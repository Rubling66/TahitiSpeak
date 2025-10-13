import Handlebars from 'handlebars';
import { render } from '@react-email/render';
import {
  TemplateEngine as ITemplateEngine,
  EmailTemplate,
  TemplateCompilationResult,
  TemplateValidationResult,
  TemplatePreviewResult,
  TemplateData
} from '../../types/email';

export class TemplateEngine implements ITemplateEngine {
  private compiledTemplates: Map<string, HandlebarsTemplateDelegate> = new Map();
  private reactTemplates: Map<string, any> = new Map();

  constructor() {
    this.registerHelpers();
  }

  private registerHelpers(): void {
    // Register common Handlebars helpers
    Handlebars.registerHelper('eq', (a: any, b: any) => a === b);
    Handlebars.registerHelper('ne', (a: any, b: any) => a !== b);
    Handlebars.registerHelper('gt', (a: number, b: number) => a > b);
    Handlebars.registerHelper('lt', (a: number, b: number) => a < b);
    Handlebars.registerHelper('and', (a: any, b: any) => a && b);
    Handlebars.registerHelper('or', (a: any, b: any) => a || b);
    Handlebars.registerHelper('not', (a: any) => !a);
    
    // Date formatting helper
    Handlebars.registerHelper('formatDate', (date: Date | string, format: string = 'YYYY-MM-DD') => {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      
      switch (format) {
        case 'YYYY-MM-DD':
          return d.toISOString().split('T')[0];
        case 'MM/DD/YYYY':
          return d.toLocaleDateString('en-US');
        case 'DD/MM/YYYY':
          return d.toLocaleDateString('en-GB');
        case 'long':
          return d.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
        default:
          return d.toLocaleDateString();
      }
    });

    // Number formatting helper
    Handlebars.registerHelper('formatNumber', (num: number, decimals: number = 0) => {
      if (typeof num !== 'number') return '';
      return num.toFixed(decimals);
    });

    // Currency formatting helper
    Handlebars.registerHelper('formatCurrency', (amount: number, currency: string = 'USD') => {
      if (typeof amount !== 'number') return '';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
      }).format(amount);
    });

    // Capitalize helper
    Handlebars.registerHelper('capitalize', (str: string) => {
      if (typeof str !== 'string') return '';
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    });

    // Truncate helper
    Handlebars.registerHelper('truncate', (str: string, length: number = 100) => {
      if (typeof str !== 'string') return '';
      return str.length > length ? str.substring(0, length) + '...' : str;
    });

    // URL helper for generating links
    Handlebars.registerHelper('url', (path: string, baseUrl?: string) => {
      const base = baseUrl || process.env.VITE_APP_URL || 'http://localhost:3000';
      return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
    });

    // Conditional block helper
    Handlebars.registerHelper('ifCond', function(v1: any, operator: string, v2: any, options: any) {
      switch (operator) {
        case '==':
          return (v1 == v2) ? options.fn(this) : options.inverse(this);
        case '===':
          return (v1 === v2) ? options.fn(this) : options.inverse(this);
        case '!=':
          return (v1 != v2) ? options.fn(this) : options.inverse(this);
        case '!==':
          return (v1 !== v2) ? options.fn(this) : options.inverse(this);
        case '<':
          return (v1 < v2) ? options.fn(this) : options.inverse(this);
        case '<=':
          return (v1 <= v2) ? options.fn(this) : options.inverse(this);
        case '>':
          return (v1 > v2) ? options.fn(this) : options.inverse(this);
        case '>=':
          return (v1 >= v2) ? options.fn(this) : options.inverse(this);
        case '&&':
          return (v1 && v2) ? options.fn(this) : options.inverse(this);
        case '||':
          return (v1 || v2) ? options.fn(this) : options.inverse(this);
        default:
          return options.inverse(this);
      }
    });
  }

  async compileTemplate(template: EmailTemplate, data: TemplateData): Promise<TemplateCompilationResult> {
    try {
      let compiledHtml: string;
      let compiledText: string | undefined;
      let compiledSubject: string;

      // Compile subject
      const subjectTemplate = Handlebars.compile(template.subject);
      compiledSubject = subjectTemplate(data);

      if (template.engine === 'react') {
        // Handle React Email templates
        compiledHtml = await this.compileReactTemplate(template, data);
        
        // Generate text version from HTML if not provided
        if (template.textContent) {
          const textTemplate = Handlebars.compile(template.textContent);
          compiledText = textTemplate(data);
        } else {
          compiledText = this.htmlToText(compiledHtml);
        }
      } else {
        // Handle Handlebars templates
        const result = this.compileHandlebarsTemplate(template, data);
        compiledHtml = result.html;
        compiledText = result.text;
      }

      return {
        success: true,
        html: compiledHtml,
        text: compiledText,
        subject: compiledSubject,
        metadata: {
          templateId: template.id,
          engine: template.engine,
          compiledAt: new Date(),
          dataKeys: Object.keys(data)
        }
      };
    } catch (error) {
      console.error('Template compilation failed:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Template compilation failed',
        metadata: {
          templateId: template.id,
          engine: template.engine,
          compiledAt: new Date()
        }
      };
    }
  }

  private async compileReactTemplate(template: EmailTemplate, data: TemplateData): Promise<string> {
    try {
      // Check if we have a cached React component
      let ReactComponent = this.reactTemplates.get(template.id);
      
      if (!ReactComponent) {
        // Dynamically import the React component
        // This assumes React templates are stored as separate files
        const modulePath = `../templates/react/${template.name}`;
        const module = await import(modulePath);
        ReactComponent = module.default || module[template.name];
        
        if (!ReactComponent) {
          throw new Error(`React component not found for template: ${template.name}`);
        }
        
        this.reactTemplates.set(template.id, ReactComponent);
      }

      // Render the React component to HTML
      const html = render(ReactComponent(data));
      return html;
    } catch (error) {
      console.error('React template compilation failed:', error);
      
      // Fallback to Handlebars if React compilation fails
      console.log('Falling back to Handlebars compilation');
      const result = this.compileHandlebarsTemplate(template, data);
      return result.html;
    }
  }

  private compileHandlebarsTemplate(template: EmailTemplate, data: TemplateData): { html: string; text?: string } {
    // Get or compile HTML template
    let htmlTemplate = this.compiledTemplates.get(`${template.id}_html`);
    if (!htmlTemplate) {
      htmlTemplate = Handlebars.compile(template.htmlContent);
      this.compiledTemplates.set(`${template.id}_html`, htmlTemplate);
    }

    const html = htmlTemplate(data);
    
    let text: string | undefined;
    if (template.textContent) {
      // Get or compile text template
      let textTemplate = this.compiledTemplates.get(`${template.id}_text`);
      if (!textTemplate) {
        textTemplate = Handlebars.compile(template.textContent);
        this.compiledTemplates.set(`${template.id}_text`, textTemplate);
      }
      text = textTemplate(data);
    }

    return { html, text };
  }

  async validateTemplate(template: EmailTemplate): Promise<TemplateValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Basic validation
      if (!template.name || template.name.trim().length === 0) {
        errors.push('Template name is required');
      }

      if (!template.subject || template.subject.trim().length === 0) {
        errors.push('Template subject is required');
      }

      if (!template.htmlContent || template.htmlContent.trim().length === 0) {
        errors.push('Template HTML content is required');
      }

      // Validate template syntax
      if (template.engine === 'handlebars') {
        await this.validateHandlebarsTemplate(template, errors, warnings);
      } else if (template.engine === 'react') {
        await this.validateReactTemplate(template, errors, warnings);
      }

      // Validate required variables
      if (template.variables && template.variables.length > 0) {
        this.validateTemplateVariables(template, errors, warnings);
      }

      // HTML validation
      this.validateHtmlContent(template.htmlContent, errors, warnings);

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        metadata: {
          templateId: template.id,
          validatedAt: new Date(),
          engine: template.engine
        }
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Validation failed');
      
      return {
        isValid: false,
        errors,
        warnings,
        metadata: {
          templateId: template.id,
          validatedAt: new Date(),
          engine: template.engine
        }
      };
    }
  }

  private async validateHandlebarsTemplate(template: EmailTemplate, errors: string[], warnings: string[]): Promise<void> {
    try {
      // Try to compile the template
      Handlebars.compile(template.htmlContent);
      
      if (template.textContent) {
        Handlebars.compile(template.textContent);
      }
      
      Handlebars.compile(template.subject);
    } catch (error) {
      errors.push(`Handlebars compilation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async validateReactTemplate(template: EmailTemplate, errors: string[], warnings: string[]): Promise<void> {
    try {
      // Check if React component exists
      const modulePath = `../templates/react/${template.name}`;
      await import(modulePath);
    } catch (error) {
      errors.push(`React template not found: ${template.name}`);
    }
  }

  private validateTemplateVariables(template: EmailTemplate, errors: string[], warnings: string[]): void {
    const requiredVars = template.variables || [];
    const htmlContent = template.htmlContent;
    const textContent = template.textContent || '';
    const subject = template.subject;

    for (const variable of requiredVars) {
      const varPattern = new RegExp(`{{\\s*${variable.name}\\s*}}`, 'g');
      
      let found = false;
      if (varPattern.test(htmlContent) || varPattern.test(textContent) || varPattern.test(subject)) {
        found = true;
      }

      if (!found) {
        warnings.push(`Variable '${variable.name}' is defined but not used in template`);
      }
    }
  }

  private validateHtmlContent(htmlContent: string, errors: string[], warnings: string[]): void {
    // Basic HTML validation
    if (!htmlContent.includes('<html') && !htmlContent.includes('<body')) {
      warnings.push('Template should include proper HTML structure with <html> and <body> tags');
    }

    if (!htmlContent.includes('<!DOCTYPE')) {
      warnings.push('Template should include DOCTYPE declaration');
    }

    // Check for common email HTML issues
    if (htmlContent.includes('position: fixed') || htmlContent.includes('position: absolute')) {
      warnings.push('Fixed and absolute positioning may not work in all email clients');
    }

    if (htmlContent.includes('background-attachment')) {
      warnings.push('Background-attachment property is not supported in many email clients');
    }

    // Check for accessibility
    if (!htmlContent.includes('alt=')) {
      warnings.push('Consider adding alt attributes to images for accessibility');
    }
  }

  async previewTemplate(template: EmailTemplate, data: TemplateData): Promise<TemplatePreviewResult> {
    try {
      const compilationResult = await this.compileTemplate(template, data);
      
      if (!compilationResult.success) {
        return {
          success: false,
          error: compilationResult.error || 'Compilation failed'
        };
      }

      return {
        success: true,
        html: compilationResult.html!,
        text: compilationResult.text,
        subject: compilationResult.subject!,
        metadata: {
          templateId: template.id,
          previewedAt: new Date(),
          dataKeys: Object.keys(data)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Preview generation failed'
      };
    }
  }

  // Utility methods
  private htmlToText(html: string): string {
    // Simple HTML to text conversion
    // In production, you might want to use a more sophisticated library like 'html-to-text'
    return html
      .replace(/<style[^>]*>.*?<\/style>/gis, '')
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Template caching management
  clearCache(): void {
    this.compiledTemplates.clear();
    this.reactTemplates.clear();
    console.log('Template cache cleared');
  }

  clearTemplateCache(templateId: string): void {
    this.compiledTemplates.delete(`${templateId}_html`);
    this.compiledTemplates.delete(`${templateId}_text`);
    this.reactTemplates.delete(templateId);
    console.log(`Cache cleared for template: ${templateId}`);
  }

  getCacheStats(): { handlebarsTemplates: number; reactTemplates: number } {
    return {
      handlebarsTemplates: this.compiledTemplates.size,
      reactTemplates: this.reactTemplates.size
    };
  }

  // Helper method to extract variables from template content
  extractVariables(content: string): string[] {
    const variables: Set<string> = new Set();
    const regex = /{{([^}]+)}}/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      const variable = match[1].trim();
      // Remove Handlebars helpers and get just the variable name
      const cleanVariable = variable.split(' ')[0].replace(/^[#\/]/, '');
      if (cleanVariable && !['if', 'unless', 'each', 'with'].includes(cleanVariable)) {
        variables.add(cleanVariable);
      }
    }

    return Array.from(variables);
  }

  // Method to get template dependencies
  getTemplateDependencies(template: EmailTemplate): string[] {
    const dependencies: string[] = [];
    
    if (template.engine === 'react') {
      // Extract React component dependencies
      // This would require parsing the React component file
      dependencies.push('@react-email/components', '@react-email/render');
    }

    return dependencies;
  }
}
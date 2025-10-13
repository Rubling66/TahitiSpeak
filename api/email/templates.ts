import { Request, Response } from 'express';
import { EmailService } from '../../src/services/email/EmailService';
import { EmailTemplate, CreateTemplateRequest, UpdateTemplateRequest } from '../../src/types/email';
import { supabase } from '../../src/lib/supabase';

const emailService = new EmailService(supabase);

/**
 * Get all email templates
 * GET /api/email/templates
 */
export async function getTemplates(req: Request, res: Response) {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      search,
      isActive 
    } = req.query;

    const filters = {
      category: category as string,
      search: search as string,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined
    };

    const templates = await emailService.listTemplates(
      Number(page),
      Number(limit),
      filters
    );

    res.status(200).json({
      success: true,
      data: templates,
      message: 'Templates retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting templates:', error);
    res.status(500).json({
      error: 'Failed to get templates',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get a specific email template
 * GET /api/email/templates/:id
 */
export async function getTemplate(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: 'Template ID is required'
      });
    }

    const template = await emailService.getTemplate(id);

    if (!template) {
      return res.status(404).json({
        error: 'Template not found'
      });
    }

    res.status(200).json({
      success: true,
      data: template,
      message: 'Template retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting template:', error);
    res.status(500).json({
      error: 'Failed to get template',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Create a new email template
 * POST /api/email/templates
 */
export async function createTemplate(req: Request, res: Response) {
  try {
    const templateData: CreateTemplateRequest = req.body;

    // Validate required fields
    if (!templateData.name || !templateData.subject || !templateData.content) {
      return res.status(400).json({
        error: 'Missing required fields: name, subject, content'
      });
    }

    // Validate template type
    if (!['handlebars', 'react'].includes(templateData.type)) {
      return res.status(400).json({
        error: 'Template type must be either "handlebars" or "react"'
      });
    }

    const template = await emailService.createTemplate(templateData);

    res.status(201).json({
      success: true,
      data: template,
      message: 'Template created successfully'
    });

  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({
      error: 'Failed to create template',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Update an email template
 * PUT /api/email/templates/:id
 */
export async function updateTemplate(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updateData: UpdateTemplateRequest = req.body;

    if (!id) {
      return res.status(400).json({
        error: 'Template ID is required'
      });
    }

    // Validate template type if provided
    if (updateData.type && !['handlebars', 'react'].includes(updateData.type)) {
      return res.status(400).json({
        error: 'Template type must be either "handlebars" or "react"'
      });
    }

    const template = await emailService.updateTemplate(id, updateData);

    if (!template) {
      return res.status(404).json({
        error: 'Template not found'
      });
    }

    res.status(200).json({
      success: true,
      data: template,
      message: 'Template updated successfully'
    });

  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({
      error: 'Failed to update template',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Delete an email template
 * DELETE /api/email/templates/:id
 */
export async function deleteTemplate(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: 'Template ID is required'
      });
    }

    const success = await emailService.deleteTemplate(id);

    if (!success) {
      return res.status(404).json({
        error: 'Template not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Template deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({
      error: 'Failed to delete template',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Preview an email template
 * POST /api/email/templates/:id/preview
 */
export async function previewTemplate(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { variables = {} } = req.body;

    if (!id) {
      return res.status(400).json({
        error: 'Template ID is required'
      });
    }

    const template = await emailService.getTemplate(id);

    if (!template) {
      return res.status(404).json({
        error: 'Template not found'
      });
    }

    // Use the TemplateEngine to render preview
    const templateEngine = emailService['templateEngine']; // Access private property
    const preview = await templateEngine.previewTemplate(template, variables);

    res.status(200).json({
      success: true,
      data: {
        subject: template.subject,
        html: preview.html,
        text: preview.text,
        variables: preview.variables
      },
      message: 'Template preview generated successfully'
    });

  } catch (error) {
    console.error('Error previewing template:', error);
    res.status(500).json({
      error: 'Failed to preview template',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Validate an email template
 * POST /api/email/templates/validate
 */
export async function validateTemplate(req: Request, res: Response) {
  try {
    const { content, type = 'handlebars', variables = {} } = req.body;

    if (!content) {
      return res.status(400).json({
        error: 'Template content is required'
      });
    }

    if (!['handlebars', 'react'].includes(type)) {
      return res.status(400).json({
        error: 'Template type must be either "handlebars" or "react"'
      });
    }

    // Create a temporary template for validation
    const tempTemplate: EmailTemplate = {
      id: 'temp',
      name: 'Validation Template',
      subject: 'Test Subject',
      content,
      type: type as 'handlebars' | 'react',
      variables: [],
      category: 'test',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system'
    };

    const templateEngine = emailService['templateEngine']; // Access private property
    const validation = await templateEngine.validateTemplate(tempTemplate, variables);

    res.status(200).json({
      success: true,
      data: validation,
      message: 'Template validation completed'
    });

  } catch (error) {
    console.error('Error validating template:', error);
    res.status(500).json({
      error: 'Failed to validate template',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get template performance analytics
 * GET /api/email/templates/:id/analytics
 */
export async function getTemplateAnalytics(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { 
      startDate, 
      endDate,
      metrics = 'all'
    } = req.query;

    if (!id) {
      return res.status(400).json({
        error: 'Template ID is required'
      });
    }

    const dateRange = {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    };

    const analytics = await emailService.getTemplatePerformance(id, dateRange);

    res.status(200).json({
      success: true,
      data: analytics,
      message: 'Template analytics retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting template analytics:', error);
    res.status(500).json({
      error: 'Failed to get template analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
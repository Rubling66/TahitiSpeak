import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEmail, EmailTemplate } from '@/hooks/useEmail';
import {
  Save,
  Eye,
  Code,
  Type,
  Image,
  Link,
  Bold,
  Italic,
  List,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Trash2,
  Copy,
  Download,
  Upload,
} from 'lucide-react';

interface EmailTemplateEditorProps {
  templateId?: string;
  onSave?: (template: EmailTemplate) => void;
  onCancel?: () => void;
}

export function EmailTemplateEditor({ templateId, onSave, onCancel }: EmailTemplateEditorProps) {
  const { loading, error, getTemplates, sendEmail } = useEmail();
  
  const [template, setTemplate] = useState<Partial<EmailTemplate>>({
    name: '',
    subject: '',
    htmlContent: '',
    textContent: '',
    description: '',
    requiredData: [],
  });
  
  const [activeTab, setActiveTab] = useState<'design' | 'html' | 'text' | 'preview'>('design');
  const [previewData, setPreviewData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (templateId) {
      loadTemplate();
    }
  }, [templateId]);

  const loadTemplate = async () => {
    try {
      const templates = await getTemplates();
      const existingTemplate = templates.find(t => t.id === templateId);
      if (existingTemplate) {
        setTemplate(existingTemplate);
        // Initialize preview data with sample values
        const sampleData: Record<string, string> = {};
        existingTemplate.requiredData.forEach(field => {
          sampleData[field] = getSampleValue(field);
        });
        setPreviewData(sampleData);
      }
    } catch (error) {
      console.error('Failed to load template:', error);
    }
  };

  const getSampleValue = (field: string): string => {
    const sampleValues: Record<string, string> = {
      userName: 'John Doe',
      userEmail: 'john.doe@example.com',
      lessonTitle: 'Basic Tahitian Greetings',
      progressPercentage: '75',
      streakCount: '7',
      nextLessonTitle: 'Tahitian Numbers',
      resetLink: 'https://example.com/reset-password',
      loginLink: 'https://example.com/login',
      unsubscribeLink: 'https://example.com/unsubscribe',
      supportEmail: 'support@tahitianapp.com',
      appName: 'French Tahitian Learning App',
    };
    return sampleValues[field] || `[${field}]`;
  };

  const handleTemplateChange = (field: keyof EmailTemplate, value: any) => {
    setTemplate(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleRequiredDataChange = (newRequiredData: string[]) => {
    handleTemplateChange('requiredData', newRequiredData);
    // Update preview data to include new fields
    const updatedPreviewData = { ...previewData };
    newRequiredData.forEach(field => {
      if (!updatedPreviewData[field]) {
        updatedPreviewData[field] = getSampleValue(field);
      }
    });
    setPreviewData(updatedPreviewData);
  };

  const addRequiredField = () => {
    const fieldName = prompt('Enter field name (e.g., userName, lessonTitle):');
    if (fieldName && !template.requiredData?.includes(fieldName)) {
      const newRequiredData = [...(template.requiredData || []), fieldName];
      handleRequiredDataChange(newRequiredData);
    }
  };

  const removeRequiredField = (field: string) => {
    const newRequiredData = (template.requiredData || []).filter(f => f !== field);
    handleRequiredDataChange(newRequiredData);
    const updatedPreviewData = { ...previewData };
    delete updatedPreviewData[field];
    setPreviewData(updatedPreviewData);
  };

  const insertVariable = (variable: string) => {
    const placeholder = `{{${variable}}}`;
    if (activeTab === 'html') {
      const textarea = document.getElementById('html-editor') as HTMLTextAreaElement;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newContent = 
          template.htmlContent!.substring(0, start) + 
          placeholder + 
          template.htmlContent!.substring(end);
        handleTemplateChange('htmlContent', newContent);
        // Restore cursor position
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
        }, 0);
      }
    } else if (activeTab === 'text') {
      const textarea = document.getElementById('text-editor') as HTMLTextAreaElement;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newContent = 
          template.textContent!.substring(0, start) + 
          placeholder + 
          template.textContent!.substring(end);
        handleTemplateChange('textContent', newContent);
        // Restore cursor position
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
        }, 0);
      }
    }
  };

  const renderPreview = (content: string): string => {
    let rendered = content;
    Object.entries(previewData).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, value);
    });
    return rendered;
  };

  const handleSave = async () => {
    if (!template.name || !template.subject) {
      alert('Please fill in template name and subject');
      return;
    }

    setSaving(true);
    try {
      // In a real implementation, this would call an API to save the template
      const savedTemplate: EmailTemplate = {
        id: templateId || `template_${Date.now()}`,
        name: template.name!,
        subject: template.subject!,
        htmlContent: template.htmlContent || '',
        textContent: template.textContent || '',
        description: template.description || '',
        requiredData: template.requiredData || [],
      };

      onSave?.(savedTemplate);
      setIsDirty(false);
    } catch (error) {
      console.error('Failed to save template:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleTestSend = async () => {
    if (!template.name || !template.subject) {
      alert('Please fill in template name and subject');
      return;
    }

    const testEmail = prompt('Enter email address to send test:');
    if (testEmail) {
      try {
        await sendEmail({
          to: testEmail,
          subject: `[TEST] ${renderPreview(template.subject!)}`,
          html: renderPreview(template.htmlContent || ''),
          text: renderPreview(template.textContent || ''),
        });
        alert('Test email sent successfully!');
      } catch (error) {
        console.error('Failed to send test email:', error);
        alert('Failed to send test email');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {templateId ? 'Edit Template' : 'Create Template'}
          </h1>
          <p className="text-muted-foreground">
            Design and customize email templates for your campaigns
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleTestSend}>
            <Eye className="h-4 w-4 mr-2" />
            Test Send
          </Button>
          <Button onClick={handleSave} disabled={saving || !isDirty}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Template'}
          </Button>
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Template Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Template Settings</CardTitle>
          <CardDescription>Basic information about your email template</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Template Name</label>
              <input
                type="text"
                value={template.name || ''}
                onChange={(e) => handleTemplateChange('name', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="e.g., Welcome Email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Subject Line</label>
              <input
                type="text"
                value={template.subject || ''}
                onChange={(e) => handleTemplateChange('subject', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="e.g., Welcome to {{appName}}!"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={template.description || ''}
              onChange={(e) => handleTemplateChange('description', e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              rows={2}
              placeholder="Brief description of this template's purpose"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">Required Data Fields</label>
              <Button size="sm" variant="outline" onClick={addRequiredField}>
                Add Field
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(template.requiredData || []).map((field) => (
                <Badge key={field} variant="secondary" className="flex items-center space-x-1">
                  <span>{field}</span>
                  <button
                    onClick={() => removeRequiredField(field)}
                    className="ml-1 hover:text-red-500"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Template Editor */}
      <Card>
        <CardHeader>
          <CardTitle>Template Content</CardTitle>
          <CardDescription>Design your email content using the editor below</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="design">Design</TabsTrigger>
              <TabsTrigger value="html">HTML</TabsTrigger>
              <TabsTrigger value="text">Text</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="design" className="space-y-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <p className="text-center text-gray-500">
                  Visual email designer would be implemented here
                </p>
                <p className="text-center text-sm text-gray-400 mt-2">
                  For now, use the HTML tab to edit content directly
                </p>
              </div>
            </TabsContent>

            <TabsContent value="html" className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-sm font-medium">Insert Variable:</span>
                {(template.requiredData || []).map((field) => (
                  <Button
                    key={field}
                    size="sm"
                    variant="outline"
                    onClick={() => insertVariable(field)}
                  >
                    {field}
                  </Button>
                ))}
              </div>
              <textarea
                id="html-editor"
                value={template.htmlContent || ''}
                onChange={(e) => handleTemplateChange('htmlContent', e.target.value)}
                className="w-full h-96 px-3 py-2 border rounded-md font-mono text-sm"
                placeholder="Enter HTML content here..."
              />
            </TabsContent>

            <TabsContent value="text" className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-sm font-medium">Insert Variable:</span>
                {(template.requiredData || []).map((field) => (
                  <Button
                    key={field}
                    size="sm"
                    variant="outline"
                    onClick={() => insertVariable(field)}
                  >
                    {field}
                  </Button>
                ))}
              </div>
              <textarea
                id="text-editor"
                value={template.textContent || ''}
                onChange={(e) => handleTemplateChange('textContent', e.target.value)}
                className="w-full h-96 px-3 py-2 border rounded-md"
                placeholder="Enter plain text content here..."
              />
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Preview Data</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(template.requiredData || []).map((field) => (
                      <div key={field}>
                        <label className="block text-sm font-medium mb-1">{field}</label>
                        <input
                          type="text"
                          value={previewData[field] || ''}
                          onChange={(e) => setPreviewData(prev => ({ ...prev, [field]: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border rounded-lg">
                  <div className="bg-gray-50 px-4 py-2 border-b">
                    <h4 className="font-medium">Subject: {renderPreview(template.subject || '')}</h4>
                  </div>
                  <div className="p-4">
                    {template.htmlContent ? (
                      <div
                        className="prose max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: renderPreview(template.htmlContent)
                        }}
                      />
                    ) : (
                      <div className="whitespace-pre-wrap">
                        {renderPreview(template.textContent || '')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
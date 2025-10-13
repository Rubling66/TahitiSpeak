import React, { useState, useEffect } from 'react';
import { useEmail } from '../../hooks/useEmail';
import { EmailTemplate } from '../../services/EmailService';
import { getTemplatePreview, validateTemplateData } from '../../services/email/EmailTemplates';
import { 
  Mail, 
  Plus, 
  Edit3, 
  Eye, 
  Trash2, 
  Save, 
  X, 
  Code, 
  FileText, 
  Settings,
  Loader2,
  CheckCircle,
  AlertCircle,
  Copy,
  Download
} from 'lucide-react';

interface EmailTemplateManagerProps {
  className?: string;
  onTemplateSelect?: (template: EmailTemplate) => void;
}

const EmailTemplateManager: React.FC<EmailTemplateManagerProps> = ({
  className = '',
  onTemplateSelect
}) => {
  const { templates, isLoading, error, loadTemplates, sendEmail } = useEmail();
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<Record<string, any>>({});
  const [editForm, setEditForm] = useState<Partial<EmailTemplate>>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleCreateNew = () => {
    setEditForm({
      name: '',
      subject: '',
      htmlContent: '',
      textContent: '',
      variables: [],
      category: 'general',
      isActive: true
    });
    setIsCreating(true);
    setIsEditing(true);
    setSelectedTemplate(null);
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditForm(template);
    setSelectedTemplate(template);
    setIsEditing(true);
    setIsCreating(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setIsCreating(false);
    setEditForm({});
    setValidationErrors([]);
    setSaveStatus('idle');
  };

  const handleSave = async () => {
    if (!editForm.name || !editForm.subject || !editForm.htmlContent) {
      setValidationErrors(['Name, subject, and HTML content are required']);
      return;
    }

    setSaveStatus('saving');
    setValidationErrors([]);

    try {
      // Here you would typically call an API to save the template
      // For now, we'll simulate the save operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSaveStatus('saved');
      setIsEditing(false);
      setIsCreating(false);
      
      // Reload templates to get the updated list
      await loadTemplates();
      
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      setSaveStatus('error');
      setValidationErrors(['Failed to save template']);
    }
  };

  const handlePreview = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setShowPreview(true);
    
    // Set sample data for preview
    const sampleData: Record<string, any> = {};
    template.variables?.forEach(variable => {
      switch (variable) {
        case 'userName':
          sampleData[variable] = 'John Doe';
          break;
        case 'streakDays':
          sampleData[variable] = '7';
          break;
        case 'achievementName':
          sampleData[variable] = 'First Lesson Complete';
          break;
        case 'lessonTitle':
          sampleData[variable] = 'Basic Greetings';
          break;
        case 'progressPercentage':
          sampleData[variable] = '75';
          break;
        default:
          sampleData[variable] = `Sample ${variable}`;
      }
    });
    setPreviewData(sampleData);
  };

  const handleCopyTemplate = (template: EmailTemplate) => {
    setEditForm({
      ...template,
      name: `${template.name} (Copy)`,
      id: undefined
    });
    setIsCreating(true);
    setIsEditing(true);
    setSelectedTemplate(null);
  };

  const handleExportTemplate = (template: EmailTemplate) => {
    const dataStr = JSON.stringify(template, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${template.name.replace(/\s+/g, '_').toLowerCase()}_template.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const renderTemplateList = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Email Templates</h3>
        <button
          onClick={handleCreateNew}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">Loading templates...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <div
            key={template.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onTemplateSelect?.(template)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 truncate">{template.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{template.subject}</p>
                <div className="flex items-center mt-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    template.category === 'welcome' ? 'bg-green-100 text-green-800' :
                    template.category === 'reminder' ? 'bg-blue-100 text-blue-800' :
                    template.category === 'achievement' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {template.category}
                  </span>
                  {!template.isActive && (
                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Inactive
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreview(template);
                  }}
                  className="p-1 text-gray-400 hover:text-blue-600"
                  title="Preview"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(template);
                  }}
                  className="p-1 text-gray-400 hover:text-green-600"
                  title="Edit"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyTemplate(template);
                  }}
                  className="p-1 text-gray-400 hover:text-purple-600"
                  title="Copy"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExportTemplate(template);
                  }}
                  className="p-1 text-gray-400 hover:text-indigo-600"
                  title="Export"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
              <span className="text-xs text-gray-500">
                {template.variables?.length || 0} variables
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderEditor = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          {isCreating ? 'Create New Template' : 'Edit Template'}
        </h3>
        <div className="flex items-center space-x-2">
          {saveStatus === 'saved' && (
            <div className="flex items-center text-green-600">
              <CheckCircle className="w-4 h-4 mr-1" />
              <span className="text-sm">Saved</span>
            </div>
          )}
          <button
            onClick={handleCancelEdit}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700 font-medium">Validation Errors</span>
          </div>
          <ul className="text-red-600 text-sm space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Template Name *
          </label>
          <input
            type="text"
            value={editForm.name || ''}
            onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter template name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            value={editForm.category || 'general'}
            onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="general">General</option>
            <option value="welcome">Welcome</option>
            <option value="reminder">Reminder</option>
            <option value="achievement">Achievement</option>
            <option value="progress">Progress</option>
            <option value="marketing">Marketing</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Subject Line *
        </label>
        <input
          type="text"
          value={editForm.subject || ''}
          onChange={(e) => setEditForm(prev => ({ ...prev, subject: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter email subject"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Variables (comma-separated)
        </label>
        <input
          type="text"
          value={editForm.variables?.join(', ') || ''}
          onChange={(e) => setEditForm(prev => ({ 
            ...prev, 
            variables: e.target.value.split(',').map(v => v.trim()).filter(v => v) 
          }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="userName, streakDays, achievementName"
        />
        <p className="text-sm text-gray-500 mt-1">
          Variables can be used in templates as &#123;&#123;variableName&#125;&#125;
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Code className="w-4 h-4 inline mr-1" />
          HTML Content *
        </label>
        <textarea
          value={editForm.htmlContent || ''}
          onChange={(e) => setEditForm(prev => ({ ...prev, htmlContent: e.target.value }))}
          rows={12}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
          placeholder="Enter HTML content with variables like {{userName}}"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <FileText className="w-4 h-4 inline mr-1" />
          Text Content (optional)
        </label>
        <textarea
          value={editForm.textContent || ''}
          onChange={(e) => setEditForm(prev => ({ ...prev, textContent: e.target.value }))}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter plain text version"
        />
      </div>

      <div className="flex items-center">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={editForm.isActive !== false}
            onChange={(e) => setEditForm(prev => ({ ...prev, isActive: e.target.checked }))}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
        <span className="ml-3 text-sm font-medium text-gray-700">Active Template</span>
      </div>

      <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
        <button
          onClick={handleCancelEdit}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saveStatus === 'saving'}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {saveStatus === 'saving' ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Template
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderPreview = () => {
    if (!selectedTemplate) return null;

    const previewHtml = getTemplatePreview(selectedTemplate.name, previewData);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Template Preview</h3>
          <button
            onClick={() => setShowPreview(false)}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="mb-4">
            <h4 className="font-medium text-gray-900">{selectedTemplate.name}</h4>
            <p className="text-sm text-gray-600">Subject: {selectedTemplate.subject}</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div 
              dangerouslySetInnerHTML={{ __html: previewHtml }}
              className="prose prose-sm max-w-none"
            />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Preview Data Used:</h4>
          <pre className="text-sm text-blue-800 bg-blue-100 rounded p-2 overflow-x-auto">
            {JSON.stringify(previewData, null, 2)}
          </pre>
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center">
          <Mail className="w-6 h-6 text-blue-500 mr-3" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Email Template Manager</h2>
            <p className="text-gray-600 text-sm mt-1">
              Create, edit, and manage email templates for automated communications
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {showPreview ? renderPreview() : isEditing ? renderEditor() : renderTemplateList()}
      </div>
    </div>
  );
};

export default EmailTemplateManager;
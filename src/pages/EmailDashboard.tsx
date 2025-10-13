import React, { useState, useEffect } from 'react';
import { useEmailAutomation } from '../hooks/useEmail';
import EmailPreferences from '../components/email/EmailPreferences';
import EmailTemplateManager from '../components/email/EmailTemplateManager';
import EmailAnalyticsDashboard from '../components/email/EmailAnalyticsDashboard';
import EmailQueueManager from '../components/email/EmailQueueManager';
import { EmailTemplate, QueuedEmail } from '../services/EmailService';
import { 
  Mail, 
  Settings, 
  BarChart3, 
  Clock, 
  Send, 
  Users, 
  TrendingUp,
  Bell,
  FileText,
  Zap
} from 'lucide-react';

const EmailDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'templates' | 'queue' | 'analytics' | 'preferences'>('overview');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<QueuedEmail | null>(null);
  
  const {
    sendWelcomeEmail,
    sendLessonReminder,
    sendAchievementNotification,
    sendProgressUpdate,
    sendWeeklyDigest
  } = useEmailAutomation();

  // Mock stats for overview
  const stats = {
    totalSent: 1250,
    deliveryRate: 94.4,
    openRate: 50.0,
    clickRate: 10.0,
    queueSize: 23,
    activeTemplates: 8,
    subscribers: 1847,
    unsubscribeRate: 0.8
  };

  const quickActions = [
    {
      title: 'Send Welcome Email',
      description: 'Send welcome email to new users',
      icon: <Users className="w-5 h-5" />,
      action: () => sendWelcomeEmail('user123', { userName: 'Test User' }),
      color: 'bg-green-500'
    },
    {
      title: 'Lesson Reminder',
      description: 'Send daily lesson reminder',
      icon: <Bell className="w-5 h-5" />,
      action: () => sendLessonReminder('user123', { 
        userName: 'Test User', 
        streakDays: 5, 
        nextLesson: 'Colors' 
      }),
      color: 'bg-blue-500'
    },
    {
      title: 'Achievement Alert',
      description: 'Notify about new achievement',
      icon: <Zap className="w-5 h-5" />,
      action: () => sendAchievementNotification('user123', { 
        userName: 'Test User', 
        achievementName: 'First Week Complete' 
      }),
      color: 'bg-purple-500'
    },
    {
      title: 'Progress Update',
      description: 'Send weekly progress summary',
      icon: <TrendingUp className="w-5 h-5" />,
      action: () => sendProgressUpdate('user123', { 
        userName: 'Test User', 
        progressPercentage: 75 
      }),
      color: 'bg-orange-500'
    }
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'templates', label: 'Templates', icon: <FileText className="w-4 h-4" /> },
    { id: 'queue', label: 'Queue', icon: <Clock className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'preferences', label: 'Preferences', icon: <Settings className="w-4 h-4" /> }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sent</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalSent.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Send className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 text-sm">+12% from last month</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Delivery Rate</p>
              <p className="text-2xl font-bold text-gray-900">{stats.deliveryRate}%</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Mail className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 text-sm">+2.1% from last month</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Open Rate</p>
              <p className="text-2xl font-bold text-gray-900">{stats.openRate}%</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 text-sm">+5.3% from last month</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Subscribers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.subscribers.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 text-sm">+8.7% from last month</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
          <p className="text-gray-600 text-sm mt-1">Send emails and manage campaigns</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow group"
              >
                <div className={`p-3 ${action.color} rounded-full text-white mb-3 group-hover:scale-110 transition-transform`}>
                  {action.icon}
                </div>
                <h4 className="font-medium text-gray-900 text-center">{action.title}</h4>
                <p className="text-sm text-gray-600 text-center mt-1">{action.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Templates</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {['Welcome Email', 'Lesson Reminder', 'Achievement Unlocked', 'Progress Update'].map((template, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 text-gray-400 mr-3" />
                    <span className="text-gray-900">{template}</span>
                  </div>
                  <span className="text-sm text-gray-500">Updated 2h ago</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Queue Status</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Pending</span>
                <span className="font-medium text-yellow-600">8 emails</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Processing</span>
                <span className="font-medium text-blue-600">2 emails</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Scheduled</span>
                <span className="font-medium text-purple-600">13 emails</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Failed</span>
                <span className="font-medium text-red-600">0 emails</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'templates':
        return (
          <EmailTemplateManager 
            onTemplateSelect={setSelectedTemplate}
          />
        );
      case 'queue':
        return (
          <EmailQueueManager 
            onEmailSelect={setSelectedEmail}
          />
        );
      case 'analytics':
        return <EmailAnalyticsDashboard />;
      case 'preferences':
        return <EmailPreferences />;
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Mail className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Email Management</h1>
                <p className="text-sm text-gray-600">Manage email campaigns and communications</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                <span className="ml-2">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </div>

      {/* Template Detail Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Template Details</h3>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="mt-1 text-gray-900">{selectedTemplate.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Subject</label>
                  <p className="mt-1 text-gray-900">{selectedTemplate.subject}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <p className="mt-1 text-gray-900 capitalize">{selectedTemplate.category}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Variables</label>
                  <p className="mt-1 text-gray-900">{selectedTemplate.variables?.join(', ') || 'None'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">HTML Content</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded border max-h-64 overflow-y-auto">
                    <pre className="text-sm text-gray-900 whitespace-pre-wrap">{selectedTemplate.htmlContent}</pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Detail Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Email Details</h3>
                <button
                  onClick={() => setSelectedEmail(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Recipient</label>
                  <p className="mt-1 text-gray-900">{selectedEmail.recipient}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Template</label>
                  <p className="mt-1 text-gray-900 capitalize">{selectedEmail.templateName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className="mt-1 text-gray-900 capitalize">{selectedEmail.status}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <p className="mt-1 text-gray-900 capitalize">{selectedEmail.priority}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Scheduled For</label>
                  <p className="mt-1 text-gray-900">{selectedEmail.scheduledFor.toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Attempts</label>
                  <p className="mt-1 text-gray-900">{selectedEmail.attempts}</p>
                </div>
                {selectedEmail.errorMessage && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Error Message</label>
                    <p className="mt-1 text-red-600">{selectedEmail.errorMessage}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Template Data</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded border">
                    <pre className="text-sm text-gray-900">{JSON.stringify(selectedEmail.templateData, null, 2)}</pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailDashboard;
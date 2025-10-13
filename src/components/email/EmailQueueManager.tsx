import React, { useState, useEffect } from 'react';
import { useEmail } from '../../hooks/useEmail';
import { QueuedEmail } from '../../services/EmailService';
import { 
  Clock, 
  Send, 
  Pause, 
  Play, 
  Trash2, 
  RefreshCw, 
  Filter, 
  Search,
  Calendar,
  User,
  Mail,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  MoreVertical,
  Eye,
  Edit3
} from 'lucide-react';

interface EmailQueueManagerProps {
  className?: string;
  onEmailSelect?: (email: QueuedEmail) => void;
}

const EmailQueueManager: React.FC<EmailQueueManagerProps> = ({
  className = '',
  onEmailSelect
}) => {
  const { isLoading, error } = useEmail();
  const [queuedEmails, setQueuedEmails] = useState<QueuedEmail[]>([]);
  const [filteredEmails, setFilteredEmails] = useState<QueuedEmail[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'processing' | 'sent' | 'failed' | 'scheduled'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'normal' | 'high' | 'urgent'>('all');
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showActions, setShowActions] = useState<string | null>(null);

  // Mock data for demonstration
  useEffect(() => {
    const mockQueuedEmails: QueuedEmail[] = [
      {
        id: '1',
        userId: 'user1',
        templateName: 'welcome',
        recipient: 'john@example.com',
        templateData: { userName: 'John Doe', dashboardUrl: '/dashboard' },
        priority: 'high',
        scheduledFor: new Date(Date.now() + 3600000), // 1 hour from now
        attempts: 0,
        status: 'scheduled',
        createdAt: new Date(Date.now() - 1800000), // 30 minutes ago
        updatedAt: new Date(Date.now() - 1800000)
      },
      {
        id: '2',
        userId: 'user2',
        templateName: 'lessonReminder',
        recipient: 'jane@example.com',
        templateData: { userName: 'Jane Smith', streakDays: 5, nextLesson: 'Colors' },
        priority: 'normal',
        scheduledFor: new Date(Date.now() + 1800000), // 30 minutes from now
        attempts: 1,
        status: 'pending',
        createdAt: new Date(Date.now() - 3600000), // 1 hour ago
        updatedAt: new Date(Date.now() - 900000) // 15 minutes ago
      },
      {
        id: '3',
        userId: 'user3',
        templateName: 'achievementUnlocked',
        recipient: 'bob@example.com',
        templateData: { userName: 'Bob Johnson', achievementName: 'First Week Complete' },
        priority: 'normal',
        scheduledFor: new Date(Date.now() - 300000), // 5 minutes ago
        attempts: 2,
        status: 'processing',
        createdAt: new Date(Date.now() - 7200000), // 2 hours ago
        updatedAt: new Date(Date.now() - 60000) // 1 minute ago
      },
      {
        id: '4',
        userId: 'user4',
        templateName: 'progressUpdate',
        recipient: 'alice@example.com',
        templateData: { userName: 'Alice Brown', progressPercentage: 75 },
        priority: 'low',
        scheduledFor: new Date(Date.now() - 1800000), // 30 minutes ago
        attempts: 3,
        status: 'failed',
        errorMessage: 'Invalid email address',
        createdAt: new Date(Date.now() - 10800000), // 3 hours ago
        updatedAt: new Date(Date.now() - 300000) // 5 minutes ago
      },
      {
        id: '5',
        userId: 'user5',
        templateName: 'weeklyDigest',
        recipient: 'charlie@example.com',
        templateData: { userName: 'Charlie Wilson' },
        priority: 'normal',
        scheduledFor: new Date(Date.now() - 3600000), // 1 hour ago
        attempts: 1,
        status: 'sent',
        createdAt: new Date(Date.now() - 14400000), // 4 hours ago
        updatedAt: new Date(Date.now() - 3600000) // 1 hour ago
      }
    ];
    
    setQueuedEmails(mockQueuedEmails);
  }, []);

  // Filter emails based on search and filters
  useEffect(() => {
    let filtered = queuedEmails;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(email => 
        email.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.templateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.templateData.userName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(email => email.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(email => email.priority === priorityFilter);
    }

    setFilteredEmails(filtered);
  }, [queuedEmails, searchTerm, statusFilter, priorityFilter]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const handleSelectEmail = (emailId: string) => {
    setSelectedEmails(prev => 
      prev.includes(emailId) 
        ? prev.filter(id => id !== emailId)
        : [...prev, emailId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEmails.length === filteredEmails.length) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(filteredEmails.map(email => email.id));
    }
  };

  const handleRetryEmail = async (emailId: string) => {
    // Simulate retry operation
    setQueuedEmails(prev => prev.map(email => 
      email.id === emailId 
        ? { ...email, status: 'pending' as const, attempts: email.attempts + 1, updatedAt: new Date() }
        : email
    ));
  };

  const handleDeleteEmail = async (emailId: string) => {
    setQueuedEmails(prev => prev.filter(email => email.id !== emailId));
    setSelectedEmails(prev => prev.filter(id => id !== emailId));
  };

  const handleBulkAction = async (action: 'retry' | 'delete' | 'pause') => {
    if (selectedEmails.length === 0) return;

    switch (action) {
      case 'retry':
        setQueuedEmails(prev => prev.map(email => 
          selectedEmails.includes(email.id) && email.status === 'failed'
            ? { ...email, status: 'pending' as const, attempts: email.attempts + 1, updatedAt: new Date() }
            : email
        ));
        break;
      case 'delete':
        setQueuedEmails(prev => prev.filter(email => !selectedEmails.includes(email.id)));
        break;
      case 'pause':
        // Implement pause logic
        break;
    }
    
    setSelectedEmails([]);
  };

  const getStatusIcon = (status: QueuedEmail['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'scheduled':
        return <Calendar className="w-4 h-4 text-purple-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: QueuedEmail['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'scheduled':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: QueuedEmail['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'normal':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (isLoading && queuedEmails.length === 0) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading email queue...</span>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Mail className="w-6 h-6 text-blue-500 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Email Queue Manager</h2>
              <p className="text-gray-600 text-sm mt-1">
                Monitor and manage queued email deliveries
              </p>
            </div>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by recipient, template, or user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
            <option value="scheduled">Scheduled</option>
          </select>
          
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Bulk Actions */}
        {selectedEmails.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-blue-800 font-medium">
                {selectedEmails.length} email{selectedEmails.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleBulkAction('retry')}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  Retry Failed
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Email List */}
        <div className="space-y-4">
          {/* Header Row */}
          <div className="flex items-center p-4 bg-gray-50 rounded-lg font-medium text-gray-700">
            <div className="flex items-center w-8">
              <input
                type="checkbox"
                checked={selectedEmails.length === filteredEmails.length && filteredEmails.length > 0}
                onChange={handleSelectAll}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1 min-w-0 ml-4">Recipient</div>
            <div className="w-32">Template</div>
            <div className="w-24">Status</div>
            <div className="w-20">Priority</div>
            <div className="w-32">Scheduled</div>
            <div className="w-16">Attempts</div>
            <div className="w-16">Actions</div>
          </div>

          {filteredEmails.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No emails found matching your criteria</p>
            </div>
          ) : (
            filteredEmails.map((email) => (
              <div
                key={email.id}
                className="flex items-center p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center w-8">
                  <input
                    type="checkbox"
                    checked={selectedEmails.includes(email.id)}
                    onChange={() => handleSelectEmail(email.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex-1 min-w-0 ml-4">
                  <div className="flex items-center">
                    <User className="w-4 h-4 text-gray-400 mr-2" />
                    <div>
                      <p className="font-medium text-gray-900 truncate">{email.recipient}</p>
                      <p className="text-sm text-gray-500 truncate">
                        {email.templateData.userName || 'Unknown User'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="w-32">
                  <span className="text-sm text-gray-900 capitalize">
                    {email.templateName.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </div>
                
                <div className="w-24">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(email.status)}`}>
                    {getStatusIcon(email.status)}
                    <span className="ml-1 capitalize">{email.status}</span>
                  </span>
                </div>
                
                <div className="w-20">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(email.priority)}`}>
                    {email.priority}
                  </span>
                </div>
                
                <div className="w-32">
                  <span className="text-sm text-gray-600">
                    {formatDate(email.scheduledFor)}
                  </span>
                </div>
                
                <div className="w-16">
                  <span className="text-sm text-gray-600">{email.attempts}</span>
                </div>
                
                <div className="w-16 relative">
                  <button
                    onClick={() => setShowActions(showActions === email.id ? null : email.id)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  
                  {showActions === email.id && (
                    <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-32">
                      <button
                        onClick={() => {
                          onEmailSelect?.(email);
                          setShowActions(null);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </button>
                      
                      {email.status === 'failed' && (
                        <button
                          onClick={() => {
                            handleRetryEmail(email.id);
                            setShowActions(null);
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Retry
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          handleDeleteEmail(email.id);
                          setShowActions(null);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
                
                {email.errorMessage && (
                  <div className="w-full mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                    <AlertCircle className="w-4 h-4 inline mr-1" />
                    {email.errorMessage}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Queue Statistics */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">
              {queuedEmails.filter(e => e.status === 'pending').length}
            </p>
            <p className="text-sm text-gray-600">Pending</p>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-blue-900">
              {queuedEmails.filter(e => e.status === 'processing').length}
            </p>
            <p className="text-sm text-blue-600">Processing</p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-900">
              {queuedEmails.filter(e => e.status === 'sent').length}
            </p>
            <p className="text-sm text-green-600">Sent</p>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-red-900">
              {queuedEmails.filter(e => e.status === 'failed').length}
            </p>
            <p className="text-sm text-red-600">Failed</p>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-purple-900">
              {queuedEmails.filter(e => e.status === 'scheduled').length}
            </p>
            <p className="text-sm text-purple-600">Scheduled</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailQueueManager;
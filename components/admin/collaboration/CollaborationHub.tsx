import React, { useState, useEffect } from 'react';
import { 
  Users, 
  GitBranch, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Plus,
  Filter,
  Search,
  Bell,
  Settings,
  Eye,
  Edit3,
  Share2
} from 'lucide-react';
import CollaborationService from '@/services/CollaborationService';
import {
  ContentVersion,
  Branch,
  MergeRequest,
  Comment,
  ReviewRequest,
  CollaborationSession,
  Notification
} from '@/types/collaboration';

interface CollaborationHubProps {
  contentId: string;
  currentVersionId: string;
  onVersionChange?: (versionId: string) => void;
}

const CollaborationHub: React.FC<CollaborationHubProps> = ({
  contentId,
  currentVersionId,
  onVersionChange
}) => {
  const [activeTab, setActiveTab] = useState<'versions' | 'branches' | 'reviews' | 'comments' | 'sessions'>('versions');
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [mergeRequests, setMergeRequests] = useState<MergeRequest[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [reviewRequests, setReviewRequests] = useState<ReviewRequest[]>([]);
  const [sessions, setSessions] = useState<CollaborationSession[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  const collaborationService = new CollaborationService();

  useEffect(() => {
    loadData();
    setupEventListeners();
    
    return () => {
      // Cleanup event listeners
    };
  }, [contentId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [versionsData, branchesData, mergeRequestsData, commentsData, reviewRequestsData] = await Promise.all([
        collaborationService.getVersions(contentId),
        collaborationService.getBranches(contentId),
        collaborationService.getMergeRequests(),
        collaborationService.getComments(contentId),
        collaborationService.getReviewRequests()
      ]);
      
      setVersions(versionsData);
      setBranches(branchesData);
      setMergeRequests(mergeRequestsData);
      setComments(commentsData);
      setReviewRequests(reviewRequestsData);
    } catch (error) {
      console.error('Error loading collaboration data:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupEventListeners = () => {
    collaborationService.on('version:created', (version: ContentVersion) => {
      setVersions(prev => [version, ...prev]);
    });
    
    collaborationService.on('comment:created', (comment: Comment) => {
      setComments(prev => [comment, ...prev]);
    });
    
    collaborationService.on('review_request:created', (request: ReviewRequest) => {
      setReviewRequests(prev => [request, ...prev]);
    });
  };

  const handleCreateVersion = async () => {
    try {
      const newVersion = await collaborationService.createVersion(contentId, {
        title: `Version ${versions.length + 1}`,
        content: 'New version content',
        status: 'draft'
      });
      setVersions(prev => [newVersion, ...prev]);
    } catch (error) {
      console.error('Error creating version:', error);
    }
  };

  const handleCreateBranch = async () => {
    try {
      const newBranch = await collaborationService.createBranch({
        name: `feature-${Date.now()}`,
        description: 'New feature branch',
        contentId,
        parentVersionId: currentVersionId
      });
      setBranches(prev => [newBranch, ...prev]);
    } catch (error) {
      console.error('Error creating branch:', error);
    }
  };

  const handleCreateComment = async (text: string, type: 'general' | 'suggestion' | 'issue' = 'general') => {
    try {
      const newComment = await collaborationService.createComment({
        contentId,
        versionId: currentVersionId,
        text,
        type
      });
      setComments(prev => [newComment, ...prev]);
    } catch (error) {
      console.error('Error creating comment:', error);
    }
  };

  const handleStartSession = async () => {
    try {
      const session = await collaborationService.startCollaborationSession(contentId, currentVersionId);
      setSessions(prev => [session, ...prev]);
    } catch (error) {
      console.error('Error starting collaboration session:', error);
    }
  };

  const filteredData = () => {
    const filterBySearch = (items: any[], searchFields: string[]) => {
      if (!searchTerm) return items;
      return items.filter(item => 
        searchFields.some(field => 
          item[field]?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    };

    const filterByStatus = (items: any[]) => {
      if (filterStatus === 'all') return items;
      return items.filter(item => item.status === filterStatus);
    };

    switch (activeTab) {
      case 'versions':
        return filterByStatus(filterBySearch(versions, ['title', 'content']));
      case 'branches':
        return filterByStatus(filterBySearch(branches, ['name', 'description']));
      case 'reviews':
        return filterByStatus(filterBySearch([...mergeRequests, ...reviewRequests], ['title', 'description']));
      case 'comments':
        return filterBySearch(comments, ['text', 'type']);
      case 'sessions':
        return filterByStatus(sessions);
      default:
        return [];
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'approved':
      case 'published':
        return 'text-green-600 bg-green-100';
      case 'pending':
      case 'in_review':
      case 'draft':
        return 'text-yellow-600 bg-yellow-100';
      case 'rejected':
      case 'ended':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const renderVersions = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Content Versions</h3>
        <button
          onClick={handleCreateVersion}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          New Version
        </button>
      </div>
      
      <div className="space-y-3">
        {filteredData().map((version: ContentVersion) => (
          <div key={version.id} className="border rounded-lg p-4 hover:bg-gray-50">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h4 className="font-medium">{version.title}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(version.status)}`}>
                    {version.status}
                  </span>
                  <span className="text-sm text-gray-500">{version.version}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{version.content}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span>By {version.authorId}</span>
                  <span>{new Date(version.createdAt).toLocaleDateString()}</span>
                  <span>{version.size} characters</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onVersionChange?.(version.id)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                  title="View Version"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded"
                  title="Edit Version"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderBranches = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Branches</h3>
        <button
          onClick={handleCreateBranch}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <GitBranch className="w-4 h-4" />
          New Branch
        </button>
      </div>
      
      <div className="space-y-3">
        {filteredData().map((branch: Branch) => (
          <div key={branch.id} className="border rounded-lg p-4 hover:bg-gray-50">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <GitBranch className="w-4 h-4 text-green-600" />
                  <h4 className="font-medium">{branch.name}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(branch.status)}`}>
                    {branch.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{branch.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span>Created by {branch.createdBy}</span>
                  <span>{new Date(branch.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                  Merge
                </button>
                <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                  Compare
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderReviews = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Reviews &amp; Merge Requests</h3>
        <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
          <Plus className="w-4 h-4" />
          New Review
        </button>
      </div>
      
      <div className="space-y-3">
        {filteredData().map((item: MergeRequest | ReviewRequest) => (
          <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h4 className="font-medium">{item.title || `Review Request ${item.id}`}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                  {'priority' in item && (
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      item.priority === 'high' ? 'bg-red-100 text-red-700' :
                      item.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {item.priority}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">{item.description || 'No description'}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span>By {'authorId' in item ? item.authorId : 'requestedBy' in item ? item.requestedBy : 'Unknown'}</span>
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  {'dueDate' in item && item.dueDate && (
                    <span className="text-orange-600">Due: {new Date(item.dueDate).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200">
                  Approve
                </button>
                <button className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200">
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderComments = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Comments &amp; Discussions</h3>
        <button
          onClick={() => handleCreateComment('New comment')}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
        >
          <MessageSquare className="w-4 h-4" />
          Add Comment
        </button>
      </div>
      
      <div className="space-y-3">
        {filteredData().map((comment: Comment) => (
          <div key={comment.id} className="border rounded-lg p-4 hover:bg-gray-50">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-4 h-4 text-orange-600" />
                  <span className="font-medium">{comment.authorId}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    comment.type === 'issue' ? 'bg-red-100 text-red-700' :
                    comment.type === 'suggestion' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {comment.type}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(comment.status)}`}>
                    {comment.status}
                  </span>
                </div>
                <p className="text-sm text-gray-800 mt-2">{comment.text}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                  {comment.replies && comment.replies.length > 0 && (
                    <span>{comment.replies.length} replies</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {comment.status === 'open' && (
                  <button
                    onClick={() => collaborationService.resolveComment(comment.id)}
                    className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded"
                    title="Resolve Comment"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                )}
                <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded" title="Reply">
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSessions = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Collaboration Sessions</h3>
        <button
          onClick={handleStartSession}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Share2 className="w-4 h-4" />
          Start Session
        </button>
      </div>
      
      <div className="space-y-3">
        {filteredData().map((session: CollaborationSession) => (
          <div key={session.id} className="border rounded-lg p-4 hover:bg-gray-50">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <h4 className="font-medium">Session {session.id}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(session.status)}`}>
                    {session.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <span>{session.participants.length} participants</span>
                  <span>Started: {new Date(session.startedAt).toLocaleString()}</span>
                  <span>Last activity: {new Date(session.lastActivity).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {session.participants.slice(0, 3).map((participant, index) => (
                    <div key={index} className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs">
                      {participant.userId.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {session.participants.length > 3 && (
                    <span className="text-xs text-gray-500">+{session.participants.length - 3} more</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200">
                  Join
                </button>
                <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                  View
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="border-b p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Collaboration Hub</h2>
            <p className="text-sm text-gray-600 mt-1">Manage versions, reviews, and team collaboration</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell className="w-5 h-5 text-gray-600" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              )}
            </div>
            <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'versions', label: 'Versions', icon: Clock },
            { id: 'branches', label: 'Branches', icon: GitBranch },
            { id: 'reviews', label: 'Reviews', icon: CheckCircle },
            { id: 'comments', label: 'Comments', icon: MessageSquare },
            { id: 'sessions', label: 'Sessions', icon: Users }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Filters */}
      <div className="p-6 border-b bg-gray-50">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'versions' && renderVersions()}
        {activeTab === 'branches' && renderBranches()}
        {activeTab === 'reviews' && renderReviews()}
        {activeTab === 'comments' && renderComments()}
        {activeTab === 'sessions' && renderSessions()}
      </div>
    </div>
  );
};

export default CollaborationHub;
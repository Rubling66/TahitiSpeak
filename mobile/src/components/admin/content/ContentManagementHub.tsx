import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Tag, 
  Archive, 
  BarChart3, 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  Upload, 
  RefreshCw, 
  Clock, 
  Star, 
  TrendingUp, 
  Users, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Play,
  Pause,
  MoreHorizontal
} from 'lucide-react';
import { 
  ContentTaxonomy, 
  ContentTag, 
  ContentSearch, 
  ContentSearchResult, 
  ContentLifecycle, 
  BulkOperation, 
  ContentPersonalization 
} from '../../../types/content-management';
import { contentManagementService } from '../../../services/ContentManagementService';

interface ContentManagementHubProps {
  onContentSelect?: (contentId: string) => void;
}

const ContentManagementHub: React.FC<ContentManagementHubProps> = ({ onContentSelect }) => {
  const [activeTab, setActiveTab] = useState<'search' | 'taxonomy' | 'lifecycle' | 'bulk' | 'analytics'>('search');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilters, setSearchFilters] = useState<ContentSearch['filters']>({});
  const [searchResults, setSearchResults] = useState<ContentSearchResult | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Taxonomy state
  const [taxonomies, setTaxonomies] = useState<ContentTaxonomy[]>([]);
  const [tags, setTags] = useState<ContentTag[]>([]);
  const [selectedTaxonomy, setSelectedTaxonomy] = useState<string | null>(null);
  const [showCreateTaxonomy, setShowCreateTaxonomy] = useState(false);
  const [showCreateTag, setShowCreateTag] = useState(false);

  // Lifecycle state
  const [lifecycles, setLifecycles] = useState<ContentLifecycle[]>([]);
  const [reviewDue, setReviewDue] = useState<ContentLifecycle[]>([]);

  // Bulk operations state
  const [bulkOperations, setBulkOperations] = useState<BulkOperation[]>([]);
  const [selectedContent, setSelectedContent] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<'archive' | 'publish' | 'delete' | 'tag'>('archive');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [taxonomiesData, tagsData, bulkOpsData, reviewDueData] = await Promise.all([
        contentManagementService.getTaxonomies(),
        contentManagementService.getTags(),
        contentManagementService.getBulkOperations(),
        contentManagementService.getContentDueForReview()
      ]);
      
      setTaxonomies(taxonomiesData);
      setTags(tagsData);
      setBulkOperations(bulkOpsData);
      setReviewDue(reviewDueData);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const searchParams: ContentSearch = {
        query: searchQuery,
        filters: searchFilters,
        sorting: { field: 'relevance', direction: 'desc' },
        pagination: { page: 1, limit: 20 }
      };
      
      const results = await contentManagementService.searchContent(searchParams);
      setSearchResults(results);
    } catch (err) {
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGetSuggestions = async (query: string) => {
    if (query.length > 2) {
      const suggestions = await contentManagementService.getContentSuggestions(query);
      setSuggestions(suggestions);
    } else {
      setSuggestions([]);
    }
  };

  const handleCreateTaxonomy = async (name: string, description: string) => {
    try {
      const newTaxonomy = await contentManagementService.createTaxonomy({
        name,
        description,
        hierarchyLevel: 0,
        children: [],
        tags: [],
        metadata: {},
        isActive: true
      });
      setTaxonomies([...taxonomies, newTaxonomy]);
      setShowCreateTaxonomy(false);
    } catch (err) {
      setError('Failed to create taxonomy');
    }
  };

  const handleCreateTag = async (name: string, category: string, color: string) => {
    try {
      const newTag = await contentManagementService.createTag({
        name,
        category,
        color,
        description: ''
      });
      setTags([...tags, newTag]);
      setShowCreateTag(false);
    } catch (err) {
      setError('Failed to create tag');
    }
  };

  const handleBulkOperation = async () => {
    if (selectedContent.length === 0) return;
    
    try {
      const operation = await contentManagementService.createBulkOperation({
        type: bulkAction,
        contentIds: selectedContent,
        parameters: {},
        createdBy: 'admin'
      });
      
      setBulkOperations([...bulkOperations, operation]);
      setSelectedContent([]);
    } catch (err) {
      setError('Bulk operation failed');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'running': return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const renderSearchTab = () => (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleGetSuggestions(e.target.value);
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search content..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 mt-1">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSearchQuery(suggestion);
                      setSuggestions([]);
                      handleSearch();
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Search'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          value={searchFilters.contentType?.[0] || ''}
          onChange={(e) => setSearchFilters({
            ...searchFilters,
            contentType: e.target.value ? [e.target.value] : undefined
          })}
          className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Types</option>
          <option value="lesson">Lessons</option>
          <option value="quiz">Quizzes</option>
          <option value="video">Videos</option>
          <option value="document">Documents</option>
        </select>
        
        <select
          value={searchFilters.difficulty?.[0] || ''}
          onChange={(e) => setSearchFilters({
            ...searchFilters,
            difficulty: e.target.value ? [e.target.value] : undefined
          })}
          className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      {/* Search Results */}
      {searchResults && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              {searchResults.total} results found
            </h3>
            <div className="flex gap-2">
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Download className="w-4 h-4" />
              </button>
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="grid gap-4">
            {searchResults.content.map((content: any) => (
              <div
                key={content.id}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onContentSelect?.(content.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{content.title}</h4>
                    <p className="text-gray-600 text-sm mt-1">{content.description}</p>
                    <div className="flex gap-2 mt-2">
                      {content.tags?.map((tag: string) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div className="capitalize">{content.contentType}</div>
                    <div className="capitalize">{content.difficulty}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderTaxonomyTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Content Taxonomy</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateTag(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Tag
          </button>
          <button
            onClick={() => setShowCreateTaxonomy(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Taxonomy
          </button>
        </div>
      </div>

      {/* Taxonomies */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium mb-3">Taxonomies</h4>
          <div className="space-y-2">
            {taxonomies.map((taxonomy) => (
              <div
                key={taxonomy.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedTaxonomy === taxonomy.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => setSelectedTaxonomy(taxonomy.id)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-medium">{taxonomy.name}</h5>
                    <p className="text-sm text-gray-600">{taxonomy.description}</p>
                  </div>
                  <div className="flex gap-1">
                    <button className="p-1 hover:bg-gray-200 rounded">
                      <Edit className="w-3 h-3" />
                    </button>
                    <button className="p-1 hover:bg-gray-200 rounded">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-3">Tags</h4>
          <div className="space-y-2">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="font-medium">{tag.name}</span>
                    <span className="text-xs text-gray-500">({tag.category})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{tag.usageCount} uses</span>
                    <div className="flex gap-1">
                      <button className="p-1 hover:bg-gray-200 rounded">
                        <Edit className="w-3 h-3" />
                      </button>
                      <button className="p-1 hover:bg-gray-200 rounded">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderLifecycleTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Content Lifecycle Management</h3>
      
      {/* Review Due Alert */}
      {reviewDue.length > 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <h4 className="font-medium text-yellow-800">
              {reviewDue.length} content items due for review
            </h4>
          </div>
          <div className="space-y-1">
            {reviewDue.slice(0, 3).map((lifecycle) => (
              <div key={lifecycle.id} className="text-sm text-yellow-700">
                Content ID: {lifecycle.contentId} - Due: {lifecycle.reviewSchedule?.nextReview.toLocaleDateString()}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lifecycle Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {['draft', 'review', 'published', 'archived', 'deprecated'].map((status) => {
          const count = lifecycles.filter(l => l.status === status).length;
          return (
            <div key={status} className="p-4 bg-white border border-gray-200 rounded-lg text-center">
              <div className="text-2xl font-bold text-gray-900">{count}</div>
              <div className="text-sm text-gray-600 capitalize">{status}</div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderBulkTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Bulk Operations</h3>
        <div className="flex gap-2">
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="archive">Archive</option>
            <option value="publish">Publish</option>
            <option value="delete">Delete</option>
            <option value="tag">Add Tags</option>
          </select>
          <button
            onClick={handleBulkOperation}
            disabled={selectedContent.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Execute ({selectedContent.length})
          </button>
        </div>
      </div>

      {/* Operations History */}
      <div className="space-y-3">
        <h4 className="font-medium">Recent Operations</h4>
        {bulkOperations.map((operation) => (
          <div key={operation.id} className="p-4 border border-gray-200 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(operation.status)}
                  <span className="font-medium capitalize">{operation.type}</span>
                  <span className="text-sm text-gray-500">
                    {operation.contentIds.length} items
                  </span>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Created: {operation.createdAt.toLocaleString()}
                </div>
                {operation.status === 'running' && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${(operation.progress.completed / operation.progress.total) * 100}%`
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {operation.progress.completed} / {operation.progress.total} completed
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-1">
                {operation.status === 'running' && (
                  <button className="p-2 hover:bg-gray-100 rounded">
                    <Pause className="w-4 h-4" />
                  </button>
                )}
                <button className="p-2 hover:bg-gray-100 rounded">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Content Analytics</h3>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-600">Total Content</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">1,247</div>
        </div>
        
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-600">Active Users</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">3,892</div>
        </div>
        
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-gray-600">Completion Rate</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">78%</div>
        </div>
        
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-600" />
            <span className="text-sm text-gray-600">Avg Rating</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">4.2</div>
        </div>
      </div>
      
      <div className="text-center py-8 text-gray-500">
        <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>Detailed analytics charts would be rendered here</p>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 text-red-800">
          <XCircle className="w-5 h-5" />
          <span className="font-medium">Error: {error}</span>
        </div>
        <button
          onClick={() => {
            setError(null);
            loadInitialData();
          }}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Content Management Hub</h2>
        <p className="text-gray-600">Manage content taxonomy, search, lifecycle, and bulk operations</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'search', label: 'Search & Discovery', icon: Search },
            { id: 'taxonomy', label: 'Taxonomy & Tags', icon: Tag },
            { id: 'lifecycle', label: 'Lifecycle', icon: Clock },
            { id: 'bulk', label: 'Bulk Operations', icon: Archive },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
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

      {/* Tab Content */}
      <div className="bg-white rounded-lg">
        {activeTab === 'search' && renderSearchTab()}
        {activeTab === 'taxonomy' && renderTaxonomyTab()}
        {activeTab === 'lifecycle' && renderLifecycleTab()}
        {activeTab === 'bulk' && renderBulkTab()}
        {activeTab === 'analytics' && renderAnalyticsTab()}
      </div>

      {/* Create Modals */}
      {showCreateTaxonomy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Create Taxonomy</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Taxonomy name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                id="taxonomy-name"
              />
              <textarea
                placeholder="Description"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={3}
                id="taxonomy-description"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const name = (document.getElementById('taxonomy-name') as HTMLInputElement).value;
                    const description = (document.getElementById('taxonomy-description') as HTMLTextAreaElement).value;
                    if (name && description) {
                      handleCreateTaxonomy(name, description);
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowCreateTaxonomy(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCreateTag && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Create Tag</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Tag name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                id="tag-name"
              />
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                id="tag-category"
              >
                <option value="">Select category</option>
                <option value="Difficulty">Difficulty</option>
                <option value="Topic">Topic</option>
                <option value="Format">Format</option>
                <option value="Language">Language</option>
              </select>
              <input
                type="color"
                className="w-full h-10 border border-gray-300 rounded-lg"
                id="tag-color"
                defaultValue="#3B82F6"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const name = (document.getElementById('tag-name') as HTMLInputElement).value;
                    const category = (document.getElementById('tag-category') as HTMLSelectElement).value;
                    const color = (document.getElementById('tag-color') as HTMLInputElement).value;
                    if (name && category) {
                      handleCreateTag(name, category, color);
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowCreateTag(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentManagementHub;
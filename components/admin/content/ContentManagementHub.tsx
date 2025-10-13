'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Search, Filter, Plus, Edit, Trash2, Eye, Download, Upload,
  Settings, BarChart3, Brain, Sparkles, CheckCircle, Clock,
  FileText, Image, Video, Mic, Users, TrendingUp, Archive,
  RefreshCw, Calendar, Tag, Star, AlertCircle, Info,
  ChevronDown, ChevronRight, Grid, List, SortAsc, SortDesc
} from 'lucide-react';
import { toast } from 'sonner';

// Import lazy loading components
import { 
  LazyLessonBuilder,
  LazyAnalyticsDashboard,
  LazyAIContentDashboard,
  LazyBatchOperations,
  LazyRichEditor
} from '../LazyWrapper';

interface ContentItem {
  id: string;
  title: string;
  type: 'lesson' | 'vocabulary' | 'cultural' | 'media' | 'quiz' | 'story';
  status: 'draft' | 'published' | 'archived' | 'review';
  lastModified: string;
  author: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  language: 'tahitian' | 'french' | 'mixed';
  engagement: number;
  views: number;
  rating: number;
  aiGenerated: boolean;
  hasAudio: boolean;
  hasVideo: boolean;
  hasImages: boolean;
  wordCount: number;
  estimatedDuration: number;
}

interface FilterState {
  search: string;
  type: string[];
  status: string[];
  difficulty: string[];
  language: string[];
  tags: string[];
  author: string[];
  dateRange: {
    start: string;
    end: string;
  };
  hasMedia: {
    audio: boolean;
    video: boolean;
    images: boolean;
  };
  aiGenerated: boolean | null;
  minRating: number;
  minEngagement: number;
}

interface SortConfig {
  field: keyof ContentItem;
  direction: 'asc' | 'desc';
}

const ContentManagementHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState('content');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'lastModified', direction: 'desc' });
  const [isLoading, setIsLoading] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    type: [],
    status: [],
    difficulty: [],
    language: [],
    tags: [],
    author: [],
    dateRange: { start: '', end: '' },
    hasMedia: { audio: false, video: false, images: false },
    aiGenerated: null,
    minRating: 0,
    minEngagement: 0
  });

  // Enhanced mock data with more properties
  const [contentItems] = useState<ContentItem[]>([
    {
      id: '1',
      title: 'Basic Greetings in Tahitian',
      type: 'lesson',
      status: 'published',
      lastModified: '2024-01-15',
      author: 'Admin',
      tags: ['greetings', 'basics', 'conversation'],
      difficulty: 'beginner',
      language: 'mixed',
      engagement: 85,
      views: 1247,
      rating: 4.8,
      aiGenerated: false,
      hasAudio: true,
      hasVideo: false,
      hasImages: true,
      wordCount: 450,
      estimatedDuration: 15
    },
    {
      id: '2',
      title: 'Traditional Dance Vocabulary',
      type: 'vocabulary',
      status: 'draft',
      lastModified: '2024-01-14',
      author: 'Content Creator',
      tags: ['dance', 'culture', 'vocabulary'],
      difficulty: 'intermediate',
      language: 'tahitian',
      engagement: 72,
      views: 892,
      rating: 4.5,
      aiGenerated: true,
      hasAudio: true,
      hasVideo: true,
      hasImages: true,
      wordCount: 320,
      estimatedDuration: 12
    },
    {
      id: '3',
      title: 'Polynesian Cultural Practices',
      type: 'cultural',
      status: 'published',
      lastModified: '2024-01-13',
      author: 'Cultural Expert',
      tags: ['culture', 'traditions', 'history'],
      difficulty: 'advanced',
      language: 'mixed',
      engagement: 91,
      views: 2156,
      rating: 4.9,
      aiGenerated: false,
      hasAudio: false,
      hasVideo: true,
      hasImages: true,
      wordCount: 780,
      estimatedDuration: 25
    },
    {
      id: '4',
      title: 'Numbers and Counting Quiz',
      type: 'quiz',
      status: 'review',
      lastModified: '2024-01-12',
      author: 'Quiz Master',
      tags: ['numbers', 'quiz', 'practice'],
      difficulty: 'beginner',
      language: 'tahitian',
      engagement: 68,
      views: 543,
      rating: 4.2,
      aiGenerated: true,
      hasAudio: true,
      hasVideo: false,
      hasImages: false,
      wordCount: 180,
      estimatedDuration: 8
    },
    {
      id: '5',
      title: 'Legend of the Tahitian Pearl',
      type: 'story',
      status: 'published',
      lastModified: '2024-01-11',
      author: 'Storyteller',
      tags: ['legend', 'story', 'culture', 'pearls'],
      difficulty: 'intermediate',
      language: 'mixed',
      engagement: 88,
      views: 1834,
      rating: 4.7,
      aiGenerated: false,
      hasAudio: true,
      hasVideo: false,
      hasImages: true,
      wordCount: 650,
      estimatedDuration: 20
    }
  ]);

  // Filter and sort content
  const filteredAndSortedItems = React.useMemo(() => {
    let filtered = contentItems.filter(item => {
      // Search filter
      if (filters.search && !item.title.toLowerCase().includes(filters.search.toLowerCase()) &&
          !item.tags.some(tag => tag.toLowerCase().includes(filters.search.toLowerCase()))) {
        return false;
      }

      // Type filter
      if (filters.type.length > 0 && !filters.type.includes(item.type)) return false;

      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(item.status)) return false;

      // Difficulty filter
      if (filters.difficulty.length > 0 && !filters.difficulty.includes(item.difficulty)) return false;

      // Language filter
      if (filters.language.length > 0 && !filters.language.includes(item.language)) return false;

      // Tags filter
      if (filters.tags.length > 0 && !filters.tags.some(tag => item.tags.includes(tag))) return false;

      // Author filter
      if (filters.author.length > 0 && !filters.author.includes(item.author)) return false;

      // Media filters
      if (filters.hasMedia.audio && !item.hasAudio) return false;
      if (filters.hasMedia.video && !item.hasVideo) return false;
      if (filters.hasMedia.images && !item.hasImages) return false;

      // AI generated filter
      if (filters.aiGenerated !== null && item.aiGenerated !== filters.aiGenerated) return false;

      // Rating filter
      if (item.rating < filters.minRating) return false;

      // Engagement filter
      if (item.engagement < filters.minEngagement) return false;

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      const aValue = a[sortConfig.field];
      const bValue = b[sortConfig.field];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' 
          ? aValue - bValue
          : bValue - aValue;
      }

      return 0;
    });

    return filtered;
  }, [contentItems, filters, sortConfig]);

  const handleSelectItem = useCallback((itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedItems(
      selectedItems.length === filteredAndSortedItems.length 
        ? [] 
        : filteredAndSortedItems.map(item => item.id)
    );
  }, [selectedItems, filteredAndSortedItems]);

  const handleBulkAction = useCallback((action: string) => {
    if (selectedItems.length === 0) {
      toast.error('Please select items first');
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      toast.success(`${action} applied to ${selectedItems.length} items`);
      setSelectedItems([]);
      setIsLoading(false);
    }, 1000);
  }, [selectedItems]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800 border-green-200';
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'archived': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'review': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'lesson': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'vocabulary': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'cultural': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'media': return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'quiz': return 'bg-green-100 text-green-800 border-green-200';
      case 'story': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-50 text-green-700';
      case 'intermediate': return 'bg-yellow-50 text-yellow-700';
      case 'advanced': return 'bg-red-50 text-red-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const renderContentCard = (item: ContentItem) => (
    <Card key={item.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <Checkbox
              checked={selectedItems.includes(item.id)}
              onCheckedChange={() => handleSelectItem(item.id)}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                {item.aiGenerated && (
                  <Badge variant="outline" className="text-xs">
                    <Brain className="h-3 w-3 mr-1" />
                    AI
                  </Badge>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge className={getTypeColor(item.type)}>{item.type}</Badge>
                <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                <Badge className={getDifficultyColor(item.difficulty)}>{item.difficulty}</Badge>
                <Badge variant="outline">{item.language}</Badge>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {item.views.toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {item.rating}
                </span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  {item.engagement}%
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {item.estimatedDuration}m
                </span>
              </div>

              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span>By {item.author}</span>
                <span>•</span>
                <span>{item.lastModified}</span>
                <span>•</span>
                <span>{item.wordCount} words</span>
                {item.hasAudio && <Mic className="h-4 w-4 text-blue-500" />}
                {item.hasVideo && <Video className="h-4 w-4 text-red-500" />}
                {item.hasImages && <Image className="h-4 w-4 text-green-500" />}
              </div>

              <div className="flex flex-wrap gap-1 mt-2">
                {item.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2 ml-4">
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              <BarChart3 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderAdvancedFilters = () => (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Advanced Filters</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
        >
          {showAdvancedFilters ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>

      {showAdvancedFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Content Type */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Content Type</Label>
            <div className="space-y-2">
              {['lesson', 'vocabulary', 'cultural', 'media', 'quiz', 'story'].map(type => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${type}`}
                    checked={filters.type.includes(type)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFilters(prev => ({ ...prev, type: [...prev.type, type] }));
                      } else {
                        setFilters(prev => ({ ...prev, type: prev.type.filter(t => t !== type) }));
                      }
                    }}
                  />
                  <Label htmlFor={`type-${type}`} className="text-sm capitalize">{type}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Status</Label>
            <div className="space-y-2">
              {['draft', 'published', 'archived', 'review'].map(status => (
                <div key={status} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${status}`}
                    checked={filters.status.includes(status)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFilters(prev => ({ ...prev, status: [...prev.status, status] }));
                      } else {
                        setFilters(prev => ({ ...prev, status: prev.status.filter(s => s !== status) }));
                      }
                    }}
                  />
                  <Label htmlFor={`status-${status}`} className="text-sm capitalize">{status}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Difficulty</Label>
            <div className="space-y-2">
              {['beginner', 'intermediate', 'advanced'].map(difficulty => (
                <div key={difficulty} className="flex items-center space-x-2">
                  <Checkbox
                    id={`difficulty-${difficulty}`}
                    checked={filters.difficulty.includes(difficulty)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFilters(prev => ({ ...prev, difficulty: [...prev.difficulty, difficulty] }));
                      } else {
                        setFilters(prev => ({ ...prev, difficulty: prev.difficulty.filter(d => d !== difficulty) }));
                      }
                    }}
                  />
                  <Label htmlFor={`difficulty-${difficulty}`} className="text-sm capitalize">{difficulty}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Media Filters */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Has Media</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has-audio"
                  checked={filters.hasMedia.audio}
                  onCheckedChange={(checked) => 
                    setFilters(prev => ({ ...prev, hasMedia: { ...prev.hasMedia, audio: !!checked } }))
                  }
                />
                <Label htmlFor="has-audio" className="text-sm">Audio</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has-video"
                  checked={filters.hasMedia.video}
                  onCheckedChange={(checked) => 
                    setFilters(prev => ({ ...prev, hasMedia: { ...prev.hasMedia, video: !!checked } }))
                  }
                />
                <Label htmlFor="has-video" className="text-sm">Video</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has-images"
                  checked={filters.hasMedia.images}
                  onCheckedChange={(checked) => 
                    setFilters(prev => ({ ...prev, hasMedia: { ...prev.hasMedia, images: !!checked } }))
                  }
                />
                <Label htmlFor="has-images" className="text-sm">Images</Label>
              </div>
            </div>
          </div>

          {/* AI Generated */}
          <div>
            <Label className="text-sm font-medium mb-2 block">AI Generated</Label>
            <Select
              value={filters.aiGenerated === null ? 'all' : filters.aiGenerated.toString()}
              onValueChange={(value) => 
                setFilters(prev => ({ 
                  ...prev, 
                  aiGenerated: value === 'all' ? null : value === 'true' 
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Content</SelectItem>
                <SelectItem value="true">AI Generated</SelectItem>
                <SelectItem value="false">Human Created</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Rating Filter */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Minimum Rating</Label>
            <Select
              value={filters.minRating.toString()}
              onValueChange={(value) => 
                setFilters(prev => ({ ...prev, minRating: parseFloat(value) }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Any Rating</SelectItem>
                <SelectItem value="3">3+ Stars</SelectItem>
                <SelectItem value="4">4+ Stars</SelectItem>
                <SelectItem value="4.5">4.5+ Stars</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Management Hub</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive content management with AI-powered tools and analytics
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Content
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="content" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="builder" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Builder
          </TabsTrigger>
          <TabsTrigger value="ai-tools" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Tools
          </TabsTrigger>
          <TabsTrigger value="batch-ops" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Batch Ops
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="editor" className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Editor
          </TabsTrigger>
        </TabsList>

        {/* Content Management Tab */}
        <TabsContent value="content" className="space-y-6">
          {/* Search and Basic Filters */}
          <Card className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search content by title, tags, or author..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                >
                  {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
                </Button>
                <Select
                  value={`${sortConfig.field}-${sortConfig.direction}`}
                  onValueChange={(value) => {
                    const [field, direction] = value.split('-');
                    setSortConfig({ field: field as keyof ContentItem, direction: direction as 'asc' | 'desc' });
                  }}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lastModified-desc">Latest First</SelectItem>
                    <SelectItem value="lastModified-asc">Oldest First</SelectItem>
                    <SelectItem value="title-asc">Title A-Z</SelectItem>
                    <SelectItem value="title-desc">Title Z-A</SelectItem>
                    <SelectItem value="rating-desc">Highest Rated</SelectItem>
                    <SelectItem value="views-desc">Most Viewed</SelectItem>
                    <SelectItem value="engagement-desc">Most Engaging</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Advanced Filters */}
          {renderAdvancedFilters()}

          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={selectedItems.length === filteredAndSortedItems.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="font-medium">
                    {selectedItems.length} of {filteredAndSortedItems.length} items selected
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleBulkAction('Publish')}
                    disabled={isLoading}
                  >
                    Publish
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleBulkAction('Archive')}
                    disabled={isLoading}
                  >
                    Archive
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleBulkAction('Export')}
                    disabled={isLoading}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleBulkAction('Delete')}
                    disabled={isLoading}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Content List */}
          <div className="space-y-4">
            {filteredAndSortedItems.map(renderContentCard)}
          </div>

          {filteredAndSortedItems.length === 0 && (
            <Card className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No content found</h3>
              <p className="text-gray-600 mb-4">
                No content items match your current filters. Try adjusting your search criteria.
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create New Content
              </Button>
            </Card>
          )}
        </TabsContent>

        {/* Visual Lesson Builder Tab */}
        <TabsContent value="builder">
          <LazyLessonBuilder />
        </TabsContent>

        {/* AI Tools Tab */}
        <TabsContent value="ai-tools">
          <LazyAIContentDashboard />
        </TabsContent>

        {/* Batch Operations Tab */}
        <TabsContent value="batch-ops">
          <LazyBatchOperations />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <LazyAnalyticsDashboard />
        </TabsContent>

        {/* Rich Editor Tab */}
        <TabsContent value="editor">
          <LazyRichEditor 
            onSave={(content) => toast.success('Content saved successfully!')}
            onPreview={(content) => toast.info('Opening preview...')}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContentManagementHub;
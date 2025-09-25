export interface ContentTag {
  id: string;
  name: string;
  category: string;
  color?: string;
  description?: string;
  parentId?: string;
  children?: ContentTag[];
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentTaxonomy {
  id: string;
  name: string;
  description: string;
  hierarchyLevel: number;
  parentId?: string;
  children: ContentTaxonomy[];
  tags: ContentTag[];
  metadata: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentMetadata {
  title: string;
  description: string;
  keywords: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number; // in minutes
  learningObjectives: string[];
  prerequisites: string[];
  targetAudience: string[];
  contentType: 'lesson' | 'quiz' | 'assignment' | 'video' | 'document' | 'interactive';
  format: string;
  language: string;
  accessibility: {
    hasTranscript: boolean;
    hasCaptions: boolean;
    isScreenReaderFriendly: boolean;
    hasAltText: boolean;
  };
}

export interface ContentRecommendation {
  id: string;
  contentId: string;
  recommendedContentId: string;
  reason: string;
  confidence: number; // 0-1
  type: 'similar' | 'prerequisite' | 'next' | 'related' | 'popular';
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface ContentLifecycle {
  id: string;
  contentId: string;
  status: 'draft' | 'review' | 'published' | 'archived' | 'deprecated';
  version: string;
  publishedAt?: Date;
  archivedAt?: Date;
  expiresAt?: Date;
  reviewSchedule?: {
    nextReview: Date;
    frequency: 'monthly' | 'quarterly' | 'yearly';
    reviewer: string;
  };
  metrics: {
    views: number;
    completions: number;
    averageRating: number;
    lastAccessed: Date;
  };
  automationRules: {
    autoArchive: boolean;
    archiveAfterDays?: number;
    autoDeprecate: boolean;
    deprecateAfterDays?: number;
  };
}

export interface BulkOperation {
  id: string;
  type: 'update' | 'delete' | 'archive' | 'publish' | 'tag' | 'move';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  contentIds: string[];
  parameters: Record<string, any>;
  progress: {
    total: number;
    completed: number;
    failed: number;
    errors: string[];
  };
  createdBy: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  estimatedDuration?: number;
}

export interface ContentSearch {
  query: string;
  filters: {
    tags?: string[];
    taxonomy?: string[];
    contentType?: string[];
    difficulty?: string[];
    language?: string[];
    status?: string[];
    dateRange?: {
      start: Date;
      end: Date;
    };
  };
  sorting: {
    field: string;
    direction: 'asc' | 'desc';
  };
  pagination: {
    page: number;
    limit: number;
  };
}

export interface ContentSearchResult {
  content: any[];
  total: number;
  page: number;
  totalPages: number;
  facets: {
    tags: { name: string; count: number }[];
    contentTypes: { type: string; count: number }[];
    difficulties: { level: string; count: number }[];
    languages: { language: string; count: number }[];
  };
}

export interface ContentPersonalization {
  userId: string;
  preferences: {
    contentTypes: string[];
    difficulty: string;
    topics: string[];
    learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
    pace: 'slow' | 'normal' | 'fast';
  };
  history: {
    viewedContent: string[];
    completedContent: string[];
    bookmarkedContent: string[];
    ratedContent: { contentId: string; rating: number }[];
  };
  recommendations: ContentRecommendation[];
  adaptiveSettings: {
    adjustDifficulty: boolean;
    suggestPrerequisites: boolean;
    personalizedPath: boolean;
  };
}

export interface ContentManagementAPI {
  // Taxonomy Management
  getTaxonomies(): Promise<ContentTaxonomy[]>;
  createTaxonomy(taxonomy: Omit<ContentTaxonomy, 'id' | 'createdAt' | 'updatedAt'>): Promise<ContentTaxonomy>;
  updateTaxonomy(id: string, updates: Partial<ContentTaxonomy>): Promise<ContentTaxonomy>;
  deleteTaxonomy(id: string): Promise<void>;
  
  // Tag Management
  getTags(taxonomyId?: string): Promise<ContentTag[]>;
  createTag(tag: Omit<ContentTag, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>): Promise<ContentTag>;
  updateTag(id: string, updates: Partial<ContentTag>): Promise<ContentTag>;
  deleteTag(id: string): Promise<void>;
  getTagUsage(tagId: string): Promise<{ contentId: string; title: string }[]>;
  
  // Content Search & Discovery
  searchContent(search: ContentSearch): Promise<ContentSearchResult>;
  getContentSuggestions(query: string): Promise<string[]>;
  getPopularContent(limit?: number): Promise<any[]>;
  getTrendingContent(timeframe: 'day' | 'week' | 'month'): Promise<any[]>;
  
  // Recommendations
  getRecommendations(contentId: string): Promise<ContentRecommendation[]>;
  generateRecommendations(contentId: string): Promise<ContentRecommendation[]>;
  getPersonalizedRecommendations(userId: string): Promise<ContentRecommendation[]>;
  
  // Lifecycle Management
  getContentLifecycle(contentId: string): Promise<ContentLifecycle>;
  updateContentStatus(contentId: string, status: ContentLifecycle['status']): Promise<ContentLifecycle>;
  scheduleContentReview(contentId: string, reviewDate: Date, reviewer: string): Promise<void>;
  getContentDueForReview(): Promise<ContentLifecycle[]>;
  archiveContent(contentIds: string[], reason?: string): Promise<BulkOperation>;
  
  // Bulk Operations
  createBulkOperation(operation: Omit<BulkOperation, 'id' | 'createdAt' | 'progress' | 'status'>): Promise<BulkOperation>;
  getBulkOperations(userId?: string): Promise<BulkOperation[]>;
  getBulkOperationStatus(operationId: string): Promise<BulkOperation>;
  cancelBulkOperation(operationId: string): Promise<void>;
  
  // Personalization
  getUserPersonalization(userId: string): Promise<ContentPersonalization>;
  updateUserPreferences(userId: string, preferences: Partial<ContentPersonalization['preferences']>): Promise<void>;
  addToUserHistory(userId: string, contentId: string, action: 'view' | 'complete' | 'bookmark' | 'rate', metadata?: any): Promise<void>;
  
  // Analytics
  getContentPerformance(contentId: string): Promise<{
    views: number;
    completions: number;
    averageTime: number;
    dropoffPoints: { position: number; percentage: number }[];
    userFeedback: { rating: number; comments: string[] };
  }>;
  getContentUsageReport(dateRange: { start: Date; end: Date }): Promise<{
    totalViews: number;
    totalCompletions: number;
    popularContent: { contentId: string; title: string; views: number }[];
    underperformingContent: { contentId: string; title: string; completionRate: number }[];
  }>;
}
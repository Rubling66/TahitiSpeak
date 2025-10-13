// Interactive Polynesian Story System Types
// Comprehensive TypeScript interfaces for the story system

export type StoryCategory = 'legend' | 'mythology' | 'history' | 'folklore' | 'creation' | 'adventure';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
export type AnnotationType = 'cultural_context' | 'historical_fact' | 'language_note' | 'tradition' | 'symbol' | 'location';
export type DiscussionType = 'question' | 'insight' | 'cultural_note' | 'interpretation' | 'general';

// Core Story Interface
export interface Story {
  id: string;
  title: string;
  description?: string;
  category: StoryCategory;
  difficulty_level: DifficultyLevel;
  estimated_duration: number; // in minutes
  cultural_region: string;
  language: string;
  cover_image_url?: string;
  author_id?: string;
  is_published: boolean;
  cultural_authenticity_score: number; // 0-100
  total_passages: number;
  created_at: string;
  updated_at: string;
  
  // Computed fields (not in database)
  average_rating?: number;
  total_ratings?: number;
  is_bookmarked?: boolean;
  user_progress?: UserStoryProgress;
}

// Story Passage Interface
export interface StoryPassage {
  id: string;
  story_id: string;
  passage_number: number;
  title?: string;
  content: string;
  audio_url?: string;
  image_url?: string;
  is_starting_passage: boolean;
  is_ending_passage: boolean;
  cultural_context?: string;
  created_at: string;
  updated_at: string;
  
  // Related data
  choices?: StoryChoice[];
  annotations?: CulturalAnnotation[];
}

// Story Choice Interface for branching narratives
export interface StoryChoice {
  id: string;
  from_passage_id: string;
  to_passage_id: string;
  choice_text: string;
  choice_description?: string;
  cultural_significance?: string;
  choice_order: number;
  created_at: string;
  
  // Related data
  to_passage?: StoryPassage;
}

// Cultural Annotation Interface
export interface CulturalAnnotation {
  id: string;
  story_id?: string;
  passage_id?: string;
  annotation_type: AnnotationType;
  title: string;
  content: string;
  highlighted_text?: string;
  position_start?: number;
  position_end?: number;
  media_url?: string;
  external_links: string[];
  created_at: string;
  updated_at: string;
  
  // Computed fields
  is_viewed?: boolean;
}

// User Story Progress Interface
export interface UserStoryProgress {
  id: string;
  user_id: string;
  story_id: string;
  current_passage_id?: string;
  completion_percentage: number; // 0-100
  is_completed: boolean;
  cultural_knowledge_gained: number;
  choices_made: ChoiceMade[];
  annotations_viewed: string[]; // annotation IDs
  time_spent: number; // in minutes
  started_at: string;
  completed_at?: string;
  last_accessed_at: string;
  
  // Related data
  story?: Story;
  current_passage?: StoryPassage;
}

// Choice Made Interface
export interface ChoiceMade {
  passage_id: string;
  choice_id: string;
  choice_text: string;
  timestamp: string;
}

// Story Discussion Interface
export interface StoryDiscussion {
  id: string;
  story_id: string;
  user_id: string;
  parent_id?: string;
  title?: string;
  content: string;
  discussion_type: DiscussionType;
  is_pinned: boolean;
  likes_count: number;
  replies_count: number;
  created_at: string;
  updated_at: string;
  
  // Related data
  replies?: StoryDiscussion[];
  user_name?: string;
  user_avatar?: string;
  is_liked?: boolean;
}

// Story Rating Interface
export interface StoryRating {
  id: string;
  story_id: string;
  user_id: string;
  rating: number; // 1-5
  review?: string;
  cultural_accuracy_rating?: number; // 1-5
  educational_value_rating?: number; // 1-5
  created_at: string;
  updated_at: string;
  
  // Related data
  user_name?: string;
}

// Story Bookmark Interface
export interface StoryBookmark {
  id: string;
  user_id: string;
  story_id: string;
  passage_id?: string;
  note?: string;
  created_at: string;
  
  // Related data
  story?: Story;
  passage?: StoryPassage;
}

// Cultural Knowledge Points Interface
export interface CulturalKnowledgePoint {
  id: string;
  user_id: string;
  story_id: string;
  annotation_id: string;
  points_earned: number;
  knowledge_category: string;
  earned_at: string;
  
  // Related data
  annotation?: CulturalAnnotation;
}

// Story Filter Interface
export interface StoryFilter {
  category?: StoryCategory[];
  difficulty_level?: DifficultyLevel[];
  cultural_region?: string[];
  language?: string[];
  min_duration?: number;
  max_duration?: number;
  min_rating?: number;
  search_query?: string;
  is_completed?: boolean;
  is_bookmarked?: boolean;
}

// Story Sort Options
export type StorySortOption = 
  | 'title_asc' 
  | 'title_desc' 
  | 'created_at_asc' 
  | 'created_at_desc' 
  | 'rating_asc' 
  | 'rating_desc' 
  | 'duration_asc' 
  | 'duration_desc' 
  | 'cultural_score_asc' 
  | 'cultural_score_desc';

// Story Library State Interface
export interface StoryLibraryState {
  stories: Story[];
  loading: boolean;
  error?: string;
  filter: StoryFilter;
  sort: StorySortOption;
  page: number;
  total_pages: number;
  total_count: number;
}

// Story Reader State Interface
export interface StoryReaderState {
  story?: Story;
  current_passage?: StoryPassage;
  progress?: UserStoryProgress;
  annotations: CulturalAnnotation[];
  loading: boolean;
  error?: string;
  show_annotations: boolean;
  selected_annotation?: CulturalAnnotation;
}

// Cultural Context Hub State Interface
export interface CulturalContextState {
  annotations: CulturalAnnotation[];
  categories: string[];
  selected_category?: string;
  search_query: string;
  loading: boolean;
  error?: string;
}

// Story Creation Interface
export interface StoryCreationData {
  title: string;
  description: string;
  category: StoryCategory;
  difficulty_level: DifficultyLevel;
  estimated_duration: number;
  cultural_region: string;
  language: string;
  cover_image_url?: string;
  passages: StoryPassageCreation[];
  annotations: CulturalAnnotationCreation[];
}

export interface StoryPassageCreation {
  passage_number: number;
  title?: string;
  content: string;
  audio_url?: string;
  image_url?: string;
  is_starting_passage: boolean;
  is_ending_passage: boolean;
  cultural_context?: string;
  choices: StoryChoiceCreation[];
}

export interface StoryChoiceCreation {
  to_passage_number: number;
  choice_text: string;
  choice_description?: string;
  cultural_significance?: string;
  choice_order: number;
}

export interface CulturalAnnotationCreation {
  passage_number?: number;
  annotation_type: AnnotationType;
  title: string;
  content: string;
  highlighted_text?: string;
  position_start?: number;
  position_end?: number;
  media_url?: string;
  external_links: string[];
}

// API Response Interfaces
export interface StoriesResponse {
  stories: Story[];
  total_count: number;
  page: number;
  total_pages: number;
}

export interface StoryDetailsResponse {
  story: Story;
  passages: StoryPassage[];
  annotations: CulturalAnnotation[];
  user_progress?: UserStoryProgress;
}

export interface DiscussionsResponse {
  discussions: StoryDiscussion[];
  total_count: number;
  page: number;
  total_pages: number;
}

// Error Interfaces
export interface StorySystemError {
  code: string;
  message: string;
  details?: any;
}

// Event Interfaces for real-time updates
export interface StoryProgressEvent {
  type: 'progress_updated';
  user_id: string;
  story_id: string;
  progress: UserStoryProgress;
}

export interface StoryDiscussionEvent {
  type: 'discussion_added' | 'discussion_updated' | 'discussion_liked';
  story_id: string;
  discussion: StoryDiscussion;
}

export interface CulturalKnowledgeEvent {
  type: 'knowledge_gained';
  user_id: string;
  points: CulturalKnowledgePoint;
}

// Utility Types
export type StorySystemEvent = StoryProgressEvent | StoryDiscussionEvent | CulturalKnowledgeEvent;

// Component Props Interfaces
export interface StoryCardProps {
  story: Story;
  onSelect: (story: Story) => void;
  showProgress?: boolean;
  compact?: boolean;
}

export interface StoryReaderProps {
  story_id: string;
  initial_passage_id?: string;
  onComplete?: (progress: UserStoryProgress) => void;
  onBookmark?: (passage_id: string) => void;
}

export interface CulturalAnnotationProps {
  annotation: CulturalAnnotation;
  onView?: (annotation: CulturalAnnotation) => void;
  interactive?: boolean;
}

export interface StoryDiscussionProps {
  story_id: string;
  discussion?: StoryDiscussion;
  onReply?: (content: string) => void;
  onLike?: () => void;
}

// Hook Return Types
export interface UseStoriesReturn {
  stories: Story[];
  loading: boolean;
  error?: string;
  filter: StoryFilter;
  setFilter: (filter: Partial<StoryFilter>) => void;
  sort: StorySortOption;
  setSort: (sort: StorySortOption) => void;
  loadMore: () => void;
  refresh: () => void;
  hasMore: boolean;
}

export interface UseStoryProgressReturn {
  progress?: UserStoryProgress;
  loading: boolean;
  error?: string;
  updateProgress: (passage_id: string, choices?: ChoiceMade[]) => Promise<void>;
  markCompleted: () => Promise<void>;
  addBookmark: (passage_id: string, note?: string) => Promise<void>;
  removeBookmark: (passage_id: string) => Promise<void>;
}

export interface UseCulturalAnnotationsReturn {
  annotations: CulturalAnnotation[];
  loading: boolean;
  error?: string;
  markAsViewed: (annotation_id: string) => Promise<void>;
  getAnnotationsForPassage: (passage_id: string) => CulturalAnnotation[];
  getAnnotationsByType: (type: AnnotationType) => CulturalAnnotation[];
}

// Additional Component Props Interfaces
export interface StoryLibraryProps {
  onStorySelect: (story: Story) => void;
  onDiscussionOpen: (storyId: string) => void;
}

export interface InteractiveStoryReaderProps {
  storyId: string;
  onClose: () => void;
  onDiscussionOpen: (storyId: string) => void;
}

export interface StoryDiscussionsProps {
  storyId?: string | null;
  onStorySelect: (story: Story) => void;
}

export interface CulturalContextHubProps {
  storyId?: string | null;
  onStorySelect: (story: Story) => void;
}

export interface ProgressTrackerProps {
  onStorySelect: (story: Story) => void;
}

export interface StoryCreationStudioProps {
  onStoryCreated: (story: Story) => void;
}
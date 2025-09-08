// Core type definitions for Tahitian French Tutor

export type LessonLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type SectionKind = 'Objectives' | 'Vocabulary' | 'Practice' | 'Culture' | 'Assessment' | 'Review';
export type ExerciseType = 'MCQ' | 'Match' | 'Ordering' | 'Dictation' | 'Pronunciation' | 'FillBlank' | 'Roleplay';
export type MediaKind = 'image' | 'audio' | 'video';

export interface TitleTriplet {
  fr: string;
  tah?: string;
  en?: string;
}

export interface VocabItem {
  fr: string;
  tah?: string;
  en?: string;
  ipaFr?: string;
  ipaTah?: string;
  partOfSpeech?: string;
  note?: string;
  audioMediaId?: number;
  isCore?: boolean;
  sortOrder?: number;
}

export interface Exercise {
  type: ExerciseType;
  prompt: string;
  data: Record<string, unknown>;
  solution?: Record<string, unknown>;
  points?: number;
  sortOrder?: number;
}

export interface LessonSection {
  kind: SectionKind;
  title: string;
  contentMd?: string;
  vocab?: VocabItem[];
  exercises?: Exercise[];
  sortOrder?: number;
}

export interface Lesson {
  id?: number;
  slug: string;
  level: LessonLevel;
  title: TitleTriplet;
  summary: string;
  durationMin?: number;
  sections: LessonSection[];
  tags?: string[];
  version?: number;
  heroMediaId?: number;
  isPublished?: boolean;
  createdAt?: number;
  updatedAt?: number;
}

export interface UserProgress {
  userId: number;
  lessonId: number;
  sectionKind: SectionKind;
  completed: boolean;
  score: number;
  attempts: number;
  updatedAt: number;
}

export interface MediaAsset {
  id: number;
  kind: MediaKind;
  filePath: string;
  alt?: string;
  durationMs?: number;
  rights?: string;
  sha256?: string;
}

export interface User {
  id: number;
  nickname?: string;
  createdAt?: number;
  lastSeenAt?: number;
}

export interface Tag {
  id: number;
  name: string;
  category?: string;
}

export interface AppSetting {
  key: string;
  value: string;
}

// Component Props Types
export interface LessonHeaderProps {
  lesson: Lesson;
  currentLanguage: 'fr' | 'tah' | 'en';
  onLanguageToggle: (lang: 'fr' | 'tah' | 'en') => void;
  onStartLesson: () => void;
}

export interface TabNavigationProps {
  sections: LessonSection[];
  activeTab: SectionKind;
  onTabChange: (tab: SectionKind) => void;
  completedSections: Set<SectionKind>;
}

export interface ProgressDrawerProps {
  lesson: Lesson;
  userProgress: UserProgress[];
  streak: number;
  isOpen: boolean;
  onToggle: () => void;
}

export interface VocabularyTabProps {
  vocab: VocabItem[];
  currentLanguage: 'fr' | 'tah' | 'en';
  onPlayAudio: (audioId: number) => void;
  onAddToPhrasebook: (item: VocabItem) => void;
}

// Search and Filter Types
export interface SearchFilters {
  level?: LessonLevel;
  tags?: string[];
  query?: string;
  minDuration?: number;
  maxDuration?: number;
  isPublished?: boolean;
  category?: string;
}

export interface LessonSearchResult {
  lesson: Lesson;
  score: number;
  highlights: string[];
}

// Exercise Data Types
export interface MCQExerciseData {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface MatchExerciseData {
  pairs: Array<{
    left: string;
    right: string;
  }>;
}

export interface OrderingExerciseData {
  items: string[];
  correctOrder: number[];
}

export interface DictationExerciseData {
  audioUrl: string;
  transcript: string;
  hints?: string[];
}

export interface PronunciationExerciseData {
  target: string;
  threshold: number;
  audioUrl?: string;
}

export interface FillBlankExerciseData {
  text: string;
  blanks: Array<{
    position: number;
    answer: string;
    alternatives?: string[];
  }>;
}

export interface RoleplayExerciseData {
  scenario: string;
  steps: Array<{
    speaker: 'you' | 'other';
    text: string;
    options?: string[];
  }>;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

export interface LessonListResponse {
  lessons: Lesson[];
  total: number;
}

// Admin Types
export type UserRole = 'student' | 'admin' | 'super_admin';
export type CourseStatus = 'draft' | 'review' | 'published' | 'archived';
export type ImportStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface AdminUser extends User {
  role: UserRole;
  email: string;
  permissions: string[];
  lastLoginAt?: number;
}

export interface CourseMetadata {
  id?: number;
  title: TitleTriplet;
  description: string;
  level: LessonLevel;
  category: string;
  tags: string[];
  estimatedDuration: number;
  prerequisites?: string[];
  learningObjectives: string[];
  status: CourseStatus;
  authorId: number;
  createdAt: number;
  updatedAt: number;
  publishedAt?: number;
  version: number;
}

export interface Course extends CourseMetadata {
  lessons: Lesson[];
  mediaAssets: MediaAsset[];
}

export interface BulkImportJob {
  id: string;
  filename: string;
  status: ImportStatus;
  totalItems: number;
  processedItems: number;
  errors: string[];
  createdAt: number;
  completedAt?: number;
  createdBy: number;
}

export interface AdminDashboardStats {
  totalCourses: number;
  totalLessons: number;
  totalUsers: number;
  publishedCourses: number;
  draftCourses: number;
  activeUsers: number;
  recentActivity: AdminActivity[];
}

export interface AdminActivity {
  id: string;
  type: 'course_created' | 'course_updated' | 'course_deleted' | 'course_published' | 'lesson_updated' | 'bulk_import' | 'user_registered';
  description: string;
  userId: number;
  userName: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

// Type alias for AdminActivityLog (used in DataService)
export type AdminActivityLog = AdminActivity;

// Admin Component Props
export interface AdminLayoutProps {
  children: React.ReactNode;
  currentUser: AdminUser;
}

export interface CourseFormProps {
  course?: Course;
  onSave: (course: Course) => Promise<void>;
  onCancel: () => void;
}

export interface MediaUploadProps {
  onUpload: (files: File[]) => Promise<MediaAsset[]>;
  acceptedTypes: string[];
  maxFileSize: number;
  multiple?: boolean;
}

export interface BulkImportProps {
  onImport: (file: File) => Promise<BulkImportJob>;
  supportedFormats: string[];
}

export interface PaginationParams {
  page: number;
  limit: number;
}

// Local Storage Types
export interface LocalStorageData {
  userProgress: Record<string, UserProgress[]>;
  userSettings: Record<string, unknown>;
  lessonCache: Record<string, Lesson>;
  lastSyncTimestamp: number;
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: unknown;
}

// Theme and UI Types
export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
}

export interface UIState {
  isLoading: boolean;
  error: AppError | null;
  theme: 'light' | 'dark' | 'tahitian';
  language: 'fr' | 'tah' | 'en';
  fontSize: 'small' | 'medium' | 'large';
  highContrast: boolean;
}
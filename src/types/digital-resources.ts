// Digital Resource Management Types
// Comprehensive data models for lesson plans, ebooks, and digital tools

export type ResourceType = 
  | 'lesson_plan' 
  | 'ebook' 
  | 'worksheet' 
  | 'audio_lesson' 
  | 'video_tutorial' 
  | 'interactive_tool' 
  | 'assessment_pack' 
  | 'teaching_kit'
  | 'cultural_content'
  | 'pronunciation_guide'
  | 'grammar_reference';

export type ResourceCategory = 
  | 'grammar' 
  | 'vocabulary' 
  | 'conversation' 
  | 'culture' 
  | 'assessment' 
  | 'pronunciation'
  | 'writing'
  | 'listening'
  | 'reading';

export type ResourceLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';

export type ResourceStatus = 'draft' | 'review' | 'published' | 'archived';

export type LicenseType = 'CC0' | 'CC-BY' | 'CC-BY-SA' | 'CC-BY-NC' | 'proprietary' | 'educational_use';

export interface ResourceMetadata {
  id: string;
  title: string;
  description: string;
  resourceType: ResourceType;
  category: ResourceCategory;
  level: ResourceLevel;
  status: ResourceStatus;
  tags: string[];
  language: 'fr' | 'tah' | 'en' | 'multilingual';
  
  // Content Information
  estimatedDuration?: number; // in minutes
  difficulty: 1 | 2 | 3 | 4 | 5;
  prerequisites?: string[];
  learningObjectives: string[];
  
  // File Information
  fileSize?: number; // in bytes
  fileFormat?: string;
  downloadUrl?: string;
  previewUrl?: string;
  thumbnailUrl?: string;
  
  // Licensing and Attribution
  license: LicenseType;
  author: string;
  authorId: string;
  contributors?: string[];
  attribution?: string;
  
  // Engagement Metrics
  downloads: number;
  views: number;
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  
  // Timestamps
  createdAt: number;
  updatedAt: number;
  publishedAt?: number;
  lastAccessedAt?: number;
}

// Lesson Plan Specific Types
export interface LessonPlanResource extends ResourceMetadata {
  resourceType: 'lesson_plan';
  lessonPlan: {
    objectives: string[];
    materials: string[];
    duration: number;
    activities: LessonActivity[];
    assessment: AssessmentCriteria[];
    culturalContext?: string;
    adaptations?: string[];
    extensions?: string[];
  };
}

export interface LessonActivity {
  id: string;
  name: string;
  description: string;
  duration: number;
  type: 'warmup' | 'presentation' | 'practice' | 'production' | 'assessment' | 'wrap-up';
  materials: string[];
  instructions: string[];
  variations?: string[];
}

export interface AssessmentCriteria {
  skill: string;
  criteria: string;
  levels: {
    excellent: string;
    good: string;
    satisfactory: string;
    needsImprovement: string;
  };
}

// Ebook Specific Types
export interface EbookResource extends ResourceMetadata {
  resourceType: 'ebook';
  ebook: {
    chapters: EbookChapter[];
    totalPages: number;
    isbn?: string;
    publisher?: string;
    edition?: string;
    tableOfContents: TableOfContentsItem[];
    glossary?: GlossaryEntry[];
    bibliography?: string[];
    readingLevel?: string;
  };
}

export interface EbookChapter {
  id: string;
  title: string;
  pageStart: number;
  pageEnd: number;
  summary?: string;
  keyTerms?: string[];
  exercises?: string[];
}

export interface TableOfContentsItem {
  title: string;
  page: number;
  level: number;
  children?: TableOfContentsItem[];
}

export interface GlossaryEntry {
  term: string;
  definition: string;
  pronunciation?: string;
  examples?: string[];
  relatedTerms?: string[];
}

// Interactive Tool Specific Types
export interface InteractiveToolResource extends ResourceMetadata {
  resourceType: 'interactive_tool';
  tool: {
    toolType: 'quiz' | 'game' | 'simulation' | 'flashcards' | 'pronunciation' | 'conversation';
    configuration: Record<string, unknown>;
    embedCode?: string;
    apiEndpoint?: string;
    instructions: string[];
    features: string[];
    systemRequirements?: string[];
    accessibility: AccessibilityFeatures;
  };
}

export interface AccessibilityFeatures {
  screenReaderCompatible: boolean;
  keyboardNavigation: boolean;
  highContrast: boolean;
  fontSize: boolean;
  audioSupport: boolean;
  subtitles: boolean;
  alternativeText: boolean;
}

// Assessment Pack Types
export interface AssessmentPackResource extends ResourceMetadata {
  resourceType: 'assessment_pack';
  assessmentPack: {
    assessments: Assessment[];
    rubrics: Rubric[];
    answerKeys: AnswerKey[];
    scoringGuide: string;
    timeLimit?: number;
    passingScore?: number;
  };
}

export interface Assessment {
  id: string;
  title: string;
  type: 'formative' | 'summative' | 'diagnostic' | 'self-assessment';
  questions: AssessmentQuestion[];
  instructions: string;
  timeLimit?: number;
  attempts?: number;
}

export interface AssessmentQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay' | 'audio-response' | 'matching';
  question: string;
  options?: string[];
  correctAnswer?: string | string[];
  points: number;
  feedback?: string;
  hints?: string[];
}

export interface Rubric {
  id: string;
  title: string;
  criteria: RubricCriterion[];
  scale: RubricScale[];
}

export interface RubricCriterion {
  name: string;
  description: string;
  weight: number;
}

export interface RubricScale {
  level: number;
  label: string;
  description: string;
  points: number;
}

export interface AnswerKey {
  assessmentId: string;
  answers: Record<string, string | string[]>;
  explanations?: Record<string, string>;
}

// Resource Collection Types
export interface ResourceCollection {
  id: string;
  title: string;
  description: string;
  resources: string[]; // Resource IDs
  author: string;
  authorId: string;
  isPublic: boolean;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

// Resource Usage Analytics
export interface ResourceUsageAnalytics {
  resourceId: string;
  userId: string;
  action: 'view' | 'download' | 'share' | 'bookmark' | 'rate' | 'comment';
  timestamp: number;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

export interface ResourceReview {
  id: string;
  resourceId: string;
  userId: string;
  userName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  helpful: number;
  reported: boolean;
  createdAt: number;
  updatedAt: number;
}

// Search and Filter Types
export interface ResourceSearchFilters {
  query?: string;
  resourceType?: ResourceType | ResourceType[];
  category?: ResourceCategory | ResourceCategory[];
  level?: ResourceLevel | ResourceLevel[];
  status?: ResourceStatus;
  tags?: string[];
  author?: string;
  license?: LicenseType;
  minRating?: number;
  dateRange?: {
    start: number;
    end: number;
  };
  featured?: boolean;
  hasPreview?: boolean;
  sortBy?: 'relevance' | 'date' | 'rating' | 'downloads' | 'title';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface ResourceSearchResult {
  resource: DigitalResource;
  score: number;
  highlights: string[];
  matchedFields: string[];
}

// Union type for all resource types
export type DigitalResource = 
  | LessonPlanResource 
  | EbookResource 
  | InteractiveToolResource 
  | AssessmentPackResource 
  | ResourceMetadata;

// Resource Management API Types
export interface ResourceUploadRequest {
  file: File;
  metadata: Partial<ResourceMetadata>;
  resourceType: ResourceType;
}

export interface ResourceUpdateRequest {
  id: string;
  updates: Partial<ResourceMetadata>;
}

export interface BulkResourceOperation {
  operation: 'publish' | 'archive' | 'delete' | 'update_tags' | 'change_category';
  resourceIds: string[];
  parameters?: Record<string, unknown>;
}

// Synthetic data for development and testing
export const syntheticDigitalResources: DigitalResource[] = [
  {
    id: 'lesson-plan-001',
    title: 'Introduction to Tahitian Greetings',
    description: 'Comprehensive lesson plan for teaching basic Tahitian greetings and polite expressions',
    resourceType: 'lesson_plan',
    category: 'conversation',
    level: 'Beginner',
    status: 'published',
    tags: ['greetings', 'politeness', 'conversation', 'beginner'],
    language: 'multilingual',
    estimatedDuration: 45,
    difficulty: 2,
    prerequisites: [],
    learningObjectives: [
      'Students will learn 10 basic Tahitian greetings',
      'Students will understand cultural context of greetings',
      'Students will practice pronunciation with confidence'
    ],
    fileSize: 2048000,
    fileFormat: 'PDF',
    downloadUrl: '/resources/lesson-plans/tahitian-greetings.pdf',
    previewUrl: '/resources/previews/tahitian-greetings-preview.pdf',
    thumbnailUrl: '/resources/thumbnails/tahitian-greetings.jpg',
    license: 'CC-BY-SA',
    author: 'Marie Tetuanui',
    authorId: 'user-001',
    contributors: ['Jean-Pierre Dubois'],
    downloads: 1247,
    views: 3891,
    rating: 4.7,
    reviewCount: 23,
    isFeatured: true,
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now() - 86400000 * 5,
    publishedAt: Date.now() - 86400000 * 25,
    lessonPlan: {
      objectives: [
        'Learn basic Tahitian greetings',
        'Understand cultural significance',
        'Practice pronunciation'
      ],
      materials: ['Audio recordings', 'Flashcards', 'Cultural context images'],
      duration: 45,
      activities: [
        {
          id: 'activity-001',
          name: 'Greeting Circle',
          description: 'Students practice greetings in a circle format',
          duration: 15,
          type: 'practice',
          materials: ['Audio player'],
          instructions: [
            'Form a circle with students',
            'Play greeting audio',
            'Have students repeat and practice'
          ]
        }
      ],
      assessment: [
        {
          skill: 'Pronunciation',
          criteria: 'Accurate pronunciation of Tahitian greetings',
          levels: {
            excellent: 'Perfect pronunciation with natural intonation',
            good: 'Good pronunciation with minor errors',
            satisfactory: 'Understandable with some pronunciation issues',
            needsImprovement: 'Significant pronunciation difficulties'
          }
        }
      ],
      culturalContext: 'Tahitian greetings reflect respect and community values',
      adaptations: ['Visual aids for hearing impaired', 'Simplified vocabulary for younger learners'],
      extensions: ['Research traditional Tahitian ceremonies', 'Create greeting video project']
    }
  } as LessonPlanResource,
  
  {
    id: 'ebook-001',
    title: 'Tahitian Language Fundamentals',
    description: 'Complete digital textbook covering Tahitian language basics with interactive exercises',
    resourceType: 'ebook',
    category: 'grammar',
    level: 'Beginner',
    status: 'published',
    tags: ['textbook', 'grammar', 'comprehensive', 'interactive'],
    language: 'multilingual',
    estimatedDuration: 480,
    difficulty: 3,
    prerequisites: [],
    learningObjectives: [
      'Master basic Tahitian grammar structures',
      'Build vocabulary of 500+ words',
      'Understand cultural context of language use'
    ],
    fileSize: 15728640,
    fileFormat: 'EPUB',
    downloadUrl: '/resources/ebooks/tahitian-fundamentals.epub',
    previewUrl: '/resources/previews/tahitian-fundamentals-preview.pdf',
    thumbnailUrl: '/resources/thumbnails/tahitian-fundamentals.jpg',
    license: 'CC-BY-NC',
    author: 'Dr. Teiva Manutahi',
    authorId: 'user-002',
    downloads: 892,
    views: 2156,
    rating: 4.5,
    reviewCount: 18,
    isFeatured: true,
    createdAt: Date.now() - 86400000 * 60,
    updatedAt: Date.now() - 86400000 * 10,
    publishedAt: Date.now() - 86400000 * 50,
    ebook: {
      chapters: [
        {
          id: 'chapter-001',
          title: 'Introduction to Tahitian',
          pageStart: 1,
          pageEnd: 25,
          summary: 'Overview of Tahitian language and culture',
          keyTerms: ['reo tahiti', 'fenua', 'mana'],
          exercises: ['Pronunciation practice', 'Cultural awareness quiz']
        }
      ],
      totalPages: 324,
      publisher: 'Tahitian Language Institute',
      edition: '2nd Edition',
      tableOfContents: [
        {
          title: 'Introduction',
          page: 1,
          level: 1,
          children: [
            { title: 'About Tahitian', page: 3, level: 2 },
            { title: 'How to Use This Book', page: 8, level: 2 }
          ]
        }
      ],
      glossary: [
        {
          term: 'Ia ora na',
          definition: 'Hello, good day (formal greeting)',
          pronunciation: 'ee-ah OH-rah nah',
          examples: ['Ia ora na, e aha to oe huru?'],
          relatedTerms: ['Ia ora', 'Maeva']
        }
      ],
      readingLevel: 'Beginner to Intermediate'
    }
  } as EbookResource,

  {
    id: 'tool-001',
    title: 'Interactive Tahitian Pronunciation Trainer',
    description: 'AI-powered tool for practicing Tahitian pronunciation with real-time feedback',
    resourceType: 'interactive_tool',
    category: 'pronunciation',
    level: 'All Levels',
    status: 'published',
    tags: ['pronunciation', 'AI', 'interactive', 'feedback'],
    language: 'multilingual',
    estimatedDuration: 30,
    difficulty: 2,
    prerequisites: ['Microphone access'],
    learningObjectives: [
      'Improve Tahitian pronunciation accuracy',
      'Develop confidence in speaking',
      'Learn proper intonation patterns'
    ],
    license: 'proprietary',
    author: 'TahitiSpeak Development Team',
    authorId: 'team-001',
    downloads: 2341,
    views: 5672,
    rating: 4.8,
    reviewCount: 45,
    isFeatured: true,
    createdAt: Date.now() - 86400000 * 20,
    updatedAt: Date.now() - 86400000 * 2,
    publishedAt: Date.now() - 86400000 * 15,
    tool: {
      toolType: 'pronunciation',
      configuration: {
        language: 'tahitian',
        feedbackType: 'realtime',
        difficultyLevels: ['beginner', 'intermediate', 'advanced']
      },
      embedCode: '<iframe src="/tools/pronunciation-trainer" width="800" height="600"></iframe>',
      apiEndpoint: '/api/tools/pronunciation',
      instructions: [
        'Click the microphone button to start recording',
        'Speak the Tahitian phrase clearly',
        'Review the AI feedback and suggestions',
        'Practice until you achieve the target score'
      ],
      features: [
        'Real-time pronunciation analysis',
        'Visual feedback with waveforms',
        'Progress tracking',
        'Personalized recommendations'
      ],
      systemRequirements: ['Modern web browser', 'Microphone access', 'Internet connection'],
      accessibility: {
        screenReaderCompatible: true,
        keyboardNavigation: true,
        highContrast: true,
        fontSize: true,
        audioSupport: true,
        subtitles: true,
        alternativeText: true
      }
    }
  } as InteractiveToolResource
];
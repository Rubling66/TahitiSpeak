// types/lesson-plan.ts

export interface LessonObjective {
  id: string;
  description: string;
  type: 'knowledge' | 'skill' | 'attitude';
  bloomsLevel: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
}

export interface LessonActivity {
  id: string;
  title: string;
  description: string;
  type: 'warmup' | 'presentation' | 'practice' | 'production' | 'assessment' | 'wrap-up';
  duration: number; // in minutes
  materials: string[];
  instructions: string[];
  grouping: 'individual' | 'pairs' | 'small-group' | 'whole-class';
  skillsFocus: ('listening' | 'speaking' | 'reading' | 'writing')[];
  notes?: string;
}

export interface LessonAssessment {
  id: string;
  type: 'formative' | 'summative';
  method: 'observation' | 'quiz' | 'presentation' | 'project' | 'discussion' | 'self-assessment';
  criteria: string[];
  rubric?: {
    levels: string[];
    descriptors: Record<string, string[]>;
  };
}

export interface LessonPlanMetadata {
  id: string;
  title: string;
  description: string;
  subject: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // total lesson duration in minutes
  targetAudience: string;
  prerequisites: string[];
  keywords: string[];
  language: string;
  culturalContext?: string;
}

export interface LessonPlanTemplate {
  id: string;
  name: string;
  description: string;
  category: 'grammar' | 'vocabulary' | 'conversation' | 'culture' | 'pronunciation' | 'mixed';
  structure: {
    phases: {
      name: string;
      suggestedDuration: number;
      activityTypes: LessonActivity['type'][];
    }[];
  };
  defaultActivities: Partial<LessonActivity>[];
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface LessonPlan {
  id: string;
  metadata: LessonPlanMetadata;
  templateId?: string;
  objectives: LessonObjective[];
  activities: LessonActivity[];
  assessments: LessonAssessment[];
  materials: {
    required: string[];
    optional: string[];
    digital: string[];
  };
  homework?: {
    description: string;
    estimatedTime: number;
    resources: string[];
  };
  differentiation: {
    forAdvanced: string[];
    forStruggling: string[];
    forELL: string[]; // English Language Learners
  };
  reflection: {
    whatWorked: string;
    whatToImprove: string;
    studentFeedback: string;
    nextSteps: string;
  };
  version: number;
  status: 'draft' | 'review' | 'approved' | 'published' | 'archived';
  collaborators: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lastUsed?: string;
  usageCount: number;
  rating?: {
    average: number;
    count: number;
  };
}

export interface LessonPlanVersion {
  id: string;
  lessonPlanId: string;
  version: number;
  changes: string;
  createdBy: string;
  createdAt: string;
  data: LessonPlan;
}

// Predefined lesson plan templates
export const defaultLessonPlanTemplates: LessonPlanTemplate[] = [
  {
    id: 'grammar-focus',
    name: 'Grammar Focus Lesson',
    description: 'Template for lessons focusing on specific grammar points',
    category: 'grammar',
    structure: {
      phases: [
        { name: 'Warm-up', suggestedDuration: 5, activityTypes: ['warmup'] },
        { name: 'Presentation', suggestedDuration: 15, activityTypes: ['presentation'] },
        { name: 'Controlled Practice', suggestedDuration: 15, activityTypes: ['practice'] },
        { name: 'Free Practice', suggestedDuration: 10, activityTypes: ['production'] },
        { name: 'Wrap-up', suggestedDuration: 5, activityTypes: ['wrap-up'] }
      ]
    },
    defaultActivities: [
      {
        title: 'Grammar Review Game',
        type: 'warmup',
        duration: 5,
        grouping: 'whole-class',
        skillsFocus: ['speaking']
      },
      {
        title: 'Grammar Presentation',
        type: 'presentation',
        duration: 15,
        grouping: 'whole-class',
        skillsFocus: ['listening']
      }
    ],
    isPublic: true,
    createdBy: 'system',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'vocabulary-building',
    name: 'Vocabulary Building Lesson',
    description: 'Template for introducing and practicing new vocabulary',
    category: 'vocabulary',
    structure: {
      phases: [
        { name: 'Warm-up', suggestedDuration: 5, activityTypes: ['warmup'] },
        { name: 'Vocabulary Introduction', suggestedDuration: 10, activityTypes: ['presentation'] },
        { name: 'Vocabulary Practice', suggestedDuration: 20, activityTypes: ['practice'] },
        { name: 'Vocabulary Application', suggestedDuration: 10, activityTypes: ['production'] },
        { name: 'Review', suggestedDuration: 5, activityTypes: ['wrap-up'] }
      ]
    },
    defaultActivities: [
      {
        title: 'Word Association',
        type: 'warmup',
        duration: 5,
        grouping: 'whole-class',
        skillsFocus: ['speaking']
      },
      {
        title: 'Visual Vocabulary Presentation',
        type: 'presentation',
        duration: 10,
        grouping: 'whole-class',
        skillsFocus: ['listening', 'reading']
      }
    ],
    isPublic: true,
    createdBy: 'system',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'conversation-practice',
    name: 'Conversation Practice Lesson',
    description: 'Template for developing speaking and listening skills',
    category: 'conversation',
    structure: {
      phases: [
        { name: 'Warm-up Discussion', suggestedDuration: 5, activityTypes: ['warmup'] },
        { name: 'Language Input', suggestedDuration: 10, activityTypes: ['presentation'] },
        { name: 'Guided Practice', suggestedDuration: 15, activityTypes: ['practice'] },
        { name: 'Free Conversation', suggestedDuration: 15, activityTypes: ['production'] },
        { name: 'Feedback & Reflection', suggestedDuration: 5, activityTypes: ['wrap-up'] }
      ]
    },
    defaultActivities: [
      {
        title: 'Topic Introduction',
        type: 'warmup',
        duration: 5,
        grouping: 'whole-class',
        skillsFocus: ['speaking', 'listening']
      },
      {
        title: 'Useful Phrases Presentation',
        type: 'presentation',
        duration: 10,
        grouping: 'whole-class',
        skillsFocus: ['listening']
      }
    ],
    isPublic: true,
    createdBy: 'system',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'cultural-exploration',
    name: 'Cultural Exploration Lesson',
    description: 'Template for lessons focusing on Tahitian culture and traditions',
    category: 'culture',
    structure: {
      phases: [
        { name: 'Cultural Hook', suggestedDuration: 5, activityTypes: ['warmup'] },
        { name: 'Cultural Content', suggestedDuration: 20, activityTypes: ['presentation'] },
        { name: 'Cultural Analysis', suggestedDuration: 15, activityTypes: ['practice'] },
        { name: 'Cultural Connection', suggestedDuration: 10, activityTypes: ['production'] },
        { name: 'Reflection', suggestedDuration: 5, activityTypes: ['wrap-up'] }
      ]
    },
    defaultActivities: [
      {
        title: 'Cultural Artifact Exploration',
        type: 'warmup',
        duration: 5,
        grouping: 'small-group',
        skillsFocus: ['speaking', 'listening']
      },
      {
        title: 'Cultural Documentary/Story',
        type: 'presentation',
        duration: 20,
        grouping: 'whole-class',
        skillsFocus: ['listening', 'reading']
      }
    ],
    isPublic: true,
    createdBy: 'system',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

// Synthetic lesson plan data
export const syntheticLessonPlans: LessonPlan[] = [
  {
    id: 'lesson-plan-1',
    metadata: {
      id: 'meta-1',
      title: 'Introduction to Tahitian Greetings',
      description: 'Learn basic greetings and polite expressions in Tahitian',
      subject: 'Tahitian Language',
      level: 'beginner',
      duration: 50,
      targetAudience: 'Adult beginners',
      prerequisites: ['Basic understanding of language learning concepts'],
      keywords: ['greetings', 'politeness', 'basic conversation'],
      language: 'Tahitian',
      culturalContext: 'Traditional Tahitian social customs'
    },
    templateId: 'conversation-practice',
    objectives: [
      {
        id: 'obj-1',
        description: 'Students will be able to greet others using appropriate Tahitian expressions',
        type: 'skill',
        bloomsLevel: 'apply'
      },
      {
        id: 'obj-2',
        description: 'Students will understand the cultural significance of greetings in Tahitian society',
        type: 'knowledge',
        bloomsLevel: 'understand'
      }
    ],
    activities: [
      {
        id: 'act-1',
        title: 'Greeting Circle',
        description: 'Students practice greetings in a circle format',
        type: 'warmup',
        duration: 5,
        materials: ['None'],
        instructions: ['Form a circle', 'Practice greetings with person next to you'],
        grouping: 'whole-class',
        skillsFocus: ['speaking', 'listening']
      },
      {
        id: 'act-2',
        title: 'Greeting Presentation',
        description: 'Introduction to common Tahitian greetings',
        type: 'presentation',
        duration: 15,
        materials: ['Slides', 'Audio recordings'],
        instructions: ['Present greetings with pronunciation', 'Explain cultural context'],
        grouping: 'whole-class',
        skillsFocus: ['listening']
      }
    ],
    assessments: [
      {
        id: 'assess-1',
        type: 'formative',
        method: 'observation',
        criteria: ['Correct pronunciation', 'Appropriate usage', 'Cultural awareness']
      }
    ],
    materials: {
      required: ['Whiteboard', 'Audio system'],
      optional: ['Cultural artifacts', 'Photos'],
      digital: ['Presentation slides', 'Audio files']
    },
    homework: {
      description: 'Practice greetings with family members',
      estimatedTime: 15,
      resources: ['Audio recordings', 'Practice sheet']
    },
    differentiation: {
      forAdvanced: ['Learn additional formal greetings'],
      forStruggling: ['Focus on 2-3 basic greetings only'],
      forELL: ['Provide written phonetic guides']
    },
    reflection: {
      whatWorked: 'Students engaged well with circle activity',
      whatToImprove: 'Need more visual aids for pronunciation',
      studentFeedback: 'Enjoyed learning about cultural context',
      nextSteps: 'Move to introductions and personal information'
    },
    version: 1,
    status: 'published',
    collaborators: [],
    createdBy: 'teacher-1',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    lastUsed: '2024-01-20T14:00:00Z',
    usageCount: 5,
    rating: {
      average: 4.5,
      count: 3
    }
  },
  {
    id: 'lesson-plan-2',
    metadata: {
      id: 'meta-2',
      title: 'Tahitian Family Vocabulary',
      description: 'Learn vocabulary related to family members and relationships',
      subject: 'Tahitian Language',
      level: 'beginner',
      duration: 45,
      targetAudience: 'Young adults and adults',
      prerequisites: ['Basic greetings', 'Numbers 1-10'],
      keywords: ['family', 'relationships', 'vocabulary'],
      language: 'Tahitian',
      culturalContext: 'Tahitian family structure and values'
    },
    templateId: 'vocabulary-building',
    objectives: [
      {
        id: 'obj-3',
        description: 'Students will identify and name family members in Tahitian',
        type: 'knowledge',
        bloomsLevel: 'remember'
      },
      {
        id: 'obj-4',
        description: 'Students will describe their family using Tahitian vocabulary',
        type: 'skill',
        bloomsLevel: 'apply'
      }
    ],
    activities: [
      {
        id: 'act-3',
        title: 'Family Photo Sharing',
        description: 'Students share family photos and discuss',
        type: 'warmup',
        duration: 5,
        materials: ['Family photos (optional)'],
        instructions: ['Show family photo', 'Describe in English first'],
        grouping: 'pairs',
        skillsFocus: ['speaking']
      },
      {
        id: 'act-4',
        title: 'Family Tree Vocabulary',
        description: 'Introduction to family member terms',
        type: 'presentation',
        duration: 15,
        materials: ['Family tree diagram', 'Vocabulary cards'],
        instructions: ['Present vocabulary with visuals', 'Practice pronunciation'],
        grouping: 'whole-class',
        skillsFocus: ['listening', 'reading']
      }
    ],
    assessments: [
      {
        id: 'assess-2',
        type: 'formative',
        method: 'quiz',
        criteria: ['Vocabulary recognition', 'Pronunciation accuracy']
      }
    ],
    materials: {
      required: ['Vocabulary cards', 'Family tree diagram'],
      optional: ['Student family photos'],
      digital: ['Digital family tree template']
    },
    differentiation: {
      forAdvanced: ['Learn extended family terms'],
      forStruggling: ['Focus on immediate family only'],
      forELL: ['Provide bilingual vocabulary cards']
    },
    reflection: {
      whatWorked: 'Visual aids were very effective',
      whatToImprove: 'Need more practice activities',
      studentFeedback: 'Enjoyed personal connection to content',
      nextSteps: 'Practice describing family in sentences'
    },
    version: 1,
    status: 'published',
    collaborators: ['teacher-2'],
    createdBy: 'teacher-1',
    createdAt: '2024-01-18T09:00:00Z',
    updatedAt: '2024-01-19T11:00:00Z',
    usageCount: 3,
    rating: {
      average: 4.8,
      count: 2
    }
  }
];
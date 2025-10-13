/**
 * Teacher Resources and Student Materials for Tahitian-French Instruction
 * Comprehensive pedagogical support materials for educators
 */

export interface TeacherResource {
  id: string;
  title: string;
  type: 'lesson_plan' | 'teaching_guide' | 'activity_sheet' | 'assessment_rubric' | 'cultural_guide';
  level: 'beginner' | 'intermediate' | 'advanced';
  module: string;
  duration: number; // minutes
  objectives: string[];
  materials: string[];
  preparation: string[];
  activities: TeachingActivity[];
  assessment: AssessmentStrategy;
  culturalNotes: CulturalTeachingNote[];
  differentiation: DifferentiationStrategy[];
  extensions: ExtensionActivity[];
  reflection: ReflectionPrompt[];
}

export interface TeachingActivity {
  id: string;
  name: string;
  type: 'warm_up' | 'presentation' | 'practice' | 'production' | 'wrap_up';
  duration: number;
  description: string;
  instructions: string[];
  materials: string[];
  grouping: 'individual' | 'pairs' | 'small_groups' | 'whole_class';
  skills: ('listening' | 'speaking' | 'reading' | 'writing' | 'cultural')[];
  tahitianFocus: string;
  frenchConnection: string;
  culturalElement: string;
}

export interface AssessmentStrategy {
  formative: FormativeAssessment[];
  summative: SummativeAssessment;
  selfAssessment: SelfAssessmentTool;
  peerAssessment: PeerAssessmentTool;
  culturalAssessment: CulturalAssessmentTool;
}

export interface FormativeAssessment {
  type: 'observation' | 'exit_ticket' | 'quick_check' | 'peer_feedback';
  description: string;
  criteria: string[];
  frequency: string;
}

export interface SummativeAssessment {
  type: 'project' | 'presentation' | 'portfolio' | 'performance_task';
  description: string;
  rubric: string;
  timeline: string;
  culturalComponent: string;
}

export interface SelfAssessmentTool {
  name: string;
  prompts: string[];
  scale: string;
  reflection: string[];
}

export interface PeerAssessmentTool {
  name: string;
  criteria: string[];
  process: string[];
  feedback: string[];
}

export interface CulturalAssessmentTool {
  name: string;
  dimensions: string[];
  indicators: string[];
  validation: string;
}

export interface CulturalTeachingNote {
  topic: string;
  context: string;
  sensitivity: string;
  authenticity: string;
  community: string;
  respect: string[];
}

export interface DifferentiationStrategy {
  learnerType: 'visual' | 'auditory' | 'kinesthetic' | 'advanced' | 'struggling' | 'ell';
  modifications: string[];
  supports: string[];
  challenges: string[];
}

export interface ExtensionActivity {
  name: string;
  description: string;
  skills: string[];
  materials: string[];
  culturalConnection: string;
}

export interface ReflectionPrompt {
  question: string;
  purpose: string;
  timing: 'during' | 'after' | 'next_day';
}

export interface StudentMaterial {
  id: string;
  title: string;
  type: 'workbook' | 'reference_sheet' | 'practice_exercises' | 'cultural_reader' | 'audio_guide';
  level: 'beginner' | 'intermediate' | 'advanced';
  module: string;
  pages: StudentPage[];
  vocabulary: VocabularyReference[];
  grammar: GrammarReference[];
  cultural: CulturalReference[];
  audio: AudioReference[];
}

export interface StudentPage {
  pageNumber: number;
  title: string;
  type: 'lesson' | 'exercise' | 'reference' | 'cultural' | 'assessment';
  content: PageContent[];
  exercises: StudentExercise[];
  vocabulary: string[];
  culturalNotes: string[];
}

export interface PageContent {
  type: 'text' | 'dialogue' | 'image' | 'audio' | 'video' | 'interactive';
  content: string;
  tahitian?: string;
  french?: string;
  english?: string;
  pronunciation?: string;
  cultural?: string;
}

export interface StudentExercise {
  id: string;
  type: 'fill_blank' | 'matching' | 'multiple_choice' | 'translation' | 'pronunciation' | 'cultural_reflection';
  instructions: string;
  items: ExerciseItem[];
  answer_key: string[];
  cultural_context: string;
}

export interface ExerciseItem {
  question: string;
  options?: string[];
  answer: string;
  explanation?: string;
  cultural_note?: string;
}

export interface VocabularyReference {
  tahitian: string;
  french: string;
  english: string;
  pronunciation: string;
  etymology: string;
  cultural_significance: string;
  usage_examples: string[];
}

export interface GrammarReference {
  concept: string;
  explanation: string;
  examples: string[];
  practice: string[];
  cultural_context: string;
}

export interface CulturalReference {
  topic: string;
  description: string;
  significance: string;
  modern_relevance: string;
  respect_guidelines: string[];
}

export interface AudioReference {
  id: string;
  title: string;
  speaker: string;
  type: 'pronunciation' | 'dialogue' | 'story' | 'song' | 'cultural';
  transcript: string;
  cultural_context: string;
}

// TEACHER RESOURCES
export const TEACHER_RESOURCES: TeacherResource[] = [
  {
    id: 'tr-beginner-greetings',
    title: 'Ia Ora Na - Les Salutations Tahitiennes',
    type: 'lesson_plan',
    level: 'beginner',
    module: 'greetings',
    duration: 45,
    objectives: [
      'Students will greet others using appropriate Tahitian expressions',
      'Students will understand cultural contexts of Tahitian greetings',
      'Students will connect Tahitian greetings to French equivalents',
      'Students will demonstrate respect for Polynesian cultural protocols'
    ],
    materials: [
      'Audio recordings by native speakers',
      'Cultural images of traditional greetings',
      'Greeting cards with Tahitian/French text',
      'Interactive pronunciation guide',
      'Cultural protocol reference sheet'
    ],
    preparation: [
      'Review pronunciation of glottal stops',
      'Prepare cultural context materials',
      'Set up audio equipment for native speaker recordings',
      'Arrange classroom for cultural circle formation',
      'Prepare differentiation materials for various learner levels'
    ],
    activities: [
      {
        id: 'warm-up-greetings',
        name: 'Circle of Respect',
        type: 'warm_up',
        duration: 10,
        description: 'Students form a circle and practice traditional Polynesian greeting protocols',
        instructions: [
          'Form a circle representing the unity of the Pacific islands',
          'Practice "Ia ora na" with proper pronunciation and respect',
          'Demonstrate traditional hand gestures and eye contact',
          'Share the cultural significance of circular formations'
        ],
        materials: ['Cultural protocol guide', 'Audio pronunciation'],
        grouping: 'whole_class',
        skills: ['speaking', 'cultural'],
        tahitianFocus: 'Proper pronunciation of "Ia ora na" with glottal stop',
        frenchConnection: 'Connection to "Bonjour" and formal/informal registers',
        culturalElement: 'Polynesian concepts of respect and community unity'
      },
      {
        id: 'presentation-greetings',
        name: 'Native Speaker Immersion',
        type: 'presentation',
        duration: 15,
        description: 'Listen to authentic Tahitian greetings from native speakers',
        instructions: [
          'Listen to various greeting contexts from native speakers',
          'Identify formal vs. informal greeting patterns',
          'Note cultural cues and non-verbal communication',
          'Compare with French greeting customs'
        ],
        materials: ['Native speaker audio', 'Cultural context videos'],
        grouping: 'whole_class',
        skills: ['listening', 'cultural'],
        tahitianFocus: 'Authentic pronunciation and intonation patterns',
        frenchConnection: 'Formal/informal register comparison',
        culturalElement: 'Traditional Polynesian hospitality concepts'
      },
      {
        id: 'practice-greetings',
        name: 'Cultural Role-Play',
        type: 'practice',
        duration: 15,
        description: 'Practice greetings in culturally appropriate contexts',
        instructions: [
          'Role-play meeting elders, peers, and children',
          'Practice appropriate cultural protocols for each context',
          'Use proper Tahitian greetings with French translations',
          'Demonstrate respect through body language and tone'
        ],
        materials: ['Role-play scenario cards', 'Cultural protocol reference'],
        grouping: 'pairs',
        skills: ['speaking', 'cultural'],
        tahitianFocus: 'Contextual usage of different greeting forms',
        frenchConnection: 'Equivalent French expressions and politeness levels',
        culturalElement: 'Respect for age hierarchy and social protocols'
      },
      {
        id: 'production-greetings',
        name: 'Community Greeting Circle',
        type: 'production',
        duration: 10,
        description: 'Students create their own culturally respectful greeting interactions',
        instructions: [
          'Create original greeting dialogues incorporating cultural elements',
          'Present to the class with proper pronunciation',
          'Include both Tahitian and French elements',
          'Demonstrate understanding of cultural significance'
        ],
        materials: ['Presentation space', 'Peer assessment forms'],
        grouping: 'small_groups',
        skills: ['speaking', 'cultural', 'writing'],
        tahitianFocus: 'Creative use of greeting vocabulary with proper pronunciation',
        frenchConnection: 'Integration of French politeness expressions',
        culturalElement: 'Personal connection to Polynesian values of respect'
      },
      {
        id: 'wrap-up-greetings',
        name: 'Reflection and Commitment',
        type: 'wrap_up',
        duration: 5,
        description: 'Reflect on cultural learning and commit to respectful practice',
        instructions: [
          'Share one new cultural insight about Tahitian greetings',
          'Commit to using respectful greetings in daily practice',
          'Connect learning to broader concepts of cultural respect',
          'Plan for continued cultural learning'
        ],
        materials: ['Reflection journals', 'Commitment cards'],
        grouping: 'individual',
        skills: ['cultural'],
        tahitianFocus: 'Personal commitment to proper pronunciation',
        frenchConnection: 'Comparison with French cultural politeness',
        culturalElement: 'Integration of Polynesian values into daily life'
      }
    ],
    assessment: {
      formative: [
        {
          type: 'observation',
          description: 'Observe student pronunciation and cultural sensitivity during activities',
          criteria: ['Accurate pronunciation', 'Cultural respect', 'Engagement level'],
          frequency: 'Throughout lesson'
        },
        {
          type: 'peer_feedback',
          description: 'Students provide constructive feedback on pronunciation and cultural appropriateness',
          criteria: ['Pronunciation accuracy', 'Cultural sensitivity', 'Respectful delivery'],
          frequency: 'During practice activities'
        }
      ],
      summative: {
        type: 'performance_task',
        description: 'Students demonstrate culturally appropriate greetings in various contexts',
        rubric: 'Cultural-Linguistic Performance Rubric',
        timeline: 'End of lesson',
        culturalComponent: 'Demonstration of respect for Polynesian cultural protocols'
      },
      selfAssessment: {
        name: 'Cultural Respect Self-Check',
        prompts: [
          'How well did I pronounce the Tahitian greetings?',
          'Did I show appropriate cultural respect?',
          'What did I learn about Polynesian values?',
          'How can I continue to honor this culture?'
        ],
        scale: '1-4 Cultural Respect Scale',
        reflection: [
          'What cultural insight surprised me most?',
          'How will I apply this learning in my daily life?'
        ]
      },
      peerAssessment: {
        name: 'Respectful Feedback Circle',
        criteria: ['Pronunciation effort', 'Cultural sensitivity', 'Respectful presentation'],
        process: [
          'Listen with respect and attention',
          'Provide specific, constructive feedback',
          'Acknowledge cultural learning efforts',
          'Suggest areas for continued growth'
        ],
        feedback: [
          'One thing you did very well was...',
          'One area for growth might be...',
          'I appreciated your respect for...'
        ]
      },
      culturalAssessment: {
        name: 'Polynesian Cultural Sensitivity Assessment',
        dimensions: ['Respect', 'Authenticity', 'Understanding', 'Application'],
        indicators: [
          'Demonstrates genuine respect for Tahitian culture',
          'Uses authentic pronunciation and cultural protocols',
          'Shows understanding of cultural significance',
          'Applies learning with cultural sensitivity'
        ],
        validation: 'Community elder or cultural expert validation when possible'
      }
    },
    culturalNotes: [
      {
        topic: 'Greeting Protocols',
        context: 'Traditional Polynesian greetings involve respect for age, status, and spiritual connection',
        sensitivity: 'Avoid treating cultural practices as exotic or entertainment',
        authenticity: 'Use recordings from native speakers and cultural experts',
        community: 'Invite community members to share authentic experiences when possible',
        respect: [
          'Always acknowledge the sacred nature of language',
          'Recognize that language carries cultural DNA',
          'Approach learning with humility and respect',
          'Honor the generosity of cultural sharing'
        ]
      }
    ],
    differentiation: [
      {
        learnerType: 'visual',
        modifications: ['Visual pronunciation guides', 'Cultural image supports', 'Written cultural protocols'],
        supports: ['Gesture demonstrations', 'Visual cultural context'],
        challenges: ['Create visual cultural presentations', 'Design greeting protocol infographics']
      },
      {
        learnerType: 'auditory',
        modifications: ['Extended audio practice', 'Native speaker recordings', 'Pronunciation drills'],
        supports: ['Audio cultural stories', 'Musical greeting patterns'],
        challenges: ['Lead pronunciation practice', 'Create audio cultural guides']
      },
      {
        learnerType: 'kinesthetic',
        modifications: ['Movement-based greetings', 'Cultural gesture practice', 'Role-play emphasis'],
        supports: ['Physical cultural demonstrations', 'Interactive cultural activities'],
        challenges: ['Choreograph cultural greeting sequences', 'Lead kinesthetic cultural activities']
      }
    ],
    extensions: [
      {
        name: 'Cultural Research Project',
        description: 'Research traditional Polynesian greeting customs across different islands',
        skills: ['Research', 'Cultural analysis', 'Presentation'],
        materials: ['Research resources', 'Presentation tools'],
        culturalConnection: 'Deeper understanding of Pacific Island cultural diversity'
      },
      {
        name: 'Community Connection',
        description: 'Interview community members about their cultural greeting experiences',
        skills: ['Interviewing', 'Cultural sensitivity', 'Documentation'],
        materials: ['Interview guides', 'Recording equipment'],
        culturalConnection: 'Real-world application of cultural respect and learning'
      }
    ],
    reflection: [
      {
        question: 'How did learning Tahitian greetings change your understanding of cultural respect?',
        purpose: 'Develop cultural awareness and sensitivity',
        timing: 'after'
      },
      {
        question: 'What connections do you see between language and cultural values?',
        purpose: 'Understand the deep connection between language and culture',
        timing: 'after'
      },
      {
        question: 'How will you continue to honor Tahitian culture in your language learning?',
        purpose: 'Develop ongoing commitment to cultural respect',
        timing: 'next_day'
      }
    ]
  }
];

// STUDENT MATERIALS
export const STUDENT_MATERIALS: StudentMaterial[] = [
  {
    id: 'sm-beginner-workbook',
    title: 'Te Reo Tahiti - Cahier de l\'Élève Débutant',
    type: 'workbook',
    level: 'beginner',
    module: 'comprehensive',
    pages: [
      {
        pageNumber: 1,
        title: 'Bienvenue dans le Monde Tahitien',
        type: 'cultural',
        content: [
          {
            type: 'text',
            content: 'Welcome to the beautiful world of Tahitian language and culture',
            tahitian: 'Maeva i te ao nehenehe o te reo Tahiti e te haapiiraa',
            french: 'Bienvenue dans le monde magnifique de la langue et culture tahitiennes',
            english: 'Welcome to the beautiful world of Tahitian language and culture',
            cultural: 'The concept of "maeva" represents more than welcome - it embodies the Polynesian spirit of hospitality and inclusion'
          },
          {
            type: 'image',
            content: 'Traditional Tahitian landscape with cultural elements',
            cultural: 'Images should represent authentic Tahitian culture with respect and accuracy'
          }
        ],
        exercises: [],
        vocabulary: ['maeva', 'ao', 'nehenehe', 'reo', 'haapiiraa'],
        culturalNotes: [
          'Tahitian culture values respect, community, and connection to nature',
          'Language learning is a sacred responsibility that honors the ancestors',
          'Every word carries the mana (spiritual power) of the culture'
        ]
      },
      {
        pageNumber: 2,
        title: 'Ia Ora Na - Les Salutations',
        type: 'lesson',
        content: [
          {
            type: 'dialogue',
            content: 'Traditional greeting exchange',
            tahitian: 'Ia ora na! - Ia ora na! E aha te huru? - Maita\'i roa!',
            french: 'Bonjour! - Bonjour! Comment allez-vous? - Très bien!',
            english: 'Hello! - Hello! How are you? - Very well!',
            pronunciation: '[ja ˈora na] - [e ˈaha te ˈhuru] - [ˈmajtaj ˈroa]',
            cultural: 'Greetings establish connection and show respect for the person\'s mana'
          }
        ],
        exercises: [
          {
            id: 'greetings-practice-1',
            type: 'pronunciation',
            instructions: 'Practice the greetings with proper pronunciation, paying attention to the glottal stop in "Ia ora na"',
            items: [
              {
                question: 'Ia ora na',
                answer: '[ja ˈora na]',
                explanation: 'The glottal stop (\') is crucial for authentic pronunciation',
                cultural_note: 'This greeting honors the life force (ora) within each person'
              }
            ],
            answer_key: ['Proper glottal stop pronunciation', 'Respectful tone', 'Cultural awareness'],
            cultural_context: 'Greetings are sacred exchanges that acknowledge the divine in each person'
          }
        ],
        vocabulary: ['ia ora na', 'e aha te huru', 'maita\'i', 'roa'],
        culturalNotes: [
          'Always greet elders first as a sign of respect',
          'Eye contact shows sincerity and respect',
          'The greeting acknowledges the life force in each person'
        ]
      }
    ],
    vocabulary: [
      {
        tahitian: 'ia ora na',
        french: 'bonjour',
        english: 'hello',
        pronunciation: '[ja ˈora na]',
        etymology: 'ia (that) + ora (life) + na (there) = "may there be life"',
        cultural_significance: 'Acknowledges and honors the life force within each person',
        usage_examples: [
          'Ia ora na, e aha te huru? (Hello, how are you?)',
          'Ia ora na i teie mahana nehenehe (Hello on this beautiful day)'
        ]
      }
    ],
    grammar: [
      {
        concept: 'Tahitian Sentence Structure (VSO)',
        explanation: 'Tahitian follows Verb-Subject-Object order, different from French and English',
        examples: [
          'Amu au i te ma\'a (Eat I the food) = I eat the food',
          'Haere mai oe (Come here you) = You come here'
        ],
        practice: [
          'Identify the verb, subject, and object in Tahitian sentences',
          'Practice creating VSO sentences with cultural vocabulary'
        ],
        cultural_context: 'The VSO structure reflects Polynesian ways of thinking about action and agency'
      }
    ],
    cultural: [
      {
        topic: 'Polynesian Hospitality',
        description: 'The concept of welcoming others as family',
        significance: 'Central to Tahitian social structure and spiritual beliefs',
        modern_relevance: 'Continues to shape contemporary Tahitian society and tourism',
        respect_guidelines: [
          'Approach cultural learning with humility',
          'Recognize the sacred nature of cultural sharing',
          'Honor the generosity of cultural teachers',
          'Apply learning with respect and authenticity'
        ]
      }
    ],
    audio: [
      {
        id: 'native-greetings-1',
        title: 'Authentic Tahitian Greetings',
        speaker: 'Native Tahitian Elder',
        type: 'pronunciation',
        transcript: 'Ia ora na, e aha te huru? Maita\'i roa au.',
        cultural_context: 'Recorded with permission and respect from community elders'
      }
    ]
  }
];

// TEACHING METHODOLOGY
export const TEACHING_METHODOLOGY = {
  approach: 'Culturally Responsive Tahitian-French Pedagogy',
  principles: [
    'Honor the sacred nature of Tahitian language and culture',
    'Integrate authentic cultural contexts in all learning',
    'Develop cultural competency alongside linguistic skills',
    'Foster respect for Polynesian values and worldview',
    'Connect learning to contemporary Tahitian life',
    'Encourage community engagement and cultural validation'
  ],
  strategies: [
    'Native speaker integration and community partnerships',
    'Cultural immersion through authentic materials',
    'Respectful cultural protocol instruction',
    'Holistic assessment including cultural competency',
    'Differentiated instruction honoring diverse learning styles',
    'Reflective practice emphasizing cultural growth'
  ],
  assessment: [
    'Performance-based cultural demonstrations',
    'Portfolio development with cultural artifacts',
    'Community validation of cultural learning',
    'Self-reflection on cultural growth and respect',
    'Peer assessment emphasizing cultural sensitivity',
    'Authentic task completion with cultural accuracy'
  ]
};

// PROFESSIONAL DEVELOPMENT
export const PROFESSIONAL_DEVELOPMENT = {
  title: 'Culturally Responsive Tahitian-French Instruction',
  modules: [
    {
      title: 'Understanding Polynesian Cultural Values',
      duration: '3 hours',
      objectives: [
        'Develop deep respect for Tahitian culture and values',
        'Understand the sacred nature of language transmission',
        'Learn appropriate cultural protocols for education',
        'Recognize the responsibility of cultural stewardship'
      ],
      activities: [
        'Cultural immersion with community elders',
        'Traditional protocol learning and practice',
        'Reflection on cultural responsibility',
        'Development of cultural sensitivity practices'
      ]
    },
    {
      title: 'Authentic Pronunciation and Cultural Context',
      duration: '4 hours',
      objectives: [
        'Master authentic Tahitian pronunciation',
        'Understand cultural contexts of language use',
        'Develop skills for teaching cultural authenticity',
        'Learn to integrate cultural and linguistic instruction'
      ],
      activities: [
        'Intensive pronunciation practice with native speakers',
        'Cultural context analysis and application',
        'Teaching practice with cultural integration',
        'Feedback and refinement of cultural instruction'
      ]
    }
  ],
  resources: [
    'Community elder partnerships',
    'Native speaker audio libraries',
    'Cultural protocol guides',
    'Authentic cultural materials',
    'Ongoing cultural mentorship programs'
  ]
};

export default {
  TEACHER_RESOURCES,
  STUDENT_MATERIALS,
  TEACHING_METHODOLOGY,
  PROFESSIONAL_DEVELOPMENT
};
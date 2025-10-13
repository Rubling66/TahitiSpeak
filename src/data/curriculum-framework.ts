// Comprehensive Tahitian-French Learning Progression Framework
// High-End Educational Curriculum Design

import { Lesson, LessonLevel, VocabItem, Exercise, LessonSection } from '@/types';

export interface CurriculumLevel {
  id: string;
  name: string;
  level: LessonLevel;
  description: string;
  prerequisites?: string[];
  learningOutcomes: string[];
  estimatedHours: number;
  modules: CurriculumModule[];
}

export interface CurriculumModule {
  id: string;
  name: string;
  nameEnglish: string;
  nameTahitian: string;
  description: string;
  objectives: string[];
  culturalContext: string;
  lessons: string[]; // lesson IDs
  assessmentCriteria: AssessmentCriteria[];
  teacherNotes: string;
}

export interface AssessmentCriteria {
  skill: 'listening' | 'speaking' | 'reading' | 'writing' | 'cultural';
  description: string;
  rubric: RubricLevel[];
}

export interface RubricLevel {
  level: 'novice' | 'developing' | 'proficient' | 'advanced';
  description: string;
  indicators: string[];
}

// Comprehensive Curriculum Structure
export const TAHITIAN_FRENCH_CURRICULUM: CurriculumLevel[] = [
  {
    id: 'beginner',
    name: 'Niveau Débutant - Te Hōʻē Taʻata Hou',
    level: 'Beginner',
    description: 'Introduction fondamentale à la langue et culture tahitiennes',
    learningOutcomes: [
      'Maîtriser les salutations et expressions de politesse de base',
      'Comprendre et utiliser les nombres de 1 à 100',
      'Identifier et nommer les membres de la famille',
      'Décrire les aliments traditionnels tahitiens',
      'Reconnaître les éléments naturels de base',
      'Comprendre les contextes culturels fondamentaux'
    ],
    estimatedHours: 40,
    modules: [
      {
        id: 'greetings-politeness',
        name: 'Salutations et Politesse',
        nameEnglish: 'Greetings and Politeness',
        nameTahitian: 'Te Faʻaʻamu Rahi e te Faʻaʻaito',
        description: 'Maîtrise des expressions essentielles de salutation et de politesse dans la culture polynésienne',
        objectives: [
          'Utiliser correctement "Ia ora na" dans différents contextes',
          'Comprendre les nuances culturelles des salutations tahitiennes',
          'Maîtriser les expressions de politesse (mauruuru, faʻahou)',
          'Adapter les salutations selon le moment de la journée'
        ],
        culturalContext: 'Les salutations en Polynésie française reflètent les valeurs de respect mutuel et d\'hospitalité (mana). L\'expression "Ia ora na" signifie littéralement "que la vie soit" et porte une dimension spirituelle profonde.',
        lessons: ['lesson-1', 'lesson-6'],
        assessmentCriteria: [
          {
            skill: 'speaking',
            description: 'Prononciation et usage approprié des salutations',
            rubric: [
              {
                level: 'novice',
                description: 'Prononce avec hésitation, usage limité',
                indicators: ['Reconnaît "Ia ora na"', 'Hésite sur la prononciation']
              },
              {
                level: 'proficient',
                description: 'Prononciation claire, usage approprié',
                indicators: ['Prononce clairement', 'Utilise dans le bon contexte']
              }
            ]
          }
        ],
        teacherNotes: 'Insister sur l\'aspect culturel des salutations. Utiliser des jeux de rôle pour pratiquer les différents contextes sociaux.'
      },
      {
        id: 'numbers-counting',
        name: 'Nombres et Comptage',
        nameEnglish: 'Numbers and Counting',
        nameTahitian: 'Te Hoe e te Tatau',
        description: 'Système numérique tahitien traditionnel et moderne',
        objectives: [
          'Compter de 1 à 100 en tahitien',
          'Comprendre le système numérique traditionnel polynésien',
          'Utiliser les nombres dans des contextes pratiques',
          'Reconnaître les influences linguistiques historiques'
        ],
        culturalContext: 'Le système numérique tahitien reflète l\'organisation sociale traditionnelle et les méthodes de comptage ancestrales utilisées pour le commerce et les cérémonies.',
        lessons: ['lesson-2'],
        assessmentCriteria: [
          {
            skill: 'listening',
            description: 'Reconnaissance auditive des nombres',
            rubric: [
              {
                level: 'developing',
                description: 'Reconnaît les nombres 1-20',
                indicators: ['Identifie les nombres simples', 'Comprend dans un contexte']
              }
            ]
          }
        ],
        teacherNotes: 'Utiliser des objets concrets et des situations de la vie quotidienne pour enseigner les nombres.'
      },
      {
        id: 'family-relationships',
        name: 'Famille et Relations',
        nameEnglish: 'Family and Relationships',
        nameTahitian: 'Te ʻUtuāfare e te Fētii',
        description: 'Structure familiale polynésienne et terminologie des relations',
        objectives: [
          'Identifier tous les membres de la famille élargie',
          'Comprendre la structure familiale polynésienne',
          'Utiliser les termes de parenté appropriés',
          'Respecter les hiérarchies familiales traditionnelles'
        ],
        culturalContext: 'La famille élargie (ʻutuāfare) est le pilier de la société polynésienne. Les relations familiales s\'étendent bien au-delà de la famille nucléaire et incluent les liens adoptifs et spirituels.',
        lessons: ['lesson-3'],
        assessmentCriteria: [
          {
            skill: 'cultural',
            description: 'Compréhension des structures familiales polynésiennes',
            rubric: [
              {
                level: 'proficient',
                description: 'Comprend les relations familiales étendues',
                indicators: ['Explique les liens familiaux', 'Respecte les hiérarchies']
              }
            ]
          }
        ],
        teacherNotes: 'Encourager les étudiants à partager leurs propres structures familiales pour créer des parallèles culturels.'
      }
    ]
  },
  {
    id: 'intermediate',
    name: 'Niveau Intermédiaire - Te Taʻata Māramarama',
    level: 'Intermediate',
    description: 'Approfondissement linguistique et culturel avancé',
    prerequisites: ['beginner'],
    learningOutcomes: [
      'Tenir des conversations simples sur des sujets familiers',
      'Comprendre et décrire les traditions culturelles',
      'Utiliser les temps verbaux de base',
      'Naviguer dans des situations sociales courantes',
      'Apprécier la littérature orale tahitienne'
    ],
    estimatedHours: 60,
    modules: [
      {
        id: 'daily-conversations',
        name: 'Conversations Quotidiennes',
        nameEnglish: 'Daily Conversations',
        nameTahitian: 'Te Parau Rahi o te Mahana',
        description: 'Compétences conversationnelles pour la vie quotidienne',
        objectives: [
          'Demander et donner des directions',
          'Faire des achats au marché local',
          'Discuter du temps et des activités',
          'Exprimer des préférences et opinions simples'
        ],
        culturalContext: 'Les conversations quotidiennes en Polynésie intègrent naturellement des références à la nature, aux ancêtres et aux valeurs communautaires.',
        lessons: ['lesson-8', 'lesson-12'],
        assessmentCriteria: [
          {
            skill: 'speaking',
            description: 'Fluidité dans les conversations simples',
            rubric: [
              {
                level: 'developing',
                description: 'Participe à des échanges simples',
                indicators: ['Pose des questions de base', 'Répond de manière appropriée']
              }
            ]
          }
        ],
        teacherNotes: 'Créer des situations authentiques basées sur la vie polynésienne réelle.'
      },
      {
        id: 'cultural-traditions',
        name: 'Traditions et Cérémonies',
        nameEnglish: 'Traditions and Ceremonies',
        nameTahitian: 'Te Hīmene e te Tabu',
        description: 'Exploration approfondie des pratiques culturelles',
        objectives: [
          'Comprendre les cérémonies traditionnelles',
          'Apprendre les chants et danses de base',
          'Respecter les protocoles culturels',
          'Identifier les objets culturels traditionnels'
        ],
        culturalContext: 'Les traditions polynésiennes sont vivantes et continuent d\'évoluer tout en préservant leur essence spirituelle et communautaire.',
        lessons: ['lesson-9', 'lesson-10', 'lesson-13'],
        assessmentCriteria: [
          {
            skill: 'cultural',
            description: 'Respect et compréhension des traditions',
            rubric: [
              {
                level: 'advanced',
                description: 'Démontre une compréhension nuancée',
                indicators: ['Explique les significations culturelles', 'Participe respectueusement']
              }
            ]
          }
        ],
        teacherNotes: 'Inviter des aînés ou des praticiens culturels pour partager leurs connaissances.'
      }
    ]
  },
  {
    id: 'advanced',
    name: 'Niveau Avancé - Te Taʻata Mātau',
    level: 'Advanced',
    description: 'Maîtrise linguistique et expertise culturelle',
    prerequisites: ['intermediate'],
    learningOutcomes: [
      'Comprendre et produire des textes complexes',
      'Analyser la littérature et poésie tahitiennes',
      'Débattre de sujets culturels et sociaux',
      'Enseigner des aspects de la culture à d\'autres',
      'Contribuer à la préservation linguistique'
    ],
    estimatedHours: 80,
    modules: [
      {
        id: 'literature-poetry',
        name: 'Littérature et Poésie',
        nameEnglish: 'Literature and Poetry',
        nameTahitian: 'Te Puta e te ʻUte',
        description: 'Exploration de la richesse littéraire polynésienne',
        objectives: [
          'Analyser des textes littéraires traditionnels',
          'Comprendre la métrique poétique tahitienne',
          'Créer ses propres compositions',
          'Interpréter les symboles culturels'
        ],
        culturalContext: 'La tradition orale polynésienne préserve l\'histoire, la généalogie et la sagesse ancestrale à travers des formes littéraires sophistiquées.',
        lessons: ['lesson-advanced-1', 'lesson-advanced-2'],
        assessmentCriteria: [
          {
            skill: 'reading',
            description: 'Compréhension de textes littéraires complexes',
            rubric: [
              {
                level: 'advanced',
                description: 'Analyse critique des textes',
                indicators: ['Identifie les thèmes', 'Interprète les métaphores']
              }
            ]
          }
        ],
        teacherNotes: 'Utiliser des textes authentiques et encourager la créativité littéraire.'
      }
    ]
  }
];

// Pedagogical Methodology Framework
export interface TeachingMethodology {
  approach: string;
  principles: string[];
  techniques: string[];
  assessmentMethods: string[];
}

export const TAHITIAN_PEDAGOGY: TeachingMethodology = {
  approach: 'Communicative-Cultural Immersion',
  principles: [
    'Apprentissage par l\'expérience culturelle authentique',
    'Intégration des valeurs polynésiennes dans l\'enseignement',
    'Respect des méthodes d\'apprentissage traditionnelles',
    'Développement de la compétence interculturelle',
    'Préservation et transmission du patrimoine linguistique'
  ],
  techniques: [
    'Narration traditionnelle (pārau tupuna)',
    'Apprentissage par la chanson et la danse',
    'Jeux de rôle basés sur des situations culturelles',
    'Projets collaboratifs communautaires',
    'Immersion dans des contextes authentiques'
  ],
  assessmentMethods: [
    'Évaluation formative continue',
    'Portfolios de progression culturelle',
    'Présentations orales traditionnelles',
    'Projets de recherche culturelle',
    'Auto-évaluation réflexive'
  ]
};
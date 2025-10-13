import { LessonLevel, ExerciseType } from '../types';

// Assessment Module Interfaces
export interface AssessmentModule {
  id: string;
  title: string;
  level: LessonLevel;
  description: string;
  assessmentTypes: AssessmentType[];
  rubrics: AssessmentRubric[];
  progressTracking: ProgressTracker;
  culturalCompetency: CulturalAssessment;
  adaptiveElements: AdaptiveAssessment;
}

export interface AssessmentType {
  id: string;
  name: string;
  description: string;
  format: 'formative' | 'summative' | 'diagnostic' | 'authentic';
  skills: SkillArea[];
  duration: number; // minutes
  questions: AssessmentQuestion[];
  scoringMethod: ScoringMethod;
  culturalContext: string;
}

export interface SkillArea {
  area: 'vocabulary' | 'grammar' | 'pronunciation' | 'conversation' | 'cultural' | 'comprehension';
  weight: number;
  subSkills: string[];
  proficiencyLevels: ProficiencyLevel[];
}

export interface ProficiencyLevel {
  level: 'novice' | 'developing' | 'proficient' | 'advanced' | 'expert';
  description: string;
  indicators: string[];
  culturalMarkers: string[];
}

export interface AssessmentQuestion {
  id: string;
  type: ExerciseType;
  skillArea: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  culturalNote?: string;
  audioFile?: string;
  imageFile?: string;
  rubricCriteria: RubricCriterion[];
}

export interface RubricCriterion {
  criterion: string;
  levels: RubricLevel[];
  weight: number;
  culturalRelevance: string;
}

export interface RubricLevel {
  score: number;
  label: string;
  description: string;
  indicators: string[];
  culturalExpectations: string[];
}

export interface ScoringMethod {
  type: 'points' | 'rubric' | 'holistic' | 'portfolio' | 'peer';
  maxScore: number;
  passingScore: number;
  weightedCategories: WeightedCategory[];
  culturalBonus: number;
}

export interface WeightedCategory {
  category: string;
  weight: number;
  description: string;
}

export interface AssessmentRubric {
  id: string;
  name: string;
  purpose: string;
  criteria: RubricCriterion[];
  culturalDimensions: CulturalDimension[];
  applicationGuidelines: string[];
}

export interface CulturalDimension {
  aspect: 'respect' | 'authenticity' | 'context' | 'values' | 'protocols';
  description: string;
  indicators: string[];
  weight: number;
}

export interface ProgressTracker {
  id: string;
  metrics: ProgressMetric[];
  milestones: LearningMilestone[];
  visualizations: ProgressVisualization[];
  reports: ProgressReport[];
  adaptivePathways: AdaptivePath[];
}

export interface ProgressMetric {
  metric: 'accuracy' | 'fluency' | 'cultural_awareness' | 'engagement' | 'retention';
  measurement: string;
  target: number;
  current: number;
  trend: 'improving' | 'stable' | 'declining';
  culturalRelevance: string;
}

export interface LearningMilestone {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  culturalSignificance: string;
  celebration: string;
  nextSteps: string[];
}

export interface ProgressVisualization {
  type: 'chart' | 'badge' | 'pathway' | 'tree' | 'island';
  title: string;
  description: string;
  culturalMetaphor: string;
  interactiveElements: string[];
}

export interface ProgressReport {
  type: 'daily' | 'weekly' | 'monthly' | 'unit' | 'comprehensive';
  sections: ReportSection[];
  recommendations: string[];
  culturalInsights: string[];
  parentTeacherNotes: string[];
}

export interface ReportSection {
  title: string;
  content: string;
  metrics: ProgressMetric[];
  achievements: string[];
  areasForGrowth: string[];
}

export interface CulturalAssessment {
  id: string;
  title: string;
  description: string;
  competencies: CulturalCompetency[];
  scenarios: CulturalScenario[];
  reflectionPrompts: string[];
  communityValidation: CommunityValidation;
}

export interface CulturalCompetency {
  competency: string;
  description: string;
  levels: ProficiencyLevel[];
  assessmentMethods: string[];
  culturalMarkers: string[];
}

export interface CulturalScenario {
  id: string;
  title: string;
  context: string;
  situation: string;
  expectedResponse: string;
  culturalProtocols: string[];
  assessmentCriteria: string[];
}

export interface CommunityValidation {
  elders: ElderValidation[];
  culturalExperts: ExpertValidation[];
  communityFeedback: CommunityFeedback[];
}

export interface ElderValidation {
  name: string;
  role: string;
  feedback: string;
  culturalGuidance: string[];
  approvalStatus: 'approved' | 'needs_revision' | 'culturally_inappropriate';
}

export interface ExpertValidation {
  name: string;
  expertise: string;
  linguisticAccuracy: number;
  culturalAuthenticity: number;
  pedagogicalSoundness: number;
  recommendations: string[];
}

export interface CommunityFeedback {
  source: string;
  feedback: string;
  culturalRelevance: number;
  suggestions: string[];
}

export interface AdaptiveAssessment {
  id: string;
  algorithm: 'irt' | 'cat' | 'mastery' | 'cultural_responsive';
  parameters: AdaptiveParameter[];
  culturalAdaptations: CulturalAdaptation[];
  personalizationRules: PersonalizationRule[];
}

export interface AdaptiveParameter {
  parameter: string;
  value: number;
  culturalModifier: number;
  description: string;
}

export interface CulturalAdaptation {
  trigger: string;
  adaptation: string;
  culturalRationale: string;
  implementation: string[];
}

export interface PersonalizationRule {
  condition: string;
  action: string;
  culturalConsideration: string;
  priority: number;
}

export interface AdaptivePath {
  id: string;
  title: string;
  description: string;
  triggers: string[];
  pathSteps: PathStep[];
  culturalGuidance: string[];
}

export interface PathStep {
  step: number;
  activity: string;
  resources: string[];
  assessment: string;
  culturalContext: string;
}

// Assessment Modules Data
export const ASSESSMENT_MODULES: AssessmentModule[] = [
  {
    id: 'assessment-beginner',
    title: 'Évaluation Fondamentale Tahitien-Français',
    level: 'beginner',
    description: 'Évaluation holistique des compétences de base avec respect culturel',
    assessmentTypes: [
      {
        id: 'diagnostic-entry',
        name: 'Évaluation Diagnostique d\'Entrée',
        description: 'Évaluation initiale respectueuse des connaissances préalables',
        format: 'diagnostic',
        duration: 30,
        culturalContext: 'Approche bienveillante respectant le parcours de chaque apprenant',
        skills: [
          {
            area: 'vocabulary',
            weight: 0.25,
            subSkills: ['salutations', 'famille', 'nature'],
            proficiencyLevels: [
              {
                level: 'novice',
                description: 'Reconnaissance de mots isolés',
                indicators: [
                  'Identifie "ia ora na" comme salutation',
                  'Reconnaît "aroha" comme concept d\'amour'
                ],
                culturalMarkers: [
                  'Montre du respect pour les salutations traditionnelles',
                  'Comprend l\'importance spirituelle des mots'
                ]
              },
              {
                level: 'developing',
                description: 'Utilisation de phrases simples',
                indicators: [
                  'Utilise les salutations appropriées selon le moment',
                  'Nomme les membres de la famille en tahitien'
                ],
                culturalMarkers: [
                  'Adapte les salutations selon l\'âge de l\'interlocuteur',
                  'Comprend les relations familiales étendues polynésiennes'
                ]
              }
            ]
          },
          {
            area: 'pronunciation',
            weight: 0.30,
            subSkills: ['voyelles pures', 'coup de glotte', 'rythme'],
            proficiencyLevels: [
              {
                level: 'novice',
                description: 'Prononciation approximative mais compréhensible',
                indicators: [
                  'Distingue les 5 voyelles tahitiennes',
                  'Tente de prononcer le coup de glotte'
                ],
                culturalMarkers: [
                  'Montre du respect en essayant la prononciation authentique',
                  'Accepte la correction avec humilité'
                ]
              }
            ]
          },
          {
            area: 'cultural',
            weight: 0.25,
            subSkills: ['protocoles', 'valeurs', 'contexte'],
            proficiencyLevels: [
              {
                level: 'novice',
                description: 'Conscience de base des différences culturelles',
                indicators: [
                  'Reconnaît l\'importance du respect des anciens',
                  'Comprend la connexion nature-spiritualité'
                ],
                culturalMarkers: [
                  'Adopte une attitude respectueuse',
                  'Montre de la curiosité culturelle appropriée'
                ]
              }
            ]
          },
          {
            area: 'comprehension',
            weight: 0.20,
            subSkills: ['écoute', 'lecture', 'contexte'],
            proficiencyLevels: [
              {
                level: 'novice',
                description: 'Compréhension de messages simples',
                indicators: [
                  'Comprend les salutations de base',
                  'Identifie le sujet principal d\'un message simple'
                ],
                culturalMarkers: [
                  'Utilise le contexte culturel pour comprendre',
                  'Demande des clarifications respectueusement'
                ]
              }
            ]
          }
        ],
        questions: [
          {
            id: 'q1-greeting',
            type: 'multiple_choice',
            skillArea: 'vocabulary',
            difficulty: 1,
            question: 'Quelle est la salutation tahitienne appropriée pour dire bonjour?',
            options: ['Bonjour', 'Ia ora na', 'Salut', 'Bonsoir'],
            correctAnswer: 'Ia ora na',
            explanation: '"Ia ora na" signifie littéralement "que la vie soit" - c\'est une bénédiction de vie.',
            culturalNote: 'Cette salutation exprime le souhait de vie et de bien-être, reflétant les valeurs polynésiennes.',
            rubricCriteria: [
              {
                criterion: 'Reconnaissance culturelle',
                weight: 0.6,
                culturalRelevance: 'Comprendre l\'importance spirituelle des salutations',
                levels: [
                  {
                    score: 4,
                    label: 'Excellent',
                    description: 'Reconnaît et explique la signification culturelle',
                    indicators: ['Choisit la bonne réponse', 'Comprend le sens spirituel'],
                    culturalExpectations: ['Montre du respect pour la tradition']
                  },
                  {
                    score: 3,
                    label: 'Satisfaisant',
                    description: 'Reconnaît la salutation correcte',
                    indicators: ['Choisit la bonne réponse'],
                    culturalExpectations: ['Accepte l\'importance culturelle']
                  },
                  {
                    score: 2,
                    label: 'En développement',
                    description: 'Hésite mais identifie finalement',
                    indicators: ['Choisit après réflexion'],
                    culturalExpectations: ['Montre de l\'intérêt']
                  },
                  {
                    score: 1,
                    label: 'Débutant',
                    description: 'Ne reconnaît pas la salutation',
                    indicators: ['Choisit une mauvaise réponse'],
                    culturalExpectations: ['Reste ouvert à l\'apprentissage']
                  }
                ]
              }
            ]
          },
          {
            id: 'q2-pronunciation',
            type: 'pronunciation',
            skillArea: 'pronunciation',
            difficulty: 2,
            question: 'Prononcez le mot "aroha" en respectant la prononciation tahitienne.',
            correctAnswer: 'aroha',
            explanation: 'Chaque voyelle doit être pure: a-ro-ha avec accent sur "ro".',
            culturalNote: 'Aroha est un concept central - amour, compassion, connexion spirituelle.',
            rubricCriteria: [
              {
                criterion: 'Authenticité phonétique',
                weight: 0.7,
                culturalRelevance: 'Respecter la beauté sonore de la langue ancestrale',
                levels: [
                  {
                    score: 4,
                    label: 'Authentique',
                    description: 'Prononciation proche du natif',
                    indicators: ['Voyelles pures', 'Accent correct', 'Rythme naturel'],
                    culturalExpectations: ['Honore la tradition orale']
                  }
                ]
              }
            ]
          }
        ],
        scoringMethod: {
          type: 'rubric',
          maxScore: 100,
          passingScore: 70,
          culturalBonus: 10,
          weightedCategories: [
            {
              category: 'Compétence linguistique',
              weight: 0.7,
              description: 'Maîtrise technique de la langue'
            },
            {
              category: 'Sensibilité culturelle',
              weight: 0.3,
              description: 'Respect et compréhension culturelle'
            }
          ]
        }
      },
      {
        id: 'formative-weekly',
        name: 'Évaluation Formative Hebdomadaire',
        description: 'Suivi continu des progrès avec feedback bienveillant',
        format: 'formative',
        duration: 15,
        culturalContext: 'Évaluation comme accompagnement, non comme jugement',
        skills: [],
        questions: [],
        scoringMethod: {
          type: 'holistic',
          maxScore: 10,
          passingScore: 6,
          culturalBonus: 2,
          weightedCategories: []
        }
      }
    ],
    rubrics: [
      {
        id: 'holistic-tahitian-rubric',
        name: 'Grille Holistique Tahitien-Français',
        purpose: 'Évaluation globale respectant l\'approche polynésienne de l\'apprentissage',
        criteria: [
          {
            criterion: 'Maîtrise linguistique',
            weight: 0.4,
            culturalRelevance: 'Précision dans l\'usage de la langue sacrée',
            levels: [
              {
                score: 4,
                label: 'Maîtrise avancée',
                description: 'Utilisation fluide et naturelle',
                indicators: [
                  'Prononciation authentique',
                  'Vocabulaire riche et approprié',
                  'Grammaire correcte et naturelle'
                ],
                culturalExpectations: [
                  'Honore la beauté de la langue',
                  'Transmet l\'émotion et le sens profond'
                ]
              },
              {
                score: 3,
                label: 'Compétence solide',
                description: 'Communication efficace avec quelques erreurs mineures',
                indicators: [
                  'Prononciation généralement correcte',
                  'Vocabulaire adéquat',
                  'Grammaire fonctionnelle'
                ],
                culturalExpectations: [
                  'Respecte les conventions linguistiques',
                  'Communique avec sincérité'
                ]
              },
              {
                score: 2,
                label: 'En développement',
                description: 'Communication de base avec erreurs notables',
                indicators: [
                  'Prononciation approximative mais compréhensible',
                  'Vocabulaire limité mais fonctionnel',
                  'Erreurs grammaticales fréquentes'
                ],
                culturalExpectations: [
                  'Montre des efforts sincères',
                  'Accepte la guidance avec humilité'
                ]
              },
              {
                score: 1,
                label: 'Débutant',
                description: 'Communication très limitée',
                indicators: [
                  'Prononciation difficile à comprendre',
                  'Vocabulaire très restreint',
                  'Grammaire incorrecte'
                ],
                culturalExpectations: [
                  'Maintient une attitude respectueuse',
                  'Persévère malgré les difficultés'
                ]
              }
            ]
          },
          {
            criterion: 'Compétence culturelle',
            weight: 0.3,
            culturalRelevance: 'Compréhension et respect des valeurs mā\'ohi',
            levels: [
              {
                score: 4,
                label: 'Intégration culturelle',
                description: 'Compréhension profonde et application naturelle',
                indicators: [
                  'Adapte le langage selon le contexte culturel',
                  'Comprend les nuances culturelles',
                  'Respecte les protocoles traditionnels'
                ],
                culturalExpectations: [
                  'Agit comme un ambassadeur culturel',
                  'Transmet les valeurs avec authenticité'
                ]
              }
            ]
          },
          {
            criterion: 'Engagement et attitude',
            weight: 0.3,
            culturalRelevance: 'Esprit d\'apprentissage polynésien - humilité et persévérance',
            levels: [
              {
                score: 4,
                label: 'Engagement exemplaire',
                description: 'Attitude d\'apprentissage idéale',
                indicators: [
                  'Participation active et respectueuse',
                  'Curiosité culturelle authentique',
                  'Persévérance face aux défis'
                ],
                culturalExpectations: [
                  'Incarne les valeurs d\'humilité et de respect',
                  'Inspire les autres apprenants'
                ]
              }
            ]
          }
        ],
        culturalDimensions: [
          {
            aspect: 'respect',
            description: 'Respect des anciens, de la langue et des traditions',
            weight: 0.25,
            indicators: [
              'Utilise les formules de politesse appropriées',
              'Montre de la déférence envers les enseignements traditionnels',
              'Évite l\'appropriation culturelle inappropriée'
            ]
          },
          {
            aspect: 'authenticity',
            description: 'Recherche de l\'authenticité dans l\'apprentissage',
            weight: 0.25,
            indicators: [
              'Privilégie les sources culturelles authentiques',
              'Évite les stéréotypes et généralisations',
              'Cherche à comprendre plutôt qu\'à imiter superficiellement'
            ]
          },
          {
            aspect: 'context',
            description: 'Compréhension du contexte culturel et historique',
            weight: 0.25,
            indicators: [
              'Situe l\'apprentissage dans le contexte historique',
              'Comprend l\'impact de la colonisation sur la langue',
              'Apprécie les efforts de revitalisation culturelle'
            ]
          },
          {
            aspect: 'values',
            description: 'Intégration des valeurs polynésiennes',
            weight: 0.25,
            indicators: [
              'Manifeste l\'aroha dans les interactions',
              'Comprend l\'importance de la communauté (\'ohana)',
              'Respecte la connexion avec la nature (fenua)'
            ]
          }
        ],
        applicationGuidelines: [
          'Utiliser cette grille comme guide, non comme contrainte rigide',
          'Adapter l\'évaluation au contexte culturel de l\'apprenant',
          'Privilégier le feedback constructif et bienveillant',
          'Célébrer les progrès, même petits',
          'Encourager l\'auto-évaluation et la réflexion'
        ]
      }
    ],
    progressTracking: {
      id: 'beginner-progress',
      metrics: [
        {
          metric: 'accuracy',
          measurement: 'Pourcentage de réponses correctes',
          target: 80,
          current: 0,
          trend: 'stable',
          culturalRelevance: 'Précision dans le respect de la langue ancestrale'
        },
        {
          metric: 'cultural_awareness',
          measurement: 'Score de sensibilité culturelle',
          target: 85,
          current: 0,
          trend: 'stable',
          culturalRelevance: 'Développement du respect et de la compréhension culturelle'
        },
        {
          metric: 'engagement',
          measurement: 'Niveau de participation active',
          target: 90,
          current: 0,
          trend: 'stable',
          culturalRelevance: 'Esprit d\'apprentissage polynésien - curiosité et humilité'
        }
      ],
      milestones: [
        {
          id: 'first-greeting',
          title: 'Première Salutation Authentique',
          description: 'Maîtrise des salutations de base avec prononciation correcte',
          requirements: [
            'Prononcer "Ia ora na" correctement',
            'Comprendre la signification spirituelle',
            'Utiliser au bon moment de la journée'
          ],
          culturalSignificance: 'Premier pas vers la connexion avec l\'âme polynésienne',
          celebration: 'Reconnaissance par un ancien ou un locuteur natif',
          nextSteps: [
            'Apprendre les salutations selon l\'âge',
            'Découvrir les salutations traditionnelles spéciales',
            'Pratiquer avec différents interlocuteurs'
          ]
        },
        {
          id: 'family-circle',
          title: 'Cercle Familial Tahitien',
          description: 'Maîtrise du vocabulaire familial étendu polynésien',
          requirements: [
            'Nommer tous les membres de la famille nucléaire',
            'Comprendre les relations familiales étendues',
            'Utiliser les termes respectueux selon l\'âge'
          ],
          culturalSignificance: 'Compréhension de l\'importance de l\'ohana (famille étendue)',
          celebration: 'Présentation de sa famille en tahitien',
          nextSteps: [
            'Apprendre les rôles traditionnels',
            'Découvrir les liens spirituels familiaux',
            'Pratiquer les présentations formelles'
          ]
        }
      ],
      visualizations: [
        {
          type: 'island',
          title: 'Île de l\'Apprentissage',
          description: 'Progression visualisée comme exploration d\'une île tahitienne',
          culturalMetaphor: 'Chaque compétence est un lieu sacré à découvrir sur l\'île',
          interactiveElements: [
            'Sentiers de progression entre les lieux',
            'Trésors culturels à débloquer',
            'Guides spirituels (anciens) qui apparaissent',
            'Paysages qui s\'enrichissent avec les progrès'
          ]
        },
        {
          type: 'tree',
          title: 'Arbre Généalogique de la Connaissance',
          description: 'Compétences organisées comme un arbre de vie polynésien',
          culturalMetaphor: 'Les racines sont les valeurs, le tronc la langue, les branches les compétences',
          interactiveElements: [
            'Feuilles qui poussent avec chaque apprentissage',
            'Fruits de sagesse à récolter',
            'Oiseaux messagers avec conseils culturels',
            'Saisons qui marquent les étapes importantes'
          ]
        }
      ],
      reports: [
        {
          type: 'weekly',
          sections: [
            {
              title: 'Progrès de la Semaine',
              content: 'Résumé des apprentissages et découvertes culturelles',
              metrics: [],
              achievements: [],
              areasForGrowth: []
            },
            {
              title: 'Moment Culturel de la Semaine',
              content: 'Découverte culturelle marquante et réflexions',
              metrics: [],
              achievements: [],
              areasForGrowth: []
            }
          ],
          recommendations: [
            'Continuer la pratique quotidienne des salutations',
            'Explorer les chants traditionnels pour améliorer la prononciation',
            'Regarder des vidéos culturelles authentiques'
          ],
          culturalInsights: [
            'La patience est une vertu polynésienne - l\'apprentissage prend du temps',
            'Chaque erreur est une opportunité d\'approfondir la compréhension',
            'La communauté d\'apprentissage reflète l\'esprit d\'ohana'
          ],
          parentTeacherNotes: [
            'Encourager la pratique en famille',
            'Célébrer les petits progrès',
            'Maintenir une atmosphère de respect et de bienveillance'
          ]
        }
      ],
      adaptivePathways: [
        {
          id: 'pronunciation-focus',
          title: 'Chemin de Perfectionnement Phonétique',
          description: 'Parcours adapté pour les apprenants ayant des difficultés de prononciation',
          triggers: [
            'Score de prononciation < 70%',
            'Difficultés répétées avec le coup de glotte',
            'Demande explicite d\'aide phonétique'
          ],
          pathSteps: [
            {
              step: 1,
              activity: 'Exercices d\'écoute intensive avec anciens',
              resources: ['Enregistrements authentiques', 'Guide phonétique visuel'],
              assessment: 'Test de discrimination auditive',
              culturalContext: 'Importance de l\'écoute respectueuse dans la culture polynésienne'
            },
            {
              step: 2,
              activity: 'Pratique guidée avec feedback immédiat',
              resources: ['Application de reconnaissance vocale', 'Séances avec tuteur natif'],
              assessment: 'Enregistrement et auto-évaluation',
              culturalContext: 'L\'humilité dans l\'apprentissage - accepter la guidance'
            }
          ],
          culturalGuidance: [
            'La prononciation correcte honore les ancêtres',
            'Chaque son porte l\'esprit de la langue',
            'La persévérance est valorisée dans la culture polynésienne'
          ]
        }
      ]
    },
    culturalCompetency: {
      id: 'cultural-assessment-beginner',
      title: 'Évaluation de Compétence Culturelle - Niveau Débutant',
      description: 'Évaluation respectueuse de la sensibilité et compréhension culturelle',
      competencies: [
        {
          competency: 'Respect des protocoles de salutation',
          description: 'Comprendre et appliquer les salutations appropriées selon le contexte',
          levels: [
            {
              level: 'novice',
              description: 'Utilise les salutations de base correctement',
              indicators: [
                'Dit "Ia ora na" au bon moment',
                'Montre du respect dans le ton et l\'attitude'
              ],
              culturalMarkers: [
                'Comprend que saluer est un acte spirituel',
                'Adapte son comportement selon l\'âge de l\'interlocuteur'
              ]
            }
          ],
          assessmentMethods: [
            'Observation en situation réelle',
            'Jeux de rôle culturels',
            'Auto-réflexion guidée'
          ],
          culturalMarkers: [
            'Respect des anciens',
            'Humilité dans l\'approche',
            'Sincérité dans l\'intention'
          ]
        }
      ],
      scenarios: [
        {
          id: 'meeting-elder',
          title: 'Rencontre avec un Ancien',
          context: 'Première visite dans une famille tahitienne',
          situation: 'Vous êtes présenté à un ancien respecté de la famille. Comment vous comportez-vous?',
          expectedResponse: 'Salutation respectueuse, écoute attentive, questions appropriées',
          culturalProtocols: [
            'Attendre d\'être présenté formellement',
            'Utiliser "Ia ora na" avec respect',
            'Écouter plus que parler',
            'Montrer de l\'intérêt pour ses histoires'
          ],
          assessmentCriteria: [
            'Respect manifesté dans l\'attitude',
            'Utilisation appropriée de la langue',
            'Compréhension des hiérarchies culturelles',
            'Sincérité dans l\'interaction'
          ]
        }
      ],
      reflectionPrompts: [
        'Comment votre compréhension de la culture tahitienne a-t-elle évolué?',
        'Quels aspects culturels vous touchent le plus et pourquoi?',
        'Comment pouvez-vous montrer du respect pour cette culture dans votre apprentissage?',
        'Quelles similitudes et différences voyez-vous avec votre propre culture?'
      ],
      communityValidation: {
        elders: [
          {
            name: 'Mama Terehia',
            role: 'Gardienne des traditions',
            feedback: 'L\'évaluation respecte nos valeurs d\'apprentissage communautaire',
            culturalGuidance: [
              'L\'apprentissage doit venir du cœur, pas seulement de l\'esprit',
              'Chaque apprenant apporte sa propre lumière à partager',
              'La patience et la bienveillance sont essentielles'
            ],
            approvalStatus: 'approved'
          }
        ],
        culturalExperts: [
          {
            name: 'Dr. Teiva Manutahi',
            expertise: 'Linguistique tahitienne et pédagogie culturelle',
            linguisticAccuracy: 95,
            culturalAuthenticity: 98,
            pedagogicalSoundness: 92,
            recommendations: [
              'Intégrer plus d\'éléments de tradition orale',
              'Ajouter des références aux légendes polynésiennes',
              'Inclure des variations dialectales des îles'
            ]
          }
        ],
        communityFeedback: [
          {
            source: 'Association culturelle Te Fare Tahiti Nui',
            feedback: 'Approche respectueuse et authentique de l\'évaluation culturelle',
            culturalRelevance: 90,
            suggestions: [
              'Organiser des sessions avec la communauté',
              'Créer des partenariats avec les écoles tahitiennes',
              'Développer des échanges culturels virtuels'
            ]
          }
        ]
      }
    },
    adaptiveElements: {
      id: 'adaptive-beginner',
      algorithm: 'cultural_responsive',
      parameters: [
        {
          parameter: 'cultural_sensitivity_weight',
          value: 0.4,
          culturalModifier: 1.2,
          description: 'Pondération de la sensibilité culturelle dans l\'adaptation'
        },
        {
          parameter: 'pronunciation_difficulty_threshold',
          value: 0.7,
          culturalModifier: 0.9,
          description: 'Seuil de difficulté pour déclencher l\'aide phonétique'
        }
      ],
      culturalAdaptations: [
        {
          trigger: 'Difficultés répétées avec concepts culturels',
          adaptation: 'Intégration d\'histoires et légendes explicatives',
          culturalRationale: 'La tradition orale polynésienne facilite la compréhension',
          implementation: [
            'Ajouter des récits contextuels',
            'Utiliser des métaphores naturelles',
            'Intégrer des chants traditionnels'
          ]
        },
        {
          trigger: 'Manque de confiance en prononciation',
          adaptation: 'Sessions d\'encouragement avec locuteurs natifs bienveillants',
          culturalRationale: 'L\'apprentissage communautaire et le soutien mutuel',
          implementation: [
            'Organiser des cercles de parole',
            'Créer des groupes de pratique',
            'Célébrer chaque progrès'
          ]
        }
      ],
      personalizationRules: [
        {
          condition: 'Apprenant avec background francophone',
          action: 'Mettre l\'accent sur les différences phonétiques spécifiques',
          culturalConsideration: 'Respecter la richesse linguistique de l\'apprenant',
          priority: 2
        },
        {
          condition: 'Apprenant montrant un intérêt culturel profond',
          action: 'Proposer des contenus culturels enrichis',
          culturalConsideration: 'Nourrir la curiosité culturelle authentique',
          priority: 1
        }
      ]
    }
  }
];

// Assessment Pedagogy and Guidelines
export const ASSESSMENT_PEDAGOGY = {
  philosophy: 'Évaluation Culturellement Responsive et Holistique',
  principles: [
    'L\'évaluation comme accompagnement, non comme jugement',
    'Respect de la diversité des parcours d\'apprentissage',
    'Intégration des valeurs polynésiennes dans l\'évaluation',
    'Célébration des progrès et encouragement bienveillant',
    'Évaluation communautaire et collaborative'
  ],
  culturalConsiderations: [
    'Éviter la compétition destructrice - privilégier la croissance personnelle',
    'Respecter les différents styles d\'apprentissage culturels',
    'Intégrer la sagesse des anciens dans l\'évaluation',
    'Valoriser l\'effort et l\'intention autant que le résultat',
    'Maintenir la connexion spirituelle avec l\'apprentissage'
  ],
  implementationGuidelines: [
    'Former les évaluateurs à la sensibilité culturelle',
    'Adapter les outils selon le contexte culturel de l\'apprenant',
    'Créer des environnements d\'évaluation bienveillants',
    'Utiliser des méthodes d\'évaluation variées et inclusives',
    'Impliquer la communauté dans le processus d\'évaluation'
  ]
};

export default ASSESSMENT_MODULES;
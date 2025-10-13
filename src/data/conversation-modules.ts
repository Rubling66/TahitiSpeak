// Comprehensive Tahitian-French Conversation Practice Modules
// Authentic Cultural Context and Practical Communication Skills

import { LessonLevel, Exercise } from '@/types';

export interface ConversationModule {
  id: string;
  name: string;
  nameEnglish: string;
  nameTahitian: string;
  level: LessonLevel;
  description: string;
  culturalContext: string;
  communicativeGoals: string[];
  dialogues: Dialogue[];
  rolePlayScenarios: RolePlayScenario[];
  culturalProtocols: CulturalProtocol[];
  practiceExercises: ConversationExercise[];
  assessmentCriteria: ConversationAssessment[];
}

export interface Dialogue {
  id: string;
  title: string;
  context: string;
  participants: Participant[];
  exchanges: Exchange[];
  culturalNotes: string[];
  keyPhrases: KeyPhrase[];
  followUpQuestions: string[];
}

export interface Participant {
  name: string;
  role: string;
  culturalBackground: string;
  relationshipToOthers: string;
}

export interface Exchange {
  speaker: string;
  tahitian: string;
  french: string;
  english: string;
  culturalSignificance?: string;
  intonationNotes?: string;
  bodyLanguage?: string;
}

export interface KeyPhrase {
  tahitian: string;
  french: string;
  english: string;
  usage: string;
  culturalContext: string;
  variations: string[];
}

export interface RolePlayScenario {
  id: string;
  title: string;
  setting: string;
  culturalContext: string;
  objectives: string[];
  roles: Role[];
  guidelines: string[];
  culturalSensitivities: string[];
  extensionActivities: string[];
}

export interface Role {
  character: string;
  background: string;
  motivations: string[];
  culturalConsiderations: string[];
  languageLevel: string;
}

export interface CulturalProtocol {
  situation: string;
  protocol: string;
  explanation: string;
  linguisticMarkers: string[];
  modernAdaptations: string[];
}

export interface ConversationExercise {
  id: string;
  type: 'dialogue-completion' | 'cultural-response' | 'register-adaptation' | 'improvisation';
  instruction: string;
  scenario: string;
  culturalFocus: string;
  expectedOutcomes: string[];
}

export interface ConversationAssessment {
  skill: 'fluency' | 'cultural-appropriateness' | 'pronunciation' | 'comprehension' | 'interaction';
  criteria: string;
  rubric: AssessmentLevel[];
}

export interface AssessmentLevel {
  level: 'novice' | 'developing' | 'proficient' | 'advanced';
  description: string;
  indicators: string[];
  culturalCompetence: string;
}

// BEGINNER CONVERSATION MODULES
export const BEGINNER_CONVERSATION_MODULES: ConversationModule[] = [
  {
    id: 'first-meetings',
    name: 'Premières Rencontres',
    nameEnglish: 'First Meetings',
    nameTahitian: 'Te Mau Faʻaʻamu Mua',
    level: 'Beginner',
    description: 'Conversations initiales avec protocoles culturels appropriés pour les premières rencontres',
    culturalContext: 'Les premières rencontres en Polynésie suivent des protocoles précis qui établissent respect mutuel et harmonie sociale.',
    communicativeGoals: [
      'Se présenter avec respect culturel',
      'Demander et donner des informations personnelles de base',
      'Utiliser les formules de politesse appropriées',
      'Établir des liens familiaux ou géographiques',
      'Montrer de l\'intérêt pour l\'autre personne'
    ],
    dialogues: [
      {
        id: 'meeting-elder',
        title: 'Rencontre avec un Aîné',
        context: 'Un jeune rencontre un aîné respecté de la communauté pour la première fois',
        participants: [
          {
            name: 'Teiva',
            role: 'Jeune homme',
            culturalBackground: 'Tahitien moderne, respectueux des traditions',
            relationshipToOthers: 'Cherche à établir une relation respectueuse'
          },
          {
            name: 'Mama Terehia',
            role: 'Aînée respectée',
            culturalBackground: 'Gardienne des traditions, sage de la communauté',
            relationshipToOthers: 'Figure maternelle pour la communauté'
          }
        ],
        exchanges: [
          {
            speaker: 'Teiva',
            tahitian: 'Ia ora na, Mama Terehia',
            french: 'Bonjour, Mama Terehia',
            english: 'Hello, Mama Terehia',
            culturalSignificance: 'Usage du titre respectueux "Mama" pour une aînée',
            intonationNotes: 'Ton respectueux et légèrement plus bas',
            bodyLanguage: 'Légère inclinaison de la tête en signe de respect'
          },
          {
            speaker: 'Mama Terehia',
            tahitian: 'Ia ora na, e tama. Eaha tō ʻoe iʻoa?',
            french: 'Bonjour, mon enfant. Quel est ton nom?',
            english: 'Hello, my child. What is your name?',
            culturalSignificance: '"E tama" exprime l\'affection maternelle envers les jeunes',
            intonationNotes: 'Ton chaleureux et bienveillant',
            bodyLanguage: 'Sourire maternel, regard bienveillant'
          },
          {
            speaker: 'Teiva',
            tahitian: 'ʻO Teiva tōʻu iʻoa. ʻO vai tō ʻoe ʻutuāfare?',
            french: 'Mon nom est Teiva. Quelle est votre famille?',
            english: 'My name is Teiva. What is your family?',
            culturalSignificance: 'Question sur la famille pour établir des connexions sociales',
            intonationNotes: 'Curiosité respectueuse',
            bodyLanguage: 'Attention soutenue, posture ouverte'
          },
          {
            speaker: 'Mama Terehia',
            tahitian: 'ʻO te ʻutuāfare Terehia au. Nō hea ʻoe?',
            french: 'Je suis de la famille Terehia. D\'où viens-tu?',
            english: 'I am from the Terehia family. Where are you from?',
            culturalSignificance: 'Identification par la famille, question sur l\'origine géographique',
            intonationNotes: 'Fierté familiale, intérêt sincère',
            bodyLanguage: 'Posture droite exprimant la dignité familiale'
          },
          {
            speaker: 'Teiva',
            tahitian: 'Nō Papeete au, engari, nō Huahine tōʻu tupuna vahine',
            french: 'Je viens de Papeete, mais ma grand-mère vient de Huahine',
            english: 'I come from Papeete, but my grandmother comes from Huahine',
            culturalSignificance: 'Mention des origines ancestrales pour établir des liens',
            intonationNotes: 'Respect pour les origines ancestrales',
            bodyLanguage: 'Expression de fierté pour les racines familiales'
          },
          {
            speaker: 'Mama Terehia',
            tahitian: 'Ē! Ua ʻite au i te mau taʻata nō Huahine. Maita\'i roa!',
            french: 'Ah! Je connais des gens de Huahine. Très bien!',
            english: 'Ah! I know people from Huahine. Very good!',
            culturalSignificance: 'Établissement d\'une connexion géographique et sociale',
            intonationNotes: 'Joie de la découverte d\'une connexion',
            bodyLanguage: 'Sourire élargi, geste d\'approbation'
          }
        ],
        culturalNotes: [
          'L\'usage de "Mama" montre le respect envers les aînées',
          'Les questions sur la famille établissent des connexions sociales',
          'Mentionner les origines ancestrales renforce l\'identité culturelle',
          'Les exclamations comme "Ē!" expriment l\'émotion authentique'
        ],
        keyPhrases: [
          {
            tahitian: 'Eaha tō ʻoe iʻoa?',
            french: 'Quel est ton nom?',
            english: 'What is your name?',
            usage: 'Question polie pour demander le nom',
            culturalContext: 'Première étape pour établir une relation',
            variations: ['ʻO vai ʻoe?', 'Eaha tō iʻoa?']
          },
          {
            tahitian: 'Nō hea ʻoe?',
            french: 'D\'où viens-tu?',
            english: 'Where are you from?',
            usage: 'Question sur l\'origine géographique',
            culturalContext: 'Établit des connexions géographiques et familiales',
            variations: ['Nō hea mai ʻoe?', 'I hea tō ʻoe fenua?']
          }
        ],
        followUpQuestions: [
          'Quelles autres informations Teiva pourrait-il partager?',
          'Comment Mama Terehia pourrait-elle continuer la conversation?',
          'Quels liens familiaux pourraient être découverts?'
        ]
      },
      {
        id: 'peer-introduction',
        title: 'Présentation entre Pairs',
        context: 'Deux jeunes du même âge se rencontrent lors d\'un événement culturel',
        participants: [
          {
            name: 'Moana',
            role: 'Jeune femme',
            culturalBackground: 'Tahitienne, étudiante en danse traditionnelle',
            relationshipToOthers: 'Cherche à se faire des amis'
          },
          {
            name: 'Kaimana',
            role: 'Jeune homme',
            culturalBackground: 'Tahitien, musicien traditionnel',
            relationshipToOthers: 'Ouvert aux nouvelles rencontres'
          }
        ],
        exchanges: [
          {
            speaker: 'Moana',
            tahitian: 'Ia ora na! ʻO Moana au',
            french: 'Salut! Je suis Moana',
            english: 'Hi! I am Moana',
            culturalSignificance: 'Présentation directe et amicale entre pairs',
            intonationNotes: 'Ton enjoué et confiant',
            bodyLanguage: 'Sourire franc, geste d\'ouverture'
          },
          {
            speaker: 'Kaimana',
            tahitian: 'Ia ora na, Moana! ʻO Kaimana au. Maita\'i ʻoe?',
            french: 'Salut, Moana! Je suis Kaimana. Tu vas bien?',
            english: 'Hi, Moana! I am Kaimana. Are you well?',
            culturalSignificance: 'Réciprocité dans la présentation et intérêt pour le bien-être',
            intonationNotes: 'Chaleur et intérêt sincère',
            bodyLanguage: 'Contact visuel direct, posture détendue'
          },
          {
            speaker: 'Moana',
            tahitian: 'Maita\'i roa! E aha tā ʻoe hana i teie nei?',
            french: 'Très bien! Qu\'est-ce que tu fais ici?',
            english: 'Very well! What are you doing here?',
            culturalSignificance: 'Question sur l\'activité pour trouver des points communs',
            intonationNotes: 'Curiosité amicale',
            bodyLanguage: 'Intérêt manifeste, légère inclinaison vers l\'avant'
          },
          {
            speaker: 'Kaimana',
            tahitian: 'E hīmene au i te ʻukulele. E ʻoe hoi?',
            french: 'Je joue du ukulélé. Et toi?',
            english: 'I play the ukulele. And you?',
            culturalSignificance: 'Partage d\'une passion culturelle et réciprocité',
            intonationNotes: 'Fierté pour son art, curiosité pour l\'autre',
            bodyLanguage: 'Geste mimant le jeu d\'ukulélé'
          },
          {
            speaker: 'Moana',
            tahitian: 'Ē! E ʻōrī au! ʻAita peʻapeʻa, e hoa?',
            french: 'Ah! Je danse! Pas de problème, mon ami?',
            english: 'Ah! I dance! No problem, my friend?',
            culturalSignificance: 'Découverte d\'arts complémentaires, proposition d\'amitié',
            intonationNotes: 'Excitation de la découverte, invitation chaleureuse',
            bodyLanguage: 'Mouvement de danse subtil, sourire complice'
          }
        ],
        culturalNotes: [
          'Entre pairs, les présentations sont plus directes et décontractées',
          'L\'art et la culture sont des sujets de connexion naturels',
          'L\'usage de "e hoa" (mon ami) marque l\'établissement d\'une amitié',
          'Les exclamations "Ē!" expriment l\'enthousiasme authentique'
        ],
        keyPhrases: [
          {
            tahitian: 'E aha tā ʻoe hana?',
            french: 'Qu\'est-ce que tu fais?',
            english: 'What do you do?',
            usage: 'Question sur l\'activité ou profession',
            culturalContext: 'Découverte des passions et talents',
            variations: ['E aha tā ʻoe ʻohipa?', 'E aha tō ʻoe hana?']
          }
        ],
        followUpQuestions: [
          'Comment cette amitié pourrait-elle se développer?',
          'Quels projets artistiques pourraient-ils envisager ensemble?',
          'Comment intégrer leurs arts respectifs?'
        ]
      }
    ],
    rolePlayScenarios: [
      {
        id: 'family-gathering',
        title: 'Rassemblement Familial',
        setting: 'Grande réunion de famille pour un anniversaire',
        culturalContext: 'Les rassemblements familiaux sont des moments sacrés de renforcement des liens et de transmission culturelle',
        objectives: [
          'Saluer appropriément selon l\'âge et le statut',
          'Se présenter aux membres inconnus de la famille',
          'Montrer du respect envers les aînés',
          'Participer aux conversations intergénérationnelles'
        ],
        roles: [
          {
            character: 'Jeune visiteur',
            background: 'Première visite à cette branche de la famille',
            motivations: ['Faire bonne impression', 'Apprendre sur ses racines'],
            culturalConsiderations: ['Respect des aînés', 'Humilité appropriée'],
            languageLevel: 'Débutant à intermédiaire'
          },
          {
            character: 'Aîné de la famille',
            background: 'Gardien des traditions familiales',
            motivations: ['Accueillir chaleureusement', 'Transmettre l\'histoire'],
            culturalConsiderations: ['Bienveillance', 'Sagesse partagée'],
            languageLevel: 'Avancé'
          },
          {
            character: 'Cousin du même âge',
            background: 'Membre régulier des rassemblements',
            motivations: ['Faciliter l\'intégration', 'Créer des liens'],
            culturalConsiderations: ['Solidarité familiale', 'Inclusion'],
            languageLevel: 'Intermédiaire'
          }
        ],
        guidelines: [
          'Commencer par saluer les aînés en premier',
          'Utiliser les titres de respect appropriés',
          'Poser des questions sur l\'histoire familiale',
          'Montrer de l\'intérêt pour les traditions',
          'Participer aux activités collectives'
        ],
        culturalSensitivities: [
          'Ne pas interrompre les aînés',
          'Respecter les hiérarchies familiales',
          'Éviter les sujets controversés',
          'Montrer de la gratitude pour l\'hospitalité'
        ],
        extensionActivities: [
          'Préparer une présentation sur sa propre branche familiale',
          'Apprendre une chanson familiale traditionnelle',
          'Participer à la préparation du repas communautaire'
        ]
      }
    ],
    culturalProtocols: [
      {
        situation: 'Rencontre avec un aîné',
        protocol: 'Saluer en premier, utiliser des titres de respect, attendre l\'invitation pour s\'asseoir',
        explanation: 'Les aînés détiennent la sagesse et méritent un respect particulier',
        linguisticMarkers: ['Mama/Papa + nom', 'Ton respectueux', 'Formules de politesse étendues'],
        modernAdaptations: ['Respect maintenu dans les contextes modernes', 'Adaptation aux situations professionnelles']
      },
      {
        situation: 'Présentation personnelle',
        protocol: 'Donner son nom, mentionner sa famille, indiquer son origine géographique',
        explanation: 'L\'identité polynésienne est collective et géographiquement ancrée',
        linguisticMarkers: ['ʻO [nom] au', 'Nō [lieu] au', 'ʻO te ʻutuāfare [famille]'],
        modernAdaptations: ['Inclusion de la profession moderne', 'Mention des études ou projets']
      }
    ],
    practiceExercises: [
      {
        id: 'greeting-hierarchy',
        type: 'cultural-response',
        instruction: 'Adaptez votre salutation selon la personne rencontrée',
        scenario: 'Vous entrez dans une pièce avec un aîné, un pair et un enfant',
        culturalFocus: 'Hiérarchie sociale et respect des âges',
        expectedOutcomes: [
          'Saluer l\'aîné en premier avec respect',
          'Saluer le pair de manière amicale',
          'Saluer l\'enfant avec bienveillance'
        ]
      },
      {
        id: 'family-connection',
        type: 'dialogue-completion',
        instruction: 'Complétez cette conversation pour établir des liens familiaux',
        scenario: 'Quelqu\'un mentionne connaître votre famille',
        culturalFocus: 'Importance des connexions familiales',
        expectedOutcomes: [
          'Exprimer l\'intérêt et la joie',
          'Poser des questions sur les connexions',
          'Partager des informations familiales appropriées'
        ]
      }
    ],
    assessmentCriteria: [
      {
        skill: 'cultural-appropriateness',
        criteria: 'Respect des protocoles sociaux et usage approprié des formules de politesse',
        rubric: [
          {
            level: 'novice',
            description: 'Utilise les salutations de base mais manque les nuances culturelles',
            indicators: ['Connaît "Ia ora na"', 'Hésite sur les titres de respect'],
            culturalCompetence: 'Conscience limitée des hiérarchies sociales'
          },
          {
            level: 'developing',
            description: 'Montre une compréhension croissante des protocoles',
            indicators: ['Utilise quelques titres de respect', 'Adapte le ton selon l\'âge'],
            culturalCompetence: 'Reconnaissance des différences générationnelles'
          },
          {
            level: 'proficient',
            description: 'Applique correctement la plupart des protocoles culturels',
            indicators: ['Salue dans l\'ordre approprié', 'Utilise les formules étendues'],
            culturalCompetence: 'Respect authentique des valeurs polynésiennes'
          },
          {
            level: 'advanced',
            description: 'Maîtrise subtile des nuances sociales et culturelles',
            indicators: ['Adaptation naturelle aux contextes', 'Créativité respectueuse'],
            culturalCompetence: 'Intégration profonde des valeurs culturelles'
          }
        ]
      },
      {
        skill: 'interaction',
        criteria: 'Capacité à maintenir une conversation naturelle et engageante',
        rubric: [
          {
            level: 'novice',
            description: 'Échanges simples avec pauses fréquentes',
            indicators: ['Répond aux questions directes', 'Utilise des phrases courtes'],
            culturalCompetence: 'Participation timide mais respectueuse'
          },
          {
            level: 'proficient',
            description: 'Conversation fluide avec questions et réponses équilibrées',
            indicators: ['Pose des questions pertinentes', 'Développe ses réponses'],
            culturalCompetence: 'Engagement authentique dans l\'échange'
          }
        ]
      }
    ]
  }
];

// INTERMEDIATE CONVERSATION MODULES
export const INTERMEDIATE_CONVERSATION_MODULES: ConversationModule[] = [
  {
    id: 'daily-life-discussions',
    name: 'Discussions de la Vie Quotidienne',
    nameEnglish: 'Daily Life Discussions',
    nameTahitian: 'Te Mau Parau o te Orara',
    level: 'Intermediate',
    description: 'Conversations approfondies sur les activités quotidiennes avec nuances culturelles',
    culturalContext: 'La vie quotidienne polynésienne intègre naturellement famille, nature et communauté dans chaque activité.',
    communicativeGoals: [
      'Décrire les activités quotidiennes avec détails culturels',
      'Exprimer des opinions et préférences personnelles',
      'Discuter des traditions et de leur évolution moderne',
      'Planifier des activités communautaires',
      'Partager des expériences personnelles significatives'
    ],
    dialogues: [
      {
        id: 'market-conversation',
        title: 'Conversation au Marché',
        context: 'Discussion entre vendeur et client au marché de Papeete',
        participants: [
          {
            name: 'Teiva',
            role: 'Vendeur de fruits',
            culturalBackground: 'Agriculteur traditionnel, fier de ses produits',
            relationshipToOthers: 'Relation commerciale mais chaleureuse'
          },
          {
            name: 'Hinano',
            role: 'Cliente régulière',
            culturalBackground: 'Mère de famille, soucieuse de qualité',
            relationshipToOthers: 'Cliente fidèle et respectée'
          }
        ],
        exchanges: [
          {
            speaker: 'Teiva',
            tahitian: 'Ia ora na, Hinano! Maita\'i ʻoe i teie poipoi?',
            french: 'Bonjour, Hinano! Tu vas bien ce matin?',
            english: 'Hello, Hinano! Are you well this morning?',
            culturalSignificance: 'Salutation personnalisée montrant la relation établie',
            intonationNotes: 'Chaleur commerciale authentique',
            bodyLanguage: 'Sourire accueillant, geste vers les produits'
          },
          {
            speaker: 'Hinano',
            tahitian: 'Maita\'i roa! E aha te mau meaʻai maita\'i i teie nei?',
            french: 'Très bien! Quels sont les bons fruits aujourd\'hui?',
            english: 'Very well! What are the good fruits today?',
            culturalSignificance: 'Confiance dans l\'expertise du vendeur',
            intonationNotes: 'Intérêt sincère pour la qualité',
            bodyLanguage: 'Regard attentif sur les produits'
          },
          {
            speaker: 'Teiva',
            tahitian: 'Te mango nei, ʻaita roa i ʻamu\'hia. Mai tōʻu mau ʻōpū rahi i Moorea',
            french: 'Ces mangues, pas encore mangées (par les vers). De mes grandes plantations à Moorea',
            english: 'These mangoes, not yet eaten (by worms). From my big plantations in Moorea',
            culturalSignificance: 'Fierté de l\'origine et de la qualité, référence géographique',
            intonationNotes: 'Fierté du producteur, assurance qualité',
            bodyLanguage: 'Manipulation délicate des fruits, geste vers Moorea'
          }
        ],
        culturalNotes: [
          'Les relations commerciales sont personnalisées et durables',
          'L\'origine géographique des produits est importante',
          'La qualité est décrite avec des références naturelles',
          'Le respect mutuel caractérise les échanges commerciaux'
        ],
        keyPhrases: [
          {
            tahitian: 'E aha te mau meaʻai maita\'i?',
            french: 'Quels sont les bons fruits?',
            english: 'What are the good fruits?',
            usage: 'Demande de recommandation au vendeur',
            culturalContext: 'Confiance dans l\'expertise locale',
            variations: ['E aha te mea maita\'i roa?', 'E aha tā ʻoe e tīaʻi nei?']
          }
        ],
        followUpQuestions: [
          'Comment la conversation pourrait-elle évoluer vers la négociation?',
          'Quelles autres informations culturelles pourraient être échangées?',
          'Comment intégrer des nouvelles de la famille?'
        ]
      }
    ],
    rolePlayScenarios: [
      {
        id: 'community-planning',
        title: 'Planification Communautaire',
        setting: 'Réunion pour organiser un événement culturel',
        culturalContext: 'Les décisions communautaires se prennent par consensus avec respect des opinions de tous',
        objectives: [
          'Exprimer des idées et suggestions',
          'Écouter et répondre aux propositions d\'autrui',
          'Négocier et trouver des compromis',
          'Respecter les processus de décision traditionnels'
        ],
        roles: [
          {
            character: 'Organisateur principal',
            background: 'Responsable communautaire expérimenté',
            motivations: ['Assurer le succès de l\'événement', 'Inclure tout le monde'],
            culturalConsiderations: ['Leadership par consensus', 'Respect des traditions'],
            languageLevel: 'Avancé'
          },
          {
            character: 'Jeune volontaire',
            background: 'Enthousiaste mais inexpérimenté',
            motivations: ['Contribuer à la communauté', 'Apprendre des aînés'],
            culturalConsiderations: ['Humilité', 'Écoute respectueuse'],
            languageLevel: 'Intermédiaire'
          }
        ],
        guidelines: [
          'Commencer par écouter les aînés',
          'Proposer des idées avec humilité',
          'Chercher le consensus plutôt que l\'imposition',
          'Intégrer les aspects traditionnels et modernes'
        ],
        culturalSensitivities: [
          'Ne pas dominer la conversation',
          'Respecter les processus de décision collectifs',
          'Valoriser les contributions de tous',
          'Maintenir l\'harmonie du groupe'
        ],
        extensionActivities: [
          'Rédiger un plan d\'action en tahitien',
          'Préparer une présentation pour la communauté',
          'Organiser les tâches selon les compétences culturelles'
        ]
      }
    ],
    culturalProtocols: [
      {
        situation: 'Négociation commerciale',
        protocol: 'Établir d\'abord la relation, discuter la qualité, négocier avec respect',
        explanation: 'Le commerce polynésien privilégie les relations durables sur le profit immédiat',
        linguisticMarkers: ['Questions sur la famille', 'Compliments sur les produits', 'Négociation indirecte'],
        modernAdaptations: ['Maintien des relations dans le commerce moderne', 'Respect des producteurs locaux']
      }
    ],
    practiceExercises: [
      {
        id: 'opinion-expression',
        type: 'cultural-response',
        instruction: 'Exprimez votre opinion sur un sujet culturel en respectant les sensibilités',
        scenario: 'Discussion sur l\'évolution des traditions dans le monde moderne',
        culturalFocus: 'Équilibre entre tradition et modernité',
        expectedOutcomes: [
          'Respecter les points de vue traditionnels',
          'Proposer des adaptations respectueuses',
          'Maintenir l\'harmonie dans la discussion'
        ]
      }
    ],
    assessmentCriteria: [
      {
        skill: 'fluency',
        criteria: 'Capacité à maintenir une conversation naturelle avec transitions fluides',
        rubric: [
          {
            level: 'developing',
            description: 'Conversation avec quelques hésitations mais compréhensible',
            indicators: ['Utilise des connecteurs simples', 'Pauses occasionnelles'],
            culturalCompetence: 'Engagement sincère malgré les limitations linguistiques'
          },
          {
            level: 'proficient',
            description: 'Conversation fluide avec expressions naturelles',
            indicators: ['Transitions naturelles', 'Utilisation d\'expressions idiomatiques'],
            culturalCompetence: 'Communication authentique et culturellement appropriée'
          }
        ]
      }
    ]
  }
];

// ADVANCED CONVERSATION MODULES
export const ADVANCED_CONVERSATION_MODULES: ConversationModule[] = [
  {
    id: 'cultural-debates',
    name: 'Débats Culturels',
    nameEnglish: 'Cultural Debates',
    nameTahitian: 'Te Mau Taʻiri Parau Tutupu',
    level: 'Advanced',
    description: 'Discussions complexes sur des sujets culturels, sociaux et philosophiques avec nuances argumentatives',
    culturalContext: 'Les débats polynésiens cherchent la vérité collective plutôt que la victoire individuelle, dans un esprit de respect mutuel.',
    communicativeGoals: [
      'Argumenter de manière respectueuse et convaincante',
      'Analyser des questions culturelles complexes',
      'Médier entre différents points de vue',
      'Proposer des solutions créatives aux défis modernes',
      'Maintenir l\'harmonie tout en exprimant des désaccords'
    ],
    dialogues: [
      {
        id: 'tradition-modernity',
        title: 'Tradition et Modernité',
        context: 'Débat intergénérationnel sur l\'évolution de la culture tahitienne',
        participants: [
          {
            name: 'Teuira',
            role: 'Aînée, gardienne des traditions',
            culturalBackground: 'Éducatrice culturelle, préservatrice du patrimoine',
            relationshipToOthers: 'Respectée pour sa sagesse, inquiète des changements'
          },
          {
            name: 'Matahi',
            role: 'Jeune professionnel',
            culturalBackground: 'Ingénieur, passionné de culture mais ouvert au changement',
            relationshipToOthers: 'Respectueux mais désireux d\'innovation'
          }
        ],
        exchanges: [
          {
            speaker: 'Teuira',
            tahitian: 'E Matahi, ua roa vau e faʻaaro nei i te mau tamariki. ʻAita rātou e ʻite i te mau hīmene tabu',
            french: 'Matahi, j\'observe les enfants depuis longtemps. Ils ne connaissent pas les chants sacrés',
            english: 'Matahi, I have been observing the children for a long time. They don\'t know the sacred songs',
            culturalSignificance: 'Inquiétude d\'une aînée sur la transmission culturelle',
            intonationNotes: 'Préoccupation sincère, ton maternel',
            bodyLanguage: 'Expression soucieuse, gestes protecteurs'
          },
          {
            speaker: 'Matahi',
            tahitian: 'Maita\'i tō parau, Mama Teuira. Engari, e nehenehe rā te faʻahou i te mau hīmene no te au fifi?',
            french: 'Votre parole est juste, Mama Teuira. Mais ne pourrait-on pas adapter les chants pour les nouvelles générations?',
            english: 'Your word is right, Mama Teuira. But couldn\'t we adapt the songs for the new generations?',
            culturalSignificance: 'Respect de l\'aînée tout en proposant une solution moderne',
            intonationNotes: 'Respect mais détermination créative',
            bodyLanguage: 'Posture respectueuse, gestes d\'ouverture'
          }
        ],
        culturalNotes: [
          'Le débat maintient le respect intergénérationnel',
          'Les solutions cherchent l\'équilibre tradition-modernité',
          'L\'argumentation évite la confrontation directe',
          'Les références culturelles enrichissent le débat'
        ],
        keyPhrases: [
          {
            tahitian: 'Maita\'i tō parau, engari...',
            french: 'Votre parole est juste, mais...',
            english: 'Your word is right, but...',
            usage: 'Transition respectueuse vers un contre-argument',
            culturalContext: 'Maintient l\'harmonie tout en exprimant un désaccord',
            variations: ['ʻEita peʻapeʻa tō manao, engari...', 'Ua maita\'i, ā...']
          }
        ],
        followUpQuestions: [
          'Comment résoudre ce dilemme culturel?',
          'Quelles innovations respectueuses sont possibles?',
          'Comment impliquer les jeunes dans la solution?'
        ]
      }
    ],
    rolePlayScenarios: [
      {
        id: 'cultural-preservation',
        title: 'Préservation Culturelle',
        setting: 'Conseil culturel débattant de nouvelles politiques',
        culturalContext: 'Les décisions culturelles engagent l\'avenir de la communauté et requièrent sagesse collective',
        objectives: [
          'Présenter des arguments complexes avec nuances',
          'Écouter et synthétiser différents points de vue',
          'Proposer des compromis créatifs',
          'Maintenir l\'unité communautaire'
        ],
        roles: [
          {
            character: 'Conservateur culturel',
            background: 'Spécialiste des traditions, inquiet des changements',
            motivations: ['Préserver l\'authenticité', 'Transmettre intégralement'],
            culturalConsiderations: ['Responsabilité envers les ancêtres', 'Pureté culturelle'],
            languageLevel: 'Avancé'
          },
          {
            character: 'Innovateur respectueux',
            background: 'Éducateur moderne, soucieux d\'adaptation',
            motivations: ['Rendre accessible', 'Assurer la survie culturelle'],
            culturalConsiderations: ['Pertinence moderne', 'Inclusion des jeunes'],
            languageLevel: 'Avancé'
          }
        ],
        guidelines: [
          'Argumenter avec des références culturelles',
          'Respecter tous les points de vue',
          'Chercher des solutions créatives',
          'Maintenir l\'esprit de consensus'
        ],
        culturalSensitivities: [
          'Éviter les accusations personnelles',
          'Respecter l\'expertise de chacun',
          'Valoriser l\'intention commune',
          'Préserver l\'harmonie du groupe'
        ],
        extensionActivities: [
          'Rédiger une proposition de politique culturelle',
          'Organiser une consultation communautaire',
          'Développer un plan d\'implémentation consensuel'
        ]
      }
    ],
    culturalProtocols: [
      {
        situation: 'Débat culturel',
        protocol: 'Écouter d\'abord, respecter l\'expertise, chercher le consensus, éviter la confrontation',
        explanation: 'Les débats polynésiens visent l\'harmonie collective plutôt que la victoire individuelle',
        linguisticMarkers: ['Formules de respect', 'Transitions diplomatiques', 'Références aux valeurs partagées'],
        modernAdaptations: ['Application dans les contextes professionnels', 'Médiation interculturelle']
      }
    ],
    practiceExercises: [
      {
        id: 'diplomatic-disagreement',
        type: 'cultural-response',
        instruction: 'Exprimez un désaccord tout en maintenant l\'harmonie relationnelle',
        scenario: 'Quelqu\'un propose une idée que vous trouvez problématique',
        culturalFocus: 'Art du désaccord respectueux',
        expectedOutcomes: [
          'Reconnaître les mérites de la proposition',
          'Exprimer les préoccupations avec tact',
          'Proposer des alternatives constructives'
        ]
      }
    ],
    assessmentCriteria: [
      {
        skill: 'cultural-appropriateness',
        criteria: 'Capacité à débattre tout en respectant les valeurs polynésiennes d\'harmonie',
        rubric: [
          {
            level: 'advanced',
            description: 'Maîtrise subtile de l\'art du débat respectueux',
            indicators: ['Arguments nuancés', 'Maintien de l\'harmonie', 'Solutions créatives'],
            culturalCompetence: 'Incarnation des valeurs polynésiennes de sagesse collective'
          }
        ]
      }
    ]
  }
];

// Export all conversation modules
export const ALL_CONVERSATION_MODULES = [
  ...BEGINNER_CONVERSATION_MODULES,
  ...INTERMEDIATE_CONVERSATION_MODULES,
  ...ADVANCED_CONVERSATION_MODULES
];

// Conversation Teaching Methodology
export const CONVERSATION_PEDAGOGY = {
  principles: [
    'Apprentissage par l\'interaction authentique',
    'Intégration systématique du contexte culturel',
    'Développement de la compétence interculturelle',
    'Respect des protocoles sociaux polynésiens',
    'Progression du personnel vers le communautaire'
  ],
  techniques: [
    'Jeux de rôle basés sur des situations réelles',
    'Analyse de conversations authentiques',
    'Pratique des protocoles culturels',
    'Débats structurés sur des sujets culturels',
    'Projets collaboratifs interculturels'
  ],
  assessment: [
    'Appropriateness culturelle des interactions',
    'Fluidité et naturalité de la communication',
    'Capacité d\'adaptation aux contextes sociaux',
    'Respect des valeurs polynésiennes',
    'Créativité dans l\'expression culturelle'
  ]
};
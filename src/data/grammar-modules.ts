// Comprehensive Tahitian-French Grammar Instruction Modules
// High-End Linguistic Analysis and Cultural Integration

import { LessonLevel, Exercise } from '@/types';

export interface GrammarModule {
  id: string;
  name: string;
  nameEnglish: string;
  nameTahitian: string;
  level: LessonLevel;
  description: string;
  linguisticConcept: string;
  culturalContext: string;
  grammarRules: GrammarRule[];
  examples: GrammarExample[];
  exercises: GrammarExercise[];
  commonMistakes: CommonMistake[];
  advancedNotes?: string;
}

export interface GrammarRule {
  id: string;
  rule: string;
  explanation: string;
  pattern: string;
  exceptions?: string[];
  culturalNote?: string;
}

export interface GrammarExample {
  tahitian: string;
  french: string;
  english: string;
  breakdown: WordBreakdown[];
  context: string;
  culturalSignificance?: string;
}

export interface WordBreakdown {
  word: string;
  function: string;
  meaning: string;
  notes?: string;
}

export interface GrammarExercise {
  id: string;
  type: 'transformation' | 'completion' | 'analysis' | 'cultural-context';
  instruction: string;
  items: ExerciseItem[];
  culturalFocus?: string;
}

export interface ExerciseItem {
  prompt: string;
  answer: string;
  explanation: string;
  culturalNote?: string;
}

export interface CommonMistake {
  mistake: string;
  correction: string;
  explanation: string;
  culturalImplication?: string;
}

// BEGINNER GRAMMAR MODULES
export const BEGINNER_GRAMMAR_MODULES: GrammarModule[] = [
  {
    id: 'basic-sentence-structure',
    name: 'Structure de Phrase de Base',
    nameEnglish: 'Basic Sentence Structure',
    nameTahitian: 'Te Hōʻē Parau Māmā',
    level: 'Beginner',
    description: 'Fondements de la construction des phrases tahitiennes avec ordre des mots et particules de base',
    linguisticConcept: 'Ordre VSO (Verbe-Sujet-Objet) et système de particules',
    culturalContext: 'L\'ordre des mots tahitien reflète une vision du monde où l\'action précède l\'acteur, soulignant l\'importance du mouvement et du changement.',
    grammarRules: [
      {
        id: 'vso-order',
        rule: 'Ordre VSO (Verbe-Sujet-Objet)',
        explanation: 'En tahitien, le verbe vient en premier, suivi du sujet, puis de l\'objet',
        pattern: '[VERBE] [SUJET] [OBJET]',
        culturalNote: 'Cet ordre privilégie l\'action, reflétant une culture dynamique et orientée vers le mouvement'
      },
      {
        id: 'particle-te',
        rule: 'Particule "te" - Article défini',
        explanation: '"Te" équivaut à "le/la" en français et précède les noms',
        pattern: 'te + [NOM]',
        exceptions: ['Noms propres', 'Certains noms de parenté'],
        culturalNote: 'L\'usage de "te" marque le respect et la spécificité culturelle'
      },
      {
        id: 'particle-e',
        rule: 'Particule "e" - Marqueur de sujet',
        explanation: '"E" introduit le sujet dans les phrases VSO',
        pattern: '[VERBE] e [SUJET]',
        culturalNote: 'Marque le respect envers la personne qui accomplit l\'action'
      }
    ],
    examples: [
      {
        tahitian: 'Amu e au i te iʻa',
        french: 'Je mange le poisson',
        english: 'I eat the fish',
        breakdown: [
          { word: 'Amu', function: 'Verbe', meaning: 'manger' },
          { word: 'e', function: 'Particule', meaning: 'marqueur de sujet' },
          { word: 'au', function: 'Pronom', meaning: 'je' },
          { word: 'i', function: 'Préposition', meaning: 'objet direct' },
          { word: 'te', function: 'Article', meaning: 'le/la' },
          { word: 'iʻa', function: 'Nom', meaning: 'poisson' }
        ],
        context: 'Phrase simple décrivant une action quotidienne',
        culturalSignificance: 'Le poisson est central dans l\'alimentation polynésienne'
      },
      {
        tahitian: 'Haere e ʻoe i te fare',
        french: 'Tu vas à la maison',
        english: 'You go to the house',
        breakdown: [
          { word: 'Haere', function: 'Verbe', meaning: 'aller' },
          { word: 'e', function: 'Particule', meaning: 'marqueur de sujet' },
          { word: 'ʻoe', function: 'Pronom', meaning: 'tu' },
          { word: 'i', function: 'Préposition', meaning: 'vers/à' },
          { word: 'te', function: 'Article', meaning: 'le/la' },
          { word: 'fare', function: 'Nom', meaning: 'maison' }
        ],
        context: 'Mouvement vers un lieu',
        culturalSignificance: 'La maison (fare) est le centre de la vie familiale polynésienne'
      }
    ],
    exercises: [
      {
        id: 'vso-practice',
        type: 'transformation',
        instruction: 'Transformez ces phrases françaises en respectant l\'ordre VSO tahitien',
        items: [
          {
            prompt: 'Le chien court dans le jardin',
            answer: 'Oma te ʻurī i te ʻōpū',
            explanation: 'Oma (court) + te ʻurī (le chien) + i te ʻōpū (dans le jardin)',
            culturalNote: 'Les chiens sont des compagnons importants dans la culture polynésienne'
          },
          {
            prompt: 'Ma mère prépare le repas',
            answer: 'Hāpī tōʻu metua vahine i te mā',
            explanation: 'Hāpī (prépare) + tōʻu metua vahine (ma mère) + i te mā (le repas)',
            culturalNote: 'La préparation des repas est un acte d\'amour familial'
          }
        ],
        culturalFocus: 'Importance de l\'action dans la vision du monde polynésienne'
      },
      {
        id: 'particle-usage',
        type: 'completion',
        instruction: 'Complétez avec la particule appropriée (te, e, i)',
        items: [
          {
            prompt: 'Tāmā ___ tamaiti ___ ___ puta',
            answer: 'Tāmā e te tamaiti i te puta',
            explanation: '"e" marque le sujet, "te" l\'article, "i" l\'objet',
            culturalNote: 'La lecture est valorisée dans l\'éducation traditionnelle'
          }
        ]
      }
    ],
    commonMistakes: [
      {
        mistake: 'Utiliser l\'ordre SVO français',
        correction: 'Respecter l\'ordre VSO tahitien',
        explanation: 'L\'ordre des mots change complètement le sens et la naturalité',
        culturalImplication: 'Reflète une incompréhension de la vision du monde polynésienne'
      },
      {
        mistake: 'Omettre les particules',
        correction: 'Inclure "e", "te", "i" selon leur fonction',
        explanation: 'Les particules sont essentielles à la clarté grammaticale',
        culturalImplication: 'Leur omission peut paraître irrespectueuse'
      }
    ]
  },
  {
    id: 'pronouns-possessives',
    name: 'Pronoms et Possessifs',
    nameEnglish: 'Pronouns and Possessives',
    nameTahitian: 'Te Mau ʻĪʻoa Pihi e te Mau Mea Pihi',
    level: 'Beginner',
    description: 'Système complexe des pronoms personnels et possessifs avec distinctions culturelles importantes',
    linguisticConcept: 'Distinctions inclusif/exclusif et possessifs aliénables/inaliénables',
    culturalContext: 'Les pronoms tahitiens reflètent les relations sociales et le degré d\'intimité entre les personnes.',
    grammarRules: [
      {
        id: 'personal-pronouns',
        rule: 'Pronoms personnels de base',
        explanation: 'Système à trois personnes avec distinctions de nombre',
        pattern: 'au (je), ʻoe (tu), ʻōna (il/elle), tāua (nous deux), tātou (nous tous), ʻoutou (vous), rātou (ils/elles)'
      },
      {
        id: 'inclusive-exclusive',
        rule: 'Distinction inclusif/exclusif pour "nous"',
        explanation: 'tāua = nous deux (toi et moi), tātou = nous tous (incluant l\'auditeur)',
        pattern: 'tāua (inclusif dual), tātou (inclusif pluriel)',
        culturalNote: 'Reflète l\'importance de l\'inclusion dans la culture polynésienne'
      },
      {
        id: 'possessive-classes',
        rule: 'Classes possessives A et O',
        explanation: 'Classe A (contrôlable): tā, Classe O (non-contrôlable): tō',
        pattern: 'tāʻu (mon - contrôlable), tōʻu (mon - non-contrôlable)',
        culturalNote: 'Distinction philosophique entre ce qu\'on contrôle et ce qu\'on reçoit'
      }
    ],
    examples: [
      {
        tahitian: 'Tāʻu poti',
        french: 'Mon bateau',
        english: 'My boat',
        breakdown: [
          { word: 'Tāʻu', function: 'Possessif A', meaning: 'mon (contrôlable)', notes: 'Classe A car on contrôle un bateau' },
          { word: 'poti', function: 'Nom', meaning: 'bateau' }
        ],
        context: 'Possession d\'un objet contrôlable',
        culturalSignificance: 'Les bateaux sont essentiels à la vie insulaire'
      },
      {
        tahitian: 'Tōʻu metua',
        french: 'Mon parent',
        english: 'My parent',
        breakdown: [
          { word: 'Tōʻu', function: 'Possessif O', meaning: 'mon (non-contrôlable)', notes: 'Classe O car on ne contrôle pas ses parents' },
          { word: 'metua', function: 'Nom', meaning: 'parent' }
        ],
        context: 'Relation familiale non-contrôlable',
        culturalSignificance: 'Respect envers les liens familiaux donnés par la nature'
      }
    ],
    exercises: [
      {
        id: 'possessive-classification',
        type: 'analysis',
        instruction: 'Classifiez ces possessions en A (contrôlable) ou O (non-contrôlable)',
        items: [
          {
            prompt: 'fare (maison)',
            answer: 'Classe A - tāʻu fare',
            explanation: 'On peut contrôler, modifier, vendre sa maison',
            culturalNote: 'La maison familiale peut être transmise mais reste contrôlable'
          },
          {
            prompt: 'tamaiti (enfant)',
            answer: 'Classe O - tōʻu tamaiti',
            explanation: 'Les enfants sont des dons, on ne les "possède" pas vraiment',
            culturalNote: 'Reflète la vision polynésienne des enfants comme êtres autonomes'
          }
        ],
        culturalFocus: 'Philosophie polynésienne de la possession et du contrôle'
      }
    ],
    commonMistakes: [
      {
        mistake: 'Confondre les classes A et O',
        correction: 'Réfléchir au degré de contrôle sur l\'objet possédé',
        explanation: 'La distinction reflète une philosophie profonde de la relation aux choses',
        culturalImplication: 'Erreur révèle une incompréhension des valeurs polynésiennes'
      }
    ]
  }
];

// INTERMEDIATE GRAMMAR MODULES
export const INTERMEDIATE_GRAMMAR_MODULES: GrammarModule[] = [
  {
    id: 'verb-aspects',
    name: 'Aspects Verbaux',
    nameEnglish: 'Verbal Aspects',
    nameTahitian: 'Te Mau Huru Hamani Reo',
    level: 'Intermediate',
    description: 'Système complexe des aspects verbaux tahitiens exprimant le temps, l\'accomplissement et la perspective',
    linguisticConcept: 'Aspects perfectif, imperfectif, inchoatif et leurs marqueurs',
    culturalContext: 'Les aspects verbaux tahitiens reflètent une perception cyclique du temps et l\'importance du processus sur le résultat.',
    grammarRules: [
      {
        id: 'aspect-markers',
        rule: 'Marqueurs d\'aspect principaux',
        explanation: 'ua (perfectif), e...nei (progressif), e...ana (habituel), ā (futur)',
        pattern: '[MARQUEUR] + [VERBE] + [COMPLÉMENT]',
        culturalNote: 'Chaque aspect porte une nuance culturelle sur la relation au temps'
      },
      {
        id: 'perfectif-ua',
        rule: 'Aspect perfectif avec "ua"',
        explanation: 'Indique une action accomplie avec effet sur le présent',
        pattern: 'ua + [VERBE]',
        culturalNote: 'Souligne l\'importance des conséquences des actions'
      },
      {
        id: 'progressive-e-nei',
        rule: 'Aspect progressif "e...nei"',
        explanation: 'Action en cours au moment de parole',
        pattern: 'e + [VERBE] + nei',
        culturalNote: 'Valorise le processus et l\'engagement dans l\'action'
      }
    ],
    examples: [
      {
        tahitian: 'Ua hōʻē e au',
        french: 'J\'ai ramé (et je suis arrivé)',
        english: 'I have rowed (and arrived)',
        breakdown: [
          { word: 'Ua', function: 'Marqueur', meaning: 'aspect perfectif' },
          { word: 'hōʻē', function: 'Verbe', meaning: 'ramer' },
          { word: 'e', function: 'Particule', meaning: 'marqueur de sujet' },
          { word: 'au', function: 'Pronom', meaning: 'je' }
        ],
        context: 'Action accomplie avec résultat visible',
        culturalSignificance: 'Le ramage est une compétence culturelle importante'
      },
      {
        tahitian: 'E hīmene nei rātou',
        french: 'Ils sont en train de chanter',
        english: 'They are singing',
        breakdown: [
          { word: 'E', function: 'Marqueur', meaning: 'aspect progressif (début)' },
          { word: 'hīmene', function: 'Verbe', meaning: 'chanter' },
          { word: 'nei', function: 'Marqueur', meaning: 'aspect progressif (fin)' },
          { word: 'rātou', function: 'Pronom', meaning: 'ils/elles' }
        ],
        context: 'Action en cours de réalisation',
        culturalSignificance: 'Le chant collectif renforce les liens communautaires'
      }
    ],
    exercises: [
      {
        id: 'aspect-transformation',
        type: 'transformation',
        instruction: 'Transformez ces phrases selon l\'aspect demandé',
        items: [
          {
            prompt: 'Hīmene rātou (progressif)',
            answer: 'E hīmene nei rātou',
            explanation: 'Ajout de "e...nei" pour marquer l\'action en cours',
            culturalNote: 'Le chant en cours crée une atmosphère de joie partagée'
          }
        ],
        culturalFocus: 'Perception polynésienne du temps et de l\'action'
      }
    ],
    commonMistakes: [
      {
        mistake: 'Utiliser "ua" pour toutes les actions passées',
        correction: 'Choisir l\'aspect selon la nuance temporelle voulue',
        explanation: 'Chaque aspect porte une signification précise',
        culturalImplication: 'Mauvais usage peut changer complètement le sens culturel'
      }
    ]
  }
];

// ADVANCED GRAMMAR MODULES
export const ADVANCED_GRAMMAR_MODULES: GrammarModule[] = [
  {
    id: 'discourse-particles',
    name: 'Particules de Discours',
    nameEnglish: 'Discourse Particles',
    nameTahitian: 'Te Mau Pīʻao Parau',
    level: 'Advanced',
    description: 'Particules subtiles qui modulent le sens, l\'émotion et les relations sociales dans le discours',
    linguisticConcept: 'Pragmatique et modalité discursive',
    culturalContext: 'Ces particules encodent les nuances sociales, émotionnelles et spirituelles essentielles à la communication polynésienne.',
    grammarRules: [
      {
        id: 'emotional-particles',
        rule: 'Particules émotionnelles',
        explanation: 'rā (affection), noa (diminutif), roa (intensité)',
        pattern: '[PHRASE] + [PARTICULE ÉMOTIONNELLE]',
        culturalNote: 'Expriment les relations affectives et le respect social'
      },
      {
        id: 'evidential-particles',
        rule: 'Particules évidentielles',
        explanation: 'Indiquent la source de l\'information et le degré de certitude',
        pattern: '[INFORMATION] + [MARQUEUR ÉVIDENTIEL]',
        culturalNote: 'Respectent la tradition orale et la transmission du savoir'
      }
    ],
    examples: [
      {
        tahitian: 'Maita\'i roa ā rā',
        french: 'C\'est vraiment très bien (avec affection)',
        english: 'It\'s really very good (with affection)',
        breakdown: [
          { word: 'Maita\'i', function: 'Adjectif', meaning: 'bon/bien' },
          { word: 'roa', function: 'Intensifieur', meaning: 'très/beaucoup' },
          { word: 'ā', function: 'Particule', meaning: 'exclamation' },
          { word: 'rā', function: 'Particule', meaning: 'affection/familiarité' }
        ],
        context: 'Expression d\'approbation chaleureuse',
        culturalSignificance: 'Combine intensité et affection typiques des relations polynésiennes'
      }
    ],
    exercises: [
      {
        id: 'particle-nuance',
        type: 'cultural-context',
        instruction: 'Analysez les nuances culturelles apportées par ces particules',
        items: [
          {
            prompt: 'Différence entre "Maita\'i" et "Maita\'i rā"',
            answer: '"Maita\'i rā" exprime plus de chaleur et de proximité affective',
            explanation: 'La particule "rā" ajoute une dimension relationnelle',
            culturalNote: 'Reflète l\'importance des liens personnels dans la communication'
          }
        ],
        culturalFocus: 'Subtilités relationnelles dans la communication polynésienne'
      }
    ],
    commonMistakes: [
      {
        mistake: 'Ignorer les particules comme optionnelles',
        correction: 'Reconnaître leur importance pour les nuances sociales',
        explanation: 'Les particules portent des informations relationnelles cruciales',
        culturalImplication: 'Leur omission peut paraître froide ou irrespectueuse'
      }
    ],
    advancedNotes: 'Les particules de discours sont l\'âme de la communication tahitienne. Leur maîtrise distingue un locuteur avancé et culturellement sensible.'
  }
];

// Export all grammar modules
export const ALL_GRAMMAR_MODULES = [
  ...BEGINNER_GRAMMAR_MODULES,
  ...INTERMEDIATE_GRAMMAR_MODULES,
  ...ADVANCED_GRAMMAR_MODULES
];

// Grammar Learning Progression
export const GRAMMAR_PROGRESSION = {
  beginner: {
    focus: 'Structures de base et ordre des mots',
    skills: ['Ordre VSO', 'Particules essentielles', 'Pronoms de base'],
    culturalEmphasis: 'Respect et politesse dans la structure linguistique'
  },
  intermediate: {
    focus: 'Nuances temporelles et aspectuelles',
    skills: ['Aspects verbaux', 'Modalités', 'Constructions complexes'],
    culturalEmphasis: 'Perception polynésienne du temps et de l\'action'
  },
  advanced: {
    focus: 'Subtilités discursives et pragmatiques',
    skills: ['Particules de discours', 'Registres sociaux', 'Style poétique'],
    culturalEmphasis: 'Maîtrise des nuances sociales et spirituelles'
  }
};

// Teaching Methodology for Grammar
export const GRAMMAR_TEACHING_APPROACH = {
  principles: [
    'Intégration culturelle systématique',
    'Apprentissage par l\'usage authentique',
    'Progression du concret vers l\'abstrait',
    'Respect des valeurs polynésiennes'
  ],
  techniques: [
    'Analyse contrastive avec le français',
    'Exemples tirés de la vie quotidienne',
    'Exercices basés sur des situations culturelles',
    'Réflexion métalinguistique guidée'
  ],
  assessment: [
    'Compréhension des nuances culturelles',
    'Usage approprié en contexte',
    'Créativité dans l\'expression',
    'Respect des conventions sociales'
  ]
};
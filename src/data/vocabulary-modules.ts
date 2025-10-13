// Comprehensive Tahitian-French Vocabulary Modules
// High-End Educational Content with Pronunciation Guides

import { VocabItem, LessonLevel } from '@/types';

export interface VocabularyModule {
  id: string;
  name: string;
  nameEnglish: string;
  nameTahitian: string;
  level: LessonLevel;
  description: string;
  culturalContext: string;
  pronunciationNotes: string;
  vocabulary: EnhancedVocabItem[];
  exercises: VocabularyExercise[];
  culturalInsights: CulturalInsight[];
}

export interface EnhancedVocabItem extends VocabItem {
  pronunciation: string; // IPA notation
  audioFile?: string;
  etymology?: string;
  culturalSignificance?: string;
  usageExamples: UsageExample[];
  relatedWords: string[];
  difficulty: 'basic' | 'intermediate' | 'advanced';
  frequency: 'high' | 'medium' | 'low';
}

export interface UsageExample {
  tahitian: string;
  french: string;
  english: string;
  context: string;
  pronunciation: string;
}

export interface VocabularyExercise {
  id: string;
  type: 'matching' | 'pronunciation' | 'context' | 'cultural';
  instruction: string;
  items: any[];
  culturalFocus?: string;
}

export interface CulturalInsight {
  concept: string;
  explanation: string;
  examples: string[];
  modernRelevance: string;
}

// BEGINNER LEVEL VOCABULARY MODULES
export const BEGINNER_VOCABULARY_MODULES: VocabularyModule[] = [
  {
    id: 'greetings-essential',
    name: 'Salutations Essentielles',
    nameEnglish: 'Essential Greetings',
    nameTahitian: 'Te Faʻaʻamu Rahi Mau',
    level: 'Beginner',
    description: 'Maîtrise complète des salutations et expressions de politesse fondamentales',
    culturalContext: 'Les salutations polynésiennes reflètent les valeurs de mana (pouvoir spirituel), de respect mutuel et d\'hospitalité traditionnelle.',
    pronunciationNotes: 'Le tahitien utilise 13 lettres. Les voyelles sont pures comme en espagnol. L\'apostrophe (ʻ) représente un coup de glotte.',
    vocabulary: [
      {
        id: 'greeting-1',
        tahitian: 'Ia ora na',
        french: 'Bonjour / Salut',
        english: 'Hello / Hi',
        pronunciation: '/i.a ˈo.ra na/',
        etymology: 'Littéralement "que la vie soit" - expression de bénédiction',
        culturalSignificance: 'Plus qu\'une salutation, c\'est un souhait de bien-être spirituel et physique',
        usageExamples: [
          {
            tahitian: 'Ia ora na, e aha tō ʻoe huru?',
            french: 'Bonjour, comment allez-vous?',
            english: 'Hello, how are you?',
            context: 'Salutation formelle avec demande de nouvelles',
            pronunciation: '/i.a ˈo.ra na, e ˈa.ha toː ˈʔoe ˈhu.ru/'
          },
          {
            tahitian: 'Ia ora na i te poipoi',
            french: 'Bonjour le matin',
            english: 'Good morning',
            context: 'Salutation matinale spécifique',
            pronunciation: '/i.a ˈo.ra na i te ˈpoi.poi/'
          }
        ],
        relatedWords: ['poipoi', 'ahiahi', 'pō'],
        difficulty: 'basic',
        frequency: 'high'
      },
      {
        id: 'greeting-2',
        tahitian: 'Nana',
        french: 'Au revoir',
        english: 'Goodbye',
        pronunciation: '/ˈna.na/',
        etymology: 'Forme contractée de "na na" signifiant "à bientôt"',
        culturalSignificance: 'Exprime l\'espoir de se revoir, reflétant l\'importance des liens communautaires',
        usageExamples: [
          {
            tahitian: 'Nana, ā teie pō!',
            french: 'Au revoir, à ce soir!',
            english: 'Goodbye, see you tonight!',
            context: 'Départ avec promesse de retrouvailles',
            pronunciation: '/ˈna.na, aː ˈte.ie poː/'
          }
        ],
        relatedWords: ['parahi', 'ā teie'],
        difficulty: 'basic',
        frequency: 'high'
      },
      {
        id: 'politeness-1',
        tahitian: 'Mauruuru',
        french: 'Merci',
        english: 'Thank you',
        pronunciation: '/mau.ˈru.u.ru/',
        etymology: 'De "mau" (porter) et "ruru" (paix), littéralement "porter la paix"',
        culturalSignificance: 'Expression de gratitude qui reconnaît l\'harmonie créée par l\'acte généreux',
        usageExamples: [
          {
            tahitian: 'Mauruuru roa',
            french: 'Merci beaucoup',
            english: 'Thank you very much',
            context: 'Gratitude intense et sincère',
            pronunciation: '/mau.ˈru.u.ru ˈro.a/'
          },
          {
            tahitian: 'Mauruuru noa atu',
            french: 'Merci infiniment',
            english: 'Thank you so much',
            context: 'Gratitude profonde et respectueuse',
            pronunciation: '/mau.ˈru.u.ru ˈno.a ˈa.tu/'
          }
        ],
        relatedWords: ['roa', 'noa atu', 'aroha'],
        difficulty: 'basic',
        frequency: 'high'
      },
      {
        id: 'politeness-2',
        tahitian: 'ʻAita peʻapeʻa',
        french: 'De rien / Il n\'y a pas de quoi',
        english: 'You\'re welcome / No problem',
        pronunciation: '/ˈʔai.ta pe.ˈʔa.pe.ˈʔa/',
        etymology: '"ʻAita" (non/pas) + "peʻapeʻa" (problème/difficulté)',
        culturalSignificance: 'Minimise l\'effort pour valoriser la relation plutôt que l\'acte',
        usageExamples: [
          {
            tahitian: 'ʻAita peʻapeʻa, e hoa',
            french: 'De rien, mon ami',
            english: 'No problem, my friend',
            context: 'Réponse chaleureuse entre amis',
            pronunciation: '/ˈʔai.ta pe.ˈʔa.pe.ˈʔa, e ˈho.a/'
          }
        ],
        relatedWords: ['hoa', 'ʻaita', 'maita\'i'],
        difficulty: 'intermediate',
        frequency: 'high'
      }
    ],
    exercises: [
      {
        id: 'greeting-pronunciation',
        type: 'pronunciation',
        instruction: 'Écoutez et répétez chaque salutation en respectant l\'intonation polynésienne',
        items: [
          { word: 'Ia ora na', focus: 'Coup de glotte initial et voyelles pures' },
          { word: 'Mauruuru', focus: 'Roulement du "r" et allongement des voyelles' }
        ],
        culturalFocus: 'L\'intonation respectueuse dans la culture polynésienne'
      },
      {
        id: 'greeting-context',
        type: 'context',
        instruction: 'Choisissez la salutation appropriée selon le contexte culturel',
        items: [
          {
            situation: 'Rencontrer un aîné le matin',
            options: ['Ia ora na', 'Nana', 'Mauruuru'],
            correct: 'Ia ora na',
            explanation: 'Respect dû aux aînés avec salutation complète'
          }
        ]
      }
    ],
    culturalInsights: [
      {
        concept: 'Mana dans les salutations',
        explanation: 'Chaque salutation échange de l\'énergie spirituelle positive entre les personnes',
        examples: ['"Ia ora na" transmet des vœux de vie', 'Le contact visuel renforce le mana'],
        modernRelevance: 'Maintient les liens communautaires dans la société moderne'
      }
    ]
  },
  {
    id: 'family-kinship',
    name: 'Famille et Parenté',
    nameEnglish: 'Family and Kinship',
    nameTahitian: 'Te ʻUtuāfare e te Fētii',
    level: 'Beginner',
    description: 'Système complexe de parenté polynésienne et terminologie familiale étendue',
    culturalContext: 'La famille polynésienne (ʻutuāfare) inclut les liens biologiques, adoptifs et spirituels, formant un réseau social essentiel.',
    pronunciationNotes: 'Attention aux voyelles longues qui changent le sens des mots de parenté.',
    vocabulary: [
      {
        id: 'family-1',
        tahitian: 'Metua',
        french: 'Parent',
        english: 'Parent',
        pronunciation: '/me.ˈtu.a/',
        etymology: 'Racine "tua" signifiant "ancien" ou "mature"',
        culturalSignificance: 'Terme respectueux qui honore la sagesse et l\'expérience',
        usageExamples: [
          {
            tahitian: 'Tōʻu metua tāne',
            french: 'Mon père',
            english: 'My father',
            context: 'Référence respectueuse au père',
            pronunciation: '/toːʔu me.ˈtu.a ˈtaː.ne/'
          },
          {
            tahitian: 'Tōʻu metua vahine',
            french: 'Ma mère',
            english: 'My mother',
            context: 'Référence respectueuse à la mère',
            pronunciation: '/toːʔu me.ˈtu.a va.ˈhi.ne/'
          }
        ],
        relatedWords: ['tāne', 'vahine', 'tupuna'],
        difficulty: 'basic',
        frequency: 'high'
      },
      {
        id: 'family-2',
        tahitian: 'Tamaiti',
        french: 'Enfant',
        english: 'Child',
        pronunciation: '/ta.ma.ˈi.ti/',
        etymology: 'De "tama" (enfant) + suffixe diminutif "iti"',
        culturalSignificance: 'Les enfants sont considérés comme des cadeaux sacrés et l\'avenir de la communauté',
        usageExamples: [
          {
            tahitian: 'Te tamaiti nei',
            french: 'Cet enfant',
            english: 'This child',
            context: 'Désignation affectueuse d\'un enfant',
            pronunciation: '/te ta.ma.ˈi.ti nei/'
          }
        ],
        relatedWords: ['tamahine', 'tamaroa', 'iti'],
        difficulty: 'basic',
        frequency: 'high'
      },
      {
        id: 'family-3',
        tahitian: 'Tupuna',
        french: 'Ancêtre / Grand-parent',
        english: 'Ancestor / Grandparent',
        pronunciation: '/tu.ˈpu.na/',
        etymology: 'De "tupu" (grandir/origine) + "na" (particule de respect)',
        culturalSignificance: 'Les tupuna sont vénérés comme guides spirituels et gardiens de la sagesse',
        usageExamples: [
          {
            tahitian: 'Tōʻu tupuna vahine',
            french: 'Ma grand-mère',
            english: 'My grandmother',
            context: 'Référence respectueuse à la grand-mère',
            pronunciation: '/toːʔu tu.ˈpu.na va.ˈhi.ne/'
          }
        ],
        relatedWords: ['metua', 'mātāhiapo', 'teina'],
        difficulty: 'intermediate',
        frequency: 'high'
      }
    ],
    exercises: [
      {
        id: 'family-tree',
        type: 'cultural',
        instruction: 'Construisez un arbre généalogique polynésien en utilisant la terminologie appropriée',
        items: [
          { concept: 'Famille élargie', terms: ['metua', 'tupuna', 'tamaiti'] },
          { concept: 'Adoption traditionnelle', terms: ['fāʻamu', 'tamaiti fāʻamu'] }
        ],
        culturalFocus: 'L\'importance de la famille élargie dans la société polynésienne'
      }
    ],
    culturalInsights: [
      {
        concept: 'Fāʻamu - Adoption traditionnelle',
        explanation: 'Pratique courante d\'adoption informelle qui renforce les liens communautaires',
        examples: ['Enfants élevés par les grands-parents', 'Partage des responsabilités parentales'],
        modernRelevance: 'Continue de jouer un rôle important dans l\'éducation des enfants'
      }
    ]
  }
];

// INTERMEDIATE LEVEL VOCABULARY MODULES
export const INTERMEDIATE_VOCABULARY_MODULES: VocabularyModule[] = [
  {
    id: 'nature-environment',
    name: 'Nature et Environnement',
    nameEnglish: 'Nature and Environment',
    nameTahitian: 'Te Taiao e te Fenua',
    level: 'Intermediate',
    description: 'Vocabulaire riche de l\'environnement polynésien et relation spirituelle avec la nature',
    culturalContext: 'La nature (taiao) est sacrée en Polynésie. Chaque élément naturel a une dimension spirituelle et pratique.',
    pronunciationNotes: 'Les mots de la nature utilisent souvent des sons onomatopéiques reflétant les bruits naturels.',
    vocabulary: [
      {
        id: 'nature-1',
        tahitian: 'Moana',
        french: 'Océan',
        english: 'Ocean',
        pronunciation: '/mo.ˈa.na/',
        etymology: 'Racine proto-polynésienne signifiant "grande étendue d\'eau"',
        culturalSignificance: 'L\'océan est la route ancestrale, source de vie et de connexion spirituelle',
        usageExamples: [
          {
            tahitian: 'Te moana nui ā Hiva',
            french: 'Le grand océan Pacifique',
            english: 'The great Pacific Ocean',
            context: 'Référence poétique à l\'océan Pacifique',
            pronunciation: '/te mo.ˈa.na ˈnu.i aː ˈhi.va/'
          }
        ],
        relatedWords: ['vai', 'pape', 'fenua'],
        difficulty: 'intermediate',
        frequency: 'high'
      },
      {
        id: 'nature-2',
        tahitian: 'Maunga',
        french: 'Montagne',
        english: 'Mountain',
        pronunciation: '/mau.ˈŋa/',
        etymology: 'Terme ancien désignant les élévations sacrées',
        culturalSignificance: 'Les montagnes sont les demeures des dieux et ancêtres, lieux de pouvoir spirituel',
        usageExamples: [
          {
            tahitian: 'Te maunga rahi o Tahiti',
            french: 'La grande montagne de Tahiti',
            english: 'The great mountain of Tahiti',
            context: 'Référence au mont Orohena',
            pronunciation: '/te mau.ˈŋa ˈra.hi o ta.ˈhi.ti/'
          }
        ],
        relatedWords: ['rahi', 'teitei', 'ʻōpū'],
        difficulty: 'intermediate',
        frequency: 'medium'
      }
    ],
    exercises: [
      {
        id: 'nature-poetry',
        type: 'cultural',
        instruction: 'Composez un court poème tahitien sur la nature en utilisant le vocabulaire appris',
        items: [
          { theme: 'Océan et montagne', vocabulary: ['moana', 'maunga', 'fenua'] }
        ],
        culturalFocus: 'La poésie traditionnelle polynésienne et sa relation à la nature'
      }
    ],
    culturalInsights: [
      {
        concept: 'Fenua - Terre sacrée',
        explanation: 'La terre n\'appartient pas aux humains, les humains appartiennent à la terre',
        examples: ['Respect des sites sacrés', 'Gestion durable des ressources'],
        modernRelevance: 'Influence les pratiques environnementales contemporaines'
      }
    ]
  }
];

// ADVANCED LEVEL VOCABULARY MODULES
export const ADVANCED_VOCABULARY_MODULES: VocabularyModule[] = [
  {
    id: 'spiritual-concepts',
    name: 'Concepts Spirituels',
    nameEnglish: 'Spiritual Concepts',
    nameTahitian: 'Te Mau Manao Varua',
    level: 'Advanced',
    description: 'Vocabulaire complexe de la spiritualité et philosophie polynésiennes',
    culturalContext: 'La spiritualité polynésienne intègre animisme, respect ancestral et harmonie cosmique.',
    pronunciationNotes: 'Les termes spirituels requièrent une prononciation respectueuse et méditative.',
    vocabulary: [
      {
        id: 'spiritual-1',
        tahitian: 'Mana',
        french: 'Pouvoir spirituel / Force sacrée',
        english: 'Spiritual power / Sacred force',
        pronunciation: '/ˈma.na/',
        etymology: 'Concept proto-polynésien de force spirituelle universelle',
        culturalSignificance: 'Force fondamentale qui anime toute vie et connecte tous les êtres',
        usageExamples: [
          {
            tahitian: 'Te mana o te fenua',
            french: 'Le pouvoir spirituel de la terre',
            english: 'The spiritual power of the land',
            context: 'Reconnaissance de la sacralité de la terre',
            pronunciation: '/te ˈma.na o te ˈfe.nu.a/'
          }
        ],
        relatedWords: ['varua', 'tapu', 'mauri'],
        difficulty: 'advanced',
        frequency: 'medium'
      }
    ],
    exercises: [
      {
        id: 'spiritual-discussion',
        type: 'cultural',
        instruction: 'Discutez des concepts spirituels polynésiens et de leur pertinence moderne',
        items: [
          { concept: 'Mana', discussion: 'Comment le mana influence-t-il les relations sociales?' }
        ],
        culturalFocus: 'Philosophie polynésienne et pensée contemporaine'
      }
    ],
    culturalInsights: [
      {
        concept: 'Interconnexion spirituelle',
        explanation: 'Tous les êtres sont connectés par des liens spirituels invisibles',
        examples: ['Respect de tous les êtres vivants', 'Responsabilité envers les générations futures'],
        modernRelevance: 'Inspire les mouvements écologiques et de justice sociale'
      }
    ]
  }
];

// Export all vocabulary modules
export const ALL_VOCABULARY_MODULES = [
  ...BEGINNER_VOCABULARY_MODULES,
  ...INTERMEDIATE_VOCABULARY_MODULES,
  ...ADVANCED_VOCABULARY_MODULES
];

// Pronunciation Guide
export const PRONUNCIATION_GUIDE = {
  vowels: {
    'a': '/a/ comme dans "papa"',
    'e': '/e/ comme dans "été"',
    'i': '/i/ comme dans "ici"',
    'o': '/o/ comme dans "eau"',
    'u': '/u/ comme dans "ou"'
  },
  consonants: {
    'f': '/f/ comme en français',
    'h': '/h/ aspiré léger',
    'm': '/m/ comme en français',
    'n': '/n/ comme en français',
    'p': '/p/ comme en français',
    'r': '/r/ roulé comme en espagnol',
    't': '/t/ comme en français',
    'v': '/v/ comme en français',
    'ʻ': '/ʔ/ coup de glotte (arrêt bref)'
  },
  rules: [
    'Chaque voyelle se prononce distinctement',
    'Pas de voyelles muettes',
    'L\'accent tonique tombe généralement sur l\'avant-dernière syllabe',
    'Le coup de glotte (ʻ) est crucial pour le sens'
  ]
};
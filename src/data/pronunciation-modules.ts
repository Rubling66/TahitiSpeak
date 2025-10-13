import { LessonLevel, ExerciseType } from '../types';

// Pronunciation Module Interfaces
export interface PronunciationModule {
  id: string;
  title: string;
  level: LessonLevel;
  description: string;
  phonemes: PhonemeGroup[];
  drills: PronunciationDrill[];
  exercises: PronunciationExercise[];
  audioGuides: AudioGuide[];
  culturalNotes: string[];
}

export interface PhonemeGroup {
  category: 'vowels' | 'consonants' | 'diphthongs' | 'clusters';
  phonemes: Phoneme[];
  description: string;
  culturalContext?: string;
}

export interface Phoneme {
  symbol: string;
  ipa: string;
  description: string;
  tahitianExamples: PronunciationExample[];
  frenchComparison?: string;
  commonMistakes: string[];
  articulationTips: string[];
}

export interface PronunciationExample {
  word: string;
  ipa: string;
  meaning: string;
  audioFile?: string;
  breakdown: SyllableBreakdown[];
}

export interface SyllableBreakdown {
  syllable: string;
  stress: 'primary' | 'secondary' | 'unstressed';
  notes?: string;
}

export interface PronunciationDrill {
  id: string;
  type: 'minimal_pairs' | 'repetition' | 'tongue_twisters' | 'rhythm' | 'intonation';
  title: string;
  instructions: string;
  items: DrillItem[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  culturalContext?: string;
}

export interface DrillItem {
  content: string;
  ipa?: string;
  audioFile?: string;
  translation?: string;
  notes?: string;
}

export interface PronunciationExercise {
  id: string;
  type: ExerciseType;
  title: string;
  instructions: string;
  items: PronunciationExerciseItem[];
  assessmentCriteria: AssessmentCriterion[];
}

export interface PronunciationExerciseItem {
  prompt: string;
  correctAnswer: string;
  ipa: string;
  audioFile?: string;
  feedback: string;
  alternatives?: string[];
}

export interface AssessmentCriterion {
  aspect: 'accuracy' | 'fluency' | 'intonation' | 'rhythm' | 'clarity';
  weight: number;
  description: string;
}

export interface AudioGuide {
  id: string;
  title: string;
  description: string;
  sections: AudioSection[];
  speaker: 'native_male' | 'native_female' | 'elder' | 'youth';
  dialect?: 'tahitian' | 'marquesan' | 'tuamotu';
}

export interface AudioSection {
  title: string;
  content: string;
  audioFile?: string;
  transcript: string;
  culturalNotes?: string[];
}

// Pronunciation Modules Data
export const PRONUNCIATION_MODULES: PronunciationModule[] = [
  {
    id: 'pronunciation-beginner',
    title: 'Fondements de la Prononciation Tahitienne',
    level: 'beginner',
    description: 'Maîtrisez les sons fondamentaux du tahitien avec une approche culturellement authentique',
    phonemes: [
      {
        category: 'vowels',
        description: 'Les cinq voyelles pures du tahitien',
        phonemes: [
          {
            symbol: 'a',
            ipa: '/a/',
            description: 'Voyelle ouverte centrale, comme dans "pâte" français',
            tahitianExamples: [
              {
                word: 'aroha',
                ipa: '/a.ˈro.ha/',
                meaning: 'amour, compassion',
                breakdown: [
                  { syllable: 'a', stress: 'unstressed' },
                  { syllable: 'ro', stress: 'primary' },
                  { syllable: 'ha', stress: 'unstressed' }
                ]
              },
              {
                word: 'vahine',
                ipa: '/va.ˈhi.ne/',
                meaning: 'femme',
                breakdown: [
                  { syllable: 'va', stress: 'unstressed' },
                  { syllable: 'hi', stress: 'primary' },
                  { syllable: 'ne', stress: 'unstressed' }
                ]
              }
            ],
            frenchComparison: 'Plus ouverte que le "a" français standard',
            commonMistakes: [
              'Prononcer comme un "e" fermé',
              'Réduire la voyelle en position non-accentuée'
            ],
            articulationTips: [
              'Gardez la bouche bien ouverte',
              'Position de langue basse et centrale',
              'Évitez la nasalisation'
            ]
          },
          {
            symbol: 'e',
            ipa: '/e/',
            description: 'Voyelle mi-fermée antérieure',
            tahitianExamples: [
              {
                word: 'fenua',
                ipa: '/fe.ˈnu.a/',
                meaning: 'terre, pays',
                breakdown: [
                  { syllable: 'fe', stress: 'unstressed' },
                  { syllable: 'nu', stress: 'primary' },
                  { syllable: 'a', stress: 'unstressed' }
                ]
              }
            ],
            frenchComparison: 'Comme le "é" français fermé',
            commonMistakes: ['Prononcer comme un "è" ouvert'],
            articulationTips: [
              'Lèvres légèrement étirées',
              'Langue en position antérieure'
            ]
          },
          {
            symbol: 'i',
            ipa: '/i/',
            description: 'Voyelle fermée antérieure',
            tahitianExamples: [
              {
                word: 'tiare',
                ipa: '/ti.ˈa.re/',
                meaning: 'fleur (gardénia)',
                breakdown: [
                  { syllable: 'ti', stress: 'unstressed' },
                  { syllable: 'a', stress: 'primary' },
                  { syllable: 're', stress: 'unstressed' }
                ]
              }
            ],
            frenchComparison: 'Identique au "i" français',
            commonMistakes: ['Diphtonguer avec les voyelles adjacentes'],
            articulationTips: [
              'Lèvres étirées',
              'Langue haute et antérieure'
            ]
          },
          {
            symbol: 'o',
            ipa: '/o/',
            description: 'Voyelle mi-fermée postérieure',
            tahitianExamples: [
              {
                word: 'moana',
                ipa: '/mo.ˈa.na/',
                meaning: 'océan',
                breakdown: [
                  { syllable: 'mo', stress: 'unstressed' },
                  { syllable: 'a', stress: 'primary' },
                  { syllable: 'na', stress: 'unstressed' }
                ]
              }
            ],
            frenchComparison: 'Comme le "o" fermé français',
            commonMistakes: ['Prononcer comme un "ô" ouvert'],
            articulationTips: [
              'Lèvres arrondies',
              'Langue postérieure'
            ]
          },
          {
            symbol: 'u',
            ipa: '/u/',
            description: 'Voyelle fermée postérieure',
            tahitianExamples: [
              {
                word: 'tumu',
                ipa: '/tu.ˈmu/',
                meaning: 'racine, origine',
                breakdown: [
                  { syllable: 'tu', stress: 'unstressed' },
                  { syllable: 'mu', stress: 'primary' }
                ]
              }
            ],
            frenchComparison: 'Identique au "ou" français',
            commonMistakes: ['Prononcer comme un "o" fermé'],
            articulationTips: [
              'Lèvres très arrondies',
              'Langue haute et postérieure'
            ]
          }
        ]
      },
      {
        category: 'consonants',
        description: 'Les consonnes essentielles du tahitien',
        phonemes: [
          {
            symbol: 'h',
            ipa: '/h/',
            description: 'Fricative glottale sourde - son crucial en tahitien',
            tahitianExamples: [
              {
                word: 'hoe',
                ipa: '/ˈho.e/',
                meaning: 'pagaie',
                breakdown: [
                  { syllable: 'ho', stress: 'primary' },
                  { syllable: 'e', stress: 'unstressed' }
                ]
              },
              {
                word: 'vahine',
                ipa: '/va.ˈhi.ne/',
                meaning: 'femme',
                breakdown: [
                  { syllable: 'va', stress: 'unstressed' },
                  { syllable: 'hi', stress: 'primary' },
                  { syllable: 'ne', stress: 'unstressed' }
                ]
              }
            ],
            frenchComparison: 'Plus marqué que le "h" aspiré français',
            commonMistakes: [
              'Omettre complètement le son',
              'Prononcer trop faiblement'
            ],
            articulationTips: [
              'Expiration audible mais douce',
              'Ne pas forcer - respiration naturelle',
              'Maintenir le son entre voyelles'
            ]
          },
          {
            symbol: "'",
            ipa: '/ʔ/',
            description: 'Coup de glotte (eta) - marque distinctive du tahitien',
            tahitianExamples: [
              {
                word: "ta'ata",
                ipa: '/ta.ˈʔa.ta/',
                meaning: 'personne, homme',
                breakdown: [
                  { syllable: 'ta', stress: 'unstressed' },
                  { syllable: "'a", stress: 'primary', notes: 'coup de glotte' },
                  { syllable: 'ta', stress: 'unstressed' }
                ]
              },
              {
                word: "pa'ari",
                ipa: '/pa.ˈʔa.ri/',
                meaning: 'casser',
                breakdown: [
                  { syllable: 'pa', stress: 'unstressed' },
                  { syllable: "'a", stress: 'primary', notes: 'coup de glotte' },
                  { syllable: 'ri', stress: 'unstressed' }
                ]
              }
            ],
            frenchComparison: 'Inexistant en français - arrêt bref de la voix',
            commonMistakes: [
              'Ignorer complètement le coup de glotte',
              'Remplacer par une pause trop longue',
              'Confondre avec le "h"'
            ],
            articulationTips: [
              'Fermeture brève des cordes vocales',
              'Comme dans "uh-oh" anglais',
              'Ne pas faire de pause audible'
            ]
          }
        ]
      }
    ],
    drills: [
      {
        id: 'vowel-purity-drill',
        type: 'repetition',
        title: 'Pureté des Voyelles Tahitiennes',
        instructions: 'Répétez chaque voyelle en maintenant sa pureté. Évitez la diphtongaison.',
        difficulty: 2,
        items: [
          {
            content: 'a - a - a',
            ipa: '/a - a - a/',
            translation: 'Voyelle ouverte pure'
          },
          {
            content: 'aroha - aroha - aroha',
            ipa: '/a.ro.ha - a.ro.ha - a.ro.ha/',
            translation: 'amour - amour - amour'
          },
          {
            content: 'vahine - vahine - vahine',
            ipa: '/va.hi.ne - va.hi.ne - va.hi.ne/',
            translation: 'femme - femme - femme'
          }
        ],
        culturalContext: 'La pureté vocalique reflète la clarté spirituelle dans la culture polynésienne'
      },
      {
        id: 'glottal-stop-drill',
        type: 'minimal_pairs',
        title: 'Maîtrise du Coup de Glotte (Eta)',
        instructions: 'Distinguez clairement les mots avec et sans coup de glotte.',
        difficulty: 4,
        items: [
          {
            content: "mata / ma'ta",
            ipa: '/ma.ta/ / /ma.ʔta/',
            translation: 'œil / cru, non cuit',
            notes: 'Le coup de glotte change complètement le sens'
          },
          {
            content: "pua / pu'a",
            ipa: '/pu.a/ / /pu.ʔa/',
            translation: 'fleur / cochon',
            notes: 'Distinction cruciale pour éviter les malentendus'
          }
        ],
        culturalContext: 'Le eta (coup de glotte) est sacré - il distingue des concepts spirituels importants'
      },
      {
        id: 'rhythm-drill',
        type: 'rhythm',
        title: 'Rythme et Accentuation Tahitienne',
        instructions: 'Suivez le rythme naturel du tahitien avec accent sur l\'avant-dernière syllabe.',
        difficulty: 3,
        items: [
          {
            content: 'Tahiti nui e',
            ipa: '/ta.ˈhi.ti ˈnu.i e/',
            translation: 'Grande Tahiti',
            notes: 'Rythme traditionnel des chants'
          },
          {
            content: 'Ia ora na',
            ipa: '/i.a ˈo.ra na/',
            translation: 'Bonjour (salut de vie)',
            notes: 'Salutation rythmée'
          }
        ]
      }
    ],
    exercises: [
      {
        id: 'pronunciation-assessment-1',
        type: 'pronunciation',
        title: 'Évaluation de Prononciation - Niveau Débutant',
        instructions: 'Prononcez chaque mot clairement en respectant l\'accentuation tahitienne.',
        items: [
          {
            prompt: 'Prononcez: aroha',
            correctAnswer: 'aroha',
            ipa: '/a.ˈro.ha/',
            feedback: 'Excellent! Vous maîtrisez la pureté vocalique tahitienne.'
          },
          {
            prompt: "Prononcez: ta'ata",
            correctAnswer: "ta'ata",
            ipa: '/ta.ˈʔa.ta/',
            feedback: 'Parfait! Le coup de glotte est bien marqué.'
          }
        ],
        assessmentCriteria: [
          {
            aspect: 'accuracy',
            weight: 0.4,
            description: 'Précision des phonèmes tahitiens'
          },
          {
            aspect: 'rhythm',
            weight: 0.3,
            description: 'Respect du rythme et de l\'accentuation'
          },
          {
            aspect: 'clarity',
            weight: 0.3,
            description: 'Clarté de l\'articulation'
          }
        ]
      }
    ],
    audioGuides: [
      {
        id: 'elder-pronunciation-guide',
        title: 'Guide de Prononciation par un Ancien',
        description: 'Apprenez la prononciation authentique avec un locuteur natif âgé',
        speaker: 'elder',
        dialect: 'tahitian',
        sections: [
          {
            title: 'Les Voyelles Sacrées',
            content: 'Dans notre langue ancestrale, chaque voyelle porte l\'esprit de nos ancêtres...',
            transcript: 'E aroha e, les cinq voyelles de notre langue sont comme les cinq doigts de la main - chacune a sa place et son importance.',
            culturalNotes: [
              'Les anciens enseignent que les voyelles connectent la terre et le ciel',
              'Chaque son porte une énergie spirituelle particulière'
            ]
          }
        ]
      }
    ],
    culturalNotes: [
      'La prononciation tahitienne reflète la connexion spirituelle avec la nature',
      'Le respect des sons authentiques honore les ancêtres',
      'Chaque phonème porte l\'histoire et la sagesse du peuple mā\'ohi'
    ]
  },
  {
    id: 'pronunciation-intermediate',
    title: 'Perfectionnement Phonétique Avancé',
    level: 'intermediate',
    description: 'Maîtrisez les subtilités prosodiques et dialectales du tahitien',
    phonemes: [
      {
        category: 'diphthongs',
        description: 'Séquences vocaliques et leur réalisation',
        phonemes: [
          {
            symbol: 'ai',
            ipa: '/ai/',
            description: 'Diphtongue descendante',
            tahitianExamples: [
              {
                word: 'maita\'i',
                ipa: '/mai.ˈta.ʔi/',
                meaning: 'bon, bien',
                breakdown: [
                  { syllable: 'mai', stress: 'unstressed' },
                  { syllable: 'ta', stress: 'primary' },
                  { syllable: "'i", stress: 'unstressed' }
                ]
              }
            ],
            commonMistakes: ['Prononcer comme deux voyelles séparées'],
            articulationTips: ['Glissement fluide de /a/ vers /i/']
          }
        ]
      }
    ],
    drills: [
      {
        id: 'intonation-drill',
        type: 'intonation',
        title: 'Patterns Intonatifs Tahitiens',
        instructions: 'Maîtrisez les courbes mélodiques caractéristiques du tahitien.',
        difficulty: 4,
        items: [
          {
            content: 'Aita peapea?',
            ipa: '/ˈai.ta pe.a.ˈpe.a/',
            translation: 'N\'est-ce pas?',
            notes: 'Intonation interrogative montante'
          }
        ]
      }
    ],
    exercises: [],
    audioGuides: [],
    culturalNotes: [
      'L\'intonation tahitienne exprime les émotions et les relations sociales',
      'Les variations dialectales enrichissent la diversité culturelle polynésienne'
    ]
  }
];

// Pronunciation Teaching Methodology
export const PRONUNCIATION_PEDAGOGY = {
  approach: 'Immersion Phonétique Culturelle',
  principles: [
    'Authenticité culturelle dans l\'enseignement',
    'Progression du global au spécifique',
    'Intégration de la prosodie et du sens',
    'Respect des variations dialectales'
  ],
  techniques: [
    'Modélisation par locuteurs natifs',
    'Exercices de discrimination auditive',
    'Pratique rythmique et mélodique',
    'Correction phonétique bienveillante'
  ],
  assessment: [
    'Évaluation holistique de la communication',
    'Feedback immédiat et constructif',
    'Auto-évaluation guidée',
    'Progression individualisée'
  ]
};

// Audio Component Integration
export const AUDIO_COMPONENTS = {
  recordingGuidelines: {
    quality: 'Studio quality (48kHz, 24-bit)',
    speakers: 'Native speakers from different age groups',
    environment: 'Natural cultural settings when possible',
    postProcessing: 'Minimal - preserve authentic characteristics'
  },
  playbackFeatures: [
    'Variable speed control (0.5x to 2x)',
    'Loop functionality for difficult segments',
    'Visual waveform display',
    'Phonetic transcription synchronization'
  ],
  interactiveElements: [
    'Record and compare functionality',
    'Real-time pronunciation feedback',
    'Gamified pronunciation challenges',
    'Cultural context audio stories'
  ]
};

export default PRONUNCIATION_MODULES;
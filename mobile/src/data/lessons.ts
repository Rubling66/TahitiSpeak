export interface Lesson {
  id: string;
  title: string;
  titleTahitian: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: 'greetings' | 'numbers' | 'family' | 'food' | 'nature' | 'culture' | 'daily' | 'dance';
  phrases: LessonPhrase[];
  culturalNote?: string;
  progress: number;
}

export interface LessonPhrase {
  id: string;
  french: string;
  tahitian: string;
  english: string;
  pronunciation: string;
  audioFile?: string;
}

export const LESSONS: Lesson[] = [
  {
    id: 'lesson-1',
    title: 'Salutations de base',
    titleTahitian: 'Te fa\'a\'amu rahi',
    description: 'Apprenez les salutations essentielles en tahitien',
    level: 'beginner',
    category: 'greetings',
    progress: 0,
    phrases: [
      {
        id: 'p1-1',
        french: 'Bonjour',
        tahitian: 'Ia ora na',
        english: 'Hello',
        pronunciation: 'ee-ah OH-rah nah'
      },
      {
        id: 'p1-2',
        french: 'Bonsoir',
        tahitian: 'Ia ora na i te ahiahi',
        english: 'Good evening',
        pronunciation: 'ee-ah OH-rah nah ee teh ah-hee-AH-hee'
      },
      {
        id: 'p1-3',
        french: 'Au revoir',
        tahitian: 'Nana',
        english: 'Goodbye',
        pronunciation: 'NAH-nah'
      },
      {
        id: 'p1-4',
        french: 'À bientôt',
        tahitian: 'A te taime ae',
        english: 'See you later',
        pronunciation: 'ah teh TAH-ee-meh ah-eh'
      }
    ],
    culturalNote: 'En Polynésie française, les salutations sont très importantes et reflètent le respect mutuel.'
  },
  {
    id: 'lesson-2',
    title: 'Les nombres',
    titleTahitian: 'Te hoe',
    description: 'Comptez de 1 à 10 en tahitien',
    level: 'beginner',
    category: 'numbers',
    progress: 0,
    phrases: [
      {
        id: 'p2-1',
        french: 'Un',
        tahitian: 'Hoe',
        english: 'One',
        pronunciation: 'HOH-eh'
      },
      {
        id: 'p2-2',
        french: 'Deux',
        tahitian: 'Piti',
        english: 'Two',
        pronunciation: 'PEE-tee'
      },
      {
        id: 'p2-3',
        french: 'Trois',
        tahitian: 'Toru',
        english: 'Three',
        pronunciation: 'TOH-roo'
      },
      {
        id: 'p2-4',
        french: 'Quatre',
        tahitian: 'Maha',
        english: 'Four',
        pronunciation: 'MAH-hah'
      },
      {
        id: 'p2-5',
        french: 'Cinq',
        tahitian: 'Pae',
        english: 'Five',
        pronunciation: 'PAH-eh'
      }
    ]
  },
  {
    id: 'lesson-3',
    title: 'La famille',
    titleTahitian: 'Te utuafare',
    description: 'Vocabulaire familial tahitien',
    level: 'beginner',
    category: 'family',
    progress: 0,
    phrases: [
      {
        id: 'p3-1',
        french: 'Mère',
        tahitian: 'Mama',
        english: 'Mother',
        pronunciation: 'MAH-mah'
      },
      {
        id: 'p3-2',
        french: 'Père',
        tahitian: 'Papa',
        english: 'Father',
        pronunciation: 'PAH-pah'
      },
      {
        id: 'p3-3',
        french: 'Enfant',
        tahitian: 'Tamarii',
        english: 'Child',
        pronunciation: 'tah-mah-REE-ee'
      },
      {
        id: 'p3-4',
        french: 'Grand-mère',
        tahitian: 'Mama rui',
        english: 'Grandmother',
        pronunciation: 'MAH-mah ROO-ee'
      }
    ],
    culturalNote: 'La famille élargie est très importante dans la culture polynésienne.'
  },
  {
    id: 'lesson-4',
    title: 'Nourriture locale',
    titleTahitian: 'Te maa',
    description: 'Découvrez les aliments traditionnels',
    level: 'beginner',
    category: 'food',
    progress: 0,
    phrases: [
      {
        id: 'p4-1',
        french: 'Poisson',
        tahitian: 'Eia',
        english: 'Fish',
        pronunciation: 'EH-ee-ah'
      },
      {
        id: 'p4-2',
        french: 'Fruit de l\'arbre à pain',
        tahitian: 'Uru',
        english: 'Breadfruit',
        pronunciation: 'OO-roo'
      },
      {
        id: 'p4-3',
        french: 'Noix de coco',
        tahitian: 'Haari',
        english: 'Coconut',
        pronunciation: 'HAH-ah-ree'
      },
      {
        id: 'p4-4',
        french: 'Banane',
        tahitian: 'Meika',
        english: 'Banana',
        pronunciation: 'MEH-ee-kah'
      }
    ]
  },
  {
    id: 'lesson-5',
    title: 'La nature',
    titleTahitian: 'Te taiao',
    description: 'Éléments naturels de Tahiti',
    level: 'beginner',
    category: 'nature',
    progress: 0,
    phrases: [
      {
        id: 'p5-1',
        french: 'Mer',
        tahitian: 'Moana',
        english: 'Ocean',
        pronunciation: 'moh-AH-nah'
      },
      {
        id: 'p5-2',
        french: 'Montagne',
        tahitian: 'Mouʻa',
        english: 'Mountain',
        pronunciation: 'MOH-oo-ah'
      },
      {
        id: 'p5-3',
        french: 'Plage',
        tahitian: 'Tahatai',
        english: 'Beach',
        pronunciation: 'tah-hah-TAH-ee'
      },
      {
        id: 'p5-4',
        french: 'Soleil',
        tahitian: 'Mahana',
        english: 'Sun',
        pronunciation: 'mah-HAH-nah'
      }
    ]
  },
  {
    id: 'lesson-6',
    title: 'Politesse et respect',
    titleTahitian: 'Te fa\'a\'aito',
    description: 'Expressions de politesse',
    level: 'beginner',
    category: 'greetings',
    progress: 0,
    phrases: [
      {
        id: 'p6-1',
        french: 'S\'il vous plaît',
        tahitian: 'E fa\'ahou',
        english: 'Please',
        pronunciation: 'eh fah-ah-HOH'
      },
      {
        id: 'p6-2',
        french: 'Merci',
        tahitian: 'Mauruuru',
        english: 'Thank you',
        pronunciation: 'mah-oo-ROO-roo'
      },
      {
        id: 'p6-3',
        french: 'Excusez-moi',
        tahitian: 'E fa\'aro\'o mai',
        english: 'Excuse me',
        pronunciation: 'eh fah-ah-roh-oh MAH-ee'
      },
      {
        id: 'p6-4',
        french: 'Pardon',
        tahitian: 'Aroha teie',
        english: 'Sorry',
        pronunciation: 'ah-ROH-hah TEH-ee-eh'
      }
    ]
  },
  {
    id: 'lesson-7',
    title: 'Les couleurs',
    titleTahitian: 'Te tae',
    description: 'Couleurs en tahitien',
    level: 'beginner',
    category: 'daily',
    progress: 0,
    phrases: [
      {
        id: 'p7-1',
        french: 'Rouge',
        tahitian: 'Ute',
        english: 'Red',
        pronunciation: 'OO-teh'
      },
      {
        id: 'p7-2',
        french: 'Bleu',
        tahitian: 'Ninamu',
        english: 'Blue',
        pronunciation: 'nee-nah-MOO'
      },
      {
        id: 'p7-3',
        french: 'Vert',
        tahitian: 'Matie',
        english: 'Green',
        pronunciation: 'mah-TEE-eh'
      },
      {
        id: 'p7-4',
        french: 'Jaune',
        tahitian: 'Rearea',
        english: 'Yellow',
        pronunciation: 'reh-ah-REH-ah'
      }
    ]
  },
  {
    id: 'lesson-8',
    title: 'Le temps',
    titleTahitian: 'Te taime',
    description: 'Expressions temporelles',
    level: 'intermediate',
    category: 'daily',
    progress: 0,
    phrases: [
      {
        id: 'p8-1',
        french: 'Aujourd\'hui',
        tahitian: 'I teie mahana',
        english: 'Today',
        pronunciation: 'ee TEH-ee-eh mah-HAH-nah'
      },
      {
        id: 'p8-2',
        french: 'Hier',
        tahitian: 'Inanahi',
        english: 'Yesterday',
        pronunciation: 'ee-nah-nah-HEE'
      },
      {
        id: 'p8-3',
        french: 'Demain',
        tahitian: 'Ananahi',
        english: 'Tomorrow',
        pronunciation: 'ah-nah-nah-HEE'
      },
      {
        id: 'p8-4',
        french: 'Maintenant',
        tahitian: 'Teie nei',
        english: 'Now',
        pronunciation: 'TEH-ee-eh NEH-ee'
      }
    ]
  },
  {
    id: 'lesson-9',
    title: 'La Danse Traditionnelle - Ori Tahiti',
    titleTahitian: 'Te ori Tahiti',
    description: 'Vocabulaire de la danse traditionnelle tahitienne',
    level: 'intermediate',
    category: 'dance',
    progress: 0,
    phrases: [
      {
        id: 'p9-1',
        french: 'Danse',
        tahitian: 'Ori',
        english: 'Dance',
        pronunciation: 'OH-ree'
      },
      {
        id: 'p9-2',
        french: 'Danseur/Danseuse',
        tahitian: 'Ori haa',
        english: 'Dancer',
        pronunciation: 'OH-ree HAH-ah'
      },
      {
        id: 'p9-3',
        french: 'Otea (danse rapide)',
        tahitian: 'Otea',
        english: 'Otea (fast dance)',
        pronunciation: 'oh-TEH-ah'
      },
      {
        id: 'p9-4',
        french: 'Aparima (danse narrative)',
        tahitian: 'Aparima',
        english: 'Aparima (storytelling dance)',
        pronunciation: 'ah-pah-REE-mah'
      },
      {
        id: 'p9-5',
        french: 'Hivinau (danse en cercle)',
        tahitian: 'Hivinau',
        english: 'Hivinau (circle dance)',
        pronunciation: 'hee-vee-NAH-oo'
      },
      {
        id: 'p9-6',
        french: 'Costume traditionnel',
        tahitian: 'Ahufiri',
        english: 'Traditional costume',
        pronunciation: 'ah-hoo-FEE-ree'
      }
    ],
    culturalNote: 'L\'Ori Tahiti est l\'âme de la culture polynésienne, transmettant les légendes et l\'histoire à travers le mouvement.'
  },
  {
    id: 'lesson-10',
    title: 'Instruments de Musique Traditionnels',
    titleTahitian: 'Te tarava tahiti',
    description: 'Instruments accompagnant la danse tahitienne',
    level: 'intermediate',
    category: 'dance',
    progress: 0,
    phrases: [
      {
        id: 'p10-1',
        french: 'Tambour',
        tahitian: 'Pahu',
        english: 'Drum',
        pronunciation: 'PAH-hoo'
      },
      {
        id: 'p10-2',
        french: 'Tambour à fente',
        tahitian: 'Toere',
        english: 'Slit drum',
        pronunciation: 'toh-EH-reh'
      },
      {
        id: 'p10-3',
        french: 'Ukulélé tahitien',
        tahitian: 'Ukulele',
        english: 'Tahitian ukulele',
        pronunciation: 'oo-koo-LEH-leh'
      },
      {
        id: 'p10-4',
        french: 'Conque marine',
        tahitian: 'Pu',
        english: 'Conch shell',
        pronunciation: 'POO'
      },
      {
        id: 'p10-5',
        french: 'Rythme',
        tahitian: 'Tarava',
        english: 'Rhythm',
        pronunciation: 'tah-RAH-vah'
      }
    ],
    culturalNote: 'Les instruments traditionnels créent l\'ambiance sacrée nécessaire aux danses polynésiennes.'
  },
  {
    id: 'lesson-11',
    title: 'Mouvements de Danse',
    titleTahitian: 'Te nehenehe ori',
    description: 'Vocabulaire des mouvements de danse',
    level: 'advanced',
    category: 'dance',
    progress: 0,
    phrases: [
      {
        id: 'p11-1',
        french: 'Mouvement des hanches',
        tahitian: 'Fa\'arapu',
        english: 'Hip movement',
        pronunciation: 'fah-ah-rah-POO'
      },
      {
        id: 'p11-2',
        french: 'Mouvement des mains',
        tahitian: 'Rima ori',
        english: 'Hand movement',
        pronunciation: 'REE-mah OH-ree'
      },
      {
        id: 'p11-3',
        french: 'Pas de base',
        tahitian: 'Tamau',
        english: 'Basic step',
        pronunciation: 'tah-MAH-oo'
      },
      {
        id: 'p11-4',
        french: 'Tourner',
        tahitian: 'Tairi',
        english: 'To turn',
        pronunciation: 'tah-EE-ree'
      },
      {
        id: 'p11-5',
        french: 'Grâce',
        tahitian: 'Nehenehe',
        english: 'Grace',
        pronunciation: 'neh-heh-NEH-heh'
      }
    ],
    culturalNote: 'Chaque mouvement dans l\'Ori Tahiti a une signification symbolique liée à la nature et aux légendes.'
  },
  {
    id: 'lesson-12',
    title: 'Directions',
    titleTahitian: 'Te ara',
    description: 'Se diriger en tahitien',
    level: 'intermediate',
    category: 'daily',
    progress: 0,
    phrases: [
      {
        id: 'p9-1',
        french: 'À droite',
        tahitian: 'I ni\'a',
        english: 'To the right',
        pronunciation: 'ee nee-AH'
      },
      {
        id: 'p9-2',
        french: 'À gauche',
        tahitian: 'I raro',
        english: 'To the left',
        pronunciation: 'ee RAH-roh'
      },
      {
        id: 'p9-3',
        french: 'Tout droit',
        tahitian: 'Toro tonu',
        english: 'Straight ahead',
        pronunciation: 'TOH-roh TOH-noo'
      },
      {
        id: 'p9-4',
        french: 'Où est...',
        tahitian: 'I hea...',
        english: 'Where is...',
        pronunciation: 'ee HEH-ah'
      }
    ]
  },
  {
    id: 'lesson-10',
    title: 'Émotions',
    titleTahitian: 'Te manaʻo',
    description: 'Exprimer ses sentiments',
    level: 'intermediate',
    category: 'daily',
    progress: 0,
    phrases: [
      {
        id: 'p10-1',
        french: 'Heureux',
        tahitian: 'Hauʻoli',
        english: 'Happy',
        pronunciation: 'hah-oo-OH-lee'
      },
      {
        id: 'p10-2',
        french: 'Triste',
        tahitian: 'Riri',
        english: 'Sad',
        pronunciation: 'REE-ree'
      },
      {
        id: 'p10-3',
        french: 'Fatigué',
        tahitian: 'Haumani',
        english: 'Tired',
        pronunciation: 'hah-oo-MAH-nee'
      },
      {
        id: 'p10-4',
        french: 'En colère',
        tahitian: 'Riri roa',
        english: 'Angry',
        pronunciation: 'REE-ree ROH-ah'
      }
    ]
  },
  {
    id: 'lesson-11',
    title: 'Activités quotidiennes',
    titleTahitian: 'Te huru mau',
    description: 'Actions de tous les jours',
    level: 'intermediate',
    category: 'daily',
    progress: 0,
    phrases: [
      {
        id: 'p11-1',
        french: 'Manger',
        tahitian: 'Amu',
        english: 'To eat',
        pronunciation: 'AH-moo'
      },
      {
        id: 'p11-2',
        french: 'Boire',
        tahitian: 'Inu',
        english: 'To drink',
        pronunciation: 'EE-noo'
      },
      {
        id: 'p11-3',
        french: 'Dormir',
        tahitian: 'Moe',
        english: 'To sleep',
        pronunciation: 'MOH-eh'
      },
      {
        id: 'p11-4',
        french: 'Travailler',
        tahitian: 'Huru',
        english: 'To work',
        pronunciation: 'HOO-roo'
      }
    ]
  },
  {
    id: 'lesson-12',
    title: 'Vêtements traditionnels',
    titleTahitian: 'Te ahu',
    description: 'Habits polynésiens',
    level: 'intermediate',
    category: 'culture',
    progress: 0,
    phrases: [
      {
        id: 'p12-1',
        french: 'Paréo',
        tahitian: 'Pareu',
        english: 'Sarong',
        pronunciation: 'pah-REH-oo'
      },
      {
        id: 'p12-2',
        french: 'Couronne de fleurs',
        tahitian: 'Hei',
        english: 'Flower crown',
        pronunciation: 'HEH-ee'
      },
      {
        id: 'p12-3',
        french: 'Collier de fleurs',
        tahitian: 'Lei',
        english: 'Flower necklace',
        pronunciation: 'LEH-ee'
      },
      {
        id: 'p12-4',
        french: 'Tapa (tissu)',
        tahitian: 'Tapa',
        english: 'Bark cloth',
        pronunciation: 'TAH-pah'
      }
    ],
    culturalNote: 'Les vêtements traditionnels sont portés lors des fêtes et cérémonies importantes.'
  },
  {
    id: 'lesson-13',
    title: 'Musique et danse',
    titleTahitian: 'Te himene e te ori',
    description: 'Arts polynésiens',
    level: 'intermediate',
    category: 'culture',
    progress: 0,
    phrases: [
      {
        id: 'p13-1',
        french: 'Danse',
        tahitian: 'Ori',
        english: 'Dance',
        pronunciation: 'OH-ree'
      },
      {
        id: 'p13-2',
        french: 'Tambour',
        tahitian: 'Pahu',
        english: 'Drum',
        pronunciation: 'PAH-hoo'
      },
      {
        id: 'p13-3',
        french: 'Chant',
        tahitian: 'Himene',
        english: 'Song',
        pronunciation: 'hee-MEH-neh'
      },
      {
        id: 'p13-4',
        french: 'Ukulélé',
        tahitian: 'Ukulele',
        english: 'Ukulele',
        pronunciation: 'oo-koo-LEH-leh'
      }
    ]
  },
  {
    id: 'lesson-14',
    title: 'Animaux marins',
    titleTahitian: 'Te mau holotona moana',
    description: 'Faune marine polynésienne',
    level: 'intermediate',
    category: 'nature',
    progress: 0,
    phrases: [
      {
        id: 'p14-1',
        french: 'Requin',
        tahitian: 'Maʻo',
        english: 'Shark',
        pronunciation: 'mah-OH'
      },
      {
        id: 'p14-2',
        french: 'Raie',
        tahitian: 'Fai',
        english: 'Stingray',
        pronunciation: 'FAH-ee'
      },
      {
        id: 'p14-3',
        french: 'Tortue',
        tahitian: 'Honu',
        english: 'Turtle',
        pronunciation: 'HOH-noo'
      },
      {
        id: 'p14-4',
        french: 'Dauphin',
        tahitian: 'Ou',
        english: 'Dolphin',
        pronunciation: 'OH-oo'
      }
    ]
  },
  {
    id: 'lesson-15',
    title: 'Météo tropicale',
    titleTahitian: 'Te taiao',
    description: 'Conditions météorologiques',
    level: 'intermediate',
    category: 'nature',
    progress: 0,
    phrases: [
      {
        id: 'p15-1',
        french: 'Pluie',
        tahitian: 'Ua',
        english: 'Rain',
        pronunciation: 'OO-ah'
      },
      {
        id: 'p15-2',
        french: 'Vent',
        tahitian: 'Matai',
        english: 'Wind',
        pronunciation: 'mah-TAH-ee'
      },
      {
        id: 'p15-3',
        french: 'Nuage',
        tahitian: 'Ao',
        english: 'Cloud',
        pronunciation: 'AH-oh'
      },
      {
        id: 'p15-4',
        french: 'Chaud',
        tahitian: 'Vevela',
        english: 'Hot',
        pronunciation: 'veh-VEH-lah'
      }
    ]
  },
  {
    id: 'lesson-16',
    title: 'Fêtes traditionnelles',
    titleTahitian: 'Te mau tamaraa',
    description: 'Célébrations polynésiennes',
    level: 'advanced',
    category: 'culture',
    progress: 0,
    phrases: [
      {
        id: 'p16-1',
        french: 'Heiva (festival)',
        tahitian: 'Heiva',
        english: 'Festival',
        pronunciation: 'HEH-ee-vah'
      },
      {
        id: 'p16-2',
        french: 'Tamaaraa (fête)',
        tahitian: 'Tamaaraa',
        english: 'Feast',
        pronunciation: 'tah-mah-ah-RAH-ah'
      },
      {
        id: 'p16-3',
        french: 'Mariage',
        tahitian: 'Faaipoipo',
        english: 'Wedding',
        pronunciation: 'fah-ah-ee-poh-ee-poh'
      },
      {
        id: 'p16-4',
        french: 'Anniversaire',
        tahitian: 'Mahana fanau',
        english: 'Birthday',
        pronunciation: 'mah-HAH-nah fah-NAH-oo'
      }
    ],
    culturalNote: 'Le Heiva est le festival culturel le plus important de Tahiti, célébré en juillet.'
  },
  {
    id: 'lesson-17',
    title: 'Artisanat local',
    titleTahitian: 'Te huru rima',
    description: 'Arts et métiers traditionnels',
    level: 'advanced',
    category: 'culture',
    progress: 0,
    phrases: [
      {
        id: 'p17-1',
        french: 'Sculpture',
        tahitian: 'Tataʻi',
        english: 'Carving',
        pronunciation: 'tah-tah-AH-ee'
      },
      {
        id: 'p17-2',
        french: 'Vannerie',
        tahitian: 'Nape',
        english: 'Basketry',
        pronunciation: 'NAH-peh'
      },
      {
        id: 'p17-3',
        french: 'Perle',
        tahitian: 'Poe',
        english: 'Pearl',
        pronunciation: 'POH-eh'
      },
      {
        id: 'p17-4',
        french: 'Tatouage',
        tahitian: 'Tatau',
        english: 'Tattoo',
        pronunciation: 'tah-TAH-oo'
      }
    ]
  },
  {
    id: 'lesson-18',
    title: 'Navigation traditionnelle',
    titleTahitian: 'Te faʻatere',
    description: 'Art de la navigation polynésienne',
    level: 'advanced',
    category: 'culture',
    progress: 0,
    phrases: [
      {
        id: 'p18-1',
        french: 'Pirogue',
        tahitian: 'Vaʻa',
        english: 'Canoe',
        pronunciation: 'vah-AH'
      },
      {
        id: 'p18-2',
        french: 'Étoiles',
        tahitian: 'Fetu',
        english: 'Stars',
        pronunciation: 'FEH-too'
      },
      {
        id: 'p18-3',
        french: 'Navigateur',
        tahitian: 'Faʻatere',
        english: 'Navigator',
        pronunciation: 'fah-ah-TEH-reh'
      },
      {
        id: 'p18-4',
        french: 'Voyage',
        tahitian: 'Tere',
        english: 'Journey',
        pronunciation: 'TEH-reh'
      }
    ],
    culturalNote: 'Les Polynésiens étaient des navigateurs exceptionnels qui utilisaient les étoiles pour traverser le Pacifique.'
  },
  {
    id: 'lesson-19',
    title: 'Expressions avancées',
    titleTahitian: 'Te mau parau rahi',
    description: 'Phrases complexes en tahitien',
    level: 'advanced',
    category: 'daily',
    progress: 0,
    phrases: [
      {
        id: 'p19-1',
        french: 'Comment allez-vous ?',
        tahitian: 'E aha to oe huru ?',
        english: 'How are you?',
        pronunciation: 'eh AH-hah toh OH-eh HOO-roo'
      },
      {
        id: 'p19-2',
        french: 'Je vais bien',
        tahitian: 'Maita\'i vau',
        english: 'I am fine',
        pronunciation: 'mah-ee-tah-EE VAH-oo'
      },
      {
        id: 'p19-3',
        french: 'Quel est votre nom ?',
        tahitian: 'O vai to oe ioa ?',
        english: 'What is your name?',
        pronunciation: 'oh VAH-ee toh OH-eh ee-OH-ah'
      },
      {
        id: 'p19-4',
        french: 'Je ne comprends pas',
        tahitian: 'Aita vau e hinaaro',
        english: 'I don\'t understand',
        pronunciation: 'AH-ee-tah VAH-oo eh hee-nah-AH-roh'
      }
    ]
  },
  {
    id: 'lesson-20',
    title: 'Sagesse polynésienne',
    titleTahitian: 'Te mau parau rahi',
    description: 'Proverbes et sagesse traditionnelle',
    level: 'advanced',
    category: 'culture',
    progress: 0,
    phrases: [
      {
        id: 'p20-1',
        french: 'Bienvenue en Polynésie',
        tahitian: 'Maeva i Porinesia',
        english: 'Welcome to Polynesia',
        pronunciation: 'mah-EH-vah ee poh-ree-NEH-see-ah'
      },
      {
        id: 'p20-2',
        french: 'L\'amour de la terre',
        tahitian: 'Te here no te fenua',
        english: 'Love of the land',
        pronunciation: 'teh HEH-reh noh teh feh-NOO-ah'
      },
      {
        id: 'p20-3',
        french: 'Vivre en harmonie',
        tahitian: 'Noho i te rau',
        english: 'Live in harmony',
        pronunciation: 'NOH-hoh ee teh RAH-oo'
      },
      {
        id: 'p20-4',
        french: 'Que la paix soit avec vous',
        tahitian: 'Te hauʻoli ia rahi oe',
        english: 'May peace be with you',
        pronunciation: 'teh hah-oo-OH-lee ee-ah RAH-hee OH-eh'
      }
    ],
    culturalNote: 'Ces expressions reflètent les valeurs fondamentales de respect, d\'harmonie et d\'amour de la nature dans la culture polynésienne.'
  }
];

export const getLessonsByCategory = (category: string): Lesson[] => {
  return LESSONS.filter(lesson => lesson.category === category);
};

export const getLessonsByLevel = (level: string): Lesson[] => {
  return LESSONS.filter(lesson => lesson.level === level);
};

export const getLessonById = (id: string): Lesson | undefined => {
  return LESSONS.find(lesson => lesson.id === id);
};
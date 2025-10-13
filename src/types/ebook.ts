// types/ebook.ts

export interface EbookChapter {
  id: string;
  title: string;
  content: string;
  order: number;
  duration?: number; // estimated reading time in minutes
  wordCount?: number;
  exercises?: EbookExercise[];
  audioUrl?: string;
  videoUrl?: string;
}

export interface EbookExercise {
  id: string;
  type: 'multiple-choice' | 'fill-blank' | 'translation' | 'pronunciation' | 'comprehension';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  points?: number;
}

export interface EbookAnnotation {
  id: string;
  chapterId: string;
  userId: string;
  text: string;
  note: string;
  position: {
    start: number;
    end: number;
  };
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface EbookBookmark {
  id: string;
  chapterId: string;
  userId: string;
  title: string;
  position: number;
  createdAt: string;
}

export interface EbookProgress {
  userId: string;
  ebookId: string;
  currentChapter: string;
  currentPosition: number;
  completedChapters: string[];
  totalTimeSpent: number; // in minutes
  lastReadAt: string;
  progressPercentage: number;
  exerciseScores: Record<string, number>;
}

export interface EbookMetadata {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  author: string;
  publisher?: string;
  isbn?: string;
  language: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  tags: string[];
  coverImageUrl?: string;
  thumbnailUrl?: string;
  totalPages?: number;
  estimatedReadingTime: number; // in minutes
  difficulty: 1 | 2 | 3 | 4 | 5;
  culturalContext?: string;
  learningObjectives: string[];
  prerequisites: string[];
  targetAudience: string;
  publicationDate: string;
  lastUpdated: string;
  version: string;
  fileSize?: number; // in bytes
  format: 'html' | 'epub' | 'pdf' | 'interactive';
  downloadUrl?: string;
  previewUrl?: string;
  price?: number;
  currency?: string;
  isPurchased?: boolean;
  isDownloaded?: boolean;
  rating?: number;
  reviewCount?: number;
  accessLevel: 'free' | 'premium' | 'subscription';
}

export interface Ebook {
  id: string;
  metadata: EbookMetadata;
  chapters: EbookChapter[];
  tableOfContents: {
    chapterId: string;
    title: string;
    page?: number;
    level: number;
  }[];
  glossary?: {
    term: string;
    definition: string;
    pronunciation?: string;
    audioUrl?: string;
    examples?: string[];
  }[];
  bibliography?: {
    title: string;
    author: string;
    url?: string;
    type: 'book' | 'article' | 'website' | 'video';
  }[];
  settings: {
    fontSize: 'small' | 'medium' | 'large' | 'extra-large';
    fontFamily: string;
    theme: 'light' | 'dark' | 'sepia';
    lineHeight: number;
    margin: number;
    autoScroll: boolean;
    highlightEnabled: boolean;
    audioEnabled: boolean;
  };
  status: 'draft' | 'review' | 'published' | 'archived';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  downloadCount?: number;
  viewCount?: number;
}

export interface EbookLibrary {
  id: string;
  name: string;
  description: string;
  ebooks: string[]; // ebook IDs
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Synthetic data for development
export const syntheticEbooks: Ebook[] = [
  {
    id: 'ebook-1',
    metadata: {
      id: 'ebook-1',
      title: 'Te Reo Tahiti: A Beginner\'s Journey',
      subtitle: 'Learn the Beautiful Language of Tahiti',
      description: 'A comprehensive introduction to the Tahitian language, covering basic vocabulary, grammar, and cultural context. Perfect for beginners who want to start their journey into Polynesian culture.',
      author: 'Dr. Teiva Manutahi',
      publisher: 'Pacific Language Press',
      isbn: '978-0-123456-78-9',
      language: 'Tahitian/English',
      level: 'beginner',
      category: 'Language Learning',
      tags: ['tahitian', 'polynesian', 'beginner', 'culture', 'vocabulary'],
      coverImageUrl: '/images/ebooks/tahiti-beginners.jpg',
      thumbnailUrl: '/images/ebooks/tahiti-beginners-thumb.jpg',
      totalPages: 240,
      estimatedReadingTime: 480,
      difficulty: 2,
      culturalContext: 'Introduces readers to Tahitian culture, traditions, and the significance of language in Polynesian society.',
      learningObjectives: [
        'Master basic Tahitian greetings and introductions',
        'Understand fundamental grammar structures',
        'Learn 500+ essential vocabulary words',
        'Appreciate Tahitian cultural context'
      ],
      prerequisites: ['Basic reading comprehension'],
      targetAudience: 'Adult learners, tourists, cultural enthusiasts',
      publicationDate: '2023-06-15',
      lastUpdated: '2023-11-20',
      version: '2.1',
      fileSize: 15728640,
      format: 'interactive',
      downloadUrl: '/downloads/tahiti-beginners.epub',
      previewUrl: '/preview/tahiti-beginners',
      price: 24.99,
      currency: 'USD',
      isPurchased: true,
      isDownloaded: true,
      rating: 4.7,
      reviewCount: 156,
      accessLevel: 'premium'
    },
    chapters: [
      {
        id: 'chapter-1',
        title: 'Ia Ora Na - Greetings and Introductions',
        content: `
# Ia Ora Na - Greetings and Introductions

Welcome to your first lesson in Te Reo Tahiti! In this chapter, we'll learn the most essential phrases for greeting people and introducing yourself.

## Basic Greetings

**Ia ora na** - Hello (literally "may you live")
This is the most common greeting in Tahitian. It can be used at any time of day.

**Ia ora na oe** - Hello to you (singular)
**Ia ora na outou** - Hello to you all (plural)

## Introducing Yourself

**O vai to oe i'oa?** - What is your name?
**O [name] to'u i'oa** - My name is [name]

## Cultural Context

In Tahitian culture, greetings are very important. They show respect and acknowledge the person's presence. The phrase "Ia ora na" literally means "may you live" and reflects the Polynesian value of wishing well-being upon others.

## Practice Exercises

Try these simple exercises to practice what you've learned:

1. How would you greet someone in Tahitian?
2. How would you introduce yourself?
3. What does "Ia ora na" literally mean?
        `,
        order: 1,
        duration: 15,
        wordCount: 180,
        exercises: [
          {
            id: 'ex-1-1',
            type: 'multiple-choice',
            question: 'What does "Ia ora na" mean?',
            options: ['Goodbye', 'Hello', 'Thank you', 'Please'],
            correctAnswer: 'Hello',
            explanation: 'Ia ora na is the standard greeting in Tahitian, meaning hello.',
            points: 10
          },
          {
            id: 'ex-1-2',
            type: 'translation',
            question: 'Translate: "My name is Marie"',
            correctAnswer: 'O Marie to\'u i\'oa',
            explanation: 'Use the pattern "O [name] to\'u i\'oa" to introduce yourself.',
            points: 15
          }
        ],
        audioUrl: '/audio/chapter-1.mp3'
      },
      {
        id: 'chapter-2',
        title: 'Te Taime - Time and Numbers',
        content: `
# Te Taime - Time and Numbers

In this chapter, we'll learn how to tell time and count in Tahitian.

## Numbers 1-10

**Hoe** - One
**Piti** - Two  
**Toru** - Three
**Maha** - Four
**Pae** - Five
**Ono** - Six
**Hitu** - Seven
**Va'u** - Eight
**Iva** - Nine
**Ahuru** - Ten

## Telling Time

**Teie te taime?** - What time is it?
**E hoe hora** - It's one o'clock
**E piti hora** - It's two o'clock

## Cultural Note

Traditional Tahitian time concepts were based on natural phenomena like the sun's position and tidal patterns. Modern Tahitian incorporates both traditional and Western time concepts.
        `,
        order: 2,
        duration: 20,
        wordCount: 150,
        exercises: [
          {
            id: 'ex-2-1',
            type: 'multiple-choice',
            question: 'What is the Tahitian word for "five"?',
            options: ['Pae', 'Ono', 'Hitu', 'Maha'],
            correctAnswer: 'Pae',
            explanation: 'Pae is the Tahitian word for five.',
            points: 10
          }
        ],
        audioUrl: '/audio/chapter-2.mp3'
      }
    ],
    tableOfContents: [
      { chapterId: 'chapter-1', title: 'Ia Ora Na - Greetings and Introductions', page: 1, level: 1 },
      { chapterId: 'chapter-2', title: 'Te Taime - Time and Numbers', page: 15, level: 1 }
    ],
    glossary: [
      {
        term: 'Ia ora na',
        definition: 'Hello, greeting',
        pronunciation: 'ee-ah OH-rah nah',
        audioUrl: '/audio/glossary/ia-ora-na.mp3',
        examples: ['Ia ora na, o vai to oe i\'oa?']
      },
      {
        term: 'i\'oa',
        definition: 'name',
        pronunciation: 'ee-OH-ah',
        audioUrl: '/audio/glossary/ioa.mp3',
        examples: ['O Teiva to\'u i\'oa']
      }
    ],
    bibliography: [
      {
        title: 'Tahitian Language and Culture',
        author: 'Dr. Louise Peltzer',
        type: 'book'
      },
      {
        title: 'Polynesian Languages: A Comparative Study',
        author: 'Prof. Albert Davletshin',
        url: 'https://example.com/polynesian-study',
        type: 'article'
      }
    ],
    settings: {
      fontSize: 'medium',
      fontFamily: 'Georgia',
      theme: 'light',
      lineHeight: 1.6,
      margin: 20,
      autoScroll: false,
      highlightEnabled: true,
      audioEnabled: true
    },
    status: 'published',
    createdBy: 'admin',
    createdAt: '2023-06-15T10:00:00Z',
    updatedAt: '2023-11-20T14:30:00Z',
    downloadCount: 1247,
    viewCount: 3891
  },
  {
    id: 'ebook-2',
    metadata: {
      id: 'ebook-2',
      title: 'Tahitian Legends and Stories',
      subtitle: 'Traditional Tales from French Polynesia',
      description: 'A collection of traditional Tahitian legends and stories, presented in both Tahitian and English. These tales offer insight into Polynesian mythology and cultural values.',
      author: 'Mama Terehia',
      publisher: 'Island Heritage Publishing',
      language: 'Tahitian/English',
      level: 'intermediate',
      category: 'Literature & Culture',
      tags: ['legends', 'stories', 'culture', 'mythology', 'intermediate'],
      coverImageUrl: '/images/ebooks/tahitian-legends.jpg',
      thumbnailUrl: '/images/ebooks/tahitian-legends-thumb.jpg',
      totalPages: 180,
      estimatedReadingTime: 360,
      difficulty: 3,
      culturalContext: 'Traditional Polynesian oral literature preserved in written form, showcasing ancient wisdom and cultural values.',
      learningObjectives: [
        'Understand traditional Tahitian storytelling',
        'Learn intermediate vocabulary through context',
        'Appreciate Polynesian mythology and values',
        'Improve reading comprehension skills'
      ],
      prerequisites: ['Basic Tahitian vocabulary', 'Elementary grammar knowledge'],
      targetAudience: 'Intermediate learners, cultural researchers, literature enthusiasts',
      publicationDate: '2023-08-10',
      lastUpdated: '2023-10-15',
      version: '1.3',
      fileSize: 12582912,
      format: 'interactive',
      downloadUrl: '/downloads/tahitian-legends.epub',
      previewUrl: '/preview/tahitian-legends',
      price: 19.99,
      currency: 'USD',
      isPurchased: false,
      isDownloaded: false,
      rating: 4.9,
      reviewCount: 89,
      accessLevel: 'premium'
    },
    chapters: [
      {
        id: 'legend-1',
        title: 'Te Fatu - The Legend of the Sacred Stone',
        content: `
# Te Fatu - The Legend of the Sacred Stone

## Tahitian Version

I te taime ra'a, i Tahiti nei, e fatu rahi te i'oa o Te Fatu Tabu. E fatu maita'i roa teie, e e mau mana rahi to na...

## English Translation

Long ago, in Tahiti, there was a great stone called Te Fatu Tabu (The Sacred Stone). This was a very special stone, and it had great spiritual power...

## Cultural Significance

This legend teaches us about the Polynesian concept of mana (spiritual power) and the sacred relationship between people and the natural world.
        `,
        order: 1,
        duration: 25,
        wordCount: 450,
        exercises: [
          {
            id: 'legend-ex-1',
            type: 'comprehension',
            question: 'What was special about Te Fatu Tabu?',
            correctAnswer: 'It had great spiritual power (mana)',
            explanation: 'The stone was considered sacred because it possessed mana, spiritual power in Polynesian belief.',
            points: 15
          }
        ],
        audioUrl: '/audio/legend-1.mp3'
      }
    ],
    tableOfContents: [
      { chapterId: 'legend-1', title: 'Te Fatu - The Legend of the Sacred Stone', page: 1, level: 1 }
    ],
    glossary: [
      {
        term: 'fatu',
        definition: 'stone, rock',
        pronunciation: 'fah-TOO',
        audioUrl: '/audio/glossary/fatu.mp3',
        examples: ['Te fatu tabu']
      },
      {
        term: 'mana',
        definition: 'spiritual power, divine energy',
        pronunciation: 'MAH-nah',
        audioUrl: '/audio/glossary/mana.mp3',
        examples: ['E mana rahi to na']
      }
    ],
    bibliography: [
      {
        title: 'Polynesian Mythology',
        author: 'Martha Beckwith',
        type: 'book'
      }
    ],
    settings: {
      fontSize: 'medium',
      fontFamily: 'Georgia',
      theme: 'light',
      lineHeight: 1.6,
      margin: 20,
      autoScroll: false,
      highlightEnabled: true,
      audioEnabled: true
    },
    status: 'published',
    createdBy: 'admin',
    createdAt: '2023-08-10T09:00:00Z',
    updatedAt: '2023-10-15T16:45:00Z',
    downloadCount: 567,
    viewCount: 1234
  }
];

export const syntheticEbookProgress: EbookProgress[] = [
  {
    userId: 'user-1',
    ebookId: 'ebook-1',
    currentChapter: 'chapter-2',
    currentPosition: 45,
    completedChapters: ['chapter-1'],
    totalTimeSpent: 35,
    lastReadAt: '2023-12-01T14:30:00Z',
    progressPercentage: 50,
    exerciseScores: {
      'ex-1-1': 10,
      'ex-1-2': 15
    }
  }
];

export const syntheticAnnotations: EbookAnnotation[] = [
  {
    id: 'annotation-1',
    chapterId: 'chapter-1',
    userId: 'user-1',
    text: 'Ia ora na',
    note: 'This is the most important greeting to remember!',
    position: { start: 150, end: 160 },
    color: '#ffeb3b',
    createdAt: '2023-12-01T10:15:00Z',
    updatedAt: '2023-12-01T10:15:00Z'
  }
];

export const syntheticBookmarks: EbookBookmark[] = [
  {
    id: 'bookmark-1',
    chapterId: 'chapter-1',
    userId: 'user-1',
    title: 'Basic Greetings Section',
    position: 200,
    createdAt: '2023-12-01T10:20:00Z'
  }
]
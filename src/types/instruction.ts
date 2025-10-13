// Instruction Card Types for Repository System

export interface InstructionCard {
  id: string;
  title: string;
  description: string;
  category: 'grammar' | 'vocabulary' | 'conversation' | 'culture' | 'assessment';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  timeGoal: string;
  learningOutcome: string;
  valueProposition: string;
  tags: string[];
  purchasePrice: number;
  isPurchased: boolean;
  rating: number;
  reviewCount: number;
  author: string;
  createdAt: number;
  updatedAt: number;
  previewUrl?: string;
  fullContentUrl?: string;
  thumbnailUrl?: string;
}

// Synthetic instruction data for development
export const syntheticInstructions: InstructionCard[] = [
  {
    id: 'inst-001',
    title: 'Master Tahitian Greetings in 30 Minutes',
    description: 'Complete guide to essential Tahitian greetings with cultural context and pronunciation tips',
    category: 'conversation',
    difficulty: 'beginner',
    timeGoal: '30 minutes',
    learningOutcome: 'Confidently greet people in Tahitian in various social situations',
    valueProposition: 'Skip months of trial and error - learn the most important greetings used by native speakers daily',
    tags: ['greetings', 'social', 'pronunciation', 'culture'],
    purchasePrice: 9.99,
    isPurchased: false,
    rating: 4.8,
    reviewCount: 127,
    author: 'Marie Tetuanui',
    createdAt: Date.now() - 86400000 * 15,
    updatedAt: Date.now() - 86400000 * 2,
    previewUrl: '/previews/tahitian-greetings.pdf',
    thumbnailUrl: '/thumbnails/greetings-thumb.jpg'
  },
  {
    id: 'inst-002',
    title: 'Essential Tahitian Family Vocabulary',
    description: 'Learn 50+ family-related terms with memory techniques and cultural insights',
    category: 'vocabulary',
    difficulty: 'beginner',
    timeGoal: '45 minutes',
    learningOutcome: 'Describe family relationships and talk about family members in Tahitian',
    valueProposition: 'Build meaningful connections by learning the vocabulary that matters most in Polynesian culture',
    tags: ['family', 'relationships', 'memory-techniques', 'cultural-values'],
    purchasePrice: 12.99,
    isPurchased: true,
    rating: 4.9,
    reviewCount: 89,
    author: 'Teiva Manutahi',
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now() - 86400000 * 5,
    previewUrl: '/previews/family-vocabulary.pdf',
    fullContentUrl: '/content/family-vocabulary-full.pdf',
    thumbnailUrl: '/thumbnails/family-thumb.jpg'
  },
  {
    id: 'inst-003',
    title: 'Tahitian Grammar Fundamentals: Sentence Structure',
    description: 'Master basic Tahitian sentence patterns with practical examples and exercises',
    category: 'grammar',
    difficulty: 'intermediate',
    timeGoal: '60 minutes',
    learningOutcome: 'Construct grammatically correct Tahitian sentences with confidence',
    valueProposition: 'Unlock fluent expression by mastering the grammar patterns that native speakers use naturally',
    tags: ['sentence-structure', 'grammar-rules', 'exercises', 'fluency'],
    purchasePrice: 15.99,
    isPurchased: false,
    rating: 4.7,
    reviewCount: 156,
    author: 'Dr. Hinano Teavai',
    createdAt: Date.now() - 86400000 * 45,
    updatedAt: Date.now() - 86400000 * 8,
    previewUrl: '/previews/grammar-fundamentals.pdf',
    thumbnailUrl: '/thumbnails/grammar-thumb.jpg'
  },
  {
    id: 'inst-004',
    title: 'Traditional Tahitian Legends for Language Learning',
    description: 'Improve reading comprehension through engaging traditional stories with vocabulary support',
    category: 'culture',
    difficulty: 'intermediate',
    timeGoal: '90 minutes',
    learningOutcome: 'Understand cultural stories while expanding vocabulary and reading skills',
    valueProposition: 'Learn language through captivating stories that connect you to Polynesian heritage and wisdom',
    tags: ['legends', 'reading', 'culture', 'storytelling', 'heritage'],
    purchasePrice: 18.99,
    isPurchased: true,
    rating: 4.9,
    reviewCount: 203,
    author: 'Mama Terehia',
    createdAt: Date.now() - 86400000 * 60,
    updatedAt: Date.now() - 86400000 * 12,
    previewUrl: '/previews/traditional-legends.pdf',
    fullContentUrl: '/content/traditional-legends-full.pdf',
    thumbnailUrl: '/thumbnails/legends-thumb.jpg'
  },
  {
    id: 'inst-005',
    title: 'Tahitian Pronunciation Mastery System',
    description: 'Perfect your Tahitian pronunciation with audio guides and phonetic breakdowns',
    category: 'conversation',
    difficulty: 'beginner',
    timeGoal: '40 minutes',
    learningOutcome: 'Speak Tahitian with clear, accurate pronunciation that natives understand',
    valueProposition: 'Avoid embarrassing mispronunciations and speak with confidence from day one',
    tags: ['pronunciation', 'phonetics', 'audio', 'speaking', 'confidence'],
    purchasePrice: 14.99,
    isPurchased: false,
    rating: 4.8,
    reviewCount: 178,
    author: 'Teva Rohfritsch',
    createdAt: Date.now() - 86400000 * 20,
    updatedAt: Date.now() - 86400000 * 3,
    previewUrl: '/previews/pronunciation-mastery.pdf',
    thumbnailUrl: '/thumbnails/pronunciation-thumb.jpg'
  },
  {
    id: 'inst-006',
    title: 'Tahitian Numbers and Counting System',
    description: 'Master the unique Tahitian counting system with practical applications',
    category: 'vocabulary',
    difficulty: 'beginner',
    timeGoal: '25 minutes',
    learningOutcome: 'Count, tell time, and handle numbers confidently in Tahitian',
    valueProposition: 'Essential skill for shopping, telling time, and daily conversations in French Polynesia',
    tags: ['numbers', 'counting', 'time', 'shopping', 'practical'],
    purchasePrice: 8.99,
    isPurchased: true,
    rating: 4.6,
    reviewCount: 94,
    author: 'Vaite Temarii',
    createdAt: Date.now() - 86400000 * 25,
    updatedAt: Date.now() - 86400000 * 4,
    previewUrl: '/previews/numbers-counting.pdf',
    fullContentUrl: '/content/numbers-counting-full.pdf',
    thumbnailUrl: '/thumbnails/numbers-thumb.jpg'
  },
  {
    id: 'inst-007',
    title: 'Advanced Tahitian Conversation Starters',
    description: 'Engage in meaningful conversations beyond basic greetings with confidence',
    category: 'conversation',
    difficulty: 'advanced',
    timeGoal: '75 minutes',
    learningOutcome: 'Initiate and maintain complex conversations on various topics in Tahitian',
    valueProposition: 'Transform from tourist phrases to meaningful cultural exchange and deep connections',
    tags: ['advanced-conversation', 'cultural-exchange', 'topics', 'fluency'],
    purchasePrice: 22.99,
    isPurchased: false,
    rating: 4.9,
    reviewCount: 67,
    author: 'Heimana Taputu',
    createdAt: Date.now() - 86400000 * 35,
    updatedAt: Date.now() - 86400000 * 6,
    previewUrl: '/previews/advanced-conversation.pdf',
    thumbnailUrl: '/thumbnails/conversation-thumb.jpg'
  },
  {
    id: 'inst-008',
    title: 'Tahitian Language Assessment Toolkit',
    description: 'Comprehensive tests and rubrics to evaluate Tahitian language proficiency',
    category: 'assessment',
    difficulty: 'intermediate',
    timeGoal: '120 minutes',
    learningOutcome: 'Accurately assess and track Tahitian language learning progress',
    valueProposition: 'Professional-grade assessment tools used by language schools and cultural centers',
    tags: ['assessment', 'testing', 'proficiency', 'rubrics', 'evaluation'],
    purchasePrice: 29.99,
    isPurchased: false,
    rating: 4.7,
    reviewCount: 45,
    author: 'Institut de la Langue Tahitienne',
    createdAt: Date.now() - 86400000 * 50,
    updatedAt: Date.now() - 86400000 * 10,
    previewUrl: '/previews/assessment-toolkit.pdf',
    thumbnailUrl: '/thumbnails/assessment-thumb.jpg'
  },
  {
    id: 'inst-009',
    title: 'Tahitian Cultural Etiquette Guide',
    description: 'Navigate social situations with proper Tahitian cultural awareness and respect',
    category: 'culture',
    difficulty: 'beginner',
    timeGoal: '50 minutes',
    learningOutcome: 'Interact respectfully and appropriately in Tahitian cultural contexts',
    valueProposition: 'Avoid cultural missteps and build genuine relationships with local communities',
    tags: ['etiquette', 'respect', 'social-norms', 'cultural-awareness'],
    purchasePrice: 16.99,
    isPurchased: true,
    rating: 4.8,
    reviewCount: 112,
    author: 'Tarita Tefaafana',
    createdAt: Date.now() - 86400000 * 40,
    updatedAt: Date.now() - 86400000 * 7,
    previewUrl: '/previews/cultural-etiquette.pdf',
    fullContentUrl: '/content/cultural-etiquette-full.pdf',
    thumbnailUrl: '/thumbnails/etiquette-thumb.jpg'
  },
  {
    id: 'inst-010',
    title: 'Tahitian Verb Conjugation Mastery',
    description: 'Master essential Tahitian verb forms with systematic practice methods',
    category: 'grammar',
    difficulty: 'advanced',
    timeGoal: '90 minutes',
    learningOutcome: 'Use Tahitian verbs correctly in all tenses and contexts',
    valueProposition: 'Achieve grammatical accuracy that impresses native speakers and enhances communication',
    tags: ['verbs', 'conjugation', 'tenses', 'grammar', 'accuracy'],
    purchasePrice: 24.99,
    isPurchased: false,
    rating: 4.6,
    reviewCount: 78,
    author: 'Professeur Mahina Teiva',
    createdAt: Date.now() - 86400000 * 55,
    updatedAt: Date.now() - 86400000 * 11,
    previewUrl: '/previews/verb-conjugation.pdf',
    thumbnailUrl: '/thumbnails/verbs-thumb.jpg'
  }
];
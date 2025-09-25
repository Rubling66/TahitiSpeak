# Tahitian French Tutor - Production-Ready Web Architecture

## 1. Executive Summary

This document outlines the transformation of the Tahitian French Tutor from a React Native/Expo application to a production-ready, web-first application using Next.js App Router, TypeScript, and local-first data architecture. The new architecture prioritizes performance, accessibility, offline functionality, and classroom-ready UX flows.

### Key Transformation Goals
- **Local-first**: No paid external services, SQLite/IndexedDB persistence
- **Web-first UX**: Fast SSG/ISR, offline-friendly, network resilient
- **Standards-focused**: Repeatable lesson templates, A11y compliance, deterministic rendering
- **Type-safe**: Deterministic data access with versioned content
- **Classroom-ready**: Discoverability, guided tasks, visible progress tracking

## 2. Database Schema (SQLite)

### 2.1 Complete DDL Schema

```sql
-- Core lesson structure
CREATE TABLE lessons (
  id INTEGER PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title_fr TEXT NOT NULL,
  title_tah TEXT,
  title_en TEXT,
  level TEXT CHECK(level IN ('Beginner','Intermediate','Advanced')) NOT NULL,
  summary TEXT NOT NULL,
  hero_media_id INTEGER,
  duration_min INTEGER DEFAULT 25,
  version INTEGER NOT NULL DEFAULT 1,
  is_published INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_lessons_level ON lessons(level);
CREATE UNIQUE INDEX idx_lessons_slug ON lessons(slug);

-- Lesson content sections
CREATE TABLE lesson_sections (
  id INTEGER PRIMARY KEY,
  lesson_id INTEGER NOT NULL,
  kind TEXT CHECK(kind IN ('Objectives','Vocabulary','Practice','Culture','Assessment','Review')) NOT NULL,
  title TEXT NOT NULL,
  content_md TEXT,
  sort_order INTEGER NOT NULL,
  FOREIGN KEY(lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);

CREATE INDEX idx_sections_lesson ON lesson_sections(lesson_id, sort_order);

-- Vocabulary items
CREATE TABLE vocab_items (
  id INTEGER PRIMARY KEY,
  lesson_id INTEGER NOT NULL,
  term_fr TEXT NOT NULL,
  term_tah TEXT,
  term_en TEXT,
  ipa_fr TEXT,
  ipa_tah TEXT,
  part_of_speech TEXT,
  note TEXT,
  audio_media_id INTEGER,
  is_core INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL,
  FOREIGN KEY(lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);

CREATE INDEX idx_vocab_lesson ON vocab_items(lesson_id, sort_order);

-- Practice exercises
CREATE TABLE exercises (
  id INTEGER PRIMARY KEY,
  lesson_id INTEGER NOT NULL,
  type TEXT CHECK(type IN ('MCQ','Match','Ordering','Dictation','Pronunciation','FillBlank','Roleplay')) NOT NULL,
  prompt TEXT NOT NULL,
  data_json TEXT NOT NULL,
  solution_json TEXT,
  points INTEGER DEFAULT 1,
  sort_order INTEGER NOT NULL,
  FOREIGN KEY(lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);

CREATE INDEX idx_exercises_lesson ON exercises(lesson_id, sort_order);

-- Media assets
CREATE TABLE media_assets (
  id INTEGER PRIMARY KEY,
  kind TEXT CHECK(kind IN ('image','audio','video')) NOT NULL,
  file_path TEXT NOT NULL,
  alt TEXT,
  duration_ms INTEGER,
  rights TEXT,
  sha256 TEXT UNIQUE
);

CREATE INDEX idx_media_kind ON media_assets(kind);

-- Tagging system
CREATE TABLE tags (
  id INTEGER PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  category TEXT
);

CREATE TABLE lesson_tags (
  lesson_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (lesson_id, tag_id),
  FOREIGN KEY(lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  FOREIGN KEY(tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- User management
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  nickname TEXT,
  created_at INTEGER,
  last_seen_at INTEGER
);

-- Progress tracking
CREATE TABLE progress (
  user_id INTEGER NOT NULL,
  lesson_id INTEGER NOT NULL,
  section_kind TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  score INTEGER DEFAULT 0,
  attempts INTEGER DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, lesson_id, section_kind),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);

CREATE INDEX idx_progress_user ON progress(user_id, updated_at DESC);

-- Application settings
CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

### 2.2 Lesson Slug Mapping

Stable URLs for the 20 existing lessons:

1. `salutations-de-base`
2. `les-nombres`
3. `la-famille`
4. `nourriture-locale`
5. `la-nature`
6. `politesse-et-respect`
7. `les-couleurs`
8. `le-temps`
9. `danse-traditionnelle-ori-tahiti`
10. `instruments-de-musique-traditionnels`
11. `mouvements-de-danse`
12. `directions`
13. `emotions`
14. `activites-quotidiennes`
15. `vetements-traditionnels`
16. `fetes-traditionnelles`
17. `artisanat-local`
18. `navigation-traditionnelle`
19. `expressions-avancees`
20. `sagesse-polynesienne`

## 3. JSON Data Structure

### 3.1 Lesson Object Schema

```json
{
  "slug": "salutations-de-base",
  "level": "Beginner",
  "title": {
    "fr": "Salutations de base",
    "tah": "Te fa'a'amu rahi",
    "en": "Basic Greetings"
  },
  "summary": "Essential Tahitian greetings: hello, good evening, goodbye, see you later. Cultural respect in greetings.",
  "durationMin": 25,
  "sections": [
    {
      "kind": "Objectives",
      "title": "Objectifs",
      "contentMd": "- Dire bonjour et au revoir\n- Utiliser les formules de politesse de base"
    },
    {
      "kind": "Vocabulary",
      "title": "Vocabulaire clef",
      "vocab": [
        {
          "fr": "Bonjour",
          "tah": "Ia ora na",
          "en": "Hello",
          "ipaFr": "bɔ̃ʒuʁ",
          "ipaTah": "ia oɾa na",
          "note": "Use any time of day"
        }
      ]
    },
    {
      "kind": "Practice",
      "title": "Mise en pratique",
      "exercises": [
        {
          "type": "Roleplay",
          "prompt": "Salue un client qui arrive le soir",
          "data": {
            "steps": [
              {"you": "Bonsoir, bienvenue !"},
              {"client": "..."},
              {"you": "..."}
            ]
          }
        },
        {
          "type": "Pronunciation",
          "prompt": "Prononce 'Ia ora na'",
          "data": {
            "target": "Ia ora na",
            "threshold": 0.75
          }
        }
      ]
    },
    {
      "kind": "Culture",
      "title": "Culture",
      "contentMd": "Le salut est un marqueur de respect crucial. Sourire, légère inclination de tête..."
    },
    {
      "kind": "Review",
      "title": "Révision rapide",
      "contentMd": "Cartes: Bonjour ↔ Ia ora na, Bonsoir ↔ Ia ora i to pô, ..."
    }
  ],
  "tags": ["greetings", "politeness", "service"]
}
```

### 3.2 JSON Schema Validation (Ajv)

```typescript
const lessonSchema = {
  type: "object",
  required: ["slug", "level", "title", "summary", "sections"],
  properties: {
    slug: { type: "string", pattern: "^[a-z0-9-]+$" },
    level: { enum: ["Beginner", "Intermediate", "Advanced"] },
    title: {
      type: "object",
      required: ["fr"],
      properties: {
        fr: { type: "string" },
        tah: { type: "string" },
        en: { type: "string" }
      }
    },
    summary: { type: "string", minLength: 10 },
    sections: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        required: ["kind", "title"],
        properties: {
          kind: { enum: ["Objectives", "Vocabulary", "Practice", "Culture", "Assessment", "Review"] },
          title: { type: "string" },
          contentMd: { type: "string" },
          vocab: { type: "array" },
          exercises: { type: "array" }
        }
      }
    }
  }
};
```

## 4. TypeScript Type Definitions

### 4.1 Core Types

```typescript
export type LessonLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type SectionKind = 'Objectives' | 'Vocabulary' | 'Practice' | 'Culture' | 'Assessment' | 'Review';
export type ExerciseType = 'MCQ' | 'Match' | 'Ordering' | 'Dictation' | 'Pronunciation' | 'FillBlank' | 'Roleplay';

export interface TitleTriplet {
  fr: string;
  tah?: string;
  en?: string;
}

export interface VocabItem {
  fr: string;
  tah?: string;
  en?: string;
  ipaFr?: string;
  ipaTah?: string;
  note?: string;
  audioMediaId?: number;
  isCore?: boolean;
}

export interface Exercise {
  type: ExerciseType;
  prompt: string;
  data: Record<string, unknown>;
  solution?: Record<string, unknown>;
  points?: number;
}

export interface LessonSection {
  kind: SectionKind;
  title: string;
  contentMd?: string;
  vocab?: VocabItem[];
  exercises?: Exercise[];
}

export interface Lesson {
  slug: string;
  level: LessonLevel;
  title: TitleTriplet;
  summary: string;
  durationMin?: number;
  sections: LessonSection[];
  tags?: string[];
  version?: number;
}

export interface UserProgress {
  userId: number;
  lessonId: number;
  sectionKind: SectionKind;
  completed: boolean;
  score: number;
  attempts: number;
  updatedAt: number;
}

export interface MediaAsset {
  id: number;
  kind: 'image' | 'audio' | 'video';
  filePath: string;
  alt?: string;
  durationMs?: number;
  rights?: string;
  sha256?: string;
}
```

## 5. Information Architecture & Routing

### 5.1 Route Structure

```
/ (Home)
├── Featured lessons carousel
├── Resume last lesson CTA
├── Quick stats dashboard
└── Cultural highlights

/lessons (Lesson Grid)
├── Filter by level, theme, tags
├── Client-side search (MiniSearch)
├── Grid view with progress indicators
└── Sorting options

/lessons/[slug] (Lesson Runtime)
├── Header with hero, difficulty, duration
├── Tabs: Overview, Vocabulary, Practice, Culture, Review
├── Right drawer: Progress, notes, streak
└── Sequential unlock flow

/practice (Global Practice)
├── SRS queue management
├── Listening/speaking drills
├── Quick review sessions
└── Cross-lesson exercises

/progress (User Analytics)
├── Per-lesson completion stats
├── Streak tracking
├── Time spent analytics
└── Achievement badges

/about (Methodology)
├── Cultural approach explanation
├── Privacy policy (local-only)
├── Accessibility features
└── Technical credits
```

### 5.2 Next.js App Router Implementation

```typescript
// app/lib/lessons.ts
export async function getLessonSlugs(): Promise<string[]> {
  const res = await fetch('/data/lessons/index.json', { cache: 'force-cache' });
  return res.json();
}

export async function getLesson(slug: string): Promise<Lesson> {
  const res = await fetch(`/data/lessons/${slug}.json`, { cache: 'force-cache' });
  return res.json();
}

export async function getAllLessons(): Promise<Lesson[]> {
  const slugs = await getLessonSlugs();
  const lessons = await Promise.all(
    slugs.map(slug => getLesson(slug))
  );
  return lessons;
}

// app/lessons/[slug]/page.tsx
import { getLesson, getLessonSlugs } from '@/lib/lessons';
import { LessonRuntime } from '@/components/LessonRuntime';

export async function generateStaticParams() {
  const slugs = await getLessonSlugs();
  return slugs.map(slug => ({ slug }));
}

export default async function LessonPage({ 
  params 
}: { 
  params: { slug: string } 
}) {
  const lesson = await getLesson(params.slug);
  
  return (
    <main className="lesson-page">
      <LessonRuntime lesson={lesson} />
    </main>
  );
}
```

## 6. UX Design Specifications

### 6.1 Lesson Page Template

#### Header Component
```typescript
interface LessonHeaderProps {
  lesson: Lesson;
  currentLanguage: 'fr' | 'tah' | 'en';
  onLanguageToggle: (lang: 'fr' | 'tah' | 'en') => void;
  onStartLesson: () => void;
}

const LessonHeader: React.FC<LessonHeaderProps> = ({
  lesson,
  currentLanguage,
  onLanguageToggle,
  onStartLesson
}) => {
  return (
    <header className="lesson-header">
      <div className="hero-section">
        <div className="title-group">
          <h1 className="lesson-title">
            {lesson.title[currentLanguage]}
          </h1>
          <div className="language-toggle">
            <button 
              onClick={() => onLanguageToggle('fr')}
              className={currentLanguage === 'fr' ? 'active' : ''}
            >
              FR
            </button>
            <button 
              onClick={() => onLanguageToggle('tah')}
              className={currentLanguage === 'tah' ? 'active' : ''}
            >
              TAH
            </button>
            <button 
              onClick={() => onLanguageToggle('en')}
              className={currentLanguage === 'en' ? 'active' : ''}
            >
              EN
            </button>
          </div>
        </div>
        
        <div className="lesson-meta">
          <span className={`difficulty-chip ${lesson.level.toLowerCase()}`}>
            {lesson.level}
          </span>
          <span className="duration">
            {lesson.durationMin} min
          </span>
          <div className="tags">
            {lesson.tags?.map(tag => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        </div>
        
        <button 
          className="start-lesson-cta"
          onClick={onStartLesson}
        >
          Start Lesson
        </button>
      </div>
    </header>
  );
};
```

#### Tab Navigation
```typescript
interface TabNavigationProps {
  sections: LessonSection[];
  activeTab: SectionKind;
  onTabChange: (tab: SectionKind) => void;
  completedSections: Set<SectionKind>;
}

const TabNavigation: React.FC<TabNavigationProps> = ({
  sections,
  activeTab,
  onTabChange,
  completedSections
}) => {
  const tabOrder: SectionKind[] = [
    'Objectives', 'Vocabulary', 'Practice', 'Culture', 'Review'
  ];
  
  return (
    <nav className="tab-navigation" role="tablist">
      {tabOrder.map(tabKind => {
        const section = sections.find(s => s.kind === tabKind);
        if (!section) return null;
        
        const isCompleted = completedSections.has(tabKind);
        const isActive = activeTab === tabKind;
        
        return (
          <button
            key={tabKind}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tabKind}`}
            className={`tab ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
            onClick={() => onTabChange(tabKind)}
          >
            <span className="tab-icon">
              {isCompleted && <CheckIcon />}
            </span>
            <span className="tab-label">{section.title}</span>
          </button>
        );
      })}
    </nav>
  );
};
```

### 6.2 Tab Content Specifications

#### Overview Tab
- Lesson objectives with checkboxes
- Cultural context preview
- Estimated completion time
- Prerequisites (if any)

#### Vocabulary Tab
```typescript
const VocabularyTab: React.FC<{ vocab: VocabItem[] }> = ({ vocab }) => {
  return (
    <div className="vocabulary-tab">
      <div className="vocab-table">
        <table>
          <thead>
            <tr>
              <th>Français</th>
              <th>Tahitien</th>
              <th>English</th>
              <th>IPA</th>
              <th>Audio</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vocab.map((item, index) => (
              <tr key={index}>
                <td>{item.fr}</td>
                <td>{item.tah}</td>
                <td>{item.en}</td>
                <td className="ipa">{item.ipaTah}</td>
                <td>
                  <button className="audio-play">
                    <PlayIcon />
                  </button>
                </td>
                <td>
                  <button className="copy-to-phrasebook">
                    Add to Phrasebook
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
```

#### Practice Tab
- Interactive exercises (MCQ, Match, Ordering, etc.)
- Web Speech API integration for pronunciation
- Real-time feedback and scoring
- Progress tracking per exercise

#### Culture Tab
- Rich markdown content
- Cultural images and media
- Etiquette guidelines
- Historical context

#### Review Tab
- Flashcard interface
- SRS queue integration
- Quick assessment
- Lesson summary

### 6.3 Right Drawer (Progress Panel)
```typescript
const ProgressDrawer: React.FC<{ 
  lesson: Lesson;
  userProgress: UserProgress[];
  streak: number;
}> = ({ lesson, userProgress, streak }) => {
  return (
    <aside className="progress-drawer">
      <div className="progress-summary">
        <h3>Progress</h3>
        <div className="completion-ring">
          {/* Circular progress indicator */}
        </div>
        <p>{completedSections}/{totalSections} sections</p>
      </div>
      
      <div className="section-progress">
        {lesson.sections.map(section => {
          const progress = userProgress.find(
            p => p.sectionKind === section.kind
          );
          return (
            <div key={section.kind} className="section-item">
              <span className="section-name">{section.title}</span>
              <span className="section-status">
                {progress?.completed ? '✓' : '○'}
              </span>
              {progress?.score && (
                <span className="section-score">
                  {progress.score}%
                </span>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="streak-counter">
        <h4>Streak</h4>
        <span className="streak-number">{streak} days</span>
      </div>
      
      <div className="notes-section">
        <h4>Notes</h4>
        <textarea 
          placeholder="Add your notes..."
          className="lesson-notes"
        />
      </div>
    </aside>
  );
};
```

## 7. Local-First Data Architecture

### 7.1 Data Service Strategy

```typescript
// lib/data/DataService.ts
export interface DataService {
  getLessons(): Promise<Lesson[]>;
  getLesson(slug: string): Promise<Lesson | null>;
  getUserProgress(userId: number): Promise<UserProgress[]>;
  updateProgress(progress: UserProgress): Promise<void>;
  searchLessons(query: string): Promise<Lesson[]>;
}

// lib/data/JSONDataService.ts
export class JSONDataService implements DataService {
  private cache = new Map<string, Lesson>();
  
  async getLessons(): Promise<Lesson[]> {
    const response = await fetch('/data/lessons/index.json');
    const slugs: string[] = await response.json();
    
    const lessons = await Promise.all(
      slugs.map(slug => this.getLesson(slug))
    );
    
    return lessons.filter(Boolean) as Lesson[];
  }
  
  async getLesson(slug: string): Promise<Lesson | null> {
    if (this.cache.has(slug)) {
      return this.cache.get(slug)!;
    }
    
    try {
      const response = await fetch(`/data/lessons/${slug}.json`);
      const lesson: Lesson = await response.json();
      this.cache.set(slug, lesson);
      return lesson;
    } catch (error) {
      console.error(`Failed to load lesson: ${slug}`, error);
      return null;
    }
  }
  
  async getUserProgress(userId: number): Promise<UserProgress[]> {
    const stored = localStorage.getItem(`progress_${userId}`);
    return stored ? JSON.parse(stored) : [];
  }
  
  async updateProgress(progress: UserProgress): Promise<void> {
    const existing = await this.getUserProgress(progress.userId);
    const index = existing.findIndex(
      p => p.lessonId === progress.lessonId && 
           p.sectionKind === progress.sectionKind
    );
    
    if (index >= 0) {
      existing[index] = progress;
    } else {
      existing.push(progress);
    }
    
    localStorage.setItem(
      `progress_${progress.userId}`, 
      JSON.stringify(existing)
    );
  }
  
  async searchLessons(query: string): Promise<Lesson[]> {
    const lessons = await this.getLessons();
    // Implement MiniSearch integration
    return lessons.filter(lesson => 
      lesson.title.fr.toLowerCase().includes(query.toLowerCase()) ||
      lesson.summary.toLowerCase().includes(query.toLowerCase())
    );
  }
}

// lib/data/SQLiteDataService.ts (Future implementation)
export class SQLiteDataService implements DataService {
  private db: Database | null = null;
  
  async init() {
    // Initialize sql.js or wa-sqlite
    // Load database from IndexedDB or create new
  }
  
  // Implement DataService interface with SQL queries
}
```

### 7.2 IndexedDB Caching Strategy

```typescript
// lib/cache/IndexedDBCache.ts
export class IndexedDBCache {
  private dbName = 'tahitian-tutor';
  private version = 1;
  
  async open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('lessons')) {
          db.createObjectStore('lessons', { keyPath: 'slug' });
        }
        
        if (!db.objectStoreNames.contains('progress')) {
          const progressStore = db.createObjectStore('progress', { 
            keyPath: ['userId', 'lessonId', 'sectionKind'] 
          });
          progressStore.createIndex('userId', 'userId');
        }
        
        if (!db.objectStoreNames.contains('media')) {
          db.createObjectStore('media', { keyPath: 'url' });
        }
      };
    });
  }
  
  async cacheLesson(lesson: Lesson): Promise<void> {
    const db = await this.open();
    const transaction = db.transaction(['lessons'], 'readwrite');
    const store = transaction.objectStore('lessons');
    await store.put(lesson);
  }
  
  async getCachedLesson(slug: string): Promise<Lesson | null> {
    const db = await this.open();
    const transaction = db.transaction(['lessons'], 'readonly');
    const store = transaction.objectStore('lessons');
    const result = await store.get(slug);
    return result || null;
  }
}
```

## 8. Accessibility & Performance

### 8.1 A11y Implementation

```typescript
// components/AccessibleLessonRuntime.tsx
const AccessibleLessonRuntime: React.FC<{ lesson: Lesson }> = ({ lesson }) => {
  const [activeTab, setActiveTab] = useState<SectionKind>('Objectives');
  const [highContrast, setHighContrast] = useState(false);
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey) {
        switch (event.key) {
          case '1':
            setActiveTab('Objectives');
            break;
          case '2':
            setActiveTab('Vocabulary');
            break;
          case '3':
            setActiveTab('Practice');
            break;
          case '4':
            setActiveTab('Culture');
            break;
          case '5':
            setActiveTab('Review');
            break;
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  return (
    <div 
      className={`lesson-runtime ${highContrast ? 'high-contrast' : ''}`}
      role="main"
      aria-label={`Lesson: ${lesson.title.fr}`}
    >
      {/* Accessibility toolbar */}
      <div className="a11y-toolbar">
        <button 
          onClick={() => setHighContrast(!highContrast)}
          aria-label="Toggle high contrast mode"
        >
          High Contrast
        </button>
        <button aria-label="Increase font size">
          A+
        </button>
        <button aria-label="Decrease font size">
          A-
        </button>
      </div>
      
      {/* Skip navigation */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      
      {/* ARIA live region for announcements */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
        id="announcements"
      />
      
      {/* Main content with proper ARIA labels */}
      <main id="main-content">
        {/* Lesson content */}
      </main>
    </div>
  );
};
```

### 8.2 Performance Optimization

```typescript
// lib/performance/LazyLoading.ts
export const LazyAudioPlayer = lazy(() => import('../components/AudioPlayer'));
export const LazyExerciseRunner = lazy(() => import('../components/ExerciseRunner'));
export const LazyPronunciationChecker = lazy(() => import('../components/PronunciationChecker'));

// components/OptimizedLessonPage.tsx
const OptimizedLessonPage: React.FC<{ lesson: Lesson }> = ({ lesson }) => {
  const [activeTab, setActiveTab] = useState<SectionKind>('Objectives');
  
  // Prefetch next lesson
  useEffect(() => {
    const prefetchNextLesson = async () => {
      // Logic to determine and prefetch next lesson
    };
    
    prefetchNextLesson();
  }, [lesson.slug]);
  
  // Code splitting by tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'Vocabulary':
        return (
          <Suspense fallback={<VocabularyTabSkeleton />}>
            <LazyVocabularyTab vocab={getVocabForSection(lesson)} />
          </Suspense>
        );
      case 'Practice':
        return (
          <Suspense fallback={<PracticeTabSkeleton />}>
            <LazyPracticeTab exercises={getExercisesForSection(lesson)} />
          </Suspense>
        );
      default:
        return <DefaultTabContent section={getCurrentSection(lesson, activeTab)} />;
    }
  };
  
  return (
    <div className="optimized-lesson-page">
      {renderTabContent()}
    </div>
  );
};
```

### 8.3 Service Worker for Offline Support

```typescript
// public/sw.js
const CACHE_NAME = 'tahitian-tutor-v1';
const STATIC_ASSETS = [
  '/',
  '/lessons',
  '/practice',
  '/progress',
  '/about'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  // Cache lesson JSON files
  if (event.request.url.includes('/data/lessons/')) {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response;
          }
          return fetch(event.request)
            .then(response => {
              const responseClone = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, responseClone));
              return response;
            });
        })
    );
  }
  
  // Cache audio files
  if (event.request.url.includes('/audio/')) {
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
  }
});
```

## 9. Migration Roadmap

### 9.1 Phase 1: Foundation (Weeks 1-2)

**Objectives:**
- Set up Next.js 14 App Router project
- Implement basic routing structure
- Create TypeScript type definitions
- Set up development environment

**Tasks:**
1. Initialize Next.js project with TypeScript
2. Configure Tailwind CSS for styling
3. Set up ESLint and Prettier
4. Create basic page structure (`/`, `/lessons`, `/lessons/[slug]`)
5. Implement core TypeScript interfaces
6. Set up basic layout components

**Deliverables:**
- Working Next.js application
- Basic routing and navigation
- Type-safe component structure
- Development tooling setup

### 9.2 Phase 2: Data Layer (Weeks 3-4)

**Objectives:**
- Implement JSON-based data service
- Create lesson data migration scripts
- Set up IndexedDB caching
- Implement search functionality

**Tasks:**
1. Create data service abstraction layer
2. Migrate existing lesson data to new JSON format
3. Implement IndexedDB caching strategy
4. Set up MiniSearch for client-side search
5. Create data validation with Ajv
6. Implement progress tracking in localStorage

**Deliverables:**
- Complete data service implementation
- Migrated lesson content (20 lessons)
- Working search functionality
- Local progress persistence

### 9.3 Phase 3: Core UX (Weeks 5-6)

**Objectives:**
- Implement lesson runtime interface
- Create tab navigation system
- Build vocabulary and practice components
- Add progress tracking UI

**Tasks:**
1. Build lesson header with language toggle
2. Implement tab navigation with persistence
3. Create vocabulary table with audio playback
4. Build exercise runner for different types
5. Implement progress drawer
6. Add cultural content rendering

**Deliverables:**
- Complete lesson runtime interface
- Working tab system
- Interactive vocabulary section
- Basic exercise functionality

### 9.4 Phase 4: Advanced Features (Weeks 7-8)

**Objectives:**
- Implement Web Speech API integration
- Add advanced exercise types
- Create SRS system
- Build analytics dashboard

**Tasks:**
1. Integrate Web Speech API for pronunciation
2. Implement roleplay and dictation exercises
3. Create spaced repetition system
4. Build progress analytics page
5. Add streak tracking
6. Implement achievement system

**Deliverables:**
- Speech recognition functionality
- Complete exercise suite
- SRS implementation
- User analytics dashboard

### 9.5 Phase 5: Accessibility & Performance (Weeks 9-10)

**Objectives:**
- Implement comprehensive A11y features
- Optimize performance and loading
- Add offline support
- Conduct testing and optimization

**Tasks:**
1. Add keyboard navigation support
2. Implement ARIA labels and roles
3. Create high contrast mode
4. Set up service worker for offline support
5. Implement code splitting and lazy loading
6. Add performance monitoring
7. Conduct accessibility audit
8. Optimize bundle size

**Deliverables:**
- WCAG 2.1 AA compliant interface
- Offline-capable application
- Optimized performance metrics
- Complete accessibility features

### 9.6 Phase 6: Cultural Integration (Weeks 11-12)

**Objectives:**
- Migrate existing cultural components
- Enhance cultural content presentation
- Add Tahitian design elements
- Integrate traditional patterns and animations

**Tasks:**
1. Port TahitianPatterns component to web
2. Migrate TahitianDancer animations
3. Enhance cultural notes with rich media
4. Add traditional color schemes
5. Implement cultural audio elements
6. Create immersive cultural experiences

**Deliverables:**
- Integrated cultural components
- Enhanced visual design
- Rich cultural content presentation
- Traditional Tahitian aesthetics

## 10. Integration with Existing Components

### 10.1 Cultural Component Migration

```typescript
// components/web/TahitianPatternsWeb.tsx
// Migrated from React Native TahitianPatterns
import React from 'react';

interface TahitianPatternWebProps {
  pattern: 'tiare' | 'wave' | 'tapa';
  size?: number;
  color?: string;
  animated?: boolean;
}

export const TahitianPatternWeb: React.FC<TahitianPatternWebProps> = ({
  pattern,
  size = 40,
  color = '#8B4513',
  animated = false
}) => {
  const getPatternPath = () => {
    switch (pattern) {
      case 'tiare':
        return 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z';
      case 'wave':
        return 'M2 12c0-2.21 1.79-4 4-4s4 1.79 4 4-1.79 4-4 4-4-1.79-4-4zm8 0c0-2.21 1.79-4 4-4s4 1.79 4 4-1.79 4-4 4-4-1.79-4-4z';
      case 'tapa':
        return 'M3 3h18v18H3V3zm2 2v14h14V5H5z';
      default:
        return '';
    }
  };
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`tahitian-pattern ${animated ? 'animate-pulse' : ''}`}
    >
      <path
        d={getPatternPath()}
        fill={color}
        className={animated ? 'animate-bounce' : ''}
      />
    </svg>
  );
};

// components/web/CulturalThemeProvider.tsx
export const CulturalThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const tahitianTheme = {
    colors: {
      primary: '#FF6B35',    // Sunset orange
      secondary: '#004E89',  // Ocean blue
      accent: '#FFD23F',     // Tropical yellow
      earth: '#8B4513',      // Traditional brown
      nature: '#228B22'      // Tropical green
    },
    fonts: {
      heading: 'Playfair Display, serif',
      body: 'Source Sans Pro, sans-serif'
    }
  };
  
  return (
    <div 
      className="cultural-theme"
      style={{
        '--color-primary': tahitianTheme.colors.primary,
        '--color-secondary': tahitianTheme.colors.secondary,
        '--color-accent': tahitianTheme.colors.accent,
        '--font-heading': tahitianTheme.fonts.heading,
        '--font-body': tahitianTheme.fonts.body
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
};
```

### 10.2 Audio Integration

```typescript
// components/AudioPlayer.tsx
// Enhanced version of existing TTS functionality
import React, { useState, useRef } from 'react';

interface AudioPlayerProps {
  text: string;
  language: 'fr' | 'tah';
  autoPlay?: boolean;
  showControls?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  text,
  language,
  autoPlay = false,
  showControls = true
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const playAudio = async () => {
    if (!text) return;
    
    setIsLoading(true);
    
    try {
      // Use Web Speech API for synthesis
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'fr' ? 'fr-FR' : 'fr-PF'; // Tahitian approximation
      utterance.rate = 0.8; // Slower for learning
      
      utterance.onstart = () => {
        setIsPlaying(true);
        setIsLoading(false);
      };
      
      utterance.onend = () => {
        setIsPlaying(false);
      };
      
      speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Audio playback failed:', error);
      setIsLoading(false);
    }
  };
  
  const stopAudio = () => {
    speechSynthesis.cancel();
    setIsPlaying(false);
  };
  
  return (
    <div className="audio-player">
      {showControls && (
        <button
          onClick={isPlaying ? stopAudio : playAudio}
          disabled={isLoading}
          className="audio-control-btn"
          aria-label={isPlaying ? 'Stop audio' : 'Play audio'}
        >
          {isLoading ? (
            <LoadingIcon className="animate-spin" />
          ) : isPlaying ? (
            <StopIcon />
          ) : (
            <PlayIcon />
          )}
        </button>
      )}
      
      <span className="audio-text">{text}</span>
    </div>
  );
};
```

## 11. Conclusion

This production-ready architecture transforms the Tahitian French Tutor from a React Native/Expo application into a comprehensive, web-first educational platform. The design prioritizes:

- **Local-first approach** with no external dependencies
- **Accessibility compliance** for inclusive learning
- **Performance optimization** for smooth user experience
- **Cultural authenticity** through integrated design elements
- **Scalable architecture** for future enhancements
- **Type safety** throughout the application
- **Offline capability** for uninterrupted learning

The migration roadmap provides a structured approach to implementation, ensuring each phase builds upon the previous while maintaining functionality throughout the transition. The result will be a production-ready web application that preserves the cultural richness of the original while providing enhanced accessibility, performance, and user experience for classroom and individual learning scenarios.

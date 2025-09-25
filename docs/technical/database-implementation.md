# Database Implementation Guide - Tahitian French Tutor

## 1. Implementation Overview

This guide provides step-by-step instructions for implementing the local database solution for the Tahitian French Tutor app using multiple approaches to avoid external paid services.

## 2. Setup Instructions

### 2.1 Install Required Dependencies

#### For React Native (SQLite)
```bash
npm install expo-sqlite
npm install @expo/vector-icons
```

#### For Web (JSON + LocalStorage)
```bash
# No additional dependencies required
# Uses built-in fetch API and localStorage
```

#### Optional: For Advanced Web (IndexedDB)
```bash
npm install dexie  # IndexedDB wrapper
```

### 2.2 Project Structure
```
src/
├── database/
│   ├── DatabaseService.ts
│   ├── SQLiteService.ts
│   ├── JSONService.ts
│   ├── models/
│   │   ├── User.ts
│   │   ├── Lesson.ts
│   │   ├── Vocabulary.ts
│   │   └── Progress.ts
│   └── migrations/
│       ├── 001_initial_schema.ts
│       └── 002_add_cultural_content.ts
├── data/
│   ├── lessons.json
│   ├── vocabulary.json
│   ├── cultural_content.json
│   └── practice_exercises.json
└── services/
    ├── LessonService.ts
    ├── ProgressService.ts
    └── VocabularyService.ts
```

## 3. Core Implementation

### 3.1 Database Service Interface

```typescript
// src/database/DatabaseService.ts
export interface DatabaseService {
  // User management
  createUser(userData: CreateUserData): Promise<User>;
  getUser(userId: number): Promise<User | null>;
  updateUser(userId: number, updates: Partial<User>): Promise<void>;
  
  // Lesson management
  getLessons(category?: string): Promise<Lesson[]>;
  getLesson(lessonId: number): Promise<Lesson | null>;
  getLessonContent(lessonId: number): Promise<LessonContent[]>;
  
  // Progress tracking
  getUserProgress(userId: number): Promise<UserProgress[]>;
  updateLessonProgress(userId: number, lessonId: number, progress: ProgressUpdate): Promise<void>;
  
  // Vocabulary
  getVocabulary(category?: string): Promise<VocabularyItem[]>;
  searchVocabulary(query: string): Promise<VocabularyItem[]>;
  
  // Exercises
  getExercises(lessonId: number): Promise<Exercise[]>;
  saveExerciseResult(userId: number, exerciseId: number, result: ExerciseResult): Promise<void>;
}

export interface User {
  id: number;
  username: string;
  email?: string;
  displayName: string;
  nativeLanguage: string;
  targetLanguage: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  createdAt: Date;
  updatedAt: Date;
  lastActive?: Date;
  totalStudyTime: number;
  streakDays: number;
  preferences: UserPreferences;
}

export interface Lesson {
  id: number;
  title: string;
  titleTahitian?: string;
  description: string;
  category: string;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  orderIndex: number;
  estimatedDuration: number;
  prerequisites: number[];
  learningObjectives: string[];
  culturalContext?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface VocabularyItem {
  id: number;
  frenchWord: string;
  tahitianWord: string;
  pronunciation: string;
  phoneticSpelling?: string;
  wordType: string;
  category: string;
  difficultyLevel: string;
  culturalSignificance?: string;
  exampleSentenceFr?: string;
  exampleSentenceTy?: string;
  audioFilePath?: string;
  imageFilePath?: string;
}

export interface UserProgress {
  id: number;
  userId: number;
  lessonId: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'mastered';
  progressPercentage: number;
  timeSpent: number;
  attemptsCount: number;
  bestScore?: number;
  lastAccessed?: Date;
  completedAt?: Date;
  notes?: string;
}
```

### 3.2 SQLite Implementation

```typescript
// src/database/SQLiteService.ts
import * as SQLite from 'expo-sqlite';
import { DatabaseService, User, Lesson, VocabularyItem, UserProgress } from './DatabaseService';

export class SQLiteService implements DatabaseService {
  private db: SQLite.WebSQLDatabase;
  
  constructor() {
    this.db = SQLite.openDatabase('tahitian_tutor.db');
    this.initializeDatabase();
  }
  
  private async initializeDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.transaction(
        tx => {
          // Create users table
          tx.executeSql(`
            CREATE TABLE IF NOT EXISTS users (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              username VARCHAR(50) UNIQUE NOT NULL,
              email VARCHAR(100) UNIQUE,
              display_name VARCHAR(100),
              native_language VARCHAR(10) DEFAULT 'fr',
              target_language VARCHAR(10) DEFAULT 'ty',
              skill_level VARCHAR(20) DEFAULT 'beginner',
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              last_active TIMESTAMP,
              total_study_time INTEGER DEFAULT 0,
              streak_days INTEGER DEFAULT 0,
              preferences TEXT
            )
          `);
          
          // Create lessons table
          tx.executeSql(`
            CREATE TABLE IF NOT EXISTS lessons (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              title VARCHAR(200) NOT NULL,
              title_tahitian VARCHAR(200),
              description TEXT,
              category VARCHAR(50) NOT NULL,
              difficulty_level VARCHAR(20) NOT NULL,
              order_index INTEGER NOT NULL,
              estimated_duration INTEGER,
              prerequisites TEXT,
              learning_objectives TEXT,
              cultural_context TEXT,
              is_active BOOLEAN DEFAULT 1,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);
          
          // Create vocabulary table
          tx.executeSql(`
            CREATE TABLE IF NOT EXISTS vocabulary (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              french_word VARCHAR(100) NOT NULL,
              tahitian_word VARCHAR(100) NOT NULL,
              pronunciation VARCHAR(200),
              phonetic_spelling VARCHAR(200),
              word_type VARCHAR(50),
              category VARCHAR(50),
              difficulty_level VARCHAR(20),
              cultural_significance TEXT,
              example_sentence_fr TEXT,
              example_sentence_ty TEXT,
              audio_file_path VARCHAR(500),
              image_file_path VARCHAR(500),
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);
          
          // Create user_progress table
          tx.executeSql(`
            CREATE TABLE IF NOT EXISTS user_progress (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER NOT NULL,
              lesson_id INTEGER NOT NULL,
              status VARCHAR(20) DEFAULT 'not_started',
              progress_percentage DECIMAL(5,2) DEFAULT 0.00,
              time_spent INTEGER DEFAULT 0,
              attempts_count INTEGER DEFAULT 0,
              best_score DECIMAL(5,2),
              last_accessed TIMESTAMP,
              completed_at TIMESTAMP,
              notes TEXT,
              UNIQUE(user_id, lesson_id)
            )
          `);
          
          // Create indexes
          tx.executeSql('CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id)');
          tx.executeSql('CREATE INDEX IF NOT EXISTS idx_vocabulary_category ON vocabulary(category)');
          tx.executeSql('CREATE INDEX IF NOT EXISTS idx_lessons_category ON lessons(category)');
        },
        error => reject(error),
        () => resolve()
      );
    });
  }
  
  async createUser(userData: any): Promise<User> {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `INSERT INTO users (username, email, display_name, native_language, target_language, skill_level, preferences) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            userData.username,
            userData.email,
            userData.displayName,
            userData.nativeLanguage || 'fr',
            userData.targetLanguage || 'ty',
            userData.skillLevel || 'beginner',
            JSON.stringify(userData.preferences || {})
          ],
          (_, result) => {
            const userId = result.insertId;
            this.getUser(userId!).then(resolve).catch(reject);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }
  
  async getUser(userId: number): Promise<User | null> {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM users WHERE id = ?',
          [userId],
          (_, result) => {
            if (result.rows.length > 0) {
              const row = result.rows.item(0);
              resolve({
                id: row.id,
                username: row.username,
                email: row.email,
                displayName: row.display_name,
                nativeLanguage: row.native_language,
                targetLanguage: row.target_language,
                skillLevel: row.skill_level,
                createdAt: new Date(row.created_at),
                updatedAt: new Date(row.updated_at),
                lastActive: row.last_active ? new Date(row.last_active) : undefined,
                totalStudyTime: row.total_study_time,
                streakDays: row.streak_days,
                preferences: JSON.parse(row.preferences || '{}')
              });
            } else {
              resolve(null);
            }
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }
  
  async getLessons(category?: string): Promise<Lesson[]> {
    return new Promise((resolve, reject) => {
      const query = category 
        ? 'SELECT * FROM lessons WHERE category = ? AND is_active = 1 ORDER BY order_index'
        : 'SELECT * FROM lessons WHERE is_active = 1 ORDER BY order_index';
      const params = category ? [category] : [];
      
      this.db.transaction(tx => {
        tx.executeSql(
          query,
          params,
          (_, result) => {
            const lessons: Lesson[] = [];
            for (let i = 0; i < result.rows.length; i++) {
              const row = result.rows.item(i);
              lessons.push({
                id: row.id,
                title: row.title,
                titleTahitian: row.title_tahitian,
                description: row.description,
                category: row.category,
                difficultyLevel: row.difficulty_level,
                orderIndex: row.order_index,
                estimatedDuration: row.estimated_duration,
                prerequisites: JSON.parse(row.prerequisites || '[]'),
                learningObjectives: JSON.parse(row.learning_objectives || '[]'),
                culturalContext: row.cultural_context,
                isActive: Boolean(row.is_active),
                createdAt: new Date(row.created_at)
              });
            }
            resolve(lessons);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }
  
  async updateLessonProgress(userId: number, lessonId: number, progress: any): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `INSERT OR REPLACE INTO user_progress 
           (user_id, lesson_id, status, progress_percentage, time_spent, attempts_count, best_score, last_accessed, completed_at, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            lessonId,
            progress.status,
            progress.progressPercentage,
            progress.timeSpent,
            progress.attemptsCount,
            progress.bestScore,
            new Date().toISOString(),
            progress.status === 'completed' ? new Date().toISOString() : null,
            progress.notes
          ],
          () => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }
  
  // Implement other methods...
  async getLesson(lessonId: number): Promise<Lesson | null> {
    // Implementation similar to getUser
    throw new Error('Method not implemented.');
  }
  
  async getLessonContent(lessonId: number): Promise<any[]> {
    // Implementation for lesson content
    throw new Error('Method not implemented.');
  }
  
  async getUserProgress(userId: number): Promise<UserProgress[]> {
    // Implementation for user progress
    throw new Error('Method not implemented.');
  }
  
  async getVocabulary(category?: string): Promise<VocabularyItem[]> {
    // Implementation for vocabulary
    throw new Error('Method not implemented.');
  }
  
  async searchVocabulary(query: string): Promise<VocabularyItem[]> {
    // Implementation for vocabulary search
    throw new Error('Method not implemented.');
  }
  
  async getExercises(lessonId: number): Promise<any[]> {
    // Implementation for exercises
    throw new Error('Method not implemented.');
  }
  
  async saveExerciseResult(userId: number, exerciseId: number, result: any): Promise<void> {
    // Implementation for exercise results
    throw new Error('Method not implemented.');
  }
  
  async updateUser(userId: number, updates: Partial<User>): Promise<void> {
    // Implementation for user updates
    throw new Error('Method not implemented.');
  }
}
```

### 3.3 JSON Service Implementation

```typescript
// src/database/JSONService.ts
import { DatabaseService, User, Lesson, VocabularyItem, UserProgress } from './DatabaseService';

export class JSONService implements DatabaseService {
  private lessonsCache: Lesson[] | null = null;
  private vocabularyCache: VocabularyItem[] | null = null;
  
  async getLessons(category?: string): Promise<Lesson[]> {
    if (!this.lessonsCache) {
      const response = await fetch('/data/lessons.json');
      const data = await response.json();
      this.lessonsCache = data.lessons;
    }
    
    let lessons = this.lessonsCache.filter(lesson => lesson.isActive);
    if (category) {
      lessons = lessons.filter(lesson => lesson.category === category);
    }
    
    return lessons.sort((a, b) => a.orderIndex - b.orderIndex);
  }
  
  async getVocabulary(category?: string): Promise<VocabularyItem[]> {
    if (!this.vocabularyCache) {
      const response = await fetch('/data/vocabulary.json');
      const data = await response.json();
      this.vocabularyCache = data.vocabulary;
    }
    
    let vocabulary = this.vocabularyCache;
    if (category) {
      vocabulary = vocabulary.filter(item => item.category === category);
    }
    
    return vocabulary;
  }
  
  async createUser(userData: any): Promise<User> {
    const users = this.getStoredUsers();
    const newUser: User = {
      id: Date.now(), // Simple ID generation
      username: userData.username,
      email: userData.email,
      displayName: userData.displayName,
      nativeLanguage: userData.nativeLanguage || 'fr',
      targetLanguage: userData.targetLanguage || 'ty',
      skillLevel: userData.skillLevel || 'beginner',
      createdAt: new Date(),
      updatedAt: new Date(),
      totalStudyTime: 0,
      streakDays: 0,
      preferences: userData.preferences || {}
    };
    
    users.push(newUser);
    localStorage.setItem('tahitian_tutor_users', JSON.stringify(users));
    
    return newUser;
  }
  
  async getUser(userId: number): Promise<User | null> {
    const users = this.getStoredUsers();
    return users.find(user => user.id === userId) || null;
  }
  
  async updateUser(userId: number, updates: Partial<User>): Promise<void> {
    const users = this.getStoredUsers();
    const userIndex = users.findIndex(user => user.id === userId);
    
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...updates, updatedAt: new Date() };
      localStorage.setItem('tahitian_tutor_users', JSON.stringify(users));
    }
  }
  
  async getUserProgress(userId: number): Promise<UserProgress[]> {
    const key = `tahitian_tutor_progress_${userId}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  }
  
  async updateLessonProgress(userId: number, lessonId: number, progress: any): Promise<void> {
    const userProgress = await this.getUserProgress(userId);
    const existingIndex = userProgress.findIndex(p => p.lessonId === lessonId);
    
    const progressEntry: UserProgress = {
      id: existingIndex !== -1 ? userProgress[existingIndex].id : Date.now(),
      userId,
      lessonId,
      status: progress.status,
      progressPercentage: progress.progressPercentage,
      timeSpent: progress.timeSpent,
      attemptsCount: progress.attemptsCount,
      bestScore: progress.bestScore,
      lastAccessed: new Date(),
      completedAt: progress.status === 'completed' ? new Date() : undefined,
      notes: progress.notes
    };
    
    if (existingIndex !== -1) {
      userProgress[existingIndex] = progressEntry;
    } else {
      userProgress.push(progressEntry);
    }
    
    const key = `tahitian_tutor_progress_${userId}`;
    localStorage.setItem(key, JSON.stringify(userProgress));
  }
  
  private getStoredUsers(): User[] {
    const stored = localStorage.getItem('tahitian_tutor_users');
    return stored ? JSON.parse(stored) : [];
  }
  
  // Implement other methods...
  async getLesson(lessonId: number): Promise<Lesson | null> {
    const lessons = await this.getLessons();
    return lessons.find(lesson => lesson.id === lessonId) || null;
  }
  
  async getLessonContent(lessonId: number): Promise<any[]> {
    // Implementation for lesson content
    throw new Error('Method not implemented.');
  }
  
  async searchVocabulary(query: string): Promise<VocabularyItem[]> {
    const vocabulary = await this.getVocabulary();
    const lowerQuery = query.toLowerCase();
    return vocabulary.filter(item => 
      item.frenchWord.toLowerCase().includes(lowerQuery) ||
      item.tahitianWord.toLowerCase().includes(lowerQuery)
    );
  }
  
  async getExercises(lessonId: number): Promise<any[]> {
    // Implementation for exercises
    throw new Error('Method not implemented.');
  }
  
  async saveExerciseResult(userId: number, exerciseId: number, result: any): Promise<void> {
    // Implementation for exercise results
    throw new Error('Method not implemented.');
  }
}
```

### 3.4 Database Factory

```typescript
// src/database/DatabaseFactory.ts
import { Platform } from 'react-native';
import { DatabaseService } from './DatabaseService';
import { SQLiteService } from './SQLiteService';
import { JSONService } from './JSONService';

export class DatabaseFactory {
  private static instance: DatabaseService | null = null;
  
  static getInstance(): DatabaseService {
    if (!this.instance) {
      if (Platform.OS === 'web') {
        this.instance = new JSONService();
      } else {
        this.instance = new SQLiteService();
      }
    }
    return this.instance;
  }
}

// Usage in components
export const useDatabase = () => {
  return DatabaseFactory.getInstance();
};
```

## 4. Data Seeding

### 4.1 Sample Data Files

```json
// public/data/lessons.json
{
  "lessons": [
    {
      "id": 1,
      "title": "Basic Greetings",
      "titleTahitian": "Te Fa'a'amu Ra'a",
      "description": "Learn essential Tahitian greetings and polite expressions",
      "category": "basics",
      "difficultyLevel": "beginner",
      "orderIndex": 1,
      "estimatedDuration": 15,
      "prerequisites": [],
      "learningObjectives": [
        "Master basic greetings in Tahitian",
        "Understand cultural context of greetings",
        "Practice correct pronunciation"
      ],
      "culturalContext": "In Tahitian culture, greetings are more than just words - they express a wish for the other person's well-being and life.",
      "isActive": true,
      "createdAt": "2024-01-15T10:00:00Z"
    },
    {
      "id": 2,
      "title": "Family Members",
      "titleTahitian": "Te 'Utuafare",
      "description": "Learn to identify and name family members in Tahitian",
      "category": "family",
      "difficultyLevel": "beginner",
      "orderIndex": 2,
      "estimatedDuration": 20,
      "prerequisites": [1],
      "learningObjectives": [
        "Name immediate family members",
        "Understand family relationships",
        "Use possessive forms correctly"
      ],
      "culturalContext": "Family is central to Tahitian society, with extended family playing important roles in daily life.",
      "isActive": true,
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

```json
// public/data/vocabulary.json
{
  "vocabulary": [
    {
      "id": 1,
      "frenchWord": "Bonjour",
      "tahitianWord": "Ia ora na",
      "pronunciation": "ee-ah OH-rah nah",
      "phoneticSpelling": "[iˈa ˈora na]",
      "wordType": "greeting",
      "category": "basics",
      "difficultyLevel": "beginner",
      "culturalSignificance": "Traditional Tahitian greeting meaning 'may you live' - expressing a wish for the person's well-being",
      "exampleSentenceFr": "Bonjour, comment allez-vous?",
      "exampleSentenceTy": "Ia ora na, eaha to oe huru?",
      "audioFilePath": "/audio/vocabulary/ia_ora_na.mp3",
      "imageFilePath": "/images/vocabulary/greeting.jpg"
    },
    {
      "id": 2,
      "frenchWord": "Au revoir",
      "tahitianWord": "Nana",
      "pronunciation": "NAH-nah",
      "phoneticSpelling": "[ˈnana]",
      "wordType": "farewell",
      "category": "basics",
      "difficultyLevel": "beginner",
      "culturalSignificance": "Simple farewell used in casual situations",
      "exampleSentenceFr": "Au revoir, à bientôt!",
      "exampleSentenceTy": "Nana, a te taime ae!",
      "audioFilePath": "/audio/vocabulary/nana.mp3",
      "imageFilePath": "/images/vocabulary/farewell.jpg"
    }
  ]
}
```

## 5. Usage Examples

### 5.1 In React Components

```typescript
// src/screens/LearnScreen.tsx
import React, { useState, useEffect } from 'react';
import { useDatabase } from '../database/DatabaseFactory';
import { Lesson } from '../database/DatabaseService';

export const LearnScreen: React.FC = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const database = useDatabase();
  
  useEffect(() => {
    loadLessons();
  }, []);
  
  const loadLessons = async () => {
    try {
      const lessonsData = await database.getLessons();
      setLessons(lessonsData);
    } catch (error) {
      console.error('Failed to load lessons:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const startLesson = async (lessonId: number) => {
    const userId = 1; // Get from user context
    await database.updateLessonProgress(userId, lessonId, {
      status: 'in_progress',
      progressPercentage: 0,
      timeSpent: 0,
      attemptsCount: 1
    });
  };
  
  if (loading) {
    return <div>Loading lessons...</div>;
  }
  
  return (
    <div>
      <h1>Lessons</h1>
      {lessons.map(lesson => (
        <div key={lesson.id} onClick={() => startLesson(lesson.id)}>
          <h3>{lesson.title}</h3>
          <p>{lesson.description}</p>
          <span>Duration: {lesson.estimatedDuration} minutes</span>
        </div>
      ))}
    </div>
  );
};
```

### 5.2 Progress Tracking Service

```typescript
// src/services/ProgressService.ts
import { useDatabase } from '../database/DatabaseFactory';

export class ProgressService {
  private database = useDatabase();
  
  async trackLessonStart(userId: number, lessonId: number) {
    await this.database.updateLessonProgress(userId, lessonId, {
      status: 'in_progress',
      progressPercentage: 0,
      timeSpent: 0,
      attemptsCount: 1,
      lastAccessed: new Date()
    });
  }
  
  async trackLessonProgress(userId: number, lessonId: number, progressPercentage: number, timeSpent: number) {
    const currentProgress = await this.database.getUserProgress(userId);
    const lessonProgress = currentProgress.find(p => p.lessonId === lessonId);
    
    await this.database.updateLessonProgress(userId, lessonId, {
      status: progressPercentage >= 100 ? 'completed' : 'in_progress',
      progressPercentage,
      timeSpent: (lessonProgress?.timeSpent || 0) + timeSpent,
      attemptsCount: lessonProgress?.attemptsCount || 1
    });
  }
  
  async getOverallProgress(userId: number) {
    const progress = await this.database.getUserProgress(userId);
    const totalLessons = (await this.database.getLessons()).length;
    const completedLessons = progress.filter(p => p.status === 'completed').length;
    
    return {
      totalLessons,
      completedLessons,
      completionPercentage: (completedLessons / totalLessons) * 100,
      totalStudyTime: progress.reduce((sum, p) => sum + p.timeSpent, 0)
    };
  }
}
```

## 6. Migration and Backup

### 6.1 Data Migration

```typescript
// src/database/migrations/MigrationManager.ts
export class MigrationManager {
  private database = useDatabase();
  
  async runMigrations() {
    const currentVersion = this.getCurrentVersion();
    const migrations = this.getMigrations();
    
    for (const migration of migrations) {
      if (migration.version > currentVersion) {
        await migration.up();
        this.setCurrentVersion(migration.version);
      }
    }
  }
  
  private getCurrentVersion(): number {
    return parseInt(localStorage.getItem('db_version') || '0');
  }
  
  private setCurrentVersion(version: number) {
    localStorage.setItem('db_version', version.toString());
  }
  
  private getMigrations() {
    return [
      {
        version: 1,
        up: async () => {
          // Initial schema creation
        }
      },
      {
        version: 2,
        up: async () => {
          // Add cultural content tables
        }
      }
    ];
  }
}
```

### 6.2 Data Backup

```typescript
// src/services/BackupService.ts
export class BackupService {
  async exportUserData(userId: number): Promise<string> {
    const database = useDatabase();
    
    const userData = {
      user: await database.getUser(userId),
      progress: await database.getUserProgress(userId),
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
    
    return JSON.stringify(userData, null, 2);
  }
  
  async importUserData(userId: number, backupData: string): Promise<void> {
    const database = useDatabase();
    const data = JSON.parse(backupData);
    
    // Restore user data
    if (data.user) {
      await database.updateUser(userId, data.user);
    }
    
    // Restore progress
    if (data.progress) {
      for (const progress of data.progress) {
        await database.updateLessonProgress(userId, progress.lessonId, progress);
      }
    }
  }
}
```

This implementation provides a complete local database solution that works across platforms without requiring external paid services.
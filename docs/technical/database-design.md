# Tahitian French Tutor - Database Design

## 1. Database Overview

This document outlines a comprehensive local database design for the Tahitian French Tutor app that can be implemented without external paid services. The design supports SQLite for native apps and JSON files/LocalStorage for web applications.

**Key Requirements:**
- Store lesson plans and educational content
- Track user progress and achievements
- Manage vocabulary and pronunciation data
- Store cultural content and multimedia references
- Handle user preferences and settings
- Support offline functionality

## 2. Database Architecture Options

### 2.1 SQLite (Recommended for Native Apps)
- **Pros:** ACID compliance, efficient queries, relational integrity
- **Cons:** Requires native SQLite support
- **Use Case:** React Native mobile apps

### 2.2 JSON Files + LocalStorage (Web Apps)
- **Pros:** No dependencies, works in browsers, easy to implement
- **Cons:** No complex queries, manual data management
- **Use Case:** Web-based Expo apps

### 2.3 IndexedDB (Advanced Web)
- **Pros:** Browser-native, supports complex queries, large storage
- **Cons:** More complex implementation
- **Use Case:** Advanced web applications

## 3. Database Schema Design

### 3.1 Core Tables/Collections

#### Users Table
```sql
CREATE TABLE users (
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
    preferences TEXT -- JSON string for user preferences
);
```

#### Lessons Table
```sql
CREATE TABLE lessons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(200) NOT NULL,
    title_tahitian VARCHAR(200),
    description TEXT,
    category VARCHAR(50) NOT NULL, -- 'basics', 'culture', 'dance', 'nature', 'family'
    difficulty_level VARCHAR(20) NOT NULL, -- 'beginner', 'intermediate', 'advanced'
    order_index INTEGER NOT NULL,
    estimated_duration INTEGER, -- in minutes
    prerequisites TEXT, -- JSON array of lesson IDs
    learning_objectives TEXT, -- JSON array of objectives
    cultural_context TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Vocabulary Table
```sql
CREATE TABLE vocabulary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    french_word VARCHAR(100) NOT NULL,
    tahitian_word VARCHAR(100) NOT NULL,
    pronunciation VARCHAR(200),
    phonetic_spelling VARCHAR(200),
    word_type VARCHAR(50), -- 'noun', 'verb', 'adjective', etc.
    category VARCHAR(50), -- 'family', 'nature', 'food', etc.
    difficulty_level VARCHAR(20),
    cultural_significance TEXT,
    example_sentence_fr TEXT,
    example_sentence_ty TEXT,
    audio_file_path VARCHAR(500),
    image_file_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Lesson Content Table
```sql
CREATE TABLE lesson_content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lesson_id INTEGER NOT NULL,
    content_type VARCHAR(50) NOT NULL, -- 'text', 'audio', 'video', 'exercise', 'vocabulary'
    content_order INTEGER NOT NULL,
    title VARCHAR(200),
    content_data TEXT, -- JSON string with content details
    media_file_path VARCHAR(500),
    is_interactive BOOLEAN DEFAULT 0,
    estimated_time INTEGER, -- in seconds
    FOREIGN KEY (lesson_id) REFERENCES lessons(id)
);
```

#### User Progress Table
```sql
CREATE TABLE user_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    lesson_id INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'not_started', -- 'not_started', 'in_progress', 'completed', 'mastered'
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    time_spent INTEGER DEFAULT 0, -- in seconds
    attempts_count INTEGER DEFAULT 0,
    best_score DECIMAL(5,2),
    last_accessed TIMESTAMP,
    completed_at TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (lesson_id) REFERENCES lessons(id),
    UNIQUE(user_id, lesson_id)
);
```

#### Practice Exercises Table
```sql
CREATE TABLE practice_exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lesson_id INTEGER,
    exercise_type VARCHAR(50) NOT NULL, -- 'multiple_choice', 'translation', 'pronunciation', 'matching'
    question_text TEXT NOT NULL,
    question_audio VARCHAR(500),
    correct_answer TEXT NOT NULL,
    wrong_answers TEXT, -- JSON array of incorrect options
    explanation TEXT,
    difficulty_level VARCHAR(20),
    points_value INTEGER DEFAULT 10,
    cultural_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id)
);
```

#### User Exercise Results Table
```sql
CREATE TABLE user_exercise_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    exercise_id INTEGER NOT NULL,
    user_answer TEXT,
    is_correct BOOLEAN NOT NULL,
    time_taken INTEGER, -- in seconds
    points_earned INTEGER DEFAULT 0,
    attempt_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (exercise_id) REFERENCES practice_exercises(id)
);
```

#### Cultural Content Table
```sql
CREATE TABLE cultural_content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(200) NOT NULL,
    title_tahitian VARCHAR(200),
    content_type VARCHAR(50), -- 'article', 'story', 'tradition', 'dance', 'music'
    description TEXT,
    full_content TEXT,
    historical_period VARCHAR(100),
    cultural_significance TEXT,
    related_vocabulary TEXT, -- JSON array of vocabulary IDs
    media_files TEXT, -- JSON array of file paths
    difficulty_level VARCHAR(20),
    tags TEXT, -- JSON array of tags
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### User Achievements Table
```sql
CREATE TABLE user_achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    achievement_type VARCHAR(50) NOT NULL, -- 'lesson_completed', 'streak', 'vocabulary_mastered'
    achievement_name VARCHAR(100) NOT NULL,
    description TEXT,
    points_awarded INTEGER DEFAULT 0,
    earned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 3.2 Indexes for Performance
```sql
-- User Progress Indexes
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_lesson_id ON user_progress(lesson_id);
CREATE INDEX idx_user_progress_status ON user_progress(status);

-- Vocabulary Indexes
CREATE INDEX idx_vocabulary_category ON vocabulary(category);
CREATE INDEX idx_vocabulary_difficulty ON vocabulary(difficulty_level);
CREATE INDEX idx_vocabulary_french ON vocabulary(french_word);
CREATE INDEX idx_vocabulary_tahitian ON vocabulary(tahitian_word);

-- Lesson Content Indexes
CREATE INDEX idx_lesson_content_lesson_id ON lesson_content(lesson_id);
CREATE INDEX idx_lesson_content_type ON lesson_content(content_type);
CREATE INDEX idx_lesson_content_order ON lesson_content(lesson_id, content_order);

-- Exercise Results Indexes
CREATE INDEX idx_exercise_results_user_id ON user_exercise_results(user_id);
CREATE INDEX idx_exercise_results_exercise_id ON user_exercise_results(exercise_id);
CREATE INDEX idx_exercise_results_date ON user_exercise_results(attempt_date);
```

## 4. JSON File Structure (Web Alternative)

### 4.1 File Organization
```
data/
├── users.json
├── lessons.json
├── vocabulary.json
├── cultural_content.json
├── practice_exercises.json
└── user_data/
    ├── {user_id}_progress.json
    ├── {user_id}_results.json
    └── {user_id}_achievements.json
```

### 4.2 Sample JSON Structures

#### lessons.json
```json
{
  "lessons": [
    {
      "id": 1,
      "title": "Basic Greetings",
      "title_tahitian": "Te Fa'a'amu Ra'a",
      "description": "Learn essential Tahitian greetings",
      "category": "basics",
      "difficulty_level": "beginner",
      "order_index": 1,
      "estimated_duration": 15,
      "prerequisites": [],
      "learning_objectives": [
        "Master basic greetings",
        "Understand cultural context",
        "Practice pronunciation"
      ],
      "cultural_context": "Greetings in Tahitian culture...",
      "content": [
        {
          "type": "text",
          "order": 1,
          "title": "Introduction",
          "content": "Welcome to Tahitian greetings..."
        },
        {
          "type": "vocabulary",
          "order": 2,
          "vocabulary_ids": [1, 2, 3, 4]
        },
        {
          "type": "exercise",
          "order": 3,
          "exercise_ids": [1, 2, 3]
        }
      ],
      "is_active": true,
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

#### vocabulary.json
```json
{
  "vocabulary": [
    {
      "id": 1,
      "french_word": "Bonjour",
      "tahitian_word": "Ia ora na",
      "pronunciation": "ee-ah OH-rah nah",
      "phonetic_spelling": "[iˈa ˈora na]",
      "word_type": "greeting",
      "category": "basics",
      "difficulty_level": "beginner",
      "cultural_significance": "Traditional Tahitian greeting meaning 'may you live'",
      "example_sentence_fr": "Bonjour, comment allez-vous?",
      "example_sentence_ty": "Ia ora na, eaha to oe huru?",
      "audio_file_path": "/audio/vocabulary/ia_ora_na.mp3",
      "image_file_path": "/images/vocabulary/greeting.jpg"
    }
  ]
}
```

## 5. Implementation Strategy

### 5.1 For React Native (SQLite)
```javascript
// Install: expo install expo-sqlite
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('tahitian_tutor.db');

// Initialize database
const initDatabase = () => {
  db.transaction(tx => {
    // Create tables
    tx.executeSql(CREATE_USERS_TABLE);
    tx.executeSql(CREATE_LESSONS_TABLE);
    // ... other tables
  });
};
```

### 5.2 For Web (JSON + LocalStorage)
```javascript
// Data service for web
class DataService {
  async loadLessons() {
    const response = await fetch('/data/lessons.json');
    return response.json();
  }
  
  saveUserProgress(userId, progressData) {
    const key = `user_${userId}_progress`;
    localStorage.setItem(key, JSON.stringify(progressData));
  }
  
  getUserProgress(userId) {
    const key = `user_${userId}_progress`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : {};
  }
}
```

### 5.3 Hybrid Approach (Recommended)
```javascript
// Database abstraction layer
class DatabaseService {
  constructor() {
    this.isNative = Platform.OS !== 'web';
    this.db = this.isNative ? SQLite.openDatabase('tahitian_tutor.db') : null;
  }
  
  async getLessons() {
    if (this.isNative) {
      return this.getSQLiteLessons();
    } else {
      return this.getJSONLessons();
    }
  }
  
  async saveUserProgress(userId, lessonId, progress) {
    if (this.isNative) {
      return this.saveSQLiteProgress(userId, lessonId, progress);
    } else {
      return this.saveLocalStorageProgress(userId, lessonId, progress);
    }
  }
}
```

## 6. Data Migration and Seeding

### 6.1 Initial Data Population
```javascript
const seedData = {
  lessons: [
    {
      title: "Basic Greetings",
      title_tahitian: "Te Fa'a'amu Ra'a",
      category: "basics",
      difficulty_level: "beginner",
      // ... lesson data
    }
  ],
  vocabulary: [
    {
      french_word: "Bonjour",
      tahitian_word: "Ia ora na",
      pronunciation: "ee-ah OH-rah nah",
      // ... vocabulary data
    }
  ]
};

const seedDatabase = async () => {
  // Populate initial lessons and vocabulary
  for (const lesson of seedData.lessons) {
    await DatabaseService.createLesson(lesson);
  }
};
```

### 6.2 Data Backup and Sync
```javascript
// Export user data for backup
const exportUserData = async (userId) => {
  const userData = {
    progress: await DatabaseService.getUserProgress(userId),
    achievements: await DatabaseService.getUserAchievements(userId),
    preferences: await DatabaseService.getUserPreferences(userId)
  };
  
  return JSON.stringify(userData, null, 2);
};

// Import user data from backup
const importUserData = async (userId, backupData) => {
  const data = JSON.parse(backupData);
  await DatabaseService.restoreUserProgress(userId, data.progress);
  await DatabaseService.restoreUserAchievements(userId, data.achievements);
  await DatabaseService.restoreUserPreferences(userId, data.preferences);
};
```

## 7. Performance Optimization

### 7.1 Caching Strategy
- Cache frequently accessed lessons in memory
- Lazy load lesson content and media files
- Implement progressive data loading

### 7.2 Storage Optimization
- Compress large text content
- Use efficient data types
- Implement data cleanup for old exercise results

### 7.3 Query Optimization
- Use appropriate indexes
- Batch database operations
- Implement pagination for large datasets

## 8. Security Considerations

### 8.1 Data Protection
- Encrypt sensitive user data
- Validate all input data
- Implement proper error handling

### 8.2 Privacy
- Store minimal personal information
- Implement data deletion capabilities
- Follow GDPR compliance guidelines

This database design provides a comprehensive foundation for the Tahitian French Tutor app that can be implemented locally without external dependencies or paid services.
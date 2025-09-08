// Data service interfaces for local-first architecture

import {
  Lesson,
  UserProgress,
  MediaAsset,
  User,
  Tag,
  VocabItem,
  SearchFilters,
  LessonSearchResult,
  ApiResponse,
  Course,
  AdminActivityLog,
  AdminDashboardStats
} from '../../types';

/**
 * Abstract base class for data services
 * Supports both local JSON files and future database implementations
 */
export abstract class DataService {
  abstract getLessons(filters?: SearchFilters): Promise<Lesson[]>;
  abstract getLessonBySlug(slug: string): Promise<Lesson | null>;
  abstract searchLessons(query: string, filters?: SearchFilters): Promise<LessonSearchResult[]>;
  
  abstract getUserProgress(userId: number, lessonId?: number): Promise<UserProgress[]>;
  abstract updateUserProgress(progress: Omit<UserProgress, 'updatedAt'>): Promise<void>;
  
  abstract getMediaAsset(id: number): Promise<MediaAsset | null>;
  abstract getMediaAssets(ids: number[]): Promise<MediaAsset[]>;
  
  abstract getUser(id: number): Promise<User | null>;
  abstract createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User>;
  
  abstract getTags(): Promise<Tag[]>;
  abstract getAppSettings(): Promise<Record<string, string>>;
  abstract updateAppSetting(key: string, value: string): Promise<void>;
  
  // Cache management
  abstract clearCache(): Promise<void>;
  abstract syncData(): Promise<void>;
  
  // Generic CRUD operations
  abstract create<T>(collection: string, data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  abstract getById<T>(collection: string, id: string | number): Promise<T | null>;
  abstract query<T>(collection: string, filters: Record<string, any>): Promise<T[]>;
  abstract update<T>(collection: string, id: string | number, data: Partial<T>): Promise<T>;
  abstract delete(collection: string, id: string | number): Promise<void>;
  
  // Admin methods
  abstract createCourse(course: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>): Promise<Course>;
  abstract updateCourse(id: number, updates: Partial<Course>): Promise<Course>;
  abstract deleteCourse(id: number): Promise<void>;
  abstract getCourses(filters?: { level?: string; category?: string; status?: string }): Promise<Course[]>;
  abstract getCourse(id: number): Promise<Course | null>;
  abstract bulkImportCourses(courses: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<Course[]>;
  abstract searchCourses(query: string): Promise<Course[]>;
  abstract getAdminStats(): Promise<AdminDashboardStats>;
  abstract getActivityLogs(limit?: number): Promise<AdminActivityLog[]>;
  abstract createCourseVersion(courseId: number, version: number): Promise<void>;
  abstract restoreCourseVersion(courseId: number, version: number): Promise<Course>;
}

/**
 * Local storage utilities for user data persistence
 */
export class LocalStorageService {
  private static readonly STORAGE_KEYS = {
    USER_PROGRESS: 'tahitian-tutor-progress',
    USER_SETTINGS: 'tahitian-tutor-settings',
    LESSON_CACHE: 'tahitian-tutor-lessons',
    LAST_SYNC: 'tahitian-tutor-last-sync'
  } as const;

  static getUserProgress(userId: number): UserProgress[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.USER_PROGRESS);
      if (!data) return [];
      
      const allProgress = JSON.parse(data) as Record<string, UserProgress[]>;
      return allProgress[userId.toString()] || [];
    } catch (error) {
      console.error('Error reading user progress from localStorage:', error);
      return [];
    }
  }

  static saveUserProgress(userId: number, progress: UserProgress[]): void {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.USER_PROGRESS);
      const allProgress = data ? JSON.parse(data) : {};
      
      allProgress[userId.toString()] = progress;
      localStorage.setItem(this.STORAGE_KEYS.USER_PROGRESS, JSON.stringify(allProgress));
    } catch (error) {
      console.error('Error saving user progress to localStorage:', error);
    }
  }

  static getUserSettings(): Record<string, unknown> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.USER_SETTINGS);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error reading user settings from localStorage:', error);
      return {};
    }
  }

  static saveUserSettings(settings: Record<string, unknown>): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.USER_SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving user settings to localStorage:', error);
    }
  }

  static getLessonCache(): Record<string, Lesson> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.LESSON_CACHE);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error reading lesson cache from localStorage:', error);
      return {};
    }
  }

  static saveLessonCache(cache: Record<string, Lesson>): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.LESSON_CACHE, JSON.stringify(cache));
    } catch (error) {
      console.error('Error saving lesson cache to localStorage:', error);
    }
  }

  static getLastSyncTimestamp(): number {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.LAST_SYNC);
      return data ? parseInt(data, 10) : 0;
    } catch (error) {
      console.error('Error reading last sync timestamp from localStorage:', error);
      return 0;
    }
  }

  static saveLastSyncTimestamp(timestamp: number): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.LAST_SYNC, timestamp.toString());
    } catch (error) {
      console.error('Error saving last sync timestamp to localStorage:', error);
    }
  }

  static clearAll(): void {
    try {
      Object.values(this.STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
}

/**
 * Error classes for data service operations
 */
export class DataServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'DataServiceError';
  }
}

export class LessonNotFoundError extends DataServiceError {
  constructor(slug: string) {
    super(`Lesson not found: ${slug}`, 'LESSON_NOT_FOUND', { slug });
    this.name = 'LessonNotFoundError';
  }
}

export class MediaAssetNotFoundError extends DataServiceError {
  constructor(id: number) {
    super(`Media asset not found: ${id}`, 'MEDIA_NOT_FOUND', { id });
    this.name = 'MediaAssetNotFoundError';
  }
}

export class DataNotFoundError extends DataServiceError {
  constructor(message: string) {
    super(message, 'DATA_NOT_FOUND');
    this.name = 'DataNotFoundError';
  }
}

/**
 * Local JSON file data service implementation
 */
export class LocalDataService extends DataService {
  private lessonCache = new Map<string, Lesson>();
  private mediaCache = new Map<number, MediaAsset>();
  private lastCacheUpdate = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async getLessons(filters?: SearchFilters): Promise<Lesson[]> {
    const cached = localStorage.getItem('lessons_cache');
    let lessons: Lesson[] = [];
    
    if (cached) {
      lessons = JSON.parse(cached);
    }
    
    if (filters) {
      lessons = lessons.filter(lesson => {
        if (filters.level && lesson.level !== filters.level) return false;
        if (filters.category && !lesson.tags.includes(filters.category)) return false;
        return true;
      });
    }
    
    return lessons;
  }

  async getLessonBySlug(slug: string): Promise<Lesson | null> {
    const lessons = await this.getLessons();
    return lessons.find(lesson => lesson.slug === slug) || null;
  }

  async searchLessons(query: string, filters?: SearchFilters): Promise<LessonSearchResult[]> {
    const lessons = await this.getLessons(filters);
    const lowercaseQuery = query.toLowerCase();
    
    return lessons
      .filter(lesson => 
        lesson.title.en.toLowerCase().includes(lowercaseQuery) ||
        lesson.title.fr.toLowerCase().includes(lowercaseQuery) ||
        lesson.title.tah.toLowerCase().includes(lowercaseQuery) ||
        lesson.summary.toLowerCase().includes(lowercaseQuery)
      )
      .map(lesson => ({
        lesson,
        score: this.calculateRelevanceScore(lesson, query),
        highlights: this.getHighlights(lesson, query)
      }))
      .sort((a, b) => b.score - a.score);
  }

  async getUserProgress(userId: number, lessonId?: number): Promise<UserProgress[]> {
    const key = `user_progress_${userId}`;
    const stored = localStorage.getItem(key);
    let progress: UserProgress[] = stored ? JSON.parse(stored) : [];
    
    if (lessonId) {
      progress = progress.filter(p => p.lessonId === lessonId);
    }
    
    return progress;
  }

  async updateUserProgress(progress: Omit<UserProgress, 'updatedAt'>): Promise<void> {
    const userProgress = await this.getUserProgress(progress.userId);
    const existingIndex = userProgress.findIndex(
      p => p.lessonId === progress.lessonId && p.sectionKind === progress.sectionKind
    );
    
    const updatedProgress: UserProgress = {
      ...progress,
      updatedAt: Date.now()
    };
    
    if (existingIndex >= 0) {
      userProgress[existingIndex] = updatedProgress;
    } else {
      userProgress.push(updatedProgress);
    }
    
    const key = `user_progress_${progress.userId}`;
    localStorage.setItem(key, JSON.stringify(userProgress));
  }

  async getMediaAsset(id: number): Promise<MediaAsset | null> {
    const cached = localStorage.getItem(`media_asset_${id}`);
    return cached ? JSON.parse(cached) : null;
  }

  async getMediaAssets(ids: number[]): Promise<MediaAsset[]> {
    const assets: MediaAsset[] = [];
    
    for (const id of ids) {
      const asset = await this.getMediaAsset(id);
      if (asset) {
        assets.push(asset);
      }
    }
    
    return assets;
  }

  async getUser(id: number): Promise<User | null> {
    const cached = localStorage.getItem(`user_${id}`);
    return cached ? JSON.parse(cached) : null;
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const newUser: User = {
      ...userData,
      id: Date.now(),
      createdAt: Date.now()
    };
    
    localStorage.setItem(`user_${newUser.id}`, JSON.stringify(newUser));
    return newUser;
  }

  async getTags(): Promise<Tag[]> {
    const cached = localStorage.getItem('tags_cache');
    return cached ? JSON.parse(cached) : [];
  }

  async getAppSettings(): Promise<Record<string, string>> {
    const cached = localStorage.getItem('app_settings');
    return cached ? JSON.parse(cached) : {};
  }

  async updateAppSetting(key: string, value: string): Promise<void> {
    const settings = await this.getAppSettings();
    settings[key] = value;
    localStorage.setItem('app_settings', JSON.stringify(settings));
  }

  async updateUserSettings(userId: number, settings: any): Promise<void> {
    const key = `user_settings_${userId}`;
    localStorage.setItem(key, JSON.stringify(settings));
  }

  async clearCache(): Promise<void> {
    // Clear all cached data
    const keys = Object.keys(localStorage).filter(key => 
      key.startsWith('lessons_') || 
      key.startsWith('lesson_') ||
      key.startsWith('user_progress_') ||
      key.startsWith('user_settings_') ||
      key.startsWith('courses_') ||
      key.startsWith('course_')
    );
    keys.forEach(key => localStorage.removeItem(key));
  }

  async syncData(): Promise<void> {
    // In a real implementation, this would sync with a remote server
    console.log('Syncing data with server...');
  }

  // Generic CRUD operations implementation
  async create<T>(collection: string, data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const items = await this.query<T>(collection, {});
    const newItem = {
      ...data,
      id: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    } as T;
    
    items.push(newItem);
    localStorage.setItem(`${collection}_cache`, JSON.stringify(items));
    return newItem;
  }

  async getById<T>(collection: string, id: string | number): Promise<T | null> {
    const items = await this.query<T>(collection, {});
    return items.find((item: any) => item.id === id) || null;
  }

  async query<T>(collection: string, filters: Record<string, any>): Promise<T[]> {
    const cached = localStorage.getItem(`${collection}_cache`);
    let items: T[] = cached ? JSON.parse(cached) : [];
    
    // Apply filters
    if (Object.keys(filters).length > 0) {
      items = items.filter((item: any) => {
        return Object.entries(filters).every(([key, value]) => {
          if (value === undefined || value === null) return true;
          return item[key] === value;
        });
      });
    }
    
    return items;
  }

  async update<T>(collection: string, id: string | number, data: Partial<T>): Promise<T> {
    const items = await this.query<T>(collection, {});
    const index = items.findIndex((item: any) => item.id === id);
    
    if (index === -1) {
      throw new DataNotFoundError(`Item with id ${id} not found in ${collection}`);
    }
    
    const updatedItem = {
      ...items[index],
      ...data,
      updatedAt: Date.now()
    } as T;
    
    items[index] = updatedItem;
    localStorage.setItem(`${collection}_cache`, JSON.stringify(items));
    return updatedItem;
  }

  async delete(collection: string, id: string | number): Promise<void> {
    const items = await this.query(collection, {});
    const filteredItems = items.filter((item: any) => item.id !== id);
    localStorage.setItem(`${collection}_cache`, JSON.stringify(filteredItems));
  }

  // Admin method implementations
  async createCourse(courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>): Promise<Course> {
    const courses = await this.getCourses();
    const newCourse: Course = {
      ...courseData,
      id: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    courses.push(newCourse);
    localStorage.setItem('admin_courses', JSON.stringify(courses));
    
    // Log activity
    await this.logActivity({
       type: 'course_created',
       description: `Created course: ${newCourse.title.en}`,
       userId: newCourse.authorId,
       userName: 'Admin User'
     });
    
    return newCourse;
  }

  async updateCourse(id: number, updates: Partial<Course>): Promise<Course> {
    const courses = await this.getCourses();
    const courseIndex = courses.findIndex(c => c.id === id);
    
    if (courseIndex === -1) {
      throw new DataNotFoundError(`Course with id ${id} not found`);
    }
    
    const updatedCourse = {
      ...courses[courseIndex],
      ...updates,
      updatedAt: Date.now()
    };
    
    courses[courseIndex] = updatedCourse;
    localStorage.setItem('admin_courses', JSON.stringify(courses));
    
    // Log activity
    await this.logActivity({
       type: 'course_updated',
       description: `Updated course: ${updatedCourse.title.en}`,
       userId: updatedCourse.authorId,
       userName: 'Admin User'
     });
    
    return updatedCourse;
  }

  async deleteCourse(id: number): Promise<void> {
    const courses = await this.getCourses();
    const courseIndex = courses.findIndex(c => c.id === id);
    
    if (courseIndex === -1) {
      throw new DataNotFoundError(`Course with id ${id} not found`);
    }
    
    const deletedCourse = courses[courseIndex];
    courses.splice(courseIndex, 1);
    localStorage.setItem('admin_courses', JSON.stringify(courses));
    
    // Log activity
    await this.logActivity({
       type: 'course_deleted',
       description: `Deleted course: ${deletedCourse.title.en}`,
       userId: deletedCourse.authorId,
       userName: 'Admin User'
     });
  }

  async getCourses(filters?: { level?: string; category?: string; status?: string }): Promise<Course[]> {
    const stored = localStorage.getItem('admin_courses');
    let courses: Course[] = stored ? JSON.parse(stored) : this.getDefaultCourses();
    
    if (filters) {
      courses = courses.filter(course => {
        if (filters.level && course.level !== filters.level) return false;
        if (filters.category && course.category !== filters.category) return false;
        if (filters.status && course.status !== filters.status) return false;
        return true;
      });
    }
    
    return courses;
  }

  async getCourse(id: number): Promise<Course | null> {
    const courses = await this.getCourses();
    return courses.find(c => c.id === id) || null;
  }

  async bulkImportCourses(coursesData: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<Course[]> {
    const existingCourses = await this.getCourses();
    const newCourses: Course[] = coursesData.map((courseData, index) => ({
      ...courseData,
      id: Date.now() + index,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }));
    
    const allCourses = [...existingCourses, ...newCourses];
    localStorage.setItem('admin_courses', JSON.stringify(allCourses));
    
    // Log activity
    await this.logActivity({
       type: 'bulk_import',
       description: `Imported ${newCourses.length} courses`,
       userId: newCourses[0]?.authorId || 1,
       userName: 'Admin User'
     });
    
    return newCourses;
  }

  async searchCourses(query: string): Promise<Course[]> {
    const courses = await this.getCourses();
    const lowercaseQuery = query.toLowerCase();
    
    return courses.filter(course => 
      course.title.en.toLowerCase().includes(lowercaseQuery) ||
      course.title.fr.toLowerCase().includes(lowercaseQuery) ||
      course.title.tah.toLowerCase().includes(lowercaseQuery) ||
      course.description.toLowerCase().includes(lowercaseQuery) ||
      course.category.toLowerCase().includes(lowercaseQuery) ||
      course.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  async getAdminStats(): Promise<AdminDashboardStats> {
    const courses = await this.getCourses();
    const activityLogs = await this.getActivityLogs();
    
    return {
      totalCourses: courses.length,
      publishedCourses: courses.filter(c => c.status === 'published').length,
      draftCourses: courses.filter(c => c.status === 'draft').length,
      totalLessons: courses.reduce((sum, course) => sum + (course.lessons?.length || 0), 0),
      totalUsers: 150, // Mock data
      activeUsers: 45, // Mock data
      recentActivity: activityLogs.slice(0, 5)
    };
  }

  async getActivityLogs(limit: number = 50): Promise<AdminActivityLog[]> {
    const stored = localStorage.getItem('admin_activity_logs');
    const logs: AdminActivityLog[] = stored ? JSON.parse(stored) : [];
    return logs.slice(0, limit).sort((a, b) => b.timestamp - a.timestamp);
  }

  async createCourseVersion(courseId: number, version: number): Promise<void> {
    const course = await this.getCourse(courseId);
    if (!course) {
      throw new DataNotFoundError(`Course with id ${courseId} not found`);
    }
    
    const versions = this.getCourseVersions(courseId);
    versions.push({
      version,
      courseData: course,
      createdAt: Date.now()
    });
    
    localStorage.setItem(`course_versions_${courseId}`, JSON.stringify(versions));
  }

  async restoreCourseVersion(courseId: number, version: number): Promise<Course> {
    const versions = this.getCourseVersions(courseId);
    const versionData = versions.find(v => v.version === version);
    
    if (!versionData) {
      throw new DataNotFoundError(`Version ${version} not found for course ${courseId}`);
    }
    
    const restoredCourse = {
      ...versionData.courseData,
      updatedAt: Date.now(),
      version: version
    };
    
    await this.updateCourse(courseId, restoredCourse);
    return restoredCourse;
  }

  private getCourseVersions(courseId: number): any[] {
    const stored = localStorage.getItem(`course_versions_${courseId}`);
    return stored ? JSON.parse(stored) : [];
  }

  private async logActivity(activity: Omit<AdminActivityLog, 'id' | 'timestamp'>): Promise<void> {
    const stored = localStorage.getItem('admin_activity_logs');
    const logs: AdminActivityLog[] = stored ? JSON.parse(stored) : [];
    
    const newLog: AdminActivityLog = {
      ...activity,
      id: Date.now().toString(),
      timestamp: Date.now()
    };
    
    logs.unshift(newLog);
    // Keep only last 100 logs
    if (logs.length > 100) {
      logs.splice(100);
    }
    
    localStorage.setItem('admin_activity_logs', JSON.stringify(logs));
  }

  private getDefaultCourses(): Course[] {
    return [
      {
        id: 1,
        title: {
          en: "Basic Greetings",
          fr: "Salutations de Base",
          tah: "Te Hoê Tamaraa"
        },
        description: "Learn essential Tahitian greetings and polite expressions",
        level: "Beginner",
        category: "Communication",
        tags: ["greetings", "basic", "communication"],
        estimatedDuration: 30,
        learningObjectives: [
          "Master basic greetings",
          "Understand cultural context"
        ],
        status: "published",
        authorId: 1,
        createdAt: Date.now() - 86400000,
        updatedAt: Date.now() - 86400000,
        version: 1,
        lessons: [],
        mediaAssets: []
      },
      {
        id: 2,
        title: {
          en: "Family Members",
          fr: "Membres de la Famille",
          tah: "Te Utuafare"
        },
        description: "Learn vocabulary for family relationships in Tahitian culture",
        level: "Beginner",
        category: "Vocabulary",
        tags: ["family", "relationships", "culture"],
        estimatedDuration: 45,
        learningObjectives: [
          "Identify family members",
          "Understand family structure"
        ],
        status: "draft",
        authorId: 1,
        createdAt: Date.now() - 43200000,
        updatedAt: Date.now() - 43200000,
        version: 1,
        lessons: [],
        mediaAssets: []
      }
    ];
  }

  private calculateRelevanceScore(lesson: Lesson, query: string): number {
    const lowercaseQuery = query.toLowerCase();
    let score = 0;
    
    if (lesson.title.en.toLowerCase().includes(lowercaseQuery)) score += 10;
    if (lesson.title.fr.toLowerCase().includes(lowercaseQuery)) score += 10;
    if (lesson.title.tah.toLowerCase().includes(lowercaseQuery)) score += 10;
    if (lesson.summary.toLowerCase().includes(lowercaseQuery)) score += 5;
    
    return score;
  }

  private getHighlights(lesson: Lesson, query: string): string[] {
    const highlights: string[] = [];
    const lowercaseQuery = query.toLowerCase();
    
    if (lesson.title.en.toLowerCase().includes(lowercaseQuery)) {
      highlights.push(lesson.title.en);
    }
    if (lesson.summary.toLowerCase().includes(lowercaseQuery)) {
      highlights.push(lesson.summary);
    }
    
    return highlights;
  }
}

/**
 * Utility functions for data validation and transformation
 */
export class DataUtils {
  /**
   * Validates a lesson object against the expected schema
   */
  static validateLesson(lesson: unknown): lesson is Lesson {
    if (!lesson || typeof lesson !== 'object') return false;
    
    const l = lesson as Record<string, unknown>;
    return (
      typeof l.slug === 'string' &&
      typeof l.level === 'string' &&
      typeof l.title === 'object' &&
      typeof l.summary === 'string' &&
      Array.isArray(l.sections)
    );
  }

  /**
   * Validates user progress object
   */
  static validateUserProgress(progress: unknown): progress is UserProgress {
    if (!progress || typeof progress !== 'object') return false;
    
    const p = progress as Record<string, unknown>;
    return (
      typeof p.userId === 'number' &&
      typeof p.lessonId === 'number' &&
      typeof p.sectionKind === 'string' &&
      typeof p.completed === 'boolean' &&
      typeof p.score === 'number' &&
      typeof p.attempts === 'number' &&
      typeof p.updatedAt === 'number'
    );
  }

  /**
   * Sanitizes lesson slug for URL usage
   */
  static sanitizeSlug(slug: string): string {
    return slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Generates a stable lesson ID from slug
   */
  static generateLessonId(slug: string): number {
    let hash = 0;
    for (let i = 0; i < slug.length; i++) {
      const char = slug.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Merges user progress arrays, keeping the latest updates
   */
  static mergeUserProgress(existing: UserProgress[], updates: UserProgress[]): UserProgress[] {
    const merged = new Map<string, UserProgress>();
    
    // Add existing progress
    existing.forEach(progress => {
      const key = `${progress.lessonId}-${progress.sectionKind}`;
      merged.set(key, progress);
    });
    
    // Update with newer progress
    updates.forEach(progress => {
      const key = `${progress.lessonId}-${progress.sectionKind}`;
      const existing = merged.get(key);
      
      if (!existing || progress.updatedAt > existing.updatedAt) {
        merged.set(key, progress);
      }
    });
    
    return Array.from(merged.values());
  }
}
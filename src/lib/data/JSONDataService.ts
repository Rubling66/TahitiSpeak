// JSON-based data service implementation with IndexedDB caching and search

import { DataService, DataServiceError } from './DataService';
import { IndexedDBService } from './IndexedDBService';
import { searchService } from './SearchService';
import type {
  Lesson,
  LessonSearchResult,
  SearchFilters,
  UserProgress,
  MediaAsset,
  User,
  Tag,
  Course,
  BulkImportJob,
  CourseStatus,
  LessonLevel,
  AdminDashboardStats,
  AdminActivityLog,
  AppSetting
} from '../../types';

export class JSONDataService extends DataService {
  private static instance: JSONDataService;
  private indexedDB: IndexedDBService;
  private isInitialized = false;
  private baseUrl: string;

  private constructor(baseUrl: string = '/data') {
    super();
    this.baseUrl = baseUrl;
    this.indexedDB = IndexedDBService.getInstance();
  }

  static getInstance(baseUrl?: string): JSONDataService {
    if (!JSONDataService.instance) {
      JSONDataService.instance = new JSONDataService(baseUrl);
    }
    return JSONDataService.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Initialize IndexedDB
      await this.indexedDB.initialize();
      
      // Load and cache initial data
      await this.loadInitialData();
      
      this.isInitialized = true;
      console.log('JSONDataService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize JSONDataService:', error);
      throw new DataServiceError('Initialization failed', 'INIT_ERROR', error);
    }
  }

  private async loadInitialData(): Promise<void> {
    try {
      // Check if we have cached data
      const cachedLessons = await this.indexedDB.getCachedLessons();
      
      if (cachedLessons.length === 0) {
        // Load from JSON files
        const lessons = await this.fetchLessonsFromJSON();
        
        // Cache in IndexedDB
        await this.indexedDB.cacheLessons(lessons);
        
        // Initialize search service
        await searchService.initialize(lessons);
      } else {
        // Use cached data
        await searchService.initialize(cachedLessons);
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
      throw error;
    }
  }

  private async fetchLessonsFromJSON(): Promise<Lesson[]> {
    try {
      const response = await fetch(`${this.baseUrl}/lessons/index.json`);
      if (!response.ok) {
        throw new Error(`Failed to fetch lessons index: ${response.statusText}`);
      }
      
      const lessonIndex = await response.json();
      const lessons: Lesson[] = [];
      
      // Load each lesson file
      for (const lessonRef of lessonIndex.lessons) {
        try {
          const lessonResponse = await fetch(`${this.baseUrl}/lessons/${lessonRef.slug}.json`);
          if (lessonResponse.ok) {
            const lesson = await lessonResponse.json();
            lessons.push(lesson);
          }
        } catch (error) {
          console.warn(`Failed to load lesson ${lessonRef.slug}:`, error);
        }
      }
      
      return lessons;
    } catch (error) {
      console.error('Failed to fetch lessons from JSON:', error);
      throw new DataServiceError('INITIALIZATION_ERROR', 'Failed to initialize data service', error instanceof Error ? error.message : String(error));
    }
  }

  // Lesson methods
  async getLessons(filters?: SearchFilters): Promise<Lesson[]> {
    this.ensureInitialized();
    
    try {
      let lessons = await this.indexedDB.getCachedLessons();
      
      if (filters) {
        lessons = lessons.filter(lesson => {
          if (filters.level && lesson.level !== filters.level) return false;
          if (filters.tags && filters.tags.length > 0) {
            const hasMatchingTag = filters.tags.some(tag => lesson.tags.includes(tag));
            if (!hasMatchingTag) return false;
          }
          return true;
        });
      }
      
      return lessons;
    } catch (error) {
      console.error('Failed to get lessons:', error);
      throw new DataServiceError('Failed to retrieve lessons', 'RETRIEVE_ERROR', error);
    }
  }

  async getLesson(slug: string): Promise<Lesson | null> {
    this.ensureInitialized();
    
    try {
      return await this.indexedDB.getCachedLesson(slug);
    } catch (error) {
      console.error(`Failed to get lesson ${slug}:`, error);
      throw new DataServiceError(`Failed to retrieve lesson ${slug}`, 'RETRIEVE_ERROR', error);
    }
  }

  async getLessonsByLevel(level: string): Promise<Lesson[]> {
    this.ensureInitialized();
    
    try {
      const lessons = await this.getLessons();
      return lessons.filter(lesson => lesson.level === level);
    } catch (error) {
      console.error(`Failed to get lessons by level ${level}:`, error);
      throw new DataServiceError('RETRIEVE_ERROR', `Failed to retrieve lessons for level ${level}`, error);
    }
  }

  async searchLessons(query: string, filters?: SearchFilters): Promise<LessonSearchResult[]> {
    this.ensureInitialized();
    
    try {
      return await searchService.search(query, filters);
    } catch (error) {
      console.error('Failed to search lessons:', error);
      throw new DataServiceError('SEARCH_ERROR', 'Search failed', error);
    }
  }

  async getSuggestedLessons(currentLessonSlug: string, limit: number = 3): Promise<Lesson[]> {
    this.ensureInitialized();
    
    try {
      const currentLesson = await this.getLesson(currentLessonSlug);
      if (!currentLesson) {
        return [];
      }
      
      const allLessons = await this.getLessons();
      
      // Simple recommendation: same level, different lessons
      return allLessons
        .filter(lesson => 
          lesson.slug !== currentLessonSlug && 
          lesson.level === currentLesson.level &&
          lesson.isPublished
        )
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to get suggested lessons:', error);
      return [];
    }
  }

  // User progress methods
  async getUserProgress(userId: number, lessonId?: number): Promise<UserProgress[]> {
    this.ensureInitialized();
    
    try {
      return await this.indexedDB.getUserProgress(userId, lessonId);
    } catch (error) {
      console.error(`Failed to get user progress for ${userId}:`, error);
      throw new DataServiceError('PROGRESS_ERROR', `Failed to retrieve progress for user ${userId}`, error);
    }
  }

  async getLessonProgress(userId: number, lessonId: number): Promise<UserProgress | null> {
    this.ensureInitialized();
    
    try {
      const progress = await this.indexedDB.getUserProgress(userId, lessonId);
      return progress.length > 0 ? progress[0] : null;
    } catch (error) {
      console.error(`Failed to get lesson progress for ${userId}/${lessonId}:`, error);
      throw new DataServiceError('PROGRESS_ERROR', 'Failed to retrieve lesson progress', error);
    }
  }

  async saveUserProgress(progress: UserProgress): Promise<void> {
    this.ensureInitialized();
    
    try {
      // Validate progress data
      this.validateUserProgress(progress);
      
      await this.indexedDB.cacheUserProgress([progress]);
    } catch (error) {
      console.error('Failed to save user progress:', error);
      throw new DataServiceError('SAVE_PROGRESS_ERROR', 'Failed to save progress', error);
    }
  }

  async updateLessonProgress(
    userId: number, 
    lessonId: number, 
    progressData: Partial<UserProgress>
  ): Promise<void> {
    this.ensureInitialized();
    
    try {
      const existingProgress = await this.getLessonProgress(userId, lessonId);
      
      const updatedProgress: UserProgress = {
        userId,
        lessonId,
        completed: false,
        score: 0,
        attempts: 0,
        updatedAt: Date.now(),
        ...existingProgress,
        ...progressData
      };
      
      await this.saveUserProgress(updatedProgress);
    } catch (error) {
      console.error('Failed to update lesson progress:', error);
      throw new DataServiceError('UPDATE_PROGRESS_ERROR', 'Failed to update lesson progress', error);
    }
  }

  // Media asset methods
  async getMediaAsset(id: number): Promise<MediaAsset | null> {
    this.ensureInitialized();
    
    try {
      return await this.indexedDB.getCachedMediaAsset(id);
    } catch (error) {
      console.error(`Failed to get media asset ${id}:`, error);
      throw new DataServiceError('MEDIA_ERROR', `Failed to retrieve media asset ${id}`, error);
    }
  }

  async cacheMediaAsset(asset: MediaAsset): Promise<void> {
    this.ensureInitialized();
    
    try {
      await this.indexedDB.cacheMediaAssets([asset]);
    } catch (error) {
      console.error('Failed to cache media asset:', error);
      throw new DataServiceError('CACHE_ERROR', 'Failed to cache media asset', error);
    }
  }

  async preloadLessonMedia(lessonSlug: string): Promise<void> {
    this.ensureInitialized();
    
    try {
      const lesson = await this.getLesson(lessonSlug);
      if (!lesson) {
        throw new Error(`Lesson ${lessonSlug} not found`);
      }
      
      // Preload hero media
      if (lesson.heroMediaId) {
        await this.preloadMediaAsset(lesson.heroMediaId);
      }
      
      // Preload section media
      for (const section of lesson.sections || []) {
        if (section.kind === 'Vocabulary' && section.vocab) {
          for (const item of section.vocab) {
            if (item.audioMediaId) {
                const mediaAsset = await this.getMediaAsset(item.audioMediaId);
                if (mediaAsset) {
                  await this.cacheMediaAsset(mediaAsset);
                }
              }
          }
        }
        if (section.kind === 'Practice' && section.exercises) {
          for (const exercise of section.exercises) {
            // Preload any media referenced in exercise data
            if (exercise.data && typeof exercise.data === 'object') {
              const data = exercise.data as any;
              if (data.audioUrl && typeof data.audioUrl === 'number') {
                  const mediaAsset = await this.getMediaAsset(data.audioUrl);
                  if (mediaAsset) {
                    await this.cacheMediaAsset(mediaAsset);
                  }
                }
            }
          }
        }
      }
    } catch (error) {
      console.error(`Failed to preload media for lesson ${lessonSlug}:`, error);
      // Don't throw - preloading is optional
    }
  }

  private async preloadMediaAsset(mediaId: number): Promise<void> {
    try {
      // Check if already cached
      const cached = await this.getMediaAsset(mediaId);
      if (cached) {
        return;
      }
      
      // Fetch and cache
      const response = await fetch(`${this.baseUrl}/media/${mediaId}`);
      if (response.ok) {
        const blob = await response.blob();
        const asset: MediaAsset = {
          id: mediaId,
          kind: 'audio',
          filePath: `media/${mediaId}`,
          alt: '',
          durationMs: 0,
          rights: '',
          sha256: ''
        };
        
        await this.cacheMediaAsset(asset);
      }
    } catch (error) {
      console.warn(`Failed to preload media asset ${mediaId}:`, error);
    }
  }

  // User preferences removed - UserPreferences type not available

  // Generic CRUD operations
  async get(collection: string, id: string | number): Promise<any> {
    await this.ensureInitialized();
    try {
      return await this.getById(collection, id);
    } catch (error) {
      throw new DataServiceError('RETRIEVE_ERROR', `Failed to get ${collection}: ${id}`, error);
    }
  }



  // Generic CRUD operations
  async create<T>(collection: string, data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    this.ensureInitialized();
    
    try {
      const id = crypto.randomUUID();
      const item = { ...data, id } as T;
      
      // Use metadata store for generic collections
      return new Promise((resolve, reject) => {
        const db = this.indexedDB.getDatabase();
        if (!db) {
          reject(new Error('Database not available'));
          return;
        }
        
        const transaction = db.transaction([collection], 'readwrite');
        const store = transaction.objectStore(collection);
        const request = store.add(item);
        
        request.onsuccess = () => resolve(item);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`Failed to create item in ${collection}:`, error);
      throw new DataServiceError(`Failed to create item in ${collection}`, 'CREATE_ERROR', error);
    }
  }

  async getById<T>(collection: string, id: string | number): Promise<T | null> {
    this.ensureInitialized();
    
    try {
      return new Promise((resolve, reject) => {
        const db = this.indexedDB.getDatabase();
        if (!db) {
          reject(new Error('Database not available'));
          return;
        }
        
        const transaction = db.transaction([collection], 'readonly');
        const store = transaction.objectStore(collection);
        const request = store.get(String(id));
        
        request.onsuccess = () => {
          resolve(request.result || null);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`Failed to get item ${id} from ${collection}:`, error);
      throw new DataServiceError(`Failed to retrieve item ${id}`, 'RETRIEVE_ERROR', error);
    }
  }

  async query<T>(storeName: string, filters?: Record<string, any>): Promise<T[]> {
    this.ensureInitialized();
    
    try {
      return new Promise((resolve, reject) => {
        const db = this.indexedDB.getDatabase();
        if (!db) {
          reject(new Error('Database not available'));
          return;
        }
        
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        
        request.onsuccess = () => {
          let results = request.result || [];
          if (filters) {
            results = results.filter(item => this.matchesFilters(item, filters));
          }
          resolve(results);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`Failed to query ${storeName}:`, error);
      throw new DataServiceError(`Failed to query ${storeName}`, 'QUERY_ERROR', error);
    }
  }

  async update<T>(storeName: string, id: string | number, data: Partial<T>): Promise<T> {
    if (!this.indexedDB) throw new Error('IndexedDB not initialized');
    
    const db = this.indexedDB.getDatabase();
    if (!db) throw new Error('Database not available');
    
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const existing = getRequest.result;
        if (!existing) {
          reject(new Error('Item not found'));
          return;
        }
        
        const updated = { ...existing, ...data };
        const putRequest = store.put(updated);
        putRequest.onsuccess = () => resolve(updated);
        putRequest.onerror = () => reject(putRequest.error);
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }



  private matchesFilters(item: any, filters: Record<string, any>): boolean {
    for (const [key, value] of Object.entries(filters)) {
      if (item[key] !== value) {
        return false;
      }
    }
    return true;
  }

  // Utility methods

  async clearCache(): Promise<void> {
    this.ensureInitialized();
    
    try {
      // Clear IndexedDB cache
      await this.indexedDB.clearCache();
      searchService.clear();
      
      // Reload initial data
      await this.loadInitialData();
    } catch (error) {
      console.error('Failed to clear cache:', error);
      throw new DataServiceError('Failed to clear cache', 'CLEAR_CACHE_ERROR', error);
    }
  }

  async getStats(): Promise<{
    lessonsCount: number;
    progressCount: number;
    mediaCount: number;
    cacheSize: number;
  }> {
    await this.ensureInitialized();
    const lessons = await this.getLessons();
    return {
       lessonsCount: lessons.length,
       progressCount: 0, // Would need to implement progress counting
       mediaCount: 0, // Would need to implement media counting
       cacheSize: 0 // IndexedDBService doesn't expose cache size
     };
  }

  /**
   * Get lesson by slug
   */
  async getLessonBySlug(slug: string): Promise<Lesson | null> {
    await this.ensureInitialized();
    try {
      return await this.indexedDB.getCachedLesson(slug);
    } catch (error) {
      throw new DataServiceError('RETRIEVE_ERROR', `Failed to get lesson by slug: ${slug}`, error);
    }
  }



  /**
   * Update user progress
   */
  async updateUserProgress(progress: Omit<UserProgress, 'updatedAt'>): Promise<void> {
    await this.ensureInitialized();
    try {
      const key = `progress_${progress.userId}_${String(progress.lessonId)}`;
      const fullProgress: UserProgress = {
        ...progress,
        updatedAt: Date.now()
      };
      localStorage.setItem(key, JSON.stringify(fullProgress));
    } catch (error) {
      throw new DataServiceError('UPDATE_ERROR', 'Failed to update user progress', error);
    }
  }

  /**
   * Get multiple media assets by IDs
   */
  async getMediaAssets(ids: number[]): Promise<MediaAsset[]> {
    await this.ensureInitialized();
    try {
      const assets: MediaAsset[] = [];
      for (const id of ids) {
        const asset = await this.getMediaAsset(id);
        if (asset) {
          assets.push(asset);
        }
      }
      return assets;
    } catch (error) {
      throw new DataServiceError('RETRIEVE_ERROR', 'Failed to get media assets', error);
    }
  }

  /**
   * Get user by ID
   */
  async getUser(id: number): Promise<User | null> {
    await this.ensureInitialized();
    try {
      const stored = localStorage.getItem(`user_${id}`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      throw new DataServiceError('RETRIEVE_ERROR', `Failed to get user: ${id}`, error);
    }
  }

  /**
   * Create new user
   */
  async createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    await this.ensureInitialized();
    try {
      const newUser: User = {
        ...user,
        id: Date.now(),
        createdAt: Date.now()
      };
      localStorage.setItem(`user_${newUser.id}`, JSON.stringify(newUser));
      return newUser;
    } catch (error) {
      throw new DataServiceError('CREATE_ERROR', 'Failed to create user', error);
    }
  }

  /**
   * Get all tags
   */
  async getTags(): Promise<Tag[]> {
    await this.ensureInitialized();
    try {
      const stored = localStorage.getItem('tags');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      throw new DataServiceError('RETRIEVE_ERROR', 'Failed to get tags', error);
    }
  }

  /**
   * Get app settings
   */
  async getAppSettings(): Promise<Record<string, string>> {
    await this.ensureInitialized();
    try {
      const stored = localStorage.getItem('app_settings');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      throw new DataServiceError('RETRIEVE_ERROR', 'Failed to get app settings', error);
    }
  }

  /**
   * Update app setting
   */
  async updateAppSetting(key: string, value: string): Promise<void> {
    await this.ensureInitialized();
    try {
      const settings = await this.getAppSettings();
      settings[key] = value;
      localStorage.setItem('app_settings', JSON.stringify(settings));
    } catch (error) {
      throw new DataServiceError('UPDATE_ERROR', `Failed to update app setting: ${key}`, error);
    }
  }

  /**
   * Sync data (override from base class)
   */
  async syncData(): Promise<void> {
    await this.ensureInitialized();
    try {
      // Reload lessons from JSON
      await this.loadInitialData();
    } catch (error) {
      throw new DataServiceError('SYNC_ERROR', 'Failed to sync data', error);
    }
  }

  /**
   * Delete from collection (override from base class)
   */
  async delete(collection: string, id: string | number): Promise<void> {
    await this.ensureInitialized();
    try {
      localStorage.removeItem(`${collection}_${id}`);
    } catch (error) {
      throw new DataServiceError('DELETE_ERROR', `Failed to delete from ${collection}: ${id}`, error);
    }
  }

  // Admin methods
  async createCourse(course: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>): Promise<Course> {
    await this.ensureInitialized();
    try {
      const newCourse: Course = {
        ...course,
        id: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      const courses = await this.getCourses();
      courses.push(newCourse);
      localStorage.setItem('courses', JSON.stringify(courses));
      return newCourse;
    } catch (error) {
      throw new DataServiceError('CREATE_ERROR', 'Failed to create course', error);
    }
  }

  async updateCourse(id: number, updates: Partial<Course>): Promise<Course> {
    await this.ensureInitialized();
    try {
      const courses = await this.getCourses();
      const index = courses.findIndex(c => c.id === id);
      if (index === -1) {
        throw new DataServiceError('NOT_FOUND', `Course not found: ${id}`);
      }
      
      courses[index] = {
        ...courses[index],
        ...updates,
        updatedAt: Date.now()
      };
      
      localStorage.setItem('courses', JSON.stringify(courses));
      return courses[index];
    } catch (error) {
      throw new DataServiceError('UPDATE_ERROR', `Failed to update course: ${id}`, error);
    }
  }

  async deleteCourse(id: number): Promise<void> {
    await this.ensureInitialized();
    try {
      const courses = await this.getCourses();
      const filtered = courses.filter(c => c.id !== id);
      localStorage.setItem('courses', JSON.stringify(filtered));
    } catch (error) {
      throw new DataServiceError('DELETE_ERROR', `Failed to delete course: ${id}`, error);
    }
  }

  async getCourses(): Promise<Course[]> {
    await this.ensureInitialized();
    try {
      const stored = localStorage.getItem('courses');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      throw new DataServiceError('RETRIEVE_ERROR', 'Failed to get courses', error);
    }
  }

  async getCourse(id: number): Promise<Course | null> {
    await this.ensureInitialized();
    try {
      const courses = await this.getCourses();
      return courses.find(c => c.id === id) || null;
    } catch (error) {
      throw new DataServiceError('RETRIEVE_ERROR', `Failed to get course: ${id}`, error);
    }
  }

  async bulkImportCourses(courses: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<Course[]> {
    await this.ensureInitialized();
    try {
      const existingCourses = await this.getCourses();
      const newCourses: Course[] = courses.map((course, index) => ({
        ...course,
        id: Date.now() + index,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }));
      
      const allCourses = [...existingCourses, ...newCourses];
      localStorage.setItem('courses', JSON.stringify(allCourses));
      
      return newCourses;
    } catch (error) {
      throw new DataServiceError('IMPORT_ERROR', 'Failed to bulk import courses', error);
    }
  }

  async searchCourses(query: string): Promise<Course[]> {
    await this.ensureInitialized();
    try {
      const courses = await this.getCourses();
      return courses.filter(course => {
        return !query || 
          course.title.en.toLowerCase().includes(query.toLowerCase()) ||
          course.title.fr.toLowerCase().includes(query.toLowerCase()) ||
          course.title.tah.toLowerCase().includes(query.toLowerCase()) ||
          course.description.toLowerCase().includes(query.toLowerCase());
      });
    } catch (error) {
      throw new DataServiceError('RETRIEVE_ERROR', 'Failed to search courses', error);
    }
  }

  async getAdminStats(): Promise<AdminDashboardStats> {
    await this.ensureInitialized();
    try {
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
    } catch (error) {
      throw new DataServiceError('RETRIEVE_ERROR', 'Failed to get admin stats', error);
    }
  }

  async getActivityLogs(limit: number = 50): Promise<AdminActivityLog[]> {
    await this.ensureInitialized();
    try {
      const stored = localStorage.getItem('admin_activity_logs');
      const logs: AdminActivityLog[] = stored ? JSON.parse(stored) : [];
      return logs.slice(0, limit);
    } catch (error) {
      throw new DataServiceError('RETRIEVE_ERROR', 'Failed to get activity logs', error);
    }
  }

  async createCourseVersion(courseId: number, version: number): Promise<void> {
    await this.ensureInitialized();
    try {
      const course = await this.getCourse(courseId);
      if (!course) {
        throw new DataServiceError('NOT_FOUND', `Course not found: ${courseId}`);
      }
      
      // Store version
      const versions = this.getCourseVersions(courseId);
      versions.push({
        version,
        courseData: course,
        createdAt: Date.now()
      });
      localStorage.setItem(`course_versions_${courseId}`, JSON.stringify(versions));
    } catch (error) {
      throw new DataServiceError('CREATE_ERROR', `Failed to create course version: ${courseId}`, error);
    }
  }

  async restoreCourseVersion(courseId: number, version: number): Promise<Course> {
    await this.ensureInitialized();
    try {
      const versions = this.getCourseVersions(courseId);
      const versionData = versions.find(v => v.version === version);
      
      if (!versionData) {
        throw new DataServiceError('NOT_FOUND', `Course version not found: ${courseId}@${version}`);
      }
      
      const restoredCourse: Course = {
        ...versionData.courseData,
        updatedAt: Date.now(),
        version: version
      };
      
      await this.updateCourse(courseId, restoredCourse);
      return restoredCourse;
    } catch (error) {
      throw new DataServiceError('RESTORE_ERROR', `Failed to restore course version: ${courseId}@${version}`, error);
    }
  }

  private getCourseVersions(courseId: number): any[] {
    const stored = localStorage.getItem(`course_versions_${courseId}`);
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * Validates user progress data
   */
  private validateUserProgress(progress: UserProgress): boolean {
    return (
      typeof progress.userId === 'number' &&
      typeof progress.lessonId === 'number' &&
      typeof progress.sectionKind === 'string' &&
      typeof progress.completed === 'boolean' &&
      typeof progress.score === 'number' &&
      typeof progress.attempts === 'number' &&
      typeof progress.updatedAt === 'number'
    );
  }

  /**
   * Ensures the service is initialized before performing operations
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }
}

// Export singleton instance
export const jsonDataService = JSONDataService.getInstance();
// Offline Synchronization Service
// Coordinates data sync between online and offline states

import { indexedDBService } from './indexeddb-service';
import { JSONDataService } from './data/JSONDataService';
import { UserProgress, Lesson } from '@/types';

interface SyncStatus {
  isOnline: boolean;
  lastSyncTime: number;
  pendingActions: number;
  syncInProgress: boolean;
}

type SyncEventType = 'sync-start' | 'sync-complete' | 'sync-error' | 'status-change';

interface SyncEventListener {
  (event: { type: SyncEventType; data?: unknown }): void;
}

class OfflineSyncService {
  private dataService: JSONDataService;
  private listeners: SyncEventListener[] = [];
  private syncStatus: SyncStatus = {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : false,
    lastSyncTime: 0,
    pendingActions: 0,
    syncInProgress: false
  };
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.dataService = new JSONDataService();
    this.setupEventListeners();
    this.loadSyncStatus();
  }

  /**
   * Initialize the sync service
   */
  async initialize(): Promise<void> {
    try {
      // Initialize IndexedDB
      await indexedDBService.init();
      
      // Load initial data if online
      if (this.syncStatus.isOnline) {
        await this.performInitialSync();
      }
      
      // Start periodic sync
      this.startPeriodicSync();
      
      console.log('Offline sync service initialized');
    } catch (error) {
      console.error('Failed to initialize offline sync service:', error);
      throw error;
    }
  }

  /**
   * Add event listener
   */
  addEventListener(listener: SyncEventListener): void {
    this.listeners.push(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(listener: SyncEventListener): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Get current sync status
   */
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * Force a sync operation
   */
  async forceSync(): Promise<void> {
    if (this.syncStatus.syncInProgress) {
      console.log('Sync already in progress');
      return;
    }

    if (!this.syncStatus.isOnline) {
      console.log('Cannot sync while offline');
      return;
    }

    await this.performSync();
  }

  /**
   * Save user progress (works offline)
   */
  async saveUserProgress(progress: UserProgress): Promise<void> {
    try {
      // Always save to IndexedDB first
      await indexedDBService.storeUserProgress(progress);
      
      if (this.syncStatus.isOnline) {
        // Try to sync immediately if online
        try {
          // In a real app, this would sync to a server
          console.log('Progress synced to server:', progress);
        } catch (error) {
          // If sync fails, add to offline actions
          await this.addOfflineAction('progress_update', progress);
        }
      } else {
        // Add to offline actions for later sync
        await this.addOfflineAction('progress_update', progress);
      }
    } catch (error) {
      console.error('Failed to save user progress:', error);
      throw error;
    }
  }

  /**
   * Get user progress (works offline)
   */
  async getUserProgress(lessonId: string): Promise<UserProgress | null> {
    try {
      // Try IndexedDB first (works offline)
      const progress = await indexedDBService.getUserProgress(lessonId);
      
      if (progress) {
        return progress;
      }
      
      // If not found locally and online, try to fetch from server
      if (this.syncStatus.isOnline) {
        // In a real app, this would fetch from server
        console.log('Fetching progress from server for lesson:', lessonId);
        return null;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get user progress:', error);
      return null;
    }
  }

  /**
   * Get lesson data (works offline)
   */
  async getLesson(id: string): Promise<Lesson | null> {
    try {
      // Try IndexedDB first (works offline)
      const lesson = await indexedDBService.getLesson(id);
      
      if (lesson) {
        return lesson;
      }
      
      // If not found locally and online, try to fetch from JSON service
      if (this.syncStatus.isOnline) {
        const lesson = await this.dataService.getLesson(id);
        
        if (lesson) {
          // Cache for offline use
          await indexedDBService.storeLesson(lesson);
        }
        
        return lesson;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get lesson:', error);
      return null;
    }
  }

  /**
   * Get all lessons (works offline)
   */
  async getAllLessons(): Promise<Lesson[]> {
    try {
      if (this.syncStatus.isOnline) {
        // If online, get fresh data and update cache
        const lessons = await this.dataService.getLessons();
        
        // Update IndexedDB cache
        for (const lesson of lessons) {
          await indexedDBService.storeLesson(lesson);
        }
        
        return lessons;
      } else {
        // If offline, get from IndexedDB
        return await indexedDBService.getAllLessons();
      }
    } catch (error) {
      console.error('Failed to get lessons:', error);
      
      // Fallback to cached data
      try {
        return await indexedDBService.getAllLessons();
      } catch (cacheError) {
        console.error('Failed to get cached lessons:', cacheError);
        return [];
      }
    }
  }

  /**
   * Preload lesson for offline use
   */
  async preloadLesson(lessonId: string): Promise<void> {
    try {
      // Preload lesson data
      const lesson = await this.getLesson(lessonId);
      
      if (lesson) {
        // Preload in service worker cache
        if (typeof window !== 'undefined') {
          const { getSwManager } = await import('./sw-registration');
          const swManager = getSwManager();
          if (swManager) {
            await swManager.preloadLesson(lessonId);
          }
        }
        
        // Preload media assets if any
        if (lesson.vocabulary) {
          for (const vocab of lesson.vocabulary) {
            if (vocab.audio) {
              try {
                const response = await fetch(vocab.audio);
                const blob = await response.blob();
                
                await indexedDBService.storeMediaAsset({
                  id: `audio-${vocab.id}`,
                  type: 'audio',
                  url: vocab.audio,
                  lessonId: lessonId
                }, blob);
              } catch (error) {
                console.warn(`Failed to preload audio for ${vocab.id}:`, error);
              }
            }
          }
        }
      }
      
      console.log(`Lesson ${lessonId} preloaded for offline use`);
    } catch (error) {
      console.error(`Failed to preload lesson ${lessonId}:`, error);
    }
  }

  private async performInitialSync(): Promise<void> {
    try {
      this.updateSyncStatus({ syncInProgress: true });
      this.emitEvent('sync-start');
      
      // Load all lessons into cache
      const lessons = await this.dataService.getLessons();
      
      for (const lesson of lessons) {
        await indexedDBService.storeLesson(lesson);
      }
      
      this.updateSyncStatus({ 
        lastSyncTime: Date.now(),
        syncInProgress: false 
      });
      
      this.emitEvent('sync-complete', { lessonsLoaded: lessons.length });
      
      console.log(`Initial sync completed: ${lessons.length} lessons loaded`);
    } catch (error) {
      this.updateSyncStatus({ syncInProgress: false });
      this.emitEvent('sync-error', error);
      console.error('Initial sync failed:', error);
    }
  }

  private async performSync(): Promise<void> {
    try {
      this.updateSyncStatus({ syncInProgress: true });
      this.emitEvent('sync-start');
      
      // Sync pending offline actions
      const pendingActions = await indexedDBService.getUnsyncedActions();
      
      for (const action of pendingActions) {
        try {
          await this.syncAction(action);
          await indexedDBService.markActionSynced(action.id);
        } catch (error) {
          console.error('Failed to sync action:', action, error);
        }
      }
      
      this.updateSyncStatus({ 
        lastSyncTime: Date.now(),
        pendingActions: 0,
        syncInProgress: false 
      });
      
      this.emitEvent('sync-complete', { actionsSynced: pendingActions.length });
      
      console.log(`Sync completed: ${pendingActions.length} actions synced`);
    } catch (error) {
      this.updateSyncStatus({ syncInProgress: false });
      this.emitEvent('sync-error', error);
      console.error('Sync failed:', error);
    }
  }

  private async syncAction(action: { id?: number; type: string; data: Record<string, unknown>; timestamp: number; synced: boolean }): Promise<void> {
    switch (action.type) {
      case 'progress_update':
        // In a real app, this would sync to a server
        console.log('Syncing progress update:', action.data);
        break;
      case 'lesson_completion':
        console.log('Syncing lesson completion:', action.data);
        break;
      case 'vocabulary_practice':
        console.log('Syncing vocabulary practice:', action.data);
        break;
      default:
        console.warn('Unknown action type:', action.type);
    }
  }

  private async addOfflineAction(type: string, data: Record<string, unknown>): Promise<void> {
    await indexedDBService.addOfflineAction(type, data);
    
    const pendingActions = await indexedDBService.getUnsyncedActions();
    this.updateSyncStatus({ pendingActions: pendingActions.length });
  }

  private setupEventListeners(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.updateSyncStatus({ isOnline: true });
        this.performSync(); // Auto-sync when coming back online
      });

      window.addEventListener('offline', () => {
        this.updateSyncStatus({ isOnline: false });
      });
    }
  }

  private startPeriodicSync(): void {
    // Sync every 5 minutes when online
    this.syncInterval = setInterval(() => {
      if (this.syncStatus.isOnline && !this.syncStatus.syncInProgress) {
        this.performSync();
      }
    }, 5 * 60 * 1000);
  }

  private stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  private updateSyncStatus(updates: Partial<SyncStatus>): void {
    this.syncStatus = { ...this.syncStatus, ...updates };
    this.saveSyncStatus();
    this.emitEvent('status-change', this.syncStatus);
  }

  private emitEvent(type: SyncEventType, data?: unknown): void {
    this.listeners.forEach(listener => {
      try {
        listener({ type, data });
      } catch (error) {
        console.error('Error in sync event listener:', error);
      }
    });
  }

  private saveSyncStatus(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('tahitian-tutor-sync-status', JSON.stringify(this.syncStatus));
      }
    } catch (error) {
      console.error('Failed to save sync status:', error);
    }
  }

  private loadSyncStatus(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem('tahitian-tutor-sync-status');
        if (saved) {
          const parsed = JSON.parse(saved);
          this.syncStatus = { ...this.syncStatus, ...parsed, syncInProgress: false };
        }
      }
    } catch (error) {
      console.error('Failed to load sync status:', error);
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopPeriodicSync();
    this.listeners = [];
    indexedDBService.close();
  }
}

// Create singleton instance
export const offlineSyncService = new OfflineSyncService();

// Helper function to initialize offline functionality
export async function initializeOfflineSync(): Promise<void> {
  try {
    await offlineSyncService.initialize();
    console.log('Offline sync initialized successfully');
  } catch (error) {
    console.error('Failed to initialize offline sync:', error);
    throw error;
  }
}

// Helper function to check offline capabilities
export function getOfflineCapabilities(): {
  serviceWorker: boolean;
  indexedDB: boolean;
  cacheAPI: boolean;
} {
  return {
    serviceWorker: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
    indexedDB: typeof window !== 'undefined' && 'indexedDB' in window,
    cacheAPI: typeof window !== 'undefined' && 'caches' in window
  };
}
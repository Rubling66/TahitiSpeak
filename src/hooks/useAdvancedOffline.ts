import { useState, useEffect, useCallback, useRef } from 'react';
import { advancedIndexedDBService } from '../services/offline/AdvancedIndexedDBService';
import { offlineSyncService, SyncStatus, ConflictResolution } from '../services/offline/OfflineSyncService';

export interface OfflineState {
  isOnline: boolean;
  isOfflineReady: boolean;
  syncStatus: SyncStatus;
  storageUsage: {
    used: number;
    quota: number;
    percentage: number;
  };
  downloadProgress: {
    total: number;
    completed: number;
    current?: string;
    percentage: number;
  };
}

export interface OfflineActions {
  // Sync operations
  syncAll: (force?: boolean) => Promise<void>;
  syncHighPriority: () => Promise<void>;
  
  // Content management
  downloadLesson: (lessonId: string) => Promise<boolean>;
  downloadAllLessons: () => Promise<void>;
  removeLesson: (lessonId: string) => Promise<boolean>;
  
  // Conflict resolution
  getConflicts: () => Promise<any[]>;
  resolveConflicts: (resolutions: ConflictResolution[]) => Promise<void>;
  
  // Storage management
  clearCache: () => Promise<void>;
  optimizeStorage: () => Promise<void>;
  getStorageUsage: () => Promise<void>;
  
  // Settings
  setOfflineSettings: (settings: any) => Promise<void>;
  getOfflineSettings: () => Promise<any>;
}

export interface UseAdvancedOfflineOptions {
  autoSync?: boolean;
  syncInterval?: number;
  preloadCriticalContent?: boolean;
  maxStorageUsage?: number; // in MB
}

export function useAdvancedOffline(options: UseAdvancedOfflineOptions = {}) {
  const {
    autoSync = true,
    syncInterval = 5 * 60 * 1000, // 5 minutes
    preloadCriticalContent = true,
    maxStorageUsage = 500 // 500MB
  } = options;

  // State
  const [state, setState] = useState<OfflineState>({
    isOnline: navigator.onLine,
    isOfflineReady: false,
    syncStatus: {
      isOnline: navigator.onLine,
      lastSync: null,
      isSyncing: false,
      pendingItems: 0,
      conflicts: 0
    },
    storageUsage: {
      used: 0,
      quota: 0,
      percentage: 0
    },
    downloadProgress: {
      total: 0,
      completed: 0,
      percentage: 0
    }
  });

  // Refs
  const syncIntervalRef = useRef<NodeJS.Timeout>();
  const downloadQueueRef = useRef<Set<string>>(new Set());

  // Initialize offline functionality
  useEffect(() => {
    initializeOffline();
    setupEventListeners();
    
    if (autoSync) {
      startAutoSync();
    }

    return () => {
      cleanup();
    };
  }, [autoSync, syncInterval]);

  // Initialize offline functionality
  const initializeOffline = useCallback(async () => {
    try {
      // Initialize IndexedDB
      await advancedIndexedDBService.initialize();
      
      // Get initial sync status
      const syncStatus = await offlineSyncService.getSyncStatus();
      
      // Get storage usage
      const storageUsage = await getStorageUsageData();
      
      // Check if offline is ready
      const isOfflineReady = await checkOfflineReadiness();
      
      setState(prev => ({
        ...prev,
        isOfflineReady,
        syncStatus,
        storageUsage
      }));

      // Preload critical content if enabled
      if (preloadCriticalContent && navigator.onLine) {
        await preloadCriticalData();
      }

      console.log('Advanced offline functionality initialized');
    } catch (error) {
      console.error('Failed to initialize offline functionality:', error);
    }
  }, [preloadCriticalContent]);

  // Setup event listeners
  const setupEventListeners = useCallback(() => {
    // Online/offline events
    const handleOnline = () => {
      setState(prev => ({
        ...prev,
        isOnline: true,
        syncStatus: { ...prev.syncStatus, isOnline: true }
      }));
      
      if (autoSync) {
        syncAll();
      }
    };

    const handleOffline = () => {
      setState(prev => ({
        ...prev,
        isOnline: false,
        syncStatus: { ...prev.syncStatus, isOnline: false }
      }));
    };

    // Storage quota events
    const handleStorageQuotaExceeded = () => {
      console.warn('Storage quota exceeded, cleaning up...');
      optimizeStorage();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('storage', handleStorageQuotaExceeded);

    // Sync status listener
    const syncStatusListener = (syncStatus: SyncStatus) => {
      setState(prev => ({ ...prev, syncStatus }));
    };

    offlineSyncService.addSyncListener(syncStatusListener);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('storage', handleStorageQuotaExceeded);
      offlineSyncService.removeSyncListener(syncStatusListener);
    };
  }, [autoSync]);

  // Start auto sync
  const startAutoSync = useCallback(() => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }

    syncIntervalRef.current = setInterval(() => {
      if (navigator.onLine && !state.syncStatus.isSyncing) {
        syncAll();
      }
    }, syncInterval);
  }, [syncInterval, state.syncStatus.isSyncing]);

  // Cleanup
  const cleanup = useCallback(() => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }
  }, []);

  // Check offline readiness
  const checkOfflineReadiness = useCallback(async (): Promise<boolean> => {
    try {
      // Check if service worker is registered
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return false;

      // Check if critical content is cached
      const lessons = await advancedIndexedDBService.getOfflineLessons();
      const hasContent = lessons.length > 0;

      // Check if IndexedDB is working
      const testData = await advancedIndexedDBService.getSetting('offlineReady');
      
      return hasContent && registration.active !== null;
    } catch (error) {
      console.error('Error checking offline readiness:', error);
      return false;
    }
  }, []);

  // Preload critical data
  const preloadCriticalData = useCallback(async () => {
    try {
      // Get user's current lessons or popular lessons
      const criticalLessons = await getCriticalLessons();
      
      for (const lesson of criticalLessons.slice(0, 5)) { // Limit to 5 lessons
        await downloadLesson(lesson.id);
      }

      await advancedIndexedDBService.setSetting('offlineReady', true);
    } catch (error) {
      console.error('Error preloading critical data:', error);
    }
  }, []);

  // Get critical lessons (mock implementation)
  const getCriticalLessons = useCallback(async () => {
    // This would typically fetch from your API
    return [
      { id: '1', title: 'Basic Greetings', priority: 'high' },
      { id: '2', title: 'Numbers 1-10', priority: 'high' },
      { id: '3', title: 'Common Phrases', priority: 'medium' }
    ];
  }, []);

  // Get storage usage data
  const getStorageUsageData = useCallback(async () => {
    try {
      const estimate = await advancedIndexedDBService.getStorageEstimate();
      return {
        used: Math.round((estimate.usage || 0) / (1024 * 1024)), // MB
        quota: Math.round((estimate.quota || 0) / (1024 * 1024)), // MB
        percentage: estimate.quota ? Math.round(((estimate.usage || 0) / estimate.quota) * 100) : 0
      };
    } catch (error) {
      console.error('Error getting storage usage:', error);
      return { used: 0, quota: 0, percentage: 0 };
    }
  }, []);

  // Actions
  const syncAll = useCallback(async (force = false) => {
    try {
      await offlineSyncService.syncAll({ force });
      
      // Update storage usage after sync
      const storageUsage = await getStorageUsageData();
      setState(prev => ({ ...prev, storageUsage }));
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    }
  }, [getStorageUsageData]);

  const syncHighPriority = useCallback(async () => {
    try {
      await offlineSyncService.syncHighPriority();
    } catch (error) {
      console.error('High priority sync failed:', error);
      throw error;
    }
  }, []);

  const downloadLesson = useCallback(async (lessonId: string): Promise<boolean> => {
    if (downloadQueueRef.current.has(lessonId)) {
      console.log(`Lesson ${lessonId} is already being downloaded`);
      return false;
    }

    try {
      downloadQueueRef.current.add(lessonId);
      
      // Update download progress
      setState(prev => ({
        ...prev,
        downloadProgress: {
          ...prev.downloadProgress,
          total: prev.downloadProgress.total + 1,
          current: lessonId
        }
      }));

      // Mock lesson data - in real app, fetch from API
      const lessonData = {
        id: lessonId,
        title: `Lesson ${lessonId}`,
        content: `Content for lesson ${lessonId}`,
        audioUrl: `https://example.com/audio/${lessonId}.mp3`,
        exercises: [],
        downloadedAt: new Date(),
        version: 1
      };

      // Store lesson
      await advancedIndexedDBService.storeOfflineLesson(lessonData);

      // Download and cache audio if available
      if (lessonData.audioUrl) {
        await cacheMediaAsset(lessonData.audioUrl, 'audio');
      }

      // Update progress
      setState(prev => ({
        ...prev,
        downloadProgress: {
          ...prev.downloadProgress,
          completed: prev.downloadProgress.completed + 1,
          percentage: Math.round(((prev.downloadProgress.completed + 1) / prev.downloadProgress.total) * 100),
          current: undefined
        }
      }));

      console.log(`Lesson ${lessonId} downloaded successfully`);
      return true;
    } catch (error) {
      console.error(`Failed to download lesson ${lessonId}:`, error);
      return false;
    } finally {
      downloadQueueRef.current.delete(lessonId);
    }
  }, []);

  const downloadAllLessons = useCallback(async () => {
    try {
      const lessons = await getCriticalLessons();
      
      setState(prev => ({
        ...prev,
        downloadProgress: {
          total: lessons.length,
          completed: 0,
          percentage: 0
        }
      }));

      for (const lesson of lessons) {
        await downloadLesson(lesson.id);
      }

      console.log('All lessons downloaded');
    } catch (error) {
      console.error('Failed to download all lessons:', error);
      throw error;
    }
  }, [downloadLesson, getCriticalLessons]);

  const removeLesson = useCallback(async (lessonId: string): Promise<boolean> => {
    try {
      await advancedIndexedDBService.removeOfflineLesson(lessonId);
      
      // Update storage usage
      const storageUsage = await getStorageUsageData();
      setState(prev => ({ ...prev, storageUsage }));
      
      console.log(`Lesson ${lessonId} removed from offline storage`);
      return true;
    } catch (error) {
      console.error(`Failed to remove lesson ${lessonId}:`, error);
      return false;
    }
  }, [getStorageUsageData]);

  const cacheMediaAsset = useCallback(async (url: string, type: 'audio' | 'image' | 'video'): Promise<void> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      
      const asset = {
        id: btoa(url), // Base64 encode URL as ID
        url,
        type,
        blob,
        size: blob.size,
        cachedAt: new Date(),
        lastAccessed: new Date()
      };

      await advancedIndexedDBService.storeMediaAsset(asset);
    } catch (error) {
      console.error(`Failed to cache media asset ${url}:`, error);
    }
  }, []);

  const getConflicts = useCallback(async () => {
    return await advancedIndexedDBService.getConflicts();
  }, []);

  const resolveConflicts = useCallback(async (resolutions: ConflictResolution[]) => {
    await offlineSyncService.resolveConflicts(resolutions);
    
    // Update sync status
    const syncStatus = await offlineSyncService.getSyncStatus();
    setState(prev => ({ ...prev, syncStatus }));
  }, []);

  const clearCache = useCallback(async () => {
    try {
      await advancedIndexedDBService.clearCache();
      
      // Update storage usage
      const storageUsage = await getStorageUsageData();
      setState(prev => ({ ...prev, storageUsage }));
      
      console.log('Cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear cache:', error);
      throw error;
    }
  }, [getStorageUsageData]);

  const optimizeStorage = useCallback(async () => {
    try {
      await advancedIndexedDBService.optimizeStorage();
      
      // Update storage usage
      const storageUsage = await getStorageUsageData();
      setState(prev => ({ ...prev, storageUsage }));
      
      console.log('Storage optimized successfully');
    } catch (error) {
      console.error('Failed to optimize storage:', error);
      throw error;
    }
  }, [getStorageUsageData]);

  const getStorageUsage = useCallback(async () => {
    const storageUsage = await getStorageUsageData();
    setState(prev => ({ ...prev, storageUsage }));
  }, [getStorageUsageData]);

  const setOfflineSettings = useCallback(async (settings: any) => {
    await advancedIndexedDBService.setSetting('offlineSettings', settings);
  }, []);

  const getOfflineSettings = useCallback(async () => {
    return await advancedIndexedDBService.getSetting('offlineSettings') || {
      autoDownload: true,
      maxStorageUsage: maxStorageUsage,
      syncInterval: syncInterval,
      downloadQuality: 'medium'
    };
  }, [maxStorageUsage, syncInterval]);

  // Actions object
  const actions: OfflineActions = {
    syncAll,
    syncHighPriority,
    downloadLesson,
    downloadAllLessons,
    removeLesson,
    getConflicts,
    resolveConflicts,
    clearCache,
    optimizeStorage,
    getStorageUsage,
    setOfflineSettings,
    getOfflineSettings
  };

  return {
    ...state,
    actions
  };
}

export default useAdvancedOffline;
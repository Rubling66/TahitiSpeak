import { useState, useEffect, useCallback } from 'react';
import { offlineManager } from '../services/offlineManager';
import { contentDownloadManager } from '../services/contentDownloadManager';
import { syncManager } from '../services/syncManager';
import { offlineDB } from '../services/offlineDatabase';

interface OfflineState {
  isOnline: boolean;
  isInitialized: boolean;
  isServiceWorkerReady: boolean;
  storageUsage: {
    used: number;
    available: number;
    total: number;
    percentage: number;
  } | null;
  syncStatus: {
    lastSync: Date | null;
    isSyncing: boolean;
    pendingItems: number;
    conflicts: number;
  };
  downloadStatus: {
    activeDownloads: number;
    queueLength: number;
    totalProgress: number;
  };
  error: string | null;
}

interface OfflineActions {
  // Initialization
  initialize: () => Promise<void>;
  
  // Content Management
  downloadContent: (contentId: string, type: 'lesson' | 'story') => Promise<void>;
  removeContent: (contentId: string, type: 'lesson' | 'story') => Promise<void>;
  isContentAvailable: (contentId: string, type: 'lesson' | 'story') => Promise<boolean>;
  
  // Sync Management
  triggerSync: () => Promise<void>;
  enableAutoSync: (enabled: boolean) => void;
  
  // Storage Management
  clearCache: () => Promise<void>;
  optimizeStorage: () => Promise<void>;
  getStorageUsage: () => Promise<void>;
  
  // Download Management
  pauseDownload: (downloadId: string) => Promise<void>;
  resumeDownload: (downloadId: string) => Promise<void>;
  cancelDownload: (downloadId: string) => Promise<void>;
  
  // Progress Tracking
  updateProgress: (lessonId: string, progress: any) => Promise<void>;
  addNote: (contentId: string, note: any) => Promise<void>;
  addBookmark: (contentId: string, bookmark: any) => Promise<void>;
  
  // Error Handling
  clearError: () => void;
}

export const useOffline = (): [OfflineState, OfflineActions] => {
  const [state, setState] = useState<OfflineState>({
    isOnline: navigator.onLine,
    isInitialized: false,
    isServiceWorkerReady: false,
    storageUsage: null,
    syncStatus: {
      lastSync: null,
      isSyncing: false,
      pendingItems: 0,
      conflicts: 0
    },
    downloadStatus: {
      activeDownloads: 0,
      queueLength: 0,
      totalProgress: 0
    },
    error: null
  });

  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);

  // Initialize offline functionality
  const initialize = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }));

      // Initialize offline manager
      await offlineManager.initialize();

      // Check service worker registration
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        setState(prev => ({ 
          ...prev, 
          isServiceWorkerReady: !!registration 
        }));
      }

      // Load initial data
      await Promise.all([
        getStorageUsage(),
        loadSyncStatus(),
        loadDownloadStatus()
      ]);

      setState(prev => ({ ...prev, isInitialized: true }));

    } catch (error) {
      console.error('Failed to initialize offline functionality:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Initialization failed',
        isInitialized: false
      }));
    }
  }, []);

  // Load storage usage
  const getStorageUsage = useCallback(async () => {
    try {
      const usage = await offlineManager.getStorageUsage();
      const total = usage.quota || 0;
      const used = usage.usage || 0;
      const available = total - used;
      const percentage = total > 0 ? (used / total) * 100 : 0;

      setState(prev => ({
        ...prev,
        storageUsage: { used, available, total, percentage }
      }));
    } catch (error) {
      console.error('Failed to load storage usage:', error);
    }
  }, []);

  // Load sync status
  const loadSyncStatus = useCallback(async () => {
    try {
      const lastSync = await syncManager.getLastSyncTime();
      
      // Count pending items
      const pendingProgress = await offlineDB.userProgress.where('syncStatus').equals('pending').count();
      const pendingNotes = await offlineDB.userNotes.where('syncStatus').equals('pending').count();
      const pendingBookmarks = await offlineDB.userBookmarks.where('syncStatus').equals('pending').count();
      const pendingAchievements = await offlineDB.userAchievements.where('syncStatus').equals('pending').count();
      const pendingItems = pendingProgress + pendingNotes + pendingBookmarks + pendingAchievements;
      
      // Count conflicts
      const conflicts = await offlineDB.syncConflicts.count();

      setState(prev => ({
        ...prev,
        syncStatus: {
          ...prev.syncStatus,
          lastSync,
          pendingItems,
          conflicts
        }
      }));
    } catch (error) {
      console.error('Failed to load sync status:', error);
    }
  }, []);

  // Load download status
  const loadDownloadStatus = useCallback(async () => {
    try {
      const queue = await contentDownloadManager.getDownloadQueue();
      const activeDownloads = queue.filter(item => item.status === 'downloading').length;
      const totalProgress = queue.length > 0 
        ? queue.reduce((sum, item) => sum + (item.progress || 0), 0) / queue.length
        : 0;

      setState(prev => ({
        ...prev,
        downloadStatus: {
          activeDownloads,
          queueLength: queue.length,
          totalProgress
        }
      }));
    } catch (error) {
      console.error('Failed to load download status:', error);
    }
  }, []);

  // Content management actions
  const downloadContent = useCallback(async (contentId: string, type: 'lesson' | 'story') => {
    try {
      setState(prev => ({ ...prev, error: null }));

      if (!state.isOnline) {
        throw new Error('Cannot download content while offline');
      }

      await contentDownloadManager.addToQueue({
        id: contentId,
        type,
        priority: 'normal'
      });

      await contentDownloadManager.startDownloads();
      await loadDownloadStatus();

    } catch (error) {
      console.error('Failed to download content:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Download failed'
      }));
    }
  }, [state.isOnline, loadDownloadStatus]);

  const removeContent = useCallback(async (contentId: string, type: 'lesson' | 'story') => {
    try {
      setState(prev => ({ ...prev, error: null }));

      if (type === 'lesson') {
        await offlineDB.lessons.delete(contentId);
      } else {
        await offlineDB.stories.delete(contentId);
      }

      // Remove associated audio files
      const audioFiles = await offlineDB.audioFiles
        .where('contentId')
        .equals(contentId)
        .toArray();

      for (const audioFile of audioFiles) {
        await offlineDB.audioFiles.delete(audioFile.id);
      }

      await getStorageUsage();

    } catch (error) {
      console.error('Failed to remove content:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to remove content'
      }));
    }
  }, [getStorageUsage]);

  const isContentAvailable = useCallback(async (contentId: string, type: 'lesson' | 'story'): Promise<boolean> => {
    try {
      if (type === 'lesson') {
        const lesson = await offlineDB.lessons.get(contentId);
        return !!lesson;
      } else {
        const story = await offlineDB.stories.get(contentId);
        return !!story;
      }
    } catch (error) {
      console.error('Failed to check content availability:', error);
      return false;
    }
  }, []);

  // Sync management actions
  const triggerSync = useCallback(async () => {
    if (!state.isOnline) {
      setState(prev => ({ 
        ...prev, 
        error: 'Cannot sync while offline'
      }));
      return;
    }

    try {
      setState(prev => ({ 
        ...prev, 
        error: null,
        syncStatus: { ...prev.syncStatus, isSyncing: true }
      }));

      await syncManager.performFullSync();
      await loadSyncStatus();

    } catch (error) {
      console.error('Sync failed:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Sync failed'
      }));
    } finally {
      setState(prev => ({ 
        ...prev, 
        syncStatus: { ...prev.syncStatus, isSyncing: false }
      }));
    }
  }, [state.isOnline, loadSyncStatus]);

  const enableAutoSync = useCallback((enabled: boolean) => {
    setAutoSyncEnabled(enabled);
  }, []);

  // Storage management actions
  const clearCache = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }));
      await offlineManager.clearCache();
      await getStorageUsage();
    } catch (error) {
      console.error('Failed to clear cache:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to clear cache'
      }));
    }
  }, [getStorageUsage]);

  const optimizeStorage = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }));
      await offlineManager.optimizeStorage();
      await getStorageUsage();
    } catch (error) {
      console.error('Failed to optimize storage:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to optimize storage'
      }));
    }
  }, [getStorageUsage]);

  // Download management actions
  const pauseDownload = useCallback(async (downloadId: string) => {
    try {
      await contentDownloadManager.pauseDownload(downloadId);
      await loadDownloadStatus();
    } catch (error) {
      console.error('Failed to pause download:', error);
    }
  }, [loadDownloadStatus]);

  const resumeDownload = useCallback(async (downloadId: string) => {
    try {
      await contentDownloadManager.resumeDownload(downloadId);
      await loadDownloadStatus();
    } catch (error) {
      console.error('Failed to resume download:', error);
    }
  }, [loadDownloadStatus]);

  const cancelDownload = useCallback(async (downloadId: string) => {
    try {
      await contentDownloadManager.cancelDownload(downloadId);
      await loadDownloadStatus();
    } catch (error) {
      console.error('Failed to cancel download:', error);
    }
  }, [loadDownloadStatus]);

  // Progress tracking actions
  const updateProgress = useCallback(async (lessonId: string, progress: any) => {
    try {
      const existingProgress = await offlineDB.userProgress
        .where(['userId', 'lessonId'])
        .equals([progress.userId, lessonId])
        .first();

      if (existingProgress) {
        await offlineDB.userProgress.update(existingProgress.id, {
          ...progress,
          syncStatus: 'pending',
          lastModified: new Date()
        });
      } else {
        await offlineDB.userProgress.add({
          id: `progress_${Date.now()}_${Math.random()}`,
          userId: progress.userId,
          lessonId,
          ...progress,
          syncStatus: 'pending',
          lastModified: new Date()
        });
      }

      await loadSyncStatus();

    } catch (error) {
      console.error('Failed to update progress:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to update progress'
      }));
    }
  }, [loadSyncStatus]);

  const addNote = useCallback(async (contentId: string, note: any) => {
    try {
      await offlineDB.userNotes.add({
        id: `note_${Date.now()}_${Math.random()}`,
        userId: note.userId,
        contentId,
        contentType: note.contentType || 'lesson',
        ...note,
        syncStatus: 'pending',
        createdAt: new Date(),
        lastModified: new Date()
      });

      await loadSyncStatus();

    } catch (error) {
      console.error('Failed to add note:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to add note'
      }));
    }
  }, [loadSyncStatus]);

  const addBookmark = useCallback(async (contentId: string, bookmark: any) => {
    try {
      await offlineDB.userBookmarks.add({
        id: `bookmark_${Date.now()}_${Math.random()}`,
        userId: bookmark.userId,
        contentId,
        contentType: bookmark.contentType || 'lesson',
        ...bookmark,
        syncStatus: 'pending',
        createdAt: new Date(),
        lastModified: new Date()
      });

      await loadSyncStatus();

    } catch (error) {
      console.error('Failed to add bookmark:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to add bookmark'
      }));
    }
  }, [loadSyncStatus]);

  // Error handling
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Set up event listeners
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      if (autoSyncEnabled && state.isInitialized) {
        triggerSync();
      }
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [autoSyncEnabled, state.isInitialized, triggerSync]);

  // Set up periodic updates
  useEffect(() => {
    if (!state.isInitialized) return;

    const interval = setInterval(() => {
      loadSyncStatus();
      loadDownloadStatus();
      getStorageUsage();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [state.isInitialized, loadSyncStatus, loadDownloadStatus, getStorageUsage]);

  // Auto-sync when online
  useEffect(() => {
    if (state.isOnline && autoSyncEnabled && state.isInitialized && state.syncStatus.pendingItems > 0) {
      const autoSyncTimer = setTimeout(() => {
        triggerSync();
      }, 5000); // Auto-sync after 5 seconds when coming online

      return () => clearTimeout(autoSyncTimer);
    }
  }, [state.isOnline, autoSyncEnabled, state.isInitialized, state.syncStatus.pendingItems, triggerSync]);

  // Set up download progress listener
  useEffect(() => {
    const handleDownloadProgress = () => {
      loadDownloadStatus();
    };

    contentDownloadManager.onProgress = handleDownloadProgress;

    return () => {
      contentDownloadManager.onProgress = undefined;
    };
  }, [loadDownloadStatus]);

  const actions: OfflineActions = {
    initialize,
    downloadContent,
    removeContent,
    isContentAvailable,
    triggerSync,
    enableAutoSync,
    clearCache,
    optimizeStorage,
    getStorageUsage,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    updateProgress,
    addNote,
    addBookmark,
    clearError
  };

  return [state, actions];
};

export default useOffline;
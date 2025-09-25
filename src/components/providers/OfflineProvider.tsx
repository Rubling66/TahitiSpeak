'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { registerServiceWorker, swManager } from '../../lib/sw-registration';
import { initializeOfflineSync, offlineSyncService } from '../../lib/offline-sync';
import { isOfflineStorageSupported } from '../../lib/indexeddb-service';

interface OfflineContextType {
  isOnline: boolean;
  isOfflineReady: boolean;
  syncStatus: {
    lastSyncTime: number;
    pendingActions: number;
    syncInProgress: boolean;
  };
  cacheSize: {
    used: number;
    quota: number;
  };
  preloadLesson: (lessonId: string) => Promise<void>;
  forceSync: () => Promise<void>;
  clearCache: () => Promise<void>;
  showUpdateAvailable: boolean;
  updateApp: () => void;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

interface OfflineProviderProps {
  children: ReactNode;
}

export function OfflineProvider({ children }: OfflineProviderProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [isOfflineReady, setIsOfflineReady] = useState(false);
  const [showUpdateAvailable, setShowUpdateAvailable] = useState(false);
  const [syncStatus, setSyncStatus] = useState({
    lastSyncTime: 0,
    pendingActions: 0,
    syncInProgress: false
  });
  const [cacheSize, setCacheSize] = useState({
    used: 0,
    quota: 0
  });

  useEffect(() => {
    // Only initialize in browser environment
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return;
    }

    // Initialize offline functionality
    initializeOffline();
    
    // Set up online/offline listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial online status
    setIsOnline(navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const initializeOffline = async () => {
    try {
      // Check if offline features are supported
      if (!isOfflineStorageSupported()) {
        console.warn('Offline storage not supported');
        return;
      }

      // Register service worker
      await registerServiceWorker({
        onSuccess: (registration) => {
          console.log('Service Worker registered successfully');
          setIsOfflineReady(true);
        },
        onUpdate: (registration) => {
          console.log('Service Worker update available');
          setShowUpdateAvailable(true);
        },
        onOffline: () => {
          console.log('App is now offline');
          setIsOnline(false);
        },
        onOnline: () => {
          console.log('App is now online');
          setIsOnline(true);
        }
      });

      // Initialize offline sync
      await initializeOfflineSync();

      // Set up sync status listener
      offlineSyncService.addEventListener((event) => {
        if (event.type === 'status-change') {
          setSyncStatus({
            lastSyncTime: event.data.lastSyncTime,
            pendingActions: event.data.pendingActions,
            syncInProgress: event.data.syncInProgress
          });
        }
      });

      // Update cache size
      updateCacheSize();

      console.log('Offline functionality initialized');
    } catch (error) {
      console.error('Failed to initialize offline functionality:', error);
    }
  };

  const updateCacheSize = async () => {
    try {
      const size = await swManager.getCacheSize();
      setCacheSize(size);
    } catch (error) {
      console.error('Failed to get cache size:', error);
    }
  };

  const preloadLesson = async (lessonId: string) => {
    try {
      await offlineSyncService.preloadLesson(lessonId);
      await updateCacheSize();
      console.log(`Lesson ${lessonId} preloaded for offline use`);
    } catch (error) {
      console.error(`Failed to preload lesson ${lessonId}:`, error);
      throw error;
    }
  };

  const forceSync = async () => {
    try {
      await offlineSyncService.forceSync();
      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    }
  };

  const clearCache = async () => {
    try {
      await swManager.clearCaches();
      await updateCacheSize();
      console.log('Cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear cache:', error);
      throw error;
    }
  };

  const updateApp = () => {
    swManager.skipWaiting();
    setShowUpdateAvailable(false);
    // Reload the page to get the new version
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const contextValue: OfflineContextType = {
    isOnline,
    isOfflineReady,
    syncStatus,
    cacheSize,
    preloadLesson,
    forceSync,
    clearCache,
    showUpdateAvailable,
    updateApp
  };

  return (
    <OfflineContext.Provider value={contextValue}>
      {children}
      {showUpdateAvailable && <UpdateNotification onUpdate={updateApp} />}
      {!isOnline && <OfflineIndicator />}
    </OfflineContext.Provider>
  );
}

// Update notification component
function UpdateNotification({ onUpdate }: { onUpdate: () => void }) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-blue-600 text-white p-4 rounded-lg shadow-lg max-w-sm">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-sm">Update Available</h3>
          <p className="text-xs text-blue-100 mt-1">
            A new version of the app is available. Update now for the latest features.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={onUpdate}
              className="bg-white text-blue-600 px-3 py-1 rounded text-xs font-medium hover:bg-blue-50 transition-colors"
            >
              Update
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="text-blue-100 px-3 py-1 rounded text-xs hover:text-white transition-colors"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Offline indicator component
function OfflineIndicator() {
  return (
    <div className="fixed bottom-4 left-4 z-50 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
      <span className="text-sm font-medium">You&#39;re offline</span>
    </div>
  );
}

// Hook to use offline context
export function useOffline(): OfflineContextType {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
}

// Hook to check if a feature is available offline
export function useOfflineCapable(): boolean {
  const { isOfflineReady } = useOffline();
  return isOfflineReady && isOfflineStorageSupported();
}

// Hook to get offline status with additional info
export function useOfflineStatus() {
  const { isOnline, isOfflineReady, syncStatus } = useOffline();
  
  return {
    isOnline,
    isOffline: !isOnline,
    isOfflineReady,
    canWorkOffline: isOfflineReady && isOfflineStorageSupported(),
    hasPendingSync: syncStatus.pendingActions > 0,
    isSyncing: syncStatus.syncInProgress,
    lastSyncTime: syncStatus.lastSyncTime
  };
}
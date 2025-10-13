import { useState, useEffect, useCallback } from 'react';
import { offlineManager, OfflineStatus, OfflineConfig } from '@/lib/offline/OfflineManager';
import { SyncResult, SyncConflict } from '@/lib/offline/OfflineSyncService';

export interface UseOfflineReturn {
  // Status
  status: OfflineStatus;
  isOnline: boolean;
  isOffline: boolean;
  isInitialized: boolean;
  syncInProgress: boolean;
  
  // Data operations
  saveData: (table: string, data: any, operation?: 'create' | 'update' | 'delete') => Promise<void>;
  getData: (table: string, id?: string) => Promise<any>;
  deleteData: (table: string, id: string) => Promise<void>;
  
  // Sync operations
  sync: () => Promise<SyncResult>;
  forceSync: () => Promise<SyncResult>;
  
  // Conflict management
  conflicts: SyncConflict[];
  resolveConflict: (conflictId: string, resolution: 'client' | 'server' | 'merge', mergedData?: any) => Promise<void>;
  
  // Cache management
  preloadContent: (contentIds: string[]) => Promise<void>;
  cacheAsset: (url: string, type: 'image' | 'audio' | 'video' | 'document') => Promise<void>;
  getAsset: (url: string) => Promise<Blob | null>;
  clearExpiredAssets: () => Promise<void>;
  
  // Configuration
  updateConfig: (config: Partial<OfflineConfig>) => void;
  config: OfflineConfig;
  
  // Utilities
  clearAllData: () => Promise<void>;
  estimateStorageQuota: () => Promise<{ usage: number; quota: number }>;
  
  // State
  loading: boolean;
  error: string | null;
  lastSyncTime: Date | null;
}

export function useOffline(initialConfig?: Partial<OfflineConfig>): UseOfflineReturn {
  const [status, setStatus] = useState<OfflineStatus>({
    isOnline: navigator.onLine,
    isInitialized: false,
    syncInProgress: false,
    lastSyncTime: null,
    pendingChanges: 0,
    storageUsage: null,
    conflicts: [],
  });
  
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [config, setConfig] = useState<OfflineConfig>(offlineManager.getConfig());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Initialize offline manager
  useEffect(() => {
    const initializeOffline = async () => {
      try {
        setLoading(true);
        setError(null);
        
        await offlineManager.initialize(initialConfig);
        
        // Update initial status
        const currentStatus = await offlineManager.getStatus();
        setStatus(currentStatus);
        setConflicts(currentStatus.conflicts);
        
        if (currentStatus.lastSyncTime) {
          setLastSyncTime(new Date(currentStatus.lastSyncTime));
        }
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize offline functionality');
        console.error('Offline initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeOffline();
  }, []);

  // Setup event listeners
  useEffect(() => {
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false }));
    };

    const handleSyncStart = () => {
      setStatus(prev => ({ ...prev, syncInProgress: true }));
      setError(null);
    };

    const handleSyncSuccess = (result: SyncResult) => {
      setStatus(prev => ({ ...prev, syncInProgress: false }));
      setLastSyncTime(new Date());
      
      // Update conflicts
      setConflicts(result.conflicts);
      
      // Update status
      offlineManager.getStatus().then(setStatus);
    };

    const handleSyncError = (result: SyncResult) => {
      setStatus(prev => ({ ...prev, syncInProgress: false }));
      setError(result.errors.join(', ') || 'Sync failed');
      setConflicts(result.conflicts);
    };

    const handleConflictResolved = () => {
      // Refresh conflicts
      offlineManager.getConflicts().then(setConflicts);
    };

    const handleConfigUpdated = (newConfig: OfflineConfig) => {
      setConfig(newConfig);
    };

    const handleError = (errorData: any) => {
      setError(errorData.error?.message || 'An error occurred');
    };

    // Register event listeners
    offlineManager.on('online', handleOnline);
    offlineManager.on('offline', handleOffline);
    offlineManager.on('sync-start', handleSyncStart);
    offlineManager.on('sync-success', handleSyncSuccess);
    offlineManager.on('sync-error', handleSyncError);
    offlineManager.on('conflict-resolved', handleConflictResolved);
    offlineManager.on('config-updated', handleConfigUpdated);
    offlineManager.on('error', handleError);

    // Cleanup
    return () => {
      offlineManager.off('online', handleOnline);
      offlineManager.off('offline', handleOffline);
      offlineManager.off('sync-start', handleSyncStart);
      offlineManager.off('sync-success', handleSyncSuccess);
      offlineManager.off('sync-error', handleSyncError);
      offlineManager.off('conflict-resolved', handleConflictResolved);
      offlineManager.off('config-updated', handleConfigUpdated);
      offlineManager.off('error', handleError);
    };
  }, []);

  // Data operations
  const saveData = useCallback(async (table: string, data: any, operation: 'create' | 'update' | 'delete' = 'create') => {
    try {
      setError(null);
      await offlineManager.saveData(table, data, operation);
      
      // Update status
      const currentStatus = await offlineManager.getStatus();
      setStatus(currentStatus);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save data';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const getData = useCallback(async (table: string, id?: string) => {
    try {
      setError(null);
      return await offlineManager.getData(table, id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get data';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const deleteData = useCallback(async (table: string, id: string) => {
    try {
      setError(null);
      await offlineManager.deleteData(table, id);
      
      // Update status
      const currentStatus = await offlineManager.getStatus();
      setStatus(currentStatus);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete data';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Sync operations
  const sync = useCallback(async () => {
    try {
      setError(null);
      return await offlineManager.sync();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sync failed';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const forceSync = useCallback(async () => {
    try {
      setError(null);
      return await offlineManager.forceSync();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Force sync failed';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Conflict management
  const resolveConflict = useCallback(async (
    conflictId: string, 
    resolution: 'client' | 'server' | 'merge', 
    mergedData?: any
  ) => {
    try {
      setError(null);
      await offlineManager.resolveConflict(conflictId, resolution, mergedData);
      
      // Update conflicts
      const updatedConflicts = await offlineManager.getConflicts();
      setConflicts(updatedConflicts);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resolve conflict';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Cache management
  const preloadContent = useCallback(async (contentIds: string[]) => {
    try {
      setError(null);
      await offlineManager.preloadContent(contentIds);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to preload content';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const cacheAsset = useCallback(async (url: string, type: 'image' | 'audio' | 'video' | 'document') => {
    try {
      setError(null);
      await offlineManager.cacheAsset(url, type);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cache asset';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const getAsset = useCallback(async (url: string) => {
    try {
      setError(null);
      return await offlineManager.getAsset(url);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get asset';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const clearExpiredAssets = useCallback(async () => {
    try {
      setError(null);
      await offlineManager.clearExpiredAssets();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear expired assets';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Configuration
  const updateConfig = useCallback((newConfig: Partial<OfflineConfig>) => {
    offlineManager.updateConfig(newConfig);
  }, []);

  // Utilities
  const clearAllData = useCallback(async () => {
    try {
      setError(null);
      await offlineManager.clearAllData();
      
      // Reset status
      const currentStatus = await offlineManager.getStatus();
      setStatus(currentStatus);
      setConflicts([]);
      setLastSyncTime(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear data';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const estimateStorageQuota = useCallback(async () => {
    try {
      setError(null);
      return await offlineManager.estimateStorageQuota();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to estimate storage';
      setError(errorMessage);
      throw err;
    }
  }, []);

  return {
    // Status
    status,
    isOnline: status.isOnline,
    isOffline: !status.isOnline,
    isInitialized: status.isInitialized,
    syncInProgress: status.syncInProgress,
    
    // Data operations
    saveData,
    getData,
    deleteData,
    
    // Sync operations
    sync,
    forceSync,
    
    // Conflict management
    conflicts,
    resolveConflict,
    
    // Cache management
    preloadContent,
    cacheAsset,
    getAsset,
    clearExpiredAssets,
    
    // Configuration
    updateConfig,
    config,
    
    // Utilities
    clearAllData,
    estimateStorageQuota,
    
    // State
    loading,
    error,
    lastSyncTime,
  };
}
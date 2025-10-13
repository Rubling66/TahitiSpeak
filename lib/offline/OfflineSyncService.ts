import { indexedDBService } from './IndexedDBService';

export interface SyncConflict {
  id: string;
  table: string;
  localData: any;
  serverData: any;
  conflictType: 'version' | 'timestamp' | 'content';
  timestamp: number;
}

export interface SyncResult {
  success: boolean;
  synced: number;
  conflicts: SyncConflict[];
  errors: string[];
}

class OfflineSyncService {
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;
  private syncQueue: any[] = [];
  private conflictResolutionStrategy: 'client' | 'server' | 'manual' = 'manual';

  constructor() {
    this.setupNetworkListeners();
    this.setupPeriodicSync();
  }

  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.triggerSync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Listen for service worker sync events
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'SYNC_OFFLINE_DATA') {
          this.triggerSync();
        }
      });
    }
  }

  private setupPeriodicSync(): void {
    // Sync every 5 minutes when online
    setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.triggerSync();
      }
    }, 5 * 60 * 1000);
  }

  async initialize(): Promise<void> {
    await indexedDBService.initialize();
  }

  // Add data to offline storage and sync queue
  async saveOffline(table: string, data: any, operation: 'create' | 'update' | 'delete'): Promise<void> {
    try {
      const timestamp = Date.now();
      const version = data.version ? data.version + 1 : 1;
      
      const offlineData = {
        ...data,
        syncStatus: 'pending' as const,
        lastModified: timestamp,
        version,
      };

      // Save to IndexedDB
      await indexedDBService.put(table as any, offlineData);

      // Add to sync queue
      await indexedDBService.addToSyncQueue({
        operation,
        table,
        data: offlineData,
      });

      // Try immediate sync if online
      if (this.isOnline) {
        this.triggerSync();
      }
    } catch (error) {
      console.error('Failed to save offline data:', error);
      throw error;
    }
  }

  // Get data from offline storage
  async getOfflineData(table: string, id?: string): Promise<any> {
    try {
      if (id) {
        return await indexedDBService.get(table as any, id);
      } else {
        return await indexedDBService.getAll(table as any);
      }
    } catch (error) {
      console.error('Failed to get offline data:', error);
      throw error;
    }
  }

  // Trigger synchronization
  async triggerSync(): Promise<SyncResult> {
    if (this.syncInProgress || !this.isOnline) {
      return { success: false, synced: 0, conflicts: [], errors: ['Sync already in progress or offline'] };
    }

    this.syncInProgress = true;
    const result: SyncResult = {
      success: true,
      synced: 0,
      conflicts: [],
      errors: [],
    };

    try {
      // Get pending sync items
      const pendingItems = await indexedDBService.getPendingSync();
      
      for (const item of pendingItems) {
        try {
          const syncItemResult = await this.syncItem(item);
          
          if (syncItemResult.success) {
            result.synced++;
            await indexedDBService.removeSyncItem(item.id);
          } else if (syncItemResult.conflict) {
            result.conflicts.push(syncItemResult.conflict);
          } else {
            result.errors.push(syncItemResult.error || 'Unknown sync error');
            await indexedDBService.updateSyncItemError(item.id, syncItemResult.error || 'Unknown error');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(errorMessage);
          await indexedDBService.updateSyncItemError(item.id, errorMessage);
        }
      }

      // Sync server changes to local
      await this.syncServerChanges();

    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Sync failed');
    } finally {
      this.syncInProgress = false;
    }

    return result;
  }

  private async syncItem(item: any): Promise<{
    success: boolean;
    conflict?: SyncConflict;
    error?: string;
  }> {
    try {
      const { operation, table, data } = item;
      let response: Response;

      switch (operation) {
        case 'create':
          response = await fetch(`/api/${table}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          break;

        case 'update':
          response = await fetch(`/api/${table}/${data.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          break;

        case 'delete':
          response = await fetch(`/api/${table}/${data.id}`, {
            method: 'DELETE',
          });
          break;

        default:
          throw new Error(`Unknown operation: ${operation}`);
      }

      if (response.ok) {
        const serverData = await response.json();
        
        // Update local data with server response
        if (operation !== 'delete') {
          const updatedData = {
            ...serverData,
            syncStatus: 'synced' as const,
            lastModified: Date.now(),
          };
          await indexedDBService.put(table as any, updatedData);
        } else {
          await indexedDBService.delete(table as any, data.id);
        }

        return { success: true };
      } else if (response.status === 409) {
        // Conflict detected
        const serverData = await response.json();
        const conflict: SyncConflict = {
          id: data.id,
          table,
          localData: data,
          serverData,
          conflictType: this.detectConflictType(data, serverData),
          timestamp: Date.now(),
        };

        return { success: false, conflict };
      } else {
        const errorText = await response.text();
        return { success: false, error: `Server error: ${response.status} - ${errorText}` };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error' 
      };
    }
  }

  private async syncServerChanges(): Promise<void> {
    try {
      // Get last sync timestamp
      const lastSync = localStorage.getItem('lastSyncTimestamp');
      const timestamp = lastSync ? parseInt(lastSync) : 0;

      // Fetch changes from server
      const response = await fetch(`/api/sync/changes?since=${timestamp}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch server changes: ${response.status}`);
      }

      const { changes } = await response.json();

      for (const change of changes) {
        await this.applyServerChange(change);
      }

      // Update last sync timestamp
      localStorage.setItem('lastSyncTimestamp', Date.now().toString());
    } catch (error) {
      console.error('Failed to sync server changes:', error);
    }
  }

  private async applyServerChange(change: any): Promise<void> {
    const { table, operation, data } = change;

    try {
      // Check for local conflicts
      const localData = await indexedDBService.get(table as any, data.id);
      
      if (localData && localData.syncStatus === 'pending') {
        // Local changes pending, create conflict
        const conflict: SyncConflict = {
          id: data.id,
          table,
          localData,
          serverData: data,
          conflictType: this.detectConflictType(localData, data),
          timestamp: Date.now(),
        };

        // Store conflict for manual resolution
        await this.storeConflict(conflict);
        return;
      }

      // Apply server change
      if (operation === 'delete') {
        await indexedDBService.delete(table as any, data.id);
      } else {
        const syncedData = {
          ...data,
          syncStatus: 'synced' as const,
          lastModified: Date.now(),
        };
        await indexedDBService.put(table as any, syncedData);
      }
    } catch (error) {
      console.error('Failed to apply server change:', error);
    }
  }

  private detectConflictType(localData: any, serverData: any): 'version' | 'timestamp' | 'content' {
    if (localData.version !== serverData.version) {
      return 'version';
    }
    
    if (localData.lastModified !== serverData.lastModified) {
      return 'timestamp';
    }
    
    return 'content';
  }

  private async storeConflict(conflict: SyncConflict): Promise<void> {
    // Store conflicts in a separate table or local storage for manual resolution
    const conflicts = JSON.parse(localStorage.getItem('syncConflicts') || '[]');
    conflicts.push(conflict);
    localStorage.setItem('syncConflicts', JSON.stringify(conflicts));
  }

  // Conflict resolution methods
  async resolveConflict(conflictId: string, resolution: 'client' | 'server' | 'merge', mergedData?: any): Promise<void> {
    const conflicts = JSON.parse(localStorage.getItem('syncConflicts') || '[]');
    const conflictIndex = conflicts.findIndex((c: SyncConflict) => c.id === conflictId);
    
    if (conflictIndex === -1) {
      throw new Error('Conflict not found');
    }

    const conflict = conflicts[conflictIndex];
    let resolvedData: any;

    switch (resolution) {
      case 'client':
        resolvedData = conflict.localData;
        break;
      case 'server':
        resolvedData = conflict.serverData;
        break;
      case 'merge':
        if (!mergedData) {
          throw new Error('Merged data required for merge resolution');
        }
        resolvedData = mergedData;
        break;
    }

    // Apply resolution
    resolvedData.syncStatus = 'synced';
    resolvedData.lastModified = Date.now();
    await indexedDBService.put(conflict.table as any, resolvedData);

    // Remove conflict
    conflicts.splice(conflictIndex, 1);
    localStorage.setItem('syncConflicts', JSON.stringify(conflicts));

    // Sync resolved data to server
    await this.saveOffline(conflict.table, resolvedData, 'update');
  }

  async getConflicts(): Promise<SyncConflict[]> {
    return JSON.parse(localStorage.getItem('syncConflicts') || '[]');
  }

  // Utility methods
  async clearOfflineData(): Promise<void> {
    await indexedDBService.clear('stories');
    await indexedDBService.clear('lessons');
    await indexedDBService.clear('userProgress');
    await indexedDBService.clear('syncQueue');
    localStorage.removeItem('syncConflicts');
    localStorage.removeItem('lastSyncTimestamp');
  }

  async getStorageUsage(): Promise<any> {
    return await indexedDBService.getStorageUsage();
  }

  setConflictResolutionStrategy(strategy: 'client' | 'server' | 'manual'): void {
    this.conflictResolutionStrategy = strategy;
  }

  isOfflineMode(): boolean {
    return !this.isOnline;
  }

  getSyncStatus(): {
    isOnline: boolean;
    syncInProgress: boolean;
    pendingItems: number;
  } {
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      pendingItems: this.syncQueue.length,
    };
  }
}

export const offlineSyncService = new OfflineSyncService();
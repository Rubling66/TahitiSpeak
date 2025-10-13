import { advancedIndexedDBService } from './AdvancedIndexedDBService';
import { supabase } from '../supabase';

export interface SyncResult {
  success: boolean;
  synced: number;
  conflicts: number;
  errors: string[];
}

export interface ConflictResolution {
  id: string;
  table: string;
  recordId: string;
  resolution: 'local' | 'remote' | 'merge';
  mergedData?: any;
}

export interface SyncOptions {
  force?: boolean;
  tables?: string[];
  batchSize?: number;
  timeout?: number;
}

export interface SyncStatus {
  isOnline: boolean;
  lastSync: Date | null;
  isSyncing: boolean;
  pendingItems: number;
  conflicts: number;
  nextSync?: Date;
}

class OfflineSyncService {
  private syncInProgress = false;
  private syncQueue: Set<string> = new Set();
  private conflictResolvers: Map<string, (local: any, remote: any) => any> = new Map();
  private syncListeners: Set<(status: SyncStatus) => void> = new Set();
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.setupEventListeners();
    this.setupConflictResolvers();
    this.startPeriodicSync();
  }

  // Event listeners setup
  private setupEventListeners(): void {
    // Online/offline detection
    window.addEventListener('online', () => {
      console.log('Connection restored, starting sync...');
      this.syncAll();
    });

    window.addEventListener('offline', () => {
      console.log('Connection lost, queuing operations...');
      this.notifyListeners();
    });

    // Visibility change (app becomes active)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && navigator.onLine) {
        this.syncAll();
      }
    });
  }

  // Setup default conflict resolvers
  private setupConflictResolvers(): void {
    // User progress resolver - merge with latest timestamps
    this.conflictResolvers.set('userProgress', (local, remote) => {
      return {
        ...remote,
        progress: Math.max(local.progress || 0, remote.progress || 0),
        completedExercises: [
          ...new Set([
            ...(local.completedExercises || []),
            ...(remote.completedExercises || [])
          ])
        ],
        timeSpent: (local.timeSpent || 0) + (remote.timeSpent || 0),
        lastStudiedAt: new Date(Math.max(
          new Date(local.lastStudiedAt || 0).getTime(),
          new Date(remote.lastStudiedAt || 0).getTime()
        ))
      };
    });

    // Settings resolver - prefer local changes
    this.conflictResolvers.set('settings', (local, remote) => {
      return local.updatedAt > remote.updatedAt ? local : remote;
    });

    // Analytics resolver - merge events
    this.conflictResolvers.set('analytics', (local, remote) => {
      // Analytics events should not conflict, but if they do, keep both
      return Array.isArray(local) ? [...local, ...remote] : [local, remote];
    });
  }

  // Start periodic sync
  private startPeriodicSync(): void {
    // Sync every 5 minutes when online
    setInterval(() => {
      if (navigator.onLine && !this.syncInProgress) {
        this.syncAll({ force: false });
      }
    }, 5 * 60 * 1000);

    // Quick sync every 30 seconds for high priority items
    setInterval(() => {
      if (navigator.onLine && !this.syncInProgress) {
        this.syncHighPriority();
      }
    }, 30 * 1000);
  }

  // Main sync method
  async syncAll(options: SyncOptions = {}): Promise<SyncResult> {
    if (this.syncInProgress && !options.force) {
      console.log('Sync already in progress');
      return { success: false, synced: 0, conflicts: 0, errors: ['Sync already in progress'] };
    }

    if (!navigator.onLine) {
      console.log('Cannot sync while offline');
      return { success: false, synced: 0, conflicts: 0, errors: ['Device is offline'] };
    }

    this.syncInProgress = true;
    this.notifyListeners();

    const result: SyncResult = {
      success: true,
      synced: 0,
      conflicts: 0,
      errors: []
    };

    try {
      // Get sync queue
      const syncQueue = await advancedIndexedDBService.getSyncQueue();
      const tablesToSync = options.tables || ['userProgress', 'analytics', 'settings'];

      // Process sync queue in batches
      const batchSize = options.batchSize || 10;
      for (let i = 0; i < syncQueue.length; i += batchSize) {
        const batch = syncQueue.slice(i, i + batchSize);
        const batchResult = await this.processSyncBatch(batch);
        
        result.synced += batchResult.synced;
        result.conflicts += batchResult.conflicts;
        result.errors.push(...batchResult.errors);
      }

      // Sync each table
      for (const table of tablesToSync) {
        try {
          const tableResult = await this.syncTable(table);
          result.synced += tableResult.synced;
          result.conflicts += tableResult.conflicts;
          result.errors.push(...tableResult.errors);
        } catch (error) {
          console.error(`Error syncing table ${table}:`, error);
          result.errors.push(`Failed to sync ${table}: ${error.message}`);
        }
      }

      // Update last sync time
      await advancedIndexedDBService.setSetting('lastSync', new Date());

      console.log('Sync completed:', result);
    } catch (error) {
      console.error('Sync failed:', error);
      result.success = false;
      result.errors.push(`Sync failed: ${error.message}`);
    } finally {
      this.syncInProgress = false;
      this.notifyListeners();
    }

    return result;
  }

  // Sync high priority items only
  async syncHighPriority(): Promise<SyncResult> {
    const highPriorityQueue = await advancedIndexedDBService.getSyncQueue('high');
    
    if (highPriorityQueue.length === 0) {
      return { success: true, synced: 0, conflicts: 0, errors: [] };
    }

    return this.processSyncBatch(highPriorityQueue);
  }

  // Process a batch of sync items
  private async processSyncBatch(batch: any[]): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      synced: 0,
      conflicts: 0,
      errors: []
    };

    for (const item of batch) {
      try {
        const itemResult = await this.processSyncItem(item);
        
        if (itemResult.success) {
          result.synced++;
          await advancedIndexedDBService.removeFromSyncQueue(item.id);
        } else if (itemResult.conflict) {
          result.conflicts++;
          await this.handleConflict(item, itemResult.conflictData);
        } else {
          result.errors.push(itemResult.error || 'Unknown error');
          await this.handleSyncError(item, itemResult.error);
        }
      } catch (error) {
        console.error('Error processing sync item:', error);
        result.errors.push(`Failed to process ${item.id}: ${error.message}`);
        await this.handleSyncError(item, error.message);
      }
    }

    return result;
  }

  // Process individual sync item
  private async processSyncItem(item: any): Promise<{ success: boolean; conflict?: boolean; conflictData?: any; error?: string }> {
    try {
      const { action, table, recordId, data } = item;

      switch (action) {
        case 'create':
          return await this.createRemoteRecord(table, data);
        case 'update':
          return await this.updateRemoteRecord(table, recordId, data);
        case 'delete':
          return await this.deleteRemoteRecord(table, recordId);
        default:
          return { success: false, error: `Unknown action: ${action}` };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Create remote record
  private async createRemoteRecord(table: string, data: any): Promise<{ success: boolean; conflict?: boolean; conflictData?: any; error?: string }> {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          // Record already exists, treat as update
          return await this.updateRemoteRecord(table, data.id, data);
        }
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Update remote record
  private async updateRemoteRecord(table: string, recordId: string, data: any): Promise<{ success: boolean; conflict?: boolean; conflictData?: any; error?: string }> {
    try {
      // First, get the current remote version
      const { data: remoteData, error: fetchError } = await supabase
        .from(table)
        .select('*')
        .eq('id', recordId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // Not found is ok
        return { success: false, error: fetchError.message };
      }

      // Check for conflicts
      if (remoteData && this.hasConflict(data, remoteData)) {
        return {
          success: false,
          conflict: true,
          conflictData: { local: data, remote: remoteData }
        };
      }

      // Update the record
      const { error: updateError } = await supabase
        .from(table)
        .update(data)
        .eq('id', recordId);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Delete remote record
  private async deleteRemoteRecord(table: string, recordId: string): Promise<{ success: boolean; conflict?: boolean; conflictData?: any; error?: string }> {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', recordId);

      if (error && error.code !== 'PGRST116') { // Not found is ok for delete
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Sync specific table
  private async syncTable(table: string): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      synced: 0,
      conflicts: 0,
      errors: []
    };

    try {
      // Get last sync time for this table
      const lastSync = await advancedIndexedDBService.getSetting(`lastSync_${table}`);
      
      // Fetch remote changes since last sync
      let query = supabase.from(table).select('*');
      
      if (lastSync) {
        query = query.gte('updated_at', lastSync);
      }

      const { data: remoteData, error } = await query;

      if (error) {
        result.errors.push(`Failed to fetch remote data for ${table}: ${error.message}`);
        return result;
      }

      // Process remote changes
      for (const remoteRecord of remoteData || []) {
        try {
          await this.processRemoteChange(table, remoteRecord);
          result.synced++;
        } catch (error) {
          console.error(`Error processing remote change for ${table}:`, error);
          result.errors.push(`Failed to process remote change: ${error.message}`);
        }
      }

      // Update last sync time for this table
      await advancedIndexedDBService.setSetting(`lastSync_${table}`, new Date());

    } catch (error) {
      console.error(`Error syncing table ${table}:`, error);
      result.errors.push(`Table sync failed: ${error.message}`);
    }

    return result;
  }

  // Process remote change
  private async processRemoteChange(table: string, remoteRecord: any): Promise<void> {
    const localRecord = await this.getLocalRecord(table, remoteRecord.id);

    if (!localRecord) {
      // New remote record, store locally
      await this.storeLocalRecord(table, remoteRecord);
    } else if (this.hasConflict(localRecord, remoteRecord)) {
      // Conflict detected, add to conflicts
      await advancedIndexedDBService.addConflict(
        table,
        remoteRecord.id,
        localRecord,
        remoteRecord,
        'update'
      );
    } else {
      // No conflict, update local record
      await this.storeLocalRecord(table, remoteRecord);
    }
  }

  // Get local record
  private async getLocalRecord(table: string, recordId: string): Promise<any | null> {
    switch (table) {
      case 'userProgress':
        const progress = await advancedIndexedDBService.getUserProgress('', recordId);
        return progress.length > 0 ? progress[0] : null;
      case 'settings':
        return await advancedIndexedDBService.getSetting(recordId);
      default:
        return null;
    }
  }

  // Store local record
  private async storeLocalRecord(table: string, record: any): Promise<void> {
    switch (table) {
      case 'userProgress':
        await advancedIndexedDBService.storeUserProgress(record);
        break;
      case 'settings':
        await advancedIndexedDBService.setSetting(record.key, record.value);
        break;
    }
  }

  // Check for conflicts
  private hasConflict(local: any, remote: any): boolean {
    // Simple version-based conflict detection
    if (local.version && remote.version) {
      return local.version !== remote.version;
    }

    // Timestamp-based conflict detection
    if (local.updated_at && remote.updated_at) {
      const localTime = new Date(local.updated_at).getTime();
      const remoteTime = new Date(remote.updated_at).getTime();
      const timeDiff = Math.abs(localTime - remoteTime);
      
      // Consider it a conflict if timestamps differ by more than 1 minute
      // and the local version is newer
      return timeDiff > 60000 && localTime > remoteTime;
    }

    return false;
  }

  // Handle conflicts
  private async handleConflict(item: any, conflictData: any): Promise<void> {
    const { table, recordId } = item;
    const { local, remote } = conflictData;

    // Try automatic resolution first
    const resolver = this.conflictResolvers.get(table);
    if (resolver) {
      try {
        const resolved = resolver(local, remote);
        await advancedIndexedDBService.resolveConflict(item.id, 'merge', resolved);
        console.log(`Auto-resolved conflict for ${table}/${recordId}`);
        return;
      } catch (error) {
        console.error('Auto-resolution failed:', error);
      }
    }

    // Add to conflicts for manual resolution
    await advancedIndexedDBService.addConflict(table, recordId, local, remote, 'update');
    console.log(`Conflict added for manual resolution: ${table}/${recordId}`);
  }

  // Handle sync errors
  private async handleSyncError(item: any, error: string): Promise<void> {
    const retryCount = item.retryCount || 0;
    const maxRetries = 5;

    if (retryCount < maxRetries) {
      // Exponential backoff
      const delay = Math.pow(2, retryCount) * 1000;
      
      setTimeout(async () => {
        await advancedIndexedDBService.updateSyncQueueItem(item.id, {
          retryCount: retryCount + 1,
          lastError: error
        });
      }, delay);
    } else {
      // Max retries reached, remove from queue
      console.error(`Max retries reached for sync item ${item.id}, removing from queue`);
      await advancedIndexedDBService.removeFromSyncQueue(item.id);
    }
  }

  // Get sync status
  async getSyncStatus(): Promise<SyncStatus> {
    const [pendingItems, conflicts, lastSync] = await Promise.all([
      advancedIndexedDBService.getSyncQueue().then(queue => queue.length),
      advancedIndexedDBService.getConflicts().then(conflicts => conflicts.length),
      advancedIndexedDBService.getSetting('lastSync')
    ]);

    return {
      isOnline: navigator.onLine,
      lastSync: lastSync ? new Date(lastSync) : null,
      isSyncing: this.syncInProgress,
      pendingItems,
      conflicts
    };
  }

  // Resolve conflicts manually
  async resolveConflicts(resolutions: ConflictResolution[]): Promise<void> {
    for (const resolution of resolutions) {
      await advancedIndexedDBService.resolveConflict(
        resolution.id,
        resolution.resolution,
        resolution.mergedData
      );
    }

    // Trigger sync after resolving conflicts
    if (navigator.onLine) {
      this.syncAll();
    }
  }

  // Add sync listener
  addSyncListener(listener: (status: SyncStatus) => void): void {
    this.syncListeners.add(listener);
  }

  // Remove sync listener
  removeSyncListener(listener: (status: SyncStatus) => void): void {
    this.syncListeners.delete(listener);
  }

  // Notify listeners
  private async notifyListeners(): Promise<void> {
    const status = await this.getSyncStatus();
    this.syncListeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in sync listener:', error);
      }
    });
  }

  // Force sync specific item
  async forceSyncItem(table: string, recordId: string, data: any, action: 'create' | 'update' | 'delete' = 'update'): Promise<boolean> {
    try {
      await advancedIndexedDBService.addToSyncQueue(action, table, recordId, data, 'high');
      
      if (navigator.onLine) {
        await this.syncHighPriority();
      }
      
      return true;
    } catch (error) {
      console.error('Error force syncing item:', error);
      return false;
    }
  }

  // Clear all sync data
  async clearSyncData(): Promise<void> {
    const syncQueue = await advancedIndexedDBService.getSyncQueue();
    for (const item of syncQueue) {
      await advancedIndexedDBService.removeFromSyncQueue(item.id);
    }

    const conflicts = await advancedIndexedDBService.getConflicts();
    for (const conflict of conflicts) {
      await advancedIndexedDBService.resolveConflict(conflict.id, 'local');
    }

    console.log('All sync data cleared');
  }

  // Export sync data for debugging
  async exportSyncData(): Promise<any> {
    const [syncQueue, conflicts, lastSync] = await Promise.all([
      advancedIndexedDBService.getSyncQueue(),
      advancedIndexedDBService.getConflicts(),
      advancedIndexedDBService.getSetting('lastSync')
    ]);

    return {
      syncQueue,
      conflicts,
      lastSync,
      status: await this.getSyncStatus()
    };
  }
}

// Create and export singleton instance
export const offlineSyncService = new OfflineSyncService();

export default offlineSyncService;
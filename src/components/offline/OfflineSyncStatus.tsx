import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle, Upload, Download, Sync } from 'lucide-react';
import { syncManager } from '../../services/syncManager';
import { offlineDB } from '../../services/offlineDatabase';

interface OfflineSyncStatusProps {
  className?: string;
  showDetails?: boolean;
}

interface SyncStatus {
  isOnline: boolean;
  lastSync: Date | null;
  isSyncing: boolean;
  pendingUploads: number;
  pendingDownloads: number;
  conflicts: number;
  errors: string[];
  syncProgress: number;
  nextAutoSync: Date | null;
}

interface SyncItem {
  id: string;
  type: 'progress' | 'notes' | 'bookmarks' | 'achievements';
  action: 'create' | 'update' | 'delete';
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  lastAttempt?: Date;
  error?: string;
}

export const OfflineSyncStatus: React.FC<OfflineSyncStatusProps> = ({
  className = '',
  showDetails = false
}) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    lastSync: null,
    isSyncing: false,
    pendingUploads: 0,
    pendingDownloads: 0,
    conflicts: 0,
    errors: [],
    syncProgress: 0,
    nextAutoSync: null
  });
  
  const [syncItems, setSyncItems] = useState<SyncItem[]>([]);
  const [showSyncDetails, setShowSyncDetails] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);

  useEffect(() => {
    loadSyncStatus();
    
    // Set up periodic status updates
    const interval = setInterval(loadSyncStatus, 5000);
    
    // Listen for online/offline events
    const handleOnline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: true }));
      if (autoSyncEnabled) {
        triggerSync();
      }
    };
    
    const handleOffline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [autoSyncEnabled]);

  const loadSyncStatus = async () => {
    try {
      // Get last sync time
      const lastSync = await syncManager.getLastSyncTime();
      
      // Count pending items
      const pendingProgress = await offlineDB.userProgress.where('syncStatus').equals('pending').count();
      const pendingNotes = await offlineDB.userNotes.where('syncStatus').equals('pending').count();
      const pendingBookmarks = await offlineDB.userBookmarks.where('syncStatus').equals('pending').count();
      const pendingAchievements = await offlineDB.userAchievements.where('syncStatus').equals('pending').count();
      
      // Count conflicts
      const conflicts = await offlineDB.syncConflicts.count();
      
      // Get sync queue items
      const queueItems = await offlineDB.syncQueue.toArray();
      
      // Calculate next auto sync (every 30 minutes when online)
      const nextAutoSync = syncStatus.isOnline && autoSyncEnabled 
        ? new Date(Date.now() + 30 * 60 * 1000)
        : null;

      setSyncStatus(prev => ({
        ...prev,
        lastSync,
        pendingUploads: pendingProgress + pendingNotes + pendingBookmarks + pendingAchievements,
        pendingDownloads: 0, // This would be calculated based on available updates
        conflicts,
        nextAutoSync
      }));

      // Convert queue items to sync items
      const items: SyncItem[] = queueItems.map(item => ({
        id: item.id,
        type: item.type as any,
        action: item.action,
        status: item.status as any,
        lastAttempt: item.lastAttempt,
        error: item.error
      }));
      
      setSyncItems(items);

    } catch (error) {
      console.error('Failed to load sync status:', error);
    }
  };

  const triggerSync = async () => {
    if (!syncStatus.isOnline) {
      return;
    }

    try {
      setSyncStatus(prev => ({ ...prev, isSyncing: true, syncProgress: 0, errors: [] }));
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setSyncStatus(prev => ({
          ...prev,
          syncProgress: Math.min(prev.syncProgress + 10, 90)
        }));
      }, 200);

      await syncManager.performFullSync();
      
      clearInterval(progressInterval);
      setSyncStatus(prev => ({ 
        ...prev, 
        isSyncing: false, 
        syncProgress: 100,
        lastSync: new Date()
      }));
      
      // Reset progress after a delay
      setTimeout(() => {
        setSyncStatus(prev => ({ ...prev, syncProgress: 0 }));
      }, 2000);
      
      await loadSyncStatus();
      
    } catch (error) {
      setSyncStatus(prev => ({ 
        ...prev, 
        isSyncing: false, 
        syncProgress: 0,
        errors: [error instanceof Error ? error.message : 'Sync failed']
      }));
    }
  };

  const resolveConflict = async (conflictId: string, resolution: 'local' | 'remote' | 'merge') => {
    try {
      // This would integrate with the conflict resolver
      // For now, just remove the conflict
      await offlineDB.syncConflicts.delete(conflictId);
      await loadSyncStatus();
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    }
  };

  const retryFailedSync = async (itemId: string) => {
    try {
      const item = await offlineDB.syncQueue.get(itemId);
      if (item) {
        item.status = 'pending';
        item.error = undefined;
        await offlineDB.syncQueue.put(item);
        await loadSyncStatus();
      }
    } catch (error) {
      console.error('Failed to retry sync:', error);
    }
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getSyncStatusColor = (): string => {
    if (!syncStatus.isOnline) return 'text-red-500';
    if (syncStatus.isSyncing) return 'text-blue-500';
    if (syncStatus.conflicts > 0) return 'text-yellow-500';
    if (syncStatus.pendingUploads > 0) return 'text-orange-500';
    return 'text-green-500';
  };

  const getSyncStatusIcon = () => {
    if (!syncStatus.isOnline) return <WifiOff className="h-5 w-5" />;
    if (syncStatus.isSyncing) return <RefreshCw className="h-5 w-5 animate-spin" />;
    if (syncStatus.conflicts > 0) return <AlertTriangle className="h-5 w-5" />;
    if (syncStatus.pendingUploads > 0) return <Upload className="h-5 w-5" />;
    return <CheckCircle className="h-5 w-5" />;
  };

  const getSyncStatusText = (): string => {
    if (!syncStatus.isOnline) return 'Offline';
    if (syncStatus.isSyncing) return 'Syncing...';
    if (syncStatus.conflicts > 0) return `${syncStatus.conflicts} conflicts`;
    if (syncStatus.pendingUploads > 0) return `${syncStatus.pendingUploads} pending`;
    return 'Up to date';
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Main Status Bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={getSyncStatusColor()}>
              {getSyncStatusIcon()}
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {getSyncStatusText()}
              </div>
              {syncStatus.lastSync && (
                <div className="text-sm text-gray-500">
                  Last sync: {formatTimeAgo(syncStatus.lastSync)}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Auto Sync Toggle */}
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={autoSyncEnabled}
                onChange={(e) => setAutoSyncEnabled(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span>Auto sync</span>
            </label>

            {/* Manual Sync Button */}
            <button
              onClick={triggerSync}
              disabled={!syncStatus.isOnline || syncStatus.isSyncing}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-1"
            >
              <Sync className="h-4 w-4" />
              <span>Sync</span>
            </button>

            {/* Details Toggle */}
            {showDetails && (
              <button
                onClick={() => setShowSyncDetails(!showSyncDetails)}
                className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200"
              >
                {showSyncDetails ? 'Hide' : 'Details'}
              </button>
            )}
          </div>
        </div>

        {/* Sync Progress */}
        {syncStatus.isSyncing && (
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${syncStatus.syncProgress}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Syncing... {syncStatus.syncProgress}%
            </div>
          </div>
        )}

        {/* Errors */}
        {syncStatus.errors.length > 0 && (
          <div className="mt-3 space-y-1">
            {syncStatus.errors.map((error, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm text-red-600">
                <XCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detailed Status */}
      {showDetails && showSyncDetails && (
        <div className="p-4 space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {syncStatus.pendingUploads}
              </div>
              <div className="text-sm text-gray-600">Pending Uploads</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {syncStatus.pendingDownloads}
              </div>
              <div className="text-sm text-gray-600">Pending Downloads</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {syncStatus.conflicts}
              </div>
              <div className="text-sm text-gray-600">Conflicts</div>
            </div>
          </div>

          {/* Next Auto Sync */}
          {syncStatus.nextAutoSync && autoSyncEnabled && (
            <div className="text-sm text-gray-600 text-center">
              Next auto sync: {syncStatus.nextAutoSync.toLocaleTimeString()}
            </div>
          )}

          {/* Sync Items */}
          {syncItems.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Sync Queue</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {syncItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      {item.status === 'pending' && <Clock className="h-4 w-4 text-gray-500" />}
                      {item.status === 'syncing' && <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />}
                      {item.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                      {item.status === 'failed' && <XCircle className="h-4 w-4 text-red-500" />}
                      
                      <div>
                        <div className="text-sm font-medium">
                          {item.type} - {item.action}
                        </div>
                        {item.error && (
                          <div className="text-xs text-red-600">{item.error}</div>
                        )}
                      </div>
                    </div>

                    {item.status === 'failed' && (
                      <button
                        onClick={() => retryFailedSync(item.id)}
                        className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conflicts */}
          {syncStatus.conflicts > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Conflicts</h4>
              <div className="text-sm text-gray-600 mb-2">
                {syncStatus.conflicts} items need manual resolution
              </div>
              <button
                onClick={() => {/* Navigate to conflict resolution */}}
                className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
              >
                Resolve Conflicts
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OfflineSyncStatus;
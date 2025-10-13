import React, { useState } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Download, 
  Sync, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  HardDrive,
  Settings,
  X
} from 'lucide-react';
import { useAdvancedOffline } from '../../hooks/useAdvancedOffline';

interface OfflineStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function OfflineStatusIndicator({ 
  className = '', 
  showDetails = false,
  position = 'top-right'
}: OfflineStatusIndicatorProps) {
  const { 
    isOnline, 
    isOfflineReady, 
    syncStatus, 
    storageUsage, 
    downloadProgress,
    actions 
  } = useAdvancedOffline();
  
  const [showPanel, setShowPanel] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const getStatusColor = () => {
    if (!isOnline) return 'text-orange-500';
    if (syncStatus.isSyncing) return 'text-blue-500';
    if (syncStatus.conflicts > 0) return 'text-red-500';
    if (syncStatus.pendingItems > 0) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="w-4 h-4" />;
    if (syncStatus.isSyncing) return <Sync className="w-4 h-4 animate-spin" />;
    if (syncStatus.conflicts > 0) return <AlertTriangle className="w-4 h-4" />;
    return <Wifi className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (syncStatus.isSyncing) return 'Syncing...';
    if (syncStatus.conflicts > 0) return `${syncStatus.conflicts} conflicts`;
    if (syncStatus.pendingItems > 0) return `${syncStatus.pendingItems} pending`;
    return 'Online';
  };

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const handleOptimizeStorage = async () => {
    setIsOptimizing(true);
    try {
      await actions.optimizeStorage();
    } catch (error) {
      console.error('Failed to optimize storage:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleForceSync = async () => {
    try {
      await actions.syncAll(true);
    } catch (error) {
      console.error('Failed to force sync:', error);
    }
  };

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50 ${className}`}>
      {/* Status Indicator */}
      <div 
        className={`flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border cursor-pointer transition-all hover:shadow-xl ${getStatusColor()}`}
        onClick={() => setShowPanel(!showPanel)}
      >
        {getStatusIcon()}
        {showDetails && (
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {getStatusText()}
          </span>
        )}
        
        {/* Download Progress */}
        {downloadProgress.total > 0 && downloadProgress.completed < downloadProgress.total && (
          <div className="flex items-center gap-1">
            <Download className="w-3 h-3" />
            <span className="text-xs">
              {downloadProgress.percentage}%
            </span>
          </div>
        )}
      </div>

      {/* Detailed Panel */}
      {showPanel && (
        <div className="absolute top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Offline Status
            </h3>
            <button
              onClick={() => setShowPanel(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Connection Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <Wifi className="w-4 h-4 text-green-500" />
                ) : (
                  <WifiOff className="w-4 h-4 text-orange-500" />
                )}
                <span className="text-sm font-medium">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {isOfflineReady ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                )}
                <span className="text-xs text-gray-500">
                  {isOfflineReady ? 'Ready' : 'Not Ready'}
                </span>
              </div>
            </div>

            {/* Sync Status */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Sync Status</span>
                <button
                  onClick={handleForceSync}
                  disabled={syncStatus.isSyncing || !isOnline}
                  className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                >
                  Force Sync
                </button>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Clock className="w-3 h-3" />
                <span>Last sync: {formatLastSync(syncStatus.lastSync)}</span>
              </div>

              {syncStatus.pendingItems > 0 && (
                <div className="text-sm text-yellow-600">
                  {syncStatus.pendingItems} items pending sync
                </div>
              )}

              {syncStatus.conflicts > 0 && (
                <div className="text-sm text-red-600">
                  {syncStatus.conflicts} conflicts need resolution
                </div>
              )}
            </div>

            {/* Storage Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4" />
                  <span className="text-sm font-medium">Storage</span>
                </div>
                <button
                  onClick={handleOptimizeStorage}
                  disabled={isOptimizing}
                  className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                >
                  {isOptimizing ? 'Optimizing...' : 'Optimize'}
                </button>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span>{storageUsage.used} MB used</span>
                  <span>{storageUsage.quota} MB total</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      storageUsage.percentage > 80 
                        ? 'bg-red-500' 
                        : storageUsage.percentage > 60 
                        ? 'bg-yellow-500' 
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(storageUsage.percentage, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 text-center">
                  {storageUsage.percentage}% used
                </div>
              </div>
            </div>

            {/* Download Progress */}
            {downloadProgress.total > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  <span className="text-sm font-medium">Downloads</span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>{downloadProgress.completed} of {downloadProgress.total}</span>
                    <span>{downloadProgress.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="h-2 bg-blue-500 rounded-full transition-all"
                      style={{ width: `${downloadProgress.percentage}%` }}
                    />
                  </div>
                  {downloadProgress.current && (
                    <div className="text-xs text-gray-500">
                      Downloading: {downloadProgress.current}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => actions.downloadAllLessons()}
                disabled={!isOnline}
                className="flex-1 px-3 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Download All
              </button>
              <button
                onClick={() => actions.clearCache()}
                className="flex-1 px-3 py-2 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Clear Cache
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OfflineStatusIndicator;
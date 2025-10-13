import React from 'react';
import { useOffline } from '@/hooks/useOffline';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Progress } from '@/components/ui/progress';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Download, 
  Upload, 
  AlertTriangle,
  CheckCircle,
  Clock,
  HardDrive,
  Settings
} from 'lucide-react';

interface OfflineStatusProps {
  showDetails?: boolean;
  compact?: boolean;
  className?: string;
}

export function OfflineStatus({ showDetails = false, compact = false, className = '' }: OfflineStatusProps) {
  const {
    status,
    isOnline,
    isOffline,
    syncInProgress,
    conflicts,
    sync,
    forceSync,
    lastSyncTime,
    error,
    estimateStorageQuota,
  } = useOffline();

  const [storageQuota, setStorageQuota] = React.useState<{ usage: number; quota: number } | null>(null);

  React.useEffect(() => {
    const loadStorageQuota = async () => {
      try {
        const quota = await estimateStorageQuota();
        setStorageQuota(quota);
      } catch (err) {
        console.error('Failed to get storage quota:', err);
      }
    };

    loadStorageQuota();
  }, [estimateStorageQuota]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatLastSync = (timestamp: Date | null): string => {
    if (!timestamp) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getStatusColor = (): string => {
    if (error) return 'destructive';
    if (isOffline) return 'secondary';
    if (conflicts.length > 0) return 'warning';
    if (syncInProgress) return 'default';
    return 'success';
  };

  const getStatusIcon = () => {
    if (syncInProgress) return <RefreshCw className="h-4 w-4 animate-spin" />;
    if (error) return <AlertTriangle className="h-4 w-4" />;
    if (isOffline) return <WifiOff className="h-4 w-4" />;
    if (conflicts.length > 0) return <AlertTriangle className="h-4 w-4" />;
    return <Wifi className="h-4 w-4" />;
  };

  const getStatusText = (): string => {
    if (syncInProgress) return 'Syncing...';
    if (error) return 'Sync Error';
    if (isOffline) return 'Offline';
    if (conflicts.length > 0) return `${conflicts.length} Conflicts`;
    return 'Online';
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Badge variant={getStatusColor()} className="flex items-center gap-1">
          {getStatusIcon()}
          {getStatusText()}
        </Badge>
        
        {status.pendingChanges > 0 && (
          <Badge variant="outline" className="flex items-center gap-1">
            <Upload className="h-3 w-3" />
            {status.pendingChanges}
          </Badge>
        )}
        
        {!syncInProgress && (isOnline || error) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => sync()}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Offline Status</h3>
            <Badge variant={getStatusColor()} className="flex items-center gap-1">
              {getStatusIcon()}
              {getStatusText()}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            {!syncInProgress && (isOnline || error) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => sync()}
                className="flex items-center gap-1"
              >
                <RefreshCw className="h-4 w-4" />
                Sync
              </Button>
            )}
            
            {error && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => forceSync()}
                className="flex items-center gap-1"
              >
                <Upload className="h-4 w-4" />
                Force Sync
              </Button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Sync Error</span>
            </div>
            <p className="text-sm text-destructive/80 mt-1">{error}</p>
          </div>
        )}

        {/* Conflicts */}
        {conflicts.length > 0 && (
          <div className="p-3 bg-warning/10 border border-warning/20 rounded-md">
            <div className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                {conflicts.length} Sync Conflict{conflicts.length > 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-sm text-warning/80 mt-1">
              Some changes couldn't be synced automatically. Manual resolution required.
            </p>
          </div>
        )}

        {showDetails && (
          <>
            {/* Sync Information */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Last Sync:</span>
                <span>{formatLastSync(lastSyncTime)}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Pending:</span>
                <span>{status.pendingChanges} changes</span>
              </div>
            </div>

            {/* Storage Usage */}
            {storageQuota && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Storage Usage</span>
                  </div>
                  <span>
                    {formatBytes(storageQuota.usage)} / {formatBytes(storageQuota.quota)}
                  </span>
                </div>
                
                <Progress 
                  value={(storageQuota.usage / storageQuota.quota) * 100} 
                  className="h-2"
                />
              </div>
            )}

            {/* Offline Storage Stats */}
            {status.storageUsage && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Stories:</span>
                  <span className="ml-2">{status.storageUsage.stories || 0}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Lessons:</span>
                  <span className="ml-2">{status.storageUsage.lessons || 0}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Progress:</span>
                  <span className="ml-2">{status.storageUsage.userProgress || 0}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Assets:</span>
                  <span className="ml-2">{status.storageUsage.offlineAssets || 0}</span>
                </div>
              </div>
            )}

            {/* Status Indicators */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                {status.isInitialized ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Clock className="h-4 w-4 text-yellow-500" />
                )}
                <span className="text-muted-foreground">
                  {status.isInitialized ? 'Initialized' : 'Initializing'}
                </span>
              </div>
              
              <div className="flex items-center gap-1">
                {isOnline ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
                <span className="text-muted-foreground">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
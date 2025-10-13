import React, { useState } from 'react';
import { useOffline } from '@/hooks/useOffline';
import { SyncConflict } from '@/lib/offline/OfflineSyncService';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/Separator';
import { 
  AlertTriangle, 
  Clock, 
  User, 
  Server, 
  GitMerge,
  Check,
  X,
  Eye,
  Calendar
} from 'lucide-react';

interface ConflictResolutionProps {
  className?: string;
}

export function ConflictResolution({ className = '' }: ConflictResolutionProps) {
  const { conflicts, resolveConflict, error } = useOffline();
  const [selectedConflict, setSelectedConflict] = useState<SyncConflict | null>(null);
  const [resolving, setResolving] = useState<string | null>(null);
  const [mergedData, setMergedData] = useState<any>(null);

  const handleResolveConflict = async (
    conflictId: string, 
    resolution: 'client' | 'server' | 'merge'
  ) => {
    try {
      setResolving(conflictId);
      await resolveConflict(conflictId, resolution, mergedData);
      setSelectedConflict(null);
      setMergedData(null);
    } catch (err) {
      console.error('Failed to resolve conflict:', err);
    } finally {
      setResolving(null);
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  const getConflictTypeColor = (type: string): string => {
    switch (type) {
      case 'version': return 'destructive';
      case 'timestamp': return 'warning';
      case 'content': return 'secondary';
      default: return 'default';
    }
  };

  const renderDataComparison = (localData: any, serverData: any) => {
    const localKeys = Object.keys(localData || {});
    const serverKeys = Object.keys(serverData || {});
    const allKeys = Array.from(new Set([...localKeys, ...serverKeys]));

    return (
      <div className="space-y-4">
        <Tabs defaultValue="side-by-side" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="side-by-side">Side by Side</TabsTrigger>
            <TabsTrigger value="unified">Unified View</TabsTrigger>
          </TabsList>
          
          <TabsContent value="side-by-side" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Local Data */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-4 w-4" />
                  <h4 className="font-medium">Local Changes</h4>
                  <Badge variant="outline">Client</Badge>
                </div>
                <ScrollArea className="h-64">
                  <div className="space-y-2 text-sm">
                    {allKeys.map(key => (
                      <div key={key} className="flex justify-between">
                        <span className="font-medium text-muted-foreground">{key}:</span>
                        <span className={
                          JSON.stringify(localData?.[key]) !== JSON.stringify(serverData?.[key])
                            ? 'text-red-600 font-medium'
                            : ''
                        }>
                          {JSON.stringify(localData?.[key] || 'undefined')}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </Card>

              {/* Server Data */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Server className="h-4 w-4" />
                  <h4 className="font-medium">Server Changes</h4>
                  <Badge variant="outline">Server</Badge>
                </div>
                <ScrollArea className="h-64">
                  <div className="space-y-2 text-sm">
                    {allKeys.map(key => (
                      <div key={key} className="flex justify-between">
                        <span className="font-medium text-muted-foreground">{key}:</span>
                        <span className={
                          JSON.stringify(localData?.[key]) !== JSON.stringify(serverData?.[key])
                            ? 'text-blue-600 font-medium'
                            : ''
                        }>
                          {JSON.stringify(serverData?.[key] || 'undefined')}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="unified" className="space-y-4">
            <Card className="p-4">
              <ScrollArea className="h-64">
                <div className="space-y-3 text-sm">
                  {allKeys.map(key => {
                    const localValue = localData?.[key];
                    const serverValue = serverData?.[key];
                    const isDifferent = JSON.stringify(localValue) !== JSON.stringify(serverValue);
                    
                    return (
                      <div key={key} className="space-y-1">
                        <div className="font-medium text-muted-foreground">{key}:</div>
                        {isDifferent ? (
                          <div className="pl-4 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-red-600">- Local:</span>
                              <span className="text-red-600">{JSON.stringify(localValue)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-blue-600">+ Server:</span>
                              <span className="text-blue-600">{JSON.stringify(serverValue)}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="pl-4 text-muted-foreground">
                            {JSON.stringify(localValue)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  if (conflicts.length === 0) {
    return (
      <Card className={`p-6 text-center ${className}`}>
        <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Conflicts</h3>
        <p className="text-muted-foreground">
          All your changes have been synchronized successfully.
        </p>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-warning" />
        <h2 className="text-xl font-semibold">Sync Conflicts</h2>
        <Badge variant="warning">{conflicts.length}</Badge>
      </div>

      <p className="text-muted-foreground">
        The following items have conflicts that need to be resolved manually.
      </p>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">Resolution Error</span>
          </div>
          <p className="text-sm text-destructive/80 mt-1">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {conflicts.map((conflict) => (
          <Card key={conflict.id} className="p-4">
            <div className="space-y-4">
              {/* Conflict Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  <div>
                    <h3 className="font-medium">
                      {conflict.table} - {conflict.id}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{formatTimestamp(conflict.timestamp)}</span>
                      <Badge variant={getConflictTypeColor(conflict.conflictType)} size="sm">
                        {conflict.conflictType}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedConflict(
                    selectedConflict?.id === conflict.id ? null : conflict
                  )}
                  className="flex items-center gap-1"
                >
                  <Eye className="h-4 w-4" />
                  {selectedConflict?.id === conflict.id ? 'Hide' : 'View'}
                </Button>
              </div>

              {/* Conflict Details */}
              {selectedConflict?.id === conflict.id && (
                <div className="space-y-4">
                  <Separator />
                  
                  {renderDataComparison(conflict.localData, conflict.serverData)}
                  
                  <Separator />
                  
                  {/* Resolution Actions */}
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Choose Resolution:</h4>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResolveConflict(conflict.id, 'client')}
                        disabled={resolving === conflict.id}
                        className="flex items-center gap-1"
                      >
                        <User className="h-4 w-4" />
                        Use Local
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResolveConflict(conflict.id, 'server')}
                        disabled={resolving === conflict.id}
                        className="flex items-center gap-1"
                      >
                        <Server className="h-4 w-4" />
                        Use Server
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // For now, merge uses server data
                          // In a real implementation, you'd show a merge editor
                          setMergedData({ ...conflict.serverData, ...conflict.localData });
                          handleResolveConflict(conflict.id, 'merge');
                        }}
                        disabled={resolving === conflict.id}
                        className="flex items-center gap-1"
                      >
                        <GitMerge className="h-4 w-4" />
                        Merge
                      </Button>
                    </div>
                  </div>
                  
                  {resolving === conflict.id && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      <span>Resolving conflict...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Bulk Actions */}
      {conflicts.length > 1 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Bulk Actions</h4>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  conflicts.forEach(conflict => {
                    handleResolveConflict(conflict.id, 'client');
                  });
                }}
                disabled={resolving !== null}
                className="flex items-center gap-1"
              >
                <User className="h-4 w-4" />
                Use All Local
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  conflicts.forEach(conflict => {
                    handleResolveConflict(conflict.id, 'server');
                  });
                }}
                disabled={resolving !== null}
                className="flex items-center gap-1"
              >
                <Server className="h-4 w-4" />
                Use All Server
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
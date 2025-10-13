import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  X, 
  ArrowRight, 
  Clock,
  User,
  Merge,
  Download,
  Upload
} from 'lucide-react';
import { useAdvancedOffline } from '../../hooks/useAdvancedOffline';
import { ConflictResolution } from '../../services/offline/OfflineSyncService';

interface ConflictResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResolved?: () => void;
}

interface ConflictItem {
  id: string;
  table: string;
  recordId: string;
  localData: any;
  remoteData: any;
  action: string;
  createdAt: Date;
}

export function ConflictResolutionModal({ 
  isOpen, 
  onClose, 
  onResolved 
}: ConflictResolutionModalProps) {
  const { actions } = useAdvancedOffline();
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [selectedConflict, setSelectedConflict] = useState<ConflictItem | null>(null);
  const [resolutions, setResolutions] = useState<Map<string, ConflictResolution>>(new Map());
  const [isResolving, setIsResolving] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');

  // Load conflicts when modal opens
  useEffect(() => {
    if (isOpen) {
      loadConflicts();
    }
  }, [isOpen]);

  const loadConflicts = async () => {
    try {
      const conflictData = await actions.getConflicts();
      setConflicts(conflictData);
    } catch (error) {
      console.error('Failed to load conflicts:', error);
    }
  };

  const handleResolutionChange = (conflictId: string, resolution: ConflictResolution) => {
    setResolutions(prev => new Map(prev.set(conflictId, resolution)));
  };

  const handleResolveAll = async () => {
    setIsResolving(true);
    try {
      const resolutionArray = Array.from(resolutions.values());
      await actions.resolveConflicts(resolutionArray);
      
      // Reload conflicts to see updated state
      await loadConflicts();
      
      // Notify parent component
      onResolved?.();
      
      // Close modal if all conflicts are resolved
      if (resolutionArray.length === conflicts.length) {
        onClose();
      }
    } catch (error) {
      console.error('Failed to resolve conflicts:', error);
    } finally {
      setIsResolving(false);
    }
  };

  const handleAutoResolve = (conflict: ConflictItem) => {
    // Auto-resolve based on data type and timestamps
    let resolution: 'local' | 'remote' | 'merge' = 'remote';
    let mergedData = undefined;

    if (conflict.table === 'userProgress') {
      // For user progress, merge the data
      resolution = 'merge';
      mergedData = {
        ...conflict.remoteData,
        progress: Math.max(
          conflict.localData.progress || 0, 
          conflict.remoteData.progress || 0
        ),
        completedExercises: [
          ...new Set([
            ...(conflict.localData.completedExercises || []),
            ...(conflict.remoteData.completedExercises || [])
          ])
        ],
        timeSpent: (conflict.localData.timeSpent || 0) + (conflict.remoteData.timeSpent || 0),
        lastStudiedAt: new Date(Math.max(
          new Date(conflict.localData.lastStudiedAt || 0).getTime(),
          new Date(conflict.remoteData.lastStudiedAt || 0).getTime()
        ))
      };
    } else if (conflict.localData.updatedAt && conflict.remoteData.updatedAt) {
      // Use the most recent version
      const localTime = new Date(conflict.localData.updatedAt).getTime();
      const remoteTime = new Date(conflict.remoteData.updatedAt).getTime();
      resolution = localTime > remoteTime ? 'local' : 'remote';
    }

    handleResolutionChange(conflict.id, {
      id: conflict.id,
      table: conflict.table,
      recordId: conflict.recordId,
      resolution,
      mergedData
    });
  };

  const formatTimestamp = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString();
  };

  const getConflictIcon = (table: string) => {
    switch (table) {
      case 'userProgress':
        return <User className="w-4 h-4" />;
      case 'settings':
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const renderDataComparison = (local: any, remote: any) => {
    const keys = new Set([...Object.keys(local), ...Object.keys(remote)]);
    
    return (
      <div className="space-y-2">
        {Array.from(keys).map(key => {
          const localValue = local[key];
          const remoteValue = remote[key];
          const isDifferent = JSON.stringify(localValue) !== JSON.stringify(remoteValue);
          
          return (
            <div key={key} className={`p-2 rounded ${isDifferent ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}>
              <div className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-1">
                {key}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Download className="w-3 h-3" />
                    Local
                  </div>
                  <div className="font-mono text-xs bg-white dark:bg-gray-900 p-2 rounded border">
                    {JSON.stringify(localValue, null, 2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Upload className="w-3 h-3" />
                    Remote
                  </div>
                  <div className="font-mono text-xs bg-white dark:bg-gray-900 p-2 rounded border">
                    {JSON.stringify(remoteValue, null, 2)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-orange-500" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Resolve Conflicts
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {conflicts.length} conflicts need your attention
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-200px)]">
          {/* Conflict List */}
          <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <div className="p-4 space-y-2">
              {conflicts.map(conflict => {
                const hasResolution = resolutions.has(conflict.id);
                const resolution = resolutions.get(conflict.id);
                
                return (
                  <div
                    key={conflict.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedConflict?.id === conflict.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : hasResolution
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    onClick={() => {
                      setSelectedConflict(conflict);
                      setViewMode('detail');
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getConflictIcon(conflict.table)}
                        <span className="font-medium text-sm">
                          {conflict.table}
                        </span>
                      </div>
                      {hasResolution && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      <div>ID: {conflict.recordId}</div>
                      <div>Action: {conflict.action}</div>
                      <div>Created: {formatTimestamp(conflict.createdAt)}</div>
                      {hasResolution && (
                        <div className="text-green-600 dark:text-green-400 font-medium">
                          Resolution: {resolution?.resolution}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Conflict Detail */}
          <div className="flex-1 overflow-y-auto">
            {selectedConflict ? (
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {selectedConflict.table} Conflict
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Record ID: {selectedConflict.recordId}
                  </p>
                </div>

                {/* Resolution Options */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    Choose Resolution
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    {/* Use Local */}
                    <button
                      onClick={() => handleResolutionChange(selectedConflict.id, {
                        id: selectedConflict.id,
                        table: selectedConflict.table,
                        recordId: selectedConflict.recordId,
                        resolution: 'local'
                      })}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        resolutions.get(selectedConflict.id)?.resolution === 'local'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Download className="w-4 h-4" />
                        <span className="font-medium">Use Local Version</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Keep the changes made on this device
                      </p>
                    </button>

                    {/* Use Remote */}
                    <button
                      onClick={() => handleResolutionChange(selectedConflict.id, {
                        id: selectedConflict.id,
                        table: selectedConflict.table,
                        recordId: selectedConflict.recordId,
                        resolution: 'remote'
                      })}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        resolutions.get(selectedConflict.id)?.resolution === 'remote'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Upload className="w-4 h-4" />
                        <span className="font-medium">Use Remote Version</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Accept the changes from the server
                      </p>
                    </button>

                    {/* Auto Resolve */}
                    <button
                      onClick={() => handleAutoResolve(selectedConflict)}
                      className="p-3 rounded-lg border border-green-200 dark:border-green-700 hover:border-green-300 text-left transition-all"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Merge className="w-4 h-4" />
                        <span className="font-medium">Auto Resolve</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Let the system merge the changes intelligently
                      </p>
                    </button>
                  </div>
                </div>

                {/* Data Comparison */}
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    Data Comparison
                  </h4>
                  {renderDataComparison(selectedConflict.localData, selectedConflict.remoteData)}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a conflict to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {resolutions.size} of {conflicts.length} conflicts resolved
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleResolveAll}
              disabled={resolutions.size === 0 || isResolving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isResolving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Resolving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Resolve {resolutions.size} Conflicts
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConflictResolutionModal;
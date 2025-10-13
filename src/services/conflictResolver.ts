import { offlineDB, ConflictItem, OfflineUserProgress, OfflineNote, OfflineBookmark } from './offlineDatabase';
import { ConflictResolution } from './offlineManager';

export interface ConflictResolver {
  resolveByTimestamp(conflict: ConflictItem): ConflictResolution;
  resolveByUserChoice(conflict: ConflictItem, userChoice: 'local' | 'remote' | 'merge'): ConflictResolution;
  resolveByMerge(conflict: ConflictItem): ConflictResolution;
  mergeUserProgress(local: OfflineUserProgress, remote: OfflineUserProgress): OfflineUserProgress;
  mergeUserNotes(local: OfflineNote, remote: OfflineNote): OfflineNote;
  mergeBookmarks(local: OfflineBookmark[], remote: OfflineBookmark[]): OfflineBookmark[];
}

export interface ConflictAnalysis {
  conflictType: 'data_mismatch' | 'version_conflict' | 'deletion_conflict' | 'creation_conflict';
  severity: 'low' | 'medium' | 'high' | 'critical';
  autoResolvable: boolean;
  recommendedAction: 'use_local' | 'use_remote' | 'merge' | 'manual_review';
  conflictFields: string[];
  impactAssessment: string;
}

export interface MergeStrategy {
  strategy: 'timestamp_wins' | 'highest_value' | 'combine_arrays' | 'user_preference' | 'custom';
  field: string;
  priority: 'local' | 'remote' | 'auto';
}

class ConflictResolverImpl implements ConflictResolver {
  private mergeStrategies: Map<string, MergeStrategy[]> = new Map();

  constructor() {
    this.initializeMergeStrategies();
  }

  private initializeMergeStrategies(): void {
    // User Progress merge strategies
    this.mergeStrategies.set('progress', [
      { strategy: 'highest_value', field: 'score', priority: 'auto' },
      { strategy: 'highest_value', field: 'timeSpent', priority: 'auto' },
      { strategy: 'timestamp_wins', field: 'completedAt', priority: 'auto' },
      { strategy: 'combine_arrays', field: 'progressData', priority: 'auto' }
    ]);

    // Notes merge strategies
    this.mergeStrategies.set('note', [
      { strategy: 'timestamp_wins', field: 'content', priority: 'auto' },
      { strategy: 'timestamp_wins', field: 'position', priority: 'auto' },
      { strategy: 'timestamp_wins', field: 'updatedAt', priority: 'auto' }
    ]);

    // Bookmarks merge strategies
    this.mergeStrategies.set('bookmark', [
      { strategy: 'combine_arrays', field: 'tags', priority: 'auto' },
      { strategy: 'timestamp_wins', field: 'createdAt', priority: 'local' }
    ]);

    // Achievements merge strategies
    this.mergeStrategies.set('achievement', [
      { strategy: 'timestamp_wins', field: 'earnedAt', priority: 'auto' }
    ]);
  }

  analyzeConflict(conflict: ConflictItem): ConflictAnalysis {
    const localData = conflict.localData;
    const remoteData = conflict.remoteData;
    const conflictFields: string[] = [];

    // Identify conflicting fields
    for (const key in localData) {
      if (localData[key] !== remoteData[key]) {
        conflictFields.push(key);
      }
    }

    // Determine conflict severity
    let severity: ConflictAnalysis['severity'] = 'low';
    if (conflictFields.includes('score') || conflictFields.includes('completedAt')) {
      severity = 'high';
    } else if (conflictFields.includes('content') || conflictFields.includes('progressData')) {
      severity = 'medium';
    }

    // Check if auto-resolvable
    const strategies = this.mergeStrategies.get(conflict.type) || [];
    const autoResolvable = conflictFields.every(field => 
      strategies.some(strategy => strategy.field === field && strategy.priority === 'auto')
    );

    // Recommend action
    let recommendedAction: ConflictAnalysis['recommendedAction'] = 'manual_review';
    if (autoResolvable) {
      if (conflict.conflictType === 'update_conflict') {
        recommendedAction = 'merge';
      } else if (this.isLocalNewer(localData, remoteData)) {
        recommendedAction = 'use_local';
      } else {
        recommendedAction = 'use_remote';
      }
    }

    return {
      conflictType: this.mapConflictType(conflict.conflictType),
      severity,
      autoResolvable,
      recommendedAction,
      conflictFields,
      impactAssessment: this.generateImpactAssessment(conflict, conflictFields, severity)
    };
  }

  private mapConflictType(conflictType: string): ConflictAnalysis['conflictType'] {
    switch (conflictType) {
      case 'update_conflict': return 'data_mismatch';
      case 'delete_conflict': return 'deletion_conflict';
      case 'create_conflict': return 'creation_conflict';
      default: return 'version_conflict';
    }
  }

  private generateImpactAssessment(conflict: ConflictItem, conflictFields: string[], severity: string): string {
    const impacts: string[] = [];

    if (conflictFields.includes('score')) {
      impacts.push('User progress scores may differ');
    }
    if (conflictFields.includes('completedAt')) {
      impacts.push('Completion timestamps may be inconsistent');
    }
    if (conflictFields.includes('content')) {
      impacts.push('User-generated content may be lost');
    }
    if (conflictFields.includes('progressData')) {
      impacts.push('Learning progress data may be incomplete');
    }

    if (impacts.length === 0) {
      return 'Minimal impact on user experience';
    }

    return impacts.join('; ');
  }

  private isLocalNewer(localData: any, remoteData: any): boolean {
    const localTime = this.extractTimestamp(localData);
    const remoteTime = this.extractTimestamp(remoteData);
    return localTime > remoteTime;
  }

  private extractTimestamp(data: any): Date {
    const timeFields = ['lastModified', 'updatedAt', 'updated_at', 'createdAt', 'created_at'];
    for (const field of timeFields) {
      if (data[field]) {
        return new Date(data[field]);
      }
    }
    return new Date(0); // Fallback to epoch
  }

  resolveByTimestamp(conflict: ConflictItem): ConflictResolution {
    const localTime = this.extractTimestamp(conflict.localData);
    const remoteTime = this.extractTimestamp(conflict.remoteData);

    if (localTime > remoteTime) {
      return {
        action: 'use_local',
        resolvedData: conflict.localData,
        requiresUserInput: false
      };
    } else {
      return {
        action: 'use_remote',
        resolvedData: conflict.remoteData,
        requiresUserInput: false
      };
    }
  }

  resolveByUserChoice(conflict: ConflictItem, userChoice: 'local' | 'remote' | 'merge'): ConflictResolution {
    switch (userChoice) {
      case 'local':
        return {
          action: 'use_local',
          resolvedData: conflict.localData,
          requiresUserInput: false
        };
      case 'remote':
        return {
          action: 'use_remote',
          resolvedData: conflict.remoteData,
          requiresUserInput: false
        };
      case 'merge':
        return this.resolveByMerge(conflict);
      default:
        return {
          action: 'manual',
          requiresUserInput: true
        };
    }
  }

  resolveByMerge(conflict: ConflictItem): ConflictResolution {
    try {
      let mergedData: any;

      switch (conflict.type) {
        case 'progress':
          mergedData = this.mergeUserProgress(
            conflict.localData as OfflineUserProgress,
            conflict.remoteData as OfflineUserProgress
          );
          break;
        case 'note':
          mergedData = this.mergeUserNotes(
            conflict.localData as OfflineNote,
            conflict.remoteData as OfflineNote
          );
          break;
        case 'bookmark':
          // For bookmarks, we merge arrays if they exist
          mergedData = this.mergeBookmarkData(conflict.localData, conflict.remoteData);
          break;
        case 'achievement':
          mergedData = this.mergeAchievementData(conflict.localData, conflict.remoteData);
          break;
        default:
          mergedData = this.mergeGenericData(conflict.localData, conflict.remoteData);
      }

      return {
        action: 'merge',
        resolvedData: mergedData,
        requiresUserInput: false
      };
    } catch (error) {
      console.error('Failed to merge conflict data:', error);
      return {
        action: 'manual',
        requiresUserInput: true
      };
    }
  }

  mergeUserProgress(local: OfflineUserProgress, remote: OfflineUserProgress): OfflineUserProgress {
    const merged: OfflineUserProgress = { ...local };

    // Use highest score
    if (remote.score && (!local.score || remote.score > local.score)) {
      merged.score = remote.score;
    }

    // Use highest time spent
    if (remote.timeSpent > local.timeSpent) {
      merged.timeSpent = remote.timeSpent;
    }

    // Use latest completion date
    if (remote.completedAt && (!local.completedAt || 
        new Date(remote.completedAt) > new Date(local.completedAt))) {
      merged.completedAt = remote.completedAt;
    }

    // Merge progress data
    if (local.progressData && remote.progressData) {
      merged.progressData = this.mergeProgressData(local.progressData, remote.progressData);
    } else {
      merged.progressData = remote.progressData || local.progressData;
    }

    // Use latest modification time
    const localTime = new Date(local.lastModified);
    const remoteTime = new Date(remote.lastModified);
    merged.lastModified = localTime > remoteTime ? local.lastModified : remote.lastModified;

    // Increment version
    merged.localVersion = Math.max(local.localVersion, remote.remoteVersion || 0) + 1;
    merged.syncStatus = 'pending';

    return merged;
  }

  private mergeProgressData(localData: any, remoteData: any): any {
    if (typeof localData !== 'object' || typeof remoteData !== 'object') {
      return remoteData || localData;
    }

    const merged = { ...localData };

    // Merge specific progress fields
    for (const key in remoteData) {
      if (key === 'completedExercises' || key === 'unlockedLevels') {
        // Merge arrays
        if (Array.isArray(localData[key]) && Array.isArray(remoteData[key])) {
          merged[key] = [...new Set([...localData[key], ...remoteData[key]])];
        } else {
          merged[key] = remoteData[key] || localData[key];
        }
      } else if (key === 'streakCount' || key === 'totalPoints') {
        // Use higher value
        merged[key] = Math.max(localData[key] || 0, remoteData[key] || 0);
      } else if (key === 'lastActivity') {
        // Use latest timestamp
        const localTime = new Date(localData[key] || 0);
        const remoteTime = new Date(remoteData[key] || 0);
        merged[key] = localTime > remoteTime ? localData[key] : remoteData[key];
      } else {
        // Default: use remote value if it exists
        merged[key] = remoteData[key] !== undefined ? remoteData[key] : localData[key];
      }
    }

    return merged;
  }

  mergeUserNotes(local: OfflineNote, remote: OfflineNote): OfflineNote {
    const merged: OfflineNote = { ...local };

    // Use latest content based on update time
    const localTime = new Date(local.updatedAt);
    const remoteTime = new Date(remote.updatedAt);

    if (remoteTime > localTime) {
      merged.content = remote.content;
      merged.position = remote.position;
      merged.updatedAt = remote.updatedAt;
    }

    // Increment version
    merged.localVersion = Math.max(local.localVersion, remote.remoteVersion || 0) + 1;
    merged.syncStatus = 'pending';

    return merged;
  }

  mergeBookmarks(local: OfflineBookmark[], remote: OfflineBookmark[]): OfflineBookmark[] {
    const merged = new Map<string, OfflineBookmark>();

    // Add all local bookmarks
    local.forEach(bookmark => {
      merged.set(bookmark.id, bookmark);
    });

    // Add or update with remote bookmarks
    remote.forEach(remoteBookmark => {
      const existing = merged.get(remoteBookmark.id);
      if (!existing) {
        merged.set(remoteBookmark.id, remoteBookmark);
      } else {
        // Keep the one with latest creation date
        const localTime = new Date(existing.createdAt);
        const remoteTime = new Date(remoteBookmark.createdAt);
        if (remoteTime > localTime) {
          merged.set(remoteBookmark.id, remoteBookmark);
        }
      }
    });

    return Array.from(merged.values());
  }

  private mergeBookmarkData(local: any, remote: any): any {
    const merged = { ...local };

    // Use latest creation date
    const localTime = new Date(local.createdAt);
    const remoteTime = new Date(remote.createdAt);

    if (remoteTime > localTime) {
      merged.title = remote.title;
      merged.createdAt = remote.createdAt;
    }

    merged.syncStatus = 'pending';
    return merged;
  }

  private mergeAchievementData(local: any, remote: any): any {
    const merged = { ...local };

    // Use earliest earned date (first achievement)
    const localTime = new Date(local.earnedAt);
    const remoteTime = new Date(remote.earnedAt);

    if (remoteTime < localTime) {
      merged.earnedAt = remote.earnedAt;
    }

    merged.syncStatus = 'pending';
    return merged;
  }

  private mergeGenericData(local: any, remote: any): any {
    const merged = { ...local };

    // Simple merge strategy: use remote values for non-timestamp fields
    for (const key in remote) {
      if (key !== 'lastModified' && key !== 'updatedAt' && key !== 'createdAt') {
        merged[key] = remote[key];
      }
    }

    // Use latest timestamp
    const localTime = this.extractTimestamp(local);
    const remoteTime = this.extractTimestamp(remote);

    if (remoteTime > localTime) {
      merged.lastModified = remote.lastModified || remote.updatedAt;
    }

    return merged;
  }

  // Batch conflict resolution
  async resolveAllConflicts(strategy: 'timestamp' | 'local' | 'remote' | 'merge' = 'timestamp'): Promise<ConflictResolution[]> {
    const conflicts = await offlineDB.conflictResolution
      .where('resolved')
      .equals(false)
      .toArray();

    const resolutions: ConflictResolution[] = [];

    for (const conflict of conflicts) {
      let resolution: ConflictResolution;

      switch (strategy) {
        case 'timestamp':
          resolution = this.resolveByTimestamp(conflict);
          break;
        case 'local':
          resolution = this.resolveByUserChoice(conflict, 'local');
          break;
        case 'remote':
          resolution = this.resolveByUserChoice(conflict, 'remote');
          break;
        case 'merge':
          resolution = this.resolveByMerge(conflict);
          break;
        default:
          resolution = { action: 'manual', requiresUserInput: true };
      }

      resolutions.push(resolution);

      // Apply resolution if it doesn't require user input
      if (!resolution.requiresUserInput) {
        await this.applyResolution(conflict.id, resolution);
      }
    }

    return resolutions;
  }

  private async applyResolution(conflictId: string, resolution: ConflictResolution): Promise<void> {
    try {
      await offlineDB.conflictResolution.update(conflictId, {
        resolved: true
      });

      console.log(`Applied resolution for conflict ${conflictId}: ${resolution.action}`);
    } catch (error) {
      console.error(`Failed to apply resolution for conflict ${conflictId}:`, error);
      throw error;
    }
  }

  // Conflict prevention
  async detectPotentialConflicts(type: string, localData: any, remoteData: any): Promise<ConflictItem | null> {
    // Check if data differs significantly
    const significantDifferences = this.findSignificantDifferences(localData, remoteData);
    
    if (significantDifferences.length === 0) {
      return null; // No conflict
    }

    // Create conflict item
    const conflict: ConflictItem = {
      id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: type as any,
      localData,
      remoteData,
      conflictType: 'update_conflict',
      timestamp: new Date(),
      resolved: false
    };

    // Store conflict for later resolution
    await offlineDB.conflictResolution.add(conflict);

    return conflict;
  }

  private findSignificantDifferences(local: any, remote: any): string[] {
    const differences: string[] = [];
    const significantFields = [
      'score', 'timeSpent', 'completedAt', 'content', 'progressData',
      'earnedAt', 'title', 'description'
    ];

    for (const field of significantFields) {
      if (local[field] !== remote[field]) {
        // Check if difference is significant
        if (this.isSignificantDifference(field, local[field], remote[field])) {
          differences.push(field);
        }
      }
    }

    return differences;
  }

  private isSignificantDifference(field: string, localValue: any, remoteValue: any): boolean {
    if (localValue === remoteValue) return false;
    if (localValue == null || remoteValue == null) return true;

    switch (field) {
      case 'score':
      case 'timeSpent':
        // Significant if difference is more than 10%
        const numLocal = Number(localValue);
        const numRemote = Number(remoteValue);
        if (isNaN(numLocal) || isNaN(numRemote)) return true;
        const diff = Math.abs(numLocal - numRemote);
        const avg = (numLocal + numRemote) / 2;
        return avg > 0 && (diff / avg) > 0.1;

      case 'completedAt':
      case 'earnedAt':
        // Significant if difference is more than 1 minute
        const timeLocal = new Date(localValue).getTime();
        const timeRemote = new Date(remoteValue).getTime();
        return Math.abs(timeLocal - timeRemote) > 60000;

      case 'content':
        // Significant if content length differs by more than 10%
        const lenLocal = String(localValue).length;
        const lenRemote = String(remoteValue).length;
        const lenDiff = Math.abs(lenLocal - lenRemote);
        const lenAvg = (lenLocal + lenRemote) / 2;
        return lenAvg > 0 && (lenDiff / lenAvg) > 0.1;

      default:
        // For other fields, any difference is significant
        return true;
    }
  }

  // Conflict statistics
  async getConflictStatistics(): Promise<{
    totalConflicts: number;
    resolvedConflicts: number;
    pendingConflicts: number;
    conflictsByType: Record<string, number>;
    autoResolutionRate: number;
  }> {
    const allConflicts = await offlineDB.conflictResolution.toArray();
    const resolvedConflicts = allConflicts.filter(c => c.resolved);
    const pendingConflicts = allConflicts.filter(c => !c.resolved);

    const conflictsByType: Record<string, number> = {};
    allConflicts.forEach(conflict => {
      conflictsByType[conflict.type] = (conflictsByType[conflict.type] || 0) + 1;
    });

    // Calculate auto-resolution rate (conflicts that could be resolved automatically)
    const autoResolvableCount = allConflicts.filter(conflict => {
      const analysis = this.analyzeConflict(conflict);
      return analysis.autoResolvable;
    }).length;

    const autoResolutionRate = allConflicts.length > 0 ? 
      (autoResolvableCount / allConflicts.length) * 100 : 0;

    return {
      totalConflicts: allConflicts.length,
      resolvedConflicts: resolvedConflicts.length,
      pendingConflicts: pendingConflicts.length,
      conflictsByType,
      autoResolutionRate
    };
  }
}

// Create and export singleton instance
export const conflictResolver = new ConflictResolverImpl();

export default conflictResolver;
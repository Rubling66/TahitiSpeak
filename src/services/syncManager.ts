import { supabase } from '../lib/supabase';
import { offlineDB, OfflineUserProgress, OfflineNote, OfflineBookmark, OfflineAchievement, SyncQueueItem } from './offlineDatabase';
import { conflictResolver } from './conflictResolver';
import { ConflictResolution } from './offlineManager';

export interface SyncManager {
  syncUserProgress(): Promise<void>;
  syncUserData(): Promise<void>;
  syncContentUpdates(): Promise<void>;
  processSyncQueue(): Promise<void>;
  handleConflicts(): Promise<ConflictResolution[]>;
  getLastSyncTime(): Promise<Date | null>;
  setLastSyncTime(time: Date): Promise<void>;
}

export interface SyncResult {
  success: boolean;
  itemsProcessed: number;
  conflicts: number;
  errors: string[];
  syncTime: Date;
}

export interface SyncStatistics {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  averageSyncTime: number;
  lastSyncTime: Date | null;
  conflictsResolved: number;
  dataTransferred: number; // in bytes
}

class SyncManagerImpl implements SyncManager {
  private syncInProgress = false;
  private syncQueue: SyncQueueItem[] = [];
  private syncStatistics: SyncStatistics = {
    totalSyncs: 0,
    successfulSyncs: 0,
    failedSyncs: 0,
    averageSyncTime: 0,
    lastSyncTime: null,
    conflictsResolved: 0,
    dataTransferred: 0
  };

  constructor() {
    this.loadSyncStatistics();
  }

  private async loadSyncStatistics(): Promise<void> {
    try {
      const stats = localStorage.getItem('syncStatistics');
      if (stats) {
        this.syncStatistics = {
          ...this.syncStatistics,
          ...JSON.parse(stats),
          lastSyncTime: stats ? new Date(JSON.parse(stats).lastSyncTime) : null
        };
      }
    } catch (error) {
      console.error('Failed to load sync statistics:', error);
    }
  }

  private async saveSyncStatistics(): Promise<void> {
    try {
      localStorage.setItem('syncStatistics', JSON.stringify(this.syncStatistics));
    } catch (error) {
      console.error('Failed to save sync statistics:', error);
    }
  }

  async getLastSyncTime(): Promise<Date | null> {
    try {
      const syncTimestamp = await offlineDB.syncTimestamps
        .where('key')
        .equals('lastSync')
        .first();
      
      return syncTimestamp ? new Date(syncTimestamp.timestamp) : null;
    } catch (error) {
      console.error('Failed to get last sync time:', error);
      return null;
    }
  }

  async setLastSyncTime(time: Date): Promise<void> {
    try {
      await offlineDB.syncTimestamps.put({
        key: 'lastSync',
        timestamp: time.toISOString()
      });
      this.syncStatistics.lastSyncTime = time;
      await this.saveSyncStatistics();
    } catch (error) {
      console.error('Failed to set last sync time:', error);
      throw error;
    }
  }

  async syncUserProgress(): Promise<void> {
    if (this.syncInProgress) {
      console.log('Sync already in progress, skipping user progress sync');
      return;
    }

    this.syncInProgress = true;
    const startTime = Date.now();

    try {
      console.log('Starting user progress sync...');

      // Get all pending progress items
      const pendingProgress = await offlineDB.userProgress
        .where('syncStatus')
        .equals('pending')
        .toArray();

      console.log(`Found ${pendingProgress.length} pending progress items`);

      for (const progress of pendingProgress) {
        try {
          await this.syncSingleProgressItem(progress);
        } catch (error) {
          console.error(`Failed to sync progress item ${progress.id}:`, error);
          // Mark as failed but continue with other items
          await offlineDB.userProgress.update(progress.id, {
            syncStatus: 'failed',
            lastModified: new Date().toISOString()
          });
        }
      }

      // Update sync statistics
      const syncTime = Date.now() - startTime;
      this.updateSyncStatistics(true, syncTime, pendingProgress.length);

      console.log('User progress sync completed successfully');
    } catch (error) {
      console.error('User progress sync failed:', error);
      this.updateSyncStatistics(false, Date.now() - startTime, 0);
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncSingleProgressItem(progress: OfflineUserProgress): Promise<void> {
    try {
      // Check if item exists remotely
      const { data: remoteProgress, error: fetchError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', progress.userId)
        .eq('lesson_id', progress.lessonId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw fetchError;
      }

      if (remoteProgress) {
        // Item exists remotely, check for conflicts
        const conflict = await conflictResolver.detectPotentialConflicts(
          'progress',
          progress,
          remoteProgress
        );

        if (conflict) {
          console.log(`Conflict detected for progress ${progress.id}, resolving...`);
          const resolution = conflictResolver.resolveByTimestamp(conflict);
          
          if (resolution.action === 'use_local' || resolution.action === 'merge') {
            await this.updateRemoteProgress(progress);
          } else if (resolution.action === 'use_remote') {
            await this.updateLocalProgress(remoteProgress);
          }
        } else {
          // No conflict, update remote
          await this.updateRemoteProgress(progress);
        }
      } else {
        // Item doesn't exist remotely, create it
        await this.createRemoteProgress(progress);
      }

      // Mark as synced
      await offlineDB.userProgress.update(progress.id, {
        syncStatus: 'synced',
        lastModified: new Date().toISOString()
      });

    } catch (error) {
      console.error(`Failed to sync progress item ${progress.id}:`, error);
      throw error;
    }
  }

  private async updateRemoteProgress(progress: OfflineUserProgress): Promise<void> {
    const { error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: progress.userId,
        lesson_id: progress.lessonId,
        score: progress.score,
        time_spent: progress.timeSpent,
        completed_at: progress.completedAt,
        progress_data: progress.progressData,
        updated_at: new Date().toISOString()
      });

    if (error) {
      throw error;
    }

    this.syncStatistics.dataTransferred += JSON.stringify(progress).length;
  }

  private async createRemoteProgress(progress: OfflineUserProgress): Promise<void> {
    const { error } = await supabase
      .from('user_progress')
      .insert({
        user_id: progress.userId,
        lesson_id: progress.lessonId,
        score: progress.score,
        time_spent: progress.timeSpent,
        completed_at: progress.completedAt,
        progress_data: progress.progressData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) {
      throw error;
    }

    this.syncStatistics.dataTransferred += JSON.stringify(progress).length;
  }

  private async updateLocalProgress(remoteProgress: any): Promise<void> {
    await offlineDB.userProgress.put({
      id: `${remoteProgress.user_id}_${remoteProgress.lesson_id}`,
      userId: remoteProgress.user_id,
      lessonId: remoteProgress.lesson_id,
      score: remoteProgress.score,
      timeSpent: remoteProgress.time_spent,
      completedAt: remoteProgress.completed_at,
      progressData: remoteProgress.progress_data,
      lastModified: remoteProgress.updated_at,
      syncStatus: 'synced',
      localVersion: 1,
      remoteVersion: 1
    });
  }

  async syncUserData(): Promise<void> {
    if (this.syncInProgress) {
      console.log('Sync already in progress, skipping user data sync');
      return;
    }

    this.syncInProgress = true;
    const startTime = Date.now();

    try {
      console.log('Starting user data sync...');

      // Sync notes
      await this.syncNotes();
      
      // Sync bookmarks
      await this.syncBookmarks();
      
      // Sync achievements
      await this.syncAchievements();

      // Update sync statistics
      const syncTime = Date.now() - startTime;
      this.updateSyncStatistics(true, syncTime, 0);

      console.log('User data sync completed successfully');
    } catch (error) {
      console.error('User data sync failed:', error);
      this.updateSyncStatistics(false, Date.now() - startTime, 0);
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncNotes(): Promise<void> {
    const pendingNotes = await offlineDB.userNotes
      .where('syncStatus')
      .equals('pending')
      .toArray();

    console.log(`Syncing ${pendingNotes.length} notes...`);

    for (const note of pendingNotes) {
      try {
        await this.syncSingleNote(note);
      } catch (error) {
        console.error(`Failed to sync note ${note.id}:`, error);
        await offlineDB.userNotes.update(note.id, {
          syncStatus: 'failed',
          updatedAt: new Date().toISOString()
        });
      }
    }
  }

  private async syncSingleNote(note: OfflineNote): Promise<void> {
    const { data: remoteNote, error: fetchError } = await supabase
      .from('user_notes')
      .select('*')
      .eq('id', note.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    if (remoteNote) {
      // Check for conflicts
      const conflict = await conflictResolver.detectPotentialConflicts(
        'note',
        note,
        remoteNote
      );

      if (conflict) {
        const resolution = conflictResolver.resolveByTimestamp(conflict);
        
        if (resolution.action === 'use_local' || resolution.action === 'merge') {
          await this.updateRemoteNote(note);
        } else if (resolution.action === 'use_remote') {
          await this.updateLocalNote(remoteNote);
        }
      } else {
        await this.updateRemoteNote(note);
      }
    } else {
      await this.createRemoteNote(note);
    }

    await offlineDB.userNotes.update(note.id, {
      syncStatus: 'synced',
      updatedAt: new Date().toISOString()
    });
  }

  private async updateRemoteNote(note: OfflineNote): Promise<void> {
    const { error } = await supabase
      .from('user_notes')
      .upsert({
        id: note.id,
        user_id: note.userId,
        lesson_id: note.lessonId,
        content: note.content,
        position: note.position,
        created_at: note.createdAt,
        updated_at: new Date().toISOString()
      });

    if (error) {
      throw error;
    }

    this.syncStatistics.dataTransferred += JSON.stringify(note).length;
  }

  private async createRemoteNote(note: OfflineNote): Promise<void> {
    const { error } = await supabase
      .from('user_notes')
      .insert({
        id: note.id,
        user_id: note.userId,
        lesson_id: note.lessonId,
        content: note.content,
        position: note.position,
        created_at: note.createdAt,
        updated_at: new Date().toISOString()
      });

    if (error) {
      throw error;
    }

    this.syncStatistics.dataTransferred += JSON.stringify(note).length;
  }

  private async updateLocalNote(remoteNote: any): Promise<void> {
    await offlineDB.userNotes.put({
      id: remoteNote.id,
      userId: remoteNote.user_id,
      lessonId: remoteNote.lesson_id,
      content: remoteNote.content,
      position: remoteNote.position,
      createdAt: remoteNote.created_at,
      updatedAt: remoteNote.updated_at,
      syncStatus: 'synced',
      localVersion: 1,
      remoteVersion: 1
    });
  }

  private async syncBookmarks(): Promise<void> {
    const pendingBookmarks = await offlineDB.userBookmarks
      .where('syncStatus')
      .equals('pending')
      .toArray();

    console.log(`Syncing ${pendingBookmarks.length} bookmarks...`);

    for (const bookmark of pendingBookmarks) {
      try {
        await this.syncSingleBookmark(bookmark);
      } catch (error) {
        console.error(`Failed to sync bookmark ${bookmark.id}:`, error);
        await offlineDB.userBookmarks.update(bookmark.id, {
          syncStatus: 'failed'
        });
      }
    }
  }

  private async syncSingleBookmark(bookmark: OfflineBookmark): Promise<void> {
    const { data: remoteBookmark, error: fetchError } = await supabase
      .from('user_bookmarks')
      .select('*')
      .eq('id', bookmark.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    if (remoteBookmark) {
      const conflict = await conflictResolver.detectPotentialConflicts(
        'bookmark',
        bookmark,
        remoteBookmark
      );

      if (conflict) {
        const resolution = conflictResolver.resolveByTimestamp(conflict);
        
        if (resolution.action === 'use_local' || resolution.action === 'merge') {
          await this.updateRemoteBookmark(bookmark);
        } else if (resolution.action === 'use_remote') {
          await this.updateLocalBookmark(remoteBookmark);
        }
      } else {
        await this.updateRemoteBookmark(bookmark);
      }
    } else {
      await this.createRemoteBookmark(bookmark);
    }

    await offlineDB.userBookmarks.update(bookmark.id, {
      syncStatus: 'synced'
    });
  }

  private async updateRemoteBookmark(bookmark: OfflineBookmark): Promise<void> {
    const { error } = await supabase
      .from('user_bookmarks')
      .upsert({
        id: bookmark.id,
        user_id: bookmark.userId,
        lesson_id: bookmark.lessonId,
        title: bookmark.title,
        created_at: bookmark.createdAt
      });

    if (error) {
      throw error;
    }

    this.syncStatistics.dataTransferred += JSON.stringify(bookmark).length;
  }

  private async createRemoteBookmark(bookmark: OfflineBookmark): Promise<void> {
    const { error } = await supabase
      .from('user_bookmarks')
      .insert({
        id: bookmark.id,
        user_id: bookmark.userId,
        lesson_id: bookmark.lessonId,
        title: bookmark.title,
        created_at: bookmark.createdAt
      });

    if (error) {
      throw error;
    }

    this.syncStatistics.dataTransferred += JSON.stringify(bookmark).length;
  }

  private async updateLocalBookmark(remoteBookmark: any): Promise<void> {
    await offlineDB.userBookmarks.put({
      id: remoteBookmark.id,
      userId: remoteBookmark.user_id,
      lessonId: remoteBookmark.lesson_id,
      title: remoteBookmark.title,
      createdAt: remoteBookmark.created_at,
      syncStatus: 'synced',
      localVersion: 1,
      remoteVersion: 1
    });
  }

  private async syncAchievements(): Promise<void> {
    const pendingAchievements = await offlineDB.userAchievements
      .where('syncStatus')
      .equals('pending')
      .toArray();

    console.log(`Syncing ${pendingAchievements.length} achievements...`);

    for (const achievement of pendingAchievements) {
      try {
        await this.syncSingleAchievement(achievement);
      } catch (error) {
        console.error(`Failed to sync achievement ${achievement.id}:`, error);
        await offlineDB.userAchievements.update(achievement.id, {
          syncStatus: 'failed'
        });
      }
    }
  }

  private async syncSingleAchievement(achievement: OfflineAchievement): Promise<void> {
    const { data: remoteAchievement, error: fetchError } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('id', achievement.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    if (remoteAchievement) {
      const conflict = await conflictResolver.detectPotentialConflicts(
        'achievement',
        achievement,
        remoteAchievement
      );

      if (conflict) {
        const resolution = conflictResolver.resolveByTimestamp(conflict);
        
        if (resolution.action === 'use_local' || resolution.action === 'merge') {
          await this.updateRemoteAchievement(achievement);
        } else if (resolution.action === 'use_remote') {
          await this.updateLocalAchievement(remoteAchievement);
        }
      } else {
        await this.updateRemoteAchievement(achievement);
      }
    } else {
      await this.createRemoteAchievement(achievement);
    }

    await offlineDB.userAchievements.update(achievement.id, {
      syncStatus: 'synced'
    });
  }

  private async updateRemoteAchievement(achievement: OfflineAchievement): Promise<void> {
    const { error } = await supabase
      .from('user_achievements')
      .upsert({
        id: achievement.id,
        user_id: achievement.userId,
        achievement_id: achievement.achievementId,
        earned_at: achievement.earnedAt
      });

    if (error) {
      throw error;
    }

    this.syncStatistics.dataTransferred += JSON.stringify(achievement).length;
  }

  private async createRemoteAchievement(achievement: OfflineAchievement): Promise<void> {
    const { error } = await supabase
      .from('user_achievements')
      .insert({
        id: achievement.id,
        user_id: achievement.userId,
        achievement_id: achievement.achievementId,
        earned_at: achievement.earnedAt
      });

    if (error) {
      throw error;
    }

    this.syncStatistics.dataTransferred += JSON.stringify(achievement).length;
  }

  private async updateLocalAchievement(remoteAchievement: any): Promise<void> {
    await offlineDB.userAchievements.put({
      id: remoteAchievement.id,
      userId: remoteAchievement.user_id,
      achievementId: remoteAchievement.achievement_id,
      earnedAt: remoteAchievement.earned_at,
      syncStatus: 'synced',
      localVersion: 1,
      remoteVersion: 1
    });
  }

  async syncContentUpdates(): Promise<void> {
    if (this.syncInProgress) {
      console.log('Sync already in progress, skipping content updates sync');
      return;
    }

    this.syncInProgress = true;
    const startTime = Date.now();

    try {
      console.log('Starting content updates sync...');

      const lastSyncTime = await this.getLastSyncTime();
      const syncTimestamp = lastSyncTime ? lastSyncTime.toISOString() : '1970-01-01T00:00:00Z';

      // Check for updated lessons
      const { data: updatedLessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .gt('updated_at', syncTimestamp);

      if (lessonsError) {
        throw lessonsError;
      }

      // Check for updated stories
      const { data: updatedStories, error: storiesError } = await supabase
        .from('stories')
        .select('*')
        .gt('updated_at', syncTimestamp);

      if (storiesError) {
        throw storiesError;
      }

      // Check for updated cultural content
      const { data: updatedCultural, error: culturalError } = await supabase
        .from('cultural_content')
        .select('*')
        .gt('updated_at', syncTimestamp);

      if (culturalError) {
        throw culturalError;
      }

      // Update local content
      if (updatedLessons?.length) {
        await this.updateLocalLessons(updatedLessons);
      }

      if (updatedStories?.length) {
        await this.updateLocalStories(updatedStories);
      }

      if (updatedCultural?.length) {
        await this.updateLocalCulturalContent(updatedCultural);
      }

      // Update last sync time
      await this.setLastSyncTime(new Date());

      // Update sync statistics
      const syncTime = Date.now() - startTime;
      const totalUpdated = (updatedLessons?.length || 0) + 
                          (updatedStories?.length || 0) + 
                          (updatedCultural?.length || 0);
      this.updateSyncStatistics(true, syncTime, totalUpdated);

      console.log(`Content updates sync completed. Updated ${totalUpdated} items.`);
    } catch (error) {
      console.error('Content updates sync failed:', error);
      this.updateSyncStatistics(false, Date.now() - startTime, 0);
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  private async updateLocalLessons(lessons: any[]): Promise<void> {
    for (const lesson of lessons) {
      await offlineDB.lessons.put({
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        content: lesson.content,
        level: lesson.level,
        category: lesson.category,
        duration: lesson.duration,
        audioUrl: lesson.audio_url,
        imageUrl: lesson.image_url,
        createdAt: lesson.created_at,
        updatedAt: lesson.updated_at,
        downloadStatus: 'not_downloaded',
        lastAccessed: new Date().toISOString()
      });
    }
  }

  private async updateLocalStories(stories: any[]): Promise<void> {
    for (const story of stories) {
      await offlineDB.stories.put({
        id: story.id,
        title: story.title,
        content: story.content,
        level: story.level,
        category: story.category,
        audioUrl: story.audio_url,
        imageUrl: story.image_url,
        createdAt: story.created_at,
        updatedAt: story.updated_at,
        downloadStatus: 'not_downloaded',
        lastAccessed: new Date().toISOString()
      });
    }
  }

  private async updateLocalCulturalContent(culturalContent: any[]): Promise<void> {
    for (const content of culturalContent) {
      await offlineDB.culturalContent.put({
        id: content.id,
        title: content.title,
        description: content.description,
        content: content.content,
        type: content.type,
        imageUrl: content.image_url,
        videoUrl: content.video_url,
        createdAt: content.created_at,
        updatedAt: content.updated_at,
        downloadStatus: 'not_downloaded',
        lastAccessed: new Date().toISOString()
      });
    }
  }

  async processSyncQueue(): Promise<void> {
    const queueItems = await offlineDB.syncQueue
      .where('status')
      .equals('pending')
      .toArray();

    console.log(`Processing ${queueItems.length} sync queue items...`);

    for (const item of queueItems) {
      try {
        await this.processSyncQueueItem(item);
        
        // Mark as completed
        await offlineDB.syncQueue.update(item.id, {
          status: 'completed',
          processedAt: new Date().toISOString()
        });
      } catch (error) {
        console.error(`Failed to process sync queue item ${item.id}:`, error);
        
        // Mark as failed and increment retry count
        await offlineDB.syncQueue.update(item.id, {
          status: 'failed',
          retryCount: (item.retryCount || 0) + 1,
          lastError: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  private async processSyncQueueItem(item: SyncQueueItem): Promise<void> {
    switch (item.operation) {
      case 'create':
        await this.handleCreateOperation(item);
        break;
      case 'update':
        await this.handleUpdateOperation(item);
        break;
      case 'delete':
        await this.handleDeleteOperation(item);
        break;
      default:
        throw new Error(`Unknown sync operation: ${item.operation}`);
    }
  }

  private async handleCreateOperation(item: SyncQueueItem): Promise<void> {
    const { error } = await supabase
      .from(item.table)
      .insert(item.data);

    if (error) {
      throw error;
    }

    this.syncStatistics.dataTransferred += JSON.stringify(item.data).length;
  }

  private async handleUpdateOperation(item: SyncQueueItem): Promise<void> {
    const { error } = await supabase
      .from(item.table)
      .update(item.data)
      .eq('id', item.recordId);

    if (error) {
      throw error;
    }

    this.syncStatistics.dataTransferred += JSON.stringify(item.data).length;
  }

  private async handleDeleteOperation(item: SyncQueueItem): Promise<void> {
    const { error } = await supabase
      .from(item.table)
      .delete()
      .eq('id', item.recordId);

    if (error) {
      throw error;
    }
  }

  async handleConflicts(): Promise<ConflictResolution[]> {
    console.log('Handling conflicts...');
    
    const resolutions = await conflictResolver.resolveAllConflicts('timestamp');
    
    this.syncStatistics.conflictsResolved += resolutions.filter(r => !r.requiresUserInput).length;
    await this.saveSyncStatistics();
    
    return resolutions;
  }

  private updateSyncStatistics(success: boolean, syncTime: number, itemsProcessed: number): void {
    this.syncStatistics.totalSyncs++;
    
    if (success) {
      this.syncStatistics.successfulSyncs++;
    } else {
      this.syncStatistics.failedSyncs++;
    }

    // Update average sync time
    const totalTime = this.syncStatistics.averageSyncTime * (this.syncStatistics.totalSyncs - 1) + syncTime;
    this.syncStatistics.averageSyncTime = totalTime / this.syncStatistics.totalSyncs;

    this.syncStatistics.lastSyncTime = new Date();

    this.saveSyncStatistics();
  }

  // Full sync operation
  async performFullSync(): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let itemsProcessed = 0;
    let conflicts = 0;

    try {
      console.log('Starting full sync...');

      // Sync user progress
      try {
        await this.syncUserProgress();
        const progressItems = await offlineDB.userProgress.where('syncStatus').equals('pending').count();
        itemsProcessed += progressItems;
      } catch (error) {
        errors.push(`User progress sync failed: ${error}`);
      }

      // Sync user data
      try {
        await this.syncUserData();
        const notesCount = await offlineDB.userNotes.where('syncStatus').equals('pending').count();
        const bookmarksCount = await offlineDB.userBookmarks.where('syncStatus').equals('pending').count();
        const achievementsCount = await offlineDB.userAchievements.where('syncStatus').equals('pending').count();
        itemsProcessed += notesCount + bookmarksCount + achievementsCount;
      } catch (error) {
        errors.push(`User data sync failed: ${error}`);
      }

      // Sync content updates
      try {
        await this.syncContentUpdates();
      } catch (error) {
        errors.push(`Content updates sync failed: ${error}`);
      }

      // Process sync queue
      try {
        await this.processSyncQueue();
      } catch (error) {
        errors.push(`Sync queue processing failed: ${error}`);
      }

      // Handle conflicts
      try {
        const resolutions = await this.handleConflicts();
        conflicts = resolutions.length;
      } catch (error) {
        errors.push(`Conflict resolution failed: ${error}`);
      }

      const success = errors.length === 0;
      const syncTime = new Date();

      console.log(`Full sync completed. Success: ${success}, Items: ${itemsProcessed}, Conflicts: ${conflicts}`);

      return {
        success,
        itemsProcessed,
        conflicts,
        errors,
        syncTime
      };

    } catch (error) {
      console.error('Full sync failed:', error);
      errors.push(`Full sync failed: ${error}`);

      return {
        success: false,
        itemsProcessed,
        conflicts,
        errors,
        syncTime: new Date()
      };
    }
  }

  // Get sync statistics
  getSyncStatistics(): SyncStatistics {
    return { ...this.syncStatistics };
  }

  // Reset sync statistics
  async resetSyncStatistics(): Promise<void> {
    this.syncStatistics = {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      averageSyncTime: 0,
      lastSyncTime: null,
      conflictsResolved: 0,
      dataTransferred: 0
    };
    await this.saveSyncStatistics();
  }

  // Check if sync is needed
  async isSyncNeeded(): Promise<boolean> {
    const pendingProgress = await offlineDB.userProgress.where('syncStatus').equals('pending').count();
    const pendingNotes = await offlineDB.userNotes.where('syncStatus').equals('pending').count();
    const pendingBookmarks = await offlineDB.userBookmarks.where('syncStatus').equals('pending').count();
    const pendingAchievements = await offlineDB.userAchievements.where('syncStatus').equals('pending').count();
    const pendingQueue = await offlineDB.syncQueue.where('status').equals('pending').count();

    return (pendingProgress + pendingNotes + pendingBookmarks + pendingAchievements + pendingQueue) > 0;
  }
}

// Create and export singleton instance
export const syncManager = new SyncManagerImpl();

export default syncManager;
import { useState, useEffect, useCallback } from 'react';
import { progressService, UserProgress, OverallProgress, StudySession } from '../services/ProgressService';

export interface UseProgressReturn {
  // Progress data
  lessonProgress: Record<string, UserProgress>;
  overallProgress: OverallProgress;
  studySessions: StudySession[];
  
  // Loading states
  isLoading: boolean;
  isUpdating: boolean;
  
  // Error state
  error: string | null;
  
  // Actions
  updateLessonProgress: (lessonId: string, score: number, timeSpent: number, completed?: boolean) => Promise<void>;
  getLessonProgress: (lessonId: string) => UserProgress | null;
  refreshProgress: () => Promise<void>;
  resetProgress: () => Promise<void>;
  exportProgress: () => Promise<string>;
  
  // Computed values
  getProgressPercentage: () => number;
  getLevelProgress: () => { current: string; next: string; progress: number };
  getStreakInfo: () => { current: number; isActive: boolean };
  getRecentActivity: () => StudySession[];
}

export const useProgress = (): UseProgressReturn => {
  const [lessonProgress, setLessonProgress] = useState<Record<string, UserProgress>>({});
  const [overallProgress, setOverallProgress] = useState<OverallProgress>({
    totalLessons: 20,
    completedLessons: 0,
    averageScore: 0,
    totalTimeSpent: 0,
    streak: 0,
    lastStudyDate: new Date(),
    level: 'Beginner'
  });
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial progress data
  const loadProgress = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [lessons, overall, sessions] = await Promise.all([
        progressService.getAllProgress(),
        progressService.getOverallProgress(),
        progressService.getStudySessions(7)
      ]);
      
      setLessonProgress(lessons);
      setOverallProgress(overall);
      setStudySessions(sessions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load progress');
      console.error('Error loading progress:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update lesson progress
  const updateLessonProgress = useCallback(async (
    lessonId: string, 
    score: number, 
    timeSpent: number, 
    completed: boolean = false
  ) => {
    try {
      setIsUpdating(true);
      setError(null);
      
      await progressService.updateLessonProgress(lessonId, score, timeSpent, completed);
      
      // Refresh progress data
      await loadProgress();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update progress');
      console.error('Error updating progress:', err);
    } finally {
      setIsUpdating(false);
    }
  }, [loadProgress]);

  // Get progress for a specific lesson
  const getLessonProgress = useCallback((lessonId: string): UserProgress | null => {
    return lessonProgress[lessonId] || null;
  }, [lessonProgress]);

  // Refresh all progress data
  const refreshProgress = useCallback(async () => {
    await loadProgress();
  }, [loadProgress]);

  // Reset all progress
  const resetProgress = useCallback(async () => {
    try {
      setIsUpdating(true);
      setError(null);
      
      await progressService.resetProgress();
      await loadProgress();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset progress');
      console.error('Error resetting progress:', err);
    } finally {
      setIsUpdating(false);
    }
  }, [loadProgress]);

  // Export progress data
  const exportProgress = useCallback(async (): Promise<string> => {
    try {
      return await progressService.exportProgress();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export progress');
      console.error('Error exporting progress:', err);
      return '{}';
    }
  }, []);

  // Calculate overall progress percentage
  const getProgressPercentage = useCallback((): number => {
    if (overallProgress.totalLessons === 0) return 0;
    return Math.round((overallProgress.completedLessons / overallProgress.totalLessons) * 100);
  }, [overallProgress]);

  // Get level progress information
  const getLevelProgress = useCallback(() => {
    const { level, completedLessons, averageScore } = overallProgress;
    
    let current = level;
    let next = 'Advanced';
    let progress = 0;
    
    if (level === 'Beginner') {
      next = 'Intermediate';
      // Need 8 lessons completed and 60% average score for Intermediate
      const lessonProgress = Math.min(completedLessons / 8, 1);
      const scoreProgress = Math.min(averageScore / 60, 1);
      progress = Math.round(((lessonProgress + scoreProgress) / 2) * 100);
    } else if (level === 'Intermediate') {
      next = 'Advanced';
      // Need 15 lessons completed and 80% average score for Advanced
      const lessonProgress = Math.min(completedLessons / 15, 1);
      const scoreProgress = Math.min(averageScore / 80, 1);
      progress = Math.round(((lessonProgress + scoreProgress) / 2) * 100);
    } else {
      next = 'Master';
      progress = 100;
    }
    
    return { current, next, progress };
  }, [overallProgress]);

  // Get streak information
  const getStreakInfo = useCallback(() => {
    const { streak, lastStudyDate } = overallProgress;
    const today = new Date();
    const daysSinceLastStudy = Math.floor(
      (today.getTime() - lastStudyDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Streak is active if studied today or yesterday
    const isActive = daysSinceLastStudy <= 1;
    
    return {
      current: streak,
      isActive
    };
  }, [overallProgress]);

  // Get recent activity (last 7 days)
  const getRecentActivity = useCallback((): StudySession[] => {
    return studySessions.slice(-7);
  }, [studySessions]);

  // Load progress on mount
  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  return {
    // Progress data
    lessonProgress,
    overallProgress,
    studySessions,
    
    // Loading states
    isLoading,
    isUpdating,
    
    // Error state
    error,
    
    // Actions
    updateLessonProgress,
    getLessonProgress,
    refreshProgress,
    resetProgress,
    exportProgress,
    
    // Computed values
    getProgressPercentage,
    getLevelProgress,
    getStreakInfo,
    getRecentActivity
  };
};

export default useProgress;
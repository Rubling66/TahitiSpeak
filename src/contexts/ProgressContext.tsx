'use client';

import React, { createContext, useContext, ReactNode, useState, useCallback } from 'react';
import { logger } from '../services/LoggingService';

// Progress Context Types
interface ProgressData {
  courseId: string;
  lessonId: string;
  progress: number;
  completed: boolean;
  lastAccessed: string;
}

interface ProgressContextType {
  userProgress: ProgressData[];
  isLoading: boolean;
  error: string | null;
  updateProgress: (courseId: string, lessonId: string, progress: number) => Promise<void>;
  markLessonComplete: (courseId: string, lessonId: string) => Promise<void>;
  getCourseProgress: (courseId: string) => number;
  getLessonProgress: (courseId: string, lessonId: string) => number;
  isLessonCompleted: (courseId: string, lessonId: string) => boolean;
  resetProgress: (courseId: string) => Promise<void>;
  clearError: () => void;
}

// Create the context
const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

// Progress Provider Component
export function ProgressProvider({ children }: { children: ReactNode }) {
  const [userProgress, setUserProgress] = useState<ProgressData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProgress = useCallback(async (courseId: string, lessonId: string, progress: number) => {
    try {
      setIsLoading(true);
      setError(null);

      // Update local state
      setUserProgress(prev => {
        const existing = prev.find(p => p.courseId === courseId && p.lessonId === lessonId);
        if (existing) {
          return prev.map(p => 
            p.courseId === courseId && p.lessonId === lessonId
              ? { ...p, progress, lastAccessed: new Date().toISOString() }
              : p
          );
        } else {
          return [...prev, {
            courseId,
            lessonId,
            progress,
            completed: progress >= 100,
            lastAccessed: new Date().toISOString()
          }];
        }
      });

      logger.info('Progress updated', { courseId, lessonId, progress });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update progress';
      setError(errorMessage);
      logger.error('Failed to update progress', { courseId, lessonId, error: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markLessonComplete = useCallback(async (courseId: string, lessonId: string) => {
    await updateProgress(courseId, lessonId, 100);
  }, [updateProgress]);

  const getCourseProgress = useCallback((courseId: string) => {
    const courseLessons = userProgress.filter(p => p.courseId === courseId);
    if (courseLessons.length === 0) return 0;
    
    const totalProgress = courseLessons.reduce((sum, lesson) => sum + lesson.progress, 0);
    return Math.round(totalProgress / courseLessons.length);
  }, [userProgress]);

  const getLessonProgress = useCallback((courseId: string, lessonId: string) => {
    const lesson = userProgress.find(p => p.courseId === courseId && p.lessonId === lessonId);
    return lesson?.progress || 0;
  }, [userProgress]);

  const isLessonCompleted = useCallback((courseId: string, lessonId: string) => {
    const lesson = userProgress.find(p => p.courseId === courseId && p.lessonId === lessonId);
    return lesson?.completed || false;
  }, [userProgress]);

  const resetProgress = useCallback(async (courseId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      setUserProgress(prev => prev.filter(p => p.courseId !== courseId));
      logger.info('Course progress reset', { courseId });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset progress';
      setError(errorMessage);
      logger.error('Failed to reset progress', { courseId, error: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: ProgressContextType = {
    userProgress,
    isLoading,
    error,
    updateProgress,
    markLessonComplete,
    getCourseProgress,
    getLessonProgress,
    isLessonCompleted,
    resetProgress,
    clearError
  };

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
}

// Custom hook to use the progress context
export function useProgressContext() {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error('useProgressContext must be used within a ProgressProvider');
  }
  return context;
}

// Export the context for testing purposes
export { ProgressContext };
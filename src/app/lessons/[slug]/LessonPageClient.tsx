'use client';

import { useState, useEffect } from 'react';
import { LessonPage } from '@/components/lesson/LessonPage';
import { JSONDataService } from '@/lib/data/JSONDataService';
import { AuthenticatedLayout } from '@/components/layout/AppLayout';
import type { Lesson, UserProgress } from '@/types';

interface LessonPageClientProps {
  lesson: Lesson;
}

export function LessonPageClient({ lesson }: LessonPageClientProps) {
  const [userProgress, setUserProgress] = useState<UserProgress | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserProgress = async () => {
      try {
        setIsLoading(true);
        const dataService = new JSONDataService();
        // Using a default user ID of 1 for now
        const progress = await dataService.getUserProgress(1, lesson.id);
        setUserProgress(progress);
      } catch (error) {
        console.error('Failed to load user progress:', error);
        // Set empty progress if loading fails
        setUserProgress(undefined);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserProgress();
  }, [lesson.id]);

  const handleProgressUpdate = async (progress: UserProgress) => {
    try {
      const dataService = new JSONDataService();
      await dataService.updateUserProgress(progress);
      setUserProgress(progress);
      console.log('Progress updated:', progress);
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  if (isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lesson...</p>
        </div>
      </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <LessonPage
        lesson={lesson}
        userProgress={userProgress}
        onProgressUpdate={handleProgressUpdate}
      />
    </AuthenticatedLayout>
  );
}
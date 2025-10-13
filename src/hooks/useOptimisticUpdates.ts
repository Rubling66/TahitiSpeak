'use client';

import { useCallback, useState } from 'react';
import useSWR, { mutate } from 'swr';
import { toast } from 'sonner';

interface OptimisticUpdateOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  rollbackDelay?: number;
  showToast?: boolean;
}

interface OptimisticState<T> {
  data: T | undefined;
  isLoading: boolean;
  error: Error | null;
  isOptimistic: boolean;
}

// Generic optimistic update hook
export const useOptimisticUpdate = <T>(
  key: string,
  updateFn: (data: T) => Promise<T>,
  options: OptimisticUpdateOptions<T> = {}
) => {
  const { data, error, isLoading } = useSWR<T>(key);
  const [optimisticState, setOptimisticState] = useState<OptimisticState<T>>({
    data: undefined,
    isLoading: false,
    error: null,
    isOptimistic: false
  });

  const performOptimisticUpdate = useCallback(async (
    optimisticData: T,
    updatePayload?: any
  ) => {
    const {
      onSuccess,
      onError,
      rollbackDelay = 5000,
      showToast = true
    } = options;

    // Set optimistic state
    setOptimisticState({
      data: optimisticData,
      isLoading: true,
      error: null,
      isOptimistic: true
    });

    // Update SWR cache optimistically
    mutate(key, optimisticData, false);

    if (showToast) {
      toast.loading('Mise à jour en cours...', { id: 'optimistic-update' });
    }

    try {
      // Perform actual update
      const result = await updateFn(updatePayload || optimisticData);
      
      // Update cache with real result
      mutate(key, result, false);
      
      setOptimisticState({
        data: result,
        isLoading: false,
        error: null,
        isOptimistic: false
      });

      if (showToast) {
        toast.success('Mise à jour réussie', { id: 'optimistic-update' });
      }

      onSuccess?.(result);
      
      return result;
    } catch (error) {
      // Rollback optimistic update
      mutate(key, data, false);
      
      const errorObj = error instanceof Error ? error : new Error(String(error));
      
      setOptimisticState({
        data: data,
        isLoading: false,
        error: errorObj,
        isOptimistic: false
      });

      if (showToast) {
        toast.error('Échec de la mise à jour', { id: 'optimistic-update' });
      }

      onError?.(errorObj);
      
      // Auto-rollback after delay
      setTimeout(() => {
        setOptimisticState(prev => ({ ...prev, error: null }));
      }, rollbackDelay);

      throw errorObj;
    }
  }, [key, updateFn, data, options]);

  return {
    data: optimisticState.isOptimistic ? optimisticState.data : data,
    error: optimisticState.error || error,
    isLoading: optimisticState.isLoading || isLoading,
    isOptimistic: optimisticState.isOptimistic,
    performOptimisticUpdate
  };
};

// Specialized hook for lesson content updates
export const useOptimisticLessonUpdate = (lessonId: string) => {
  const key = `/api/lessons/${lessonId}`;
  
  const updateLesson = useCallback(async (lessonData: any) => {
    const response = await fetch(key, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lessonData)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update lesson: ${response.statusText}`);
    }
    
    return response.json();
  }, [key]);

  return useOptimisticUpdate(key, updateLesson, {
    showToast: true,
    onSuccess: () => {
      // Invalidate related caches
      mutate('/api/lessons', undefined, true);
      mutate('/api/analytics/lessons', undefined, true);
    }
  });
};

// Specialized hook for user progress updates
export const useOptimisticProgressUpdate = (userId: string) => {
  const key = `/api/users/${userId}/progress`;
  
  const updateProgress = useCallback(async (progressData: any) => {
    const response = await fetch(key, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(progressData)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update progress: ${response.statusText}`);
    }
    
    return response.json();
  }, [key]);

  return useOptimisticUpdate(key, updateProgress, {
    showToast: false, // Silent updates for progress
    onSuccess: () => {
      // Invalidate analytics cache
      mutate('/api/analytics/learner-progress', undefined, true);
    }
  });
};

// Specialized hook for content creation
export const useOptimisticContentCreate = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createContent = useCallback(async (
    contentData: any,
    optimisticId?: string
  ) => {
    setIsCreating(true);
    setError(null);

    // Generate optimistic ID if not provided
    const tempId = optimisticId || `temp_${Date.now()}`;
    const optimisticContent = {
      ...contentData,
      id: tempId,
      createdAt: new Date().toISOString(),
      status: 'creating'
    };

    try {
      // Add optimistic content to cache
      const currentLessons = await mutate('/api/lessons');
      const optimisticLessons = Array.isArray(currentLessons) 
        ? [optimisticContent, ...currentLessons]
        : [optimisticContent];
      
      mutate('/api/lessons', optimisticLessons, false);

      toast.loading('Création du contenu...', { id: 'content-create' });

      // Perform actual creation
      const response = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contentData)
      });

      if (!response.ok) {
        throw new Error(`Failed to create content: ${response.statusText}`);
      }

      const result = await response.json();

      // Replace optimistic content with real content
      const updatedLessons = optimisticLessons.map(lesson => 
        lesson.id === tempId ? result : lesson
      );
      
      mutate('/api/lessons', updatedLessons, false);

      toast.success('Contenu créé avec succès', { id: 'content-create' });
      
      return result;
    } catch (error) {
      // Remove optimistic content on error
      const currentLessons = await mutate('/api/lessons');
      const filteredLessons = Array.isArray(currentLessons)
        ? currentLessons.filter(lesson => lesson.id !== tempId)
        : [];
      
      mutate('/api/lessons', filteredLessons, false);

      const errorObj = error instanceof Error ? error : new Error(String(error));
      setError(errorObj);

      toast.error('Échec de la création', { id: 'content-create' });
      
      throw errorObj;
    } finally {
      setIsCreating(false);
    }
  }, []);

  return {
    createContent,
    isCreating,
    error
  };
};

// Batch optimistic updates for multiple items
export const useBatchOptimisticUpdate = <T>(
  keys: string[],
  updateFn: (items: T[]) => Promise<T[]>
) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [errors, setErrors] = useState<Record<string, Error>>({});

  const performBatchUpdate = useCallback(async (
    optimisticData: Record<string, T>
  ) => {
    setIsUpdating(true);
    setErrors({});

    // Apply optimistic updates to all keys
    const originalData: Record<string, T> = {};
    
    for (const key of keys) {
      const currentData = await mutate(key);
      originalData[key] = currentData;
      
      if (optimisticData[key]) {
        mutate(key, optimisticData[key], false);
      }
    }

    try {
      const items = Object.values(optimisticData);
      const results = await updateFn(items);

      // Update caches with real results
      results.forEach((result, index) => {
        const key = keys[index];
        if (key) {
          mutate(key, result, false);
        }
      });

      toast.success('Mise à jour groupée réussie');
      
      return results;
    } catch (error) {
      // Rollback all optimistic updates
      for (const key of keys) {
        mutate(key, originalData[key], false);
      }

      const errorObj = error instanceof Error ? error : new Error(String(error));
      const errorRecord = keys.reduce((acc, key) => {
        acc[key] = errorObj;
        return acc;
      }, {} as Record<string, Error>);
      
      setErrors(errorRecord);
      toast.error('Échec de la mise à jour groupée');
      
      throw errorObj;
    } finally {
      setIsUpdating(false);
    }
  }, [keys, updateFn]);

  return {
    performBatchUpdate,
    isUpdating,
    errors
  };
};

export default useOptimisticUpdate;
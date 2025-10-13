// useStoryProgress Hook - Manages user story progress and bookmarks
'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, getCurrentUser } from '@/lib/supabase/client';
import type { 
  UserStoryProgress, 
  UseStoryProgressReturn,
  ChoiceMade,
  StoryBookmark 
} from '@/types/story-system';

export function useStoryProgress(storyId: string): UseStoryProgressReturn {
  const [progress, setProgress] = useState<UserStoryProgress>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  // Load user progress for the story
  const loadProgress = useCallback(async () => {
    try {
      setLoading(true);
      setError(undefined);

      const user = await getCurrentUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error: queryError } = await supabase
        .from('user_story_progress')
        .select(`
          *,
          story:stories(*),
          current_passage:story_passages(*)
        `)
        .eq('user_id', user.id)
        .eq('story_id', storyId)
        .single();

      if (queryError && queryError.code !== 'PGRST116') {
        throw queryError;
      }

      if (data) {
        setProgress(data as UserStoryProgress);
      }
    } catch (err) {
      console.error('Error loading story progress:', err);
      setError(err instanceof Error ? err.message : 'Failed to load progress');
    } finally {
      setLoading(false);
    }
  }, [storyId]);

  // Update progress when user navigates to a new passage
  const updateProgress = useCallback(async (
    passageId: string, 
    choices?: ChoiceMade[]
  ) => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get current progress or create new one
      let currentProgress = progress;
      
      if (!currentProgress) {
        const { data: newProgress, error: createError } = await supabase
          .from('user_story_progress')
          .insert({
            user_id: user.id,
            story_id: storyId,
            current_passage_id: passageId,
            completion_percentage: 0,
            is_completed: false,
            cultural_knowledge_gained: 0,
            choices_made: choices || [],
            annotations_viewed: [],
            time_spent: 0,
            last_accessed_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) {
          throw createError;
        }

        currentProgress = newProgress as UserStoryProgress;
        setProgress(currentProgress);
        return;
      }

      // Update existing progress
      const updatedChoices = choices 
        ? [...(currentProgress.choices_made || []), ...choices]
        : currentProgress.choices_made;

      const { data: updatedProgress, error: updateError } = await supabase
        .from('user_story_progress')
        .update({
          current_passage_id: passageId,
          choices_made: updatedChoices,
          last_accessed_at: new Date().toISOString()
        })
        .eq('id', currentProgress.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setProgress(updatedProgress as UserStoryProgress);
    } catch (err) {
      console.error('Error updating story progress:', err);
      setError(err instanceof Error ? err.message : 'Failed to update progress');
    }
  }, [storyId, progress]);

  // Mark story as completed
  const markCompleted = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      if (!user || !progress) {
        throw new Error('User not authenticated or no progress found');
      }

      const { data: updatedProgress, error: updateError } = await supabase
        .from('user_story_progress')
        .update({
          is_completed: true,
          completion_percentage: 100,
          completed_at: new Date().toISOString(),
          last_accessed_at: new Date().toISOString()
        })
        .eq('id', progress.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setProgress(updatedProgress as UserStoryProgress);
    } catch (err) {
      console.error('Error marking story as completed:', err);
      setError(err instanceof Error ? err.message : 'Failed to mark as completed');
    }
  }, [progress]);

  // Add bookmark for a passage
  const addBookmark = useCallback(async (passageId: string, note?: string) => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error: insertError } = await supabase
        .from('story_bookmarks')
        .insert({
          user_id: user.id,
          story_id: storyId,
          passage_id: passageId,
          note: note || null
        });

      if (insertError) {
        throw insertError;
      }
    } catch (err) {
      console.error('Error adding bookmark:', err);
      setError(err instanceof Error ? err.message : 'Failed to add bookmark');
    }
  }, [storyId]);

  // Remove bookmark for a passage
  const removeBookmark = useCallback(async (passageId: string) => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error: deleteError } = await supabase
        .from('story_bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('story_id', storyId)
        .eq('passage_id', passageId);

      if (deleteError) {
        throw deleteError;
      }
    } catch (err) {
      console.error('Error removing bookmark:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove bookmark');
    }
  }, [storyId]);

  // Load progress on mount
  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  // Set up real-time subscription for progress updates
  useEffect(() => {
    const user = getCurrentUser();
    if (!user) return;

    const subscription = supabase
      .channel(`story_progress_${storyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_story_progress',
          filter: `story_id=eq.${storyId}`
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' && payload.new) {
            setProgress(payload.new as UserStoryProgress);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [storyId]);

  return {
    progress,
    loading,
    error,
    updateProgress,
    markCompleted,
    addBookmark,
    removeBookmark
  };
}
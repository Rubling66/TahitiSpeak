// useStoryDiscussions Hook - Manages community discussions and Q&A
'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, getCurrentUser } from '@/lib/supabase/client';
import type { 
  StoryDiscussion, 
  UseStoryDiscussionsReturn,
  DiscussionType 
} from '@/types/story-system';

export function useStoryDiscussions(storyId: string): UseStoryDiscussionsReturn {
  const [discussions, setDiscussions] = useState<StoryDiscussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  // Load discussions for the story
  const loadDiscussions = useCallback(async () => {
    try {
      setLoading(true);
      setError(undefined);

      const { data, error: queryError } = await supabase
        .from('story_discussions')
        .select('*')
        .eq('story_id', storyId)
        .order('created_at', { ascending: false });

      if (queryError) {
        throw queryError;
      }

      setDiscussions(data || []);
    } catch (err) {
      console.error('Error loading story discussions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load discussions');
    } finally {
      setLoading(false);
    }
  }, [storyId]);

  // Add a new discussion
  const addDiscussion = useCallback(async (
    title: string,
    content: string,
    type: DiscussionType,
    passageId?: string
  ) => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: newDiscussion, error: insertError } = await supabase
        .from('story_discussions')
        .insert({
          story_id: storyId,
          user_id: user.id,
          title,
          content,
          discussion_type: type,
          passage_id: passageId || null,
          upvotes: 0,
          downvotes: 0,
          is_answered: false
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      setDiscussions(prev => [newDiscussion as StoryDiscussion, ...prev]);
      return newDiscussion as StoryDiscussion;
    } catch (err) {
      console.error('Error adding discussion:', err);
      setError(err instanceof Error ? err.message : 'Failed to add discussion');
      throw err;
    }
  }, [storyId]);

  // Reply to a discussion
  const replyToDiscussion = useCallback(async (
    parentId: string,
    content: string
  ) => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: reply, error: insertError } = await supabase
        .from('story_discussions')
        .insert({
          story_id: storyId,
          user_id: user.id,
          title: '', // Replies don't need titles
          content,
          discussion_type: 'general',
          parent_id: parentId,
          upvotes: 0,
          downvotes: 0,
          is_answered: false
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Add reply to the discussions list
      setDiscussions(prev => [reply as StoryDiscussion, ...prev]);
      return reply as StoryDiscussion;
    } catch (err) {
      console.error('Error replying to discussion:', err);
      setError(err instanceof Error ? err.message : 'Failed to reply');
      throw err;
    }
  }, [storyId]);

  // Vote on a discussion
  const voteOnDiscussion = useCallback(async (
    discussionId: string,
    isUpvote: boolean
  ) => {
    try {
      const discussion = discussions.find(d => d.id === discussionId);
      if (!discussion) {
        throw new Error('Discussion not found');
      }

      const updateData = isUpvote
        ? { upvotes: discussion.upvotes + 1 }
        : { downvotes: discussion.downvotes + 1 };

      const { data: updatedDiscussion, error: updateError } = await supabase
        .from('story_discussions')
        .update(updateData)
        .eq('id', discussionId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setDiscussions(prev =>
        prev.map(d =>
          d.id === discussionId ? updatedDiscussion as StoryDiscussion : d
        )
      );
    } catch (err) {
      console.error('Error voting on discussion:', err);
      setError(err instanceof Error ? err.message : 'Failed to vote');
    }
  }, [discussions]);

  // Mark discussion as answered (for Q&A type)
  const markAsAnswered = useCallback(async (discussionId: string) => {
    try {
      const { data: updatedDiscussion, error: updateError } = await supabase
        .from('story_discussions')
        .update({ is_answered: true })
        .eq('id', discussionId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setDiscussions(prev =>
        prev.map(d =>
          d.id === discussionId ? updatedDiscussion as StoryDiscussion : d
        )
      );
    } catch (err) {
      console.error('Error marking discussion as answered:', err);
      setError(err instanceof Error ? err.message : 'Failed to mark as answered');
    }
  }, []);

  // Get discussions by type
  const getDiscussionsByType = useCallback((type: DiscussionType): StoryDiscussion[] => {
    return discussions.filter(discussion => discussion.discussion_type === type);
  }, [discussions]);

  // Get replies for a discussion
  const getReplies = useCallback((parentId: string): StoryDiscussion[] => {
    return discussions.filter(discussion => discussion.parent_id === parentId);
  }, [discussions]);

  // Load discussions on mount
  useEffect(() => {
    loadDiscussions();
  }, [loadDiscussions]);

  // Set up real-time subscription for new discussions
  useEffect(() => {
    const subscription = supabase
      .channel(`discussions_${storyId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'story_discussions',
          filter: `story_id=eq.${storyId}`
        },
        (payload) => {
          const newDiscussion = payload.new as StoryDiscussion;
          setDiscussions(prev => {
            // Avoid duplicates
            if (prev.some(d => d.id === newDiscussion.id)) {
              return prev;
            }
            return [newDiscussion, ...prev];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'story_discussions',
          filter: `story_id=eq.${storyId}`
        },
        (payload) => {
          const updatedDiscussion = payload.new as StoryDiscussion;
          setDiscussions(prev =>
            prev.map(d =>
              d.id === updatedDiscussion.id ? updatedDiscussion : d
            )
          );
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [storyId]);

  return {
    discussions,
    loading,
    error,
    addDiscussion,
    replyToDiscussion,
    voteOnDiscussion,
    markAsAnswered,
    getDiscussionsByType,
    getReplies
  };
}
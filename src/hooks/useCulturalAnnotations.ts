// useCulturalAnnotations Hook - Manages cultural annotations and knowledge tracking
'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, getCurrentUser } from '@/lib/supabase/client';
import type { 
  CulturalAnnotation, 
  UseCulturalAnnotationsReturn,
  AnnotationType,
  CulturalKnowledgePoint 
} from '@/types/story-system';

export function useCulturalAnnotations(storyId?: string): UseCulturalAnnotationsReturn {
  const [annotations, setAnnotations] = useState<CulturalAnnotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  // Load annotations for a story or all annotations
  const loadAnnotations = useCallback(async () => {
    try {
      setLoading(true);
      setError(undefined);

      let query = supabase
        .from('cultural_annotations')
        .select('*')
        .order('created_at', { ascending: false });

      if (storyId) {
        query = query.eq('story_id', storyId);
      }

      const { data, error: queryError } = await query;

      if (queryError) {
        throw queryError;
      }

      // Check which annotations have been viewed by the current user
      const user = await getCurrentUser();
      let viewedAnnotations: string[] = [];

      if (user && data?.length) {
        const { data: knowledgePoints } = await supabase
          .from('cultural_knowledge_points')
          .select('annotation_id')
          .eq('user_id', user.id)
          .in('annotation_id', data.map(a => a.id));

        viewedAnnotations = knowledgePoints?.map(kp => kp.annotation_id) || [];
      }

      const processedAnnotations: CulturalAnnotation[] = (data || []).map(annotation => ({
        ...annotation,
        external_links: Array.isArray(annotation.external_links) 
          ? annotation.external_links as string[]
          : [],
        is_viewed: viewedAnnotations.includes(annotation.id)
      }));

      setAnnotations(processedAnnotations);
    } catch (err) {
      console.error('Error loading cultural annotations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load annotations');
    } finally {
      setLoading(false);
    }
  }, [storyId]);

  // Mark annotation as viewed and award knowledge points
  const markAsViewed = useCallback(async (annotationId: string) => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get the annotation details
      const annotation = annotations.find(a => a.id === annotationId);
      if (!annotation) {
        throw new Error('Annotation not found');
      }

      // Check if already viewed
      if (annotation.is_viewed) {
        return;
      }

      // Award knowledge points
      const { error: insertError } = await supabase
        .from('cultural_knowledge_points')
        .insert({
          user_id: user.id,
          story_id: annotation.story_id || '',
          annotation_id: annotationId,
          points_earned: 1,
          knowledge_category: annotation.annotation_type
        });

      if (insertError && insertError.code !== '23505') { // Ignore duplicate key error
        throw insertError;
      }

      // Update local state
      setAnnotations(prev => 
        prev.map(a => 
          a.id === annotationId 
            ? { ...a, is_viewed: true }
            : a
        )
      );
    } catch (err) {
      console.error('Error marking annotation as viewed:', err);
      setError(err instanceof Error ? err.message : 'Failed to mark as viewed');
    }
  }, [annotations]);

  // Get annotations for a specific passage
  const getAnnotationsForPassage = useCallback((passageId: string): CulturalAnnotation[] => {
    return annotations.filter(annotation => annotation.passage_id === passageId);
  }, [annotations]);

  // Get annotations by type
  const getAnnotationsByType = useCallback((type: AnnotationType): CulturalAnnotation[] => {
    return annotations.filter(annotation => annotation.annotation_type === type);
  }, [annotations]);

  // Load annotations on mount
  useEffect(() => {
    loadAnnotations();
  }, [loadAnnotations]);

  // Set up real-time subscription for new annotations
  useEffect(() => {
    let subscription: any;

    if (storyId) {
      subscription = supabase
        .channel(`annotations_${storyId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'cultural_annotations',
            filter: `story_id=eq.${storyId}`
          },
          (payload) => {
            const newAnnotation = {
              ...payload.new,
              external_links: Array.isArray(payload.new.external_links) 
                ? payload.new.external_links as string[]
                : [],
              is_viewed: false
            } as CulturalAnnotation;

            setAnnotations(prev => [newAnnotation, ...prev]);
          }
        )
        .subscribe();
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [storyId]);

  return {
    annotations,
    loading,
    error,
    markAsViewed,
    getAnnotationsForPassage,
    getAnnotationsByType
  };
}
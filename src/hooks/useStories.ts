// useStories Hook - Manages story library and filtering
'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { 
  Story, 
  StoryFilter, 
  StorySortOption, 
  UseStoriesReturn,
  UserStoryProgress 
} from '@/types/story-system';

const STORIES_PER_PAGE = 12;

export function useStories(): UseStoriesReturn {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [filter, setFilterState] = useState<StoryFilter>({});
  const [sort, setSortState] = useState<StorySortOption>('created_at_desc');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Build query based on filters and sort
  const buildQuery = useCallback(() => {
    let query = supabase
      .from('stories')
      .select(`
        *,
        story_ratings(rating),
        user_story_progress(completion_percentage, is_completed)
      `)
      .eq('is_published', true);

    // Apply filters
    if (filter.category?.length) {
      query = query.in('category', filter.category);
    }
    
    if (filter.difficulty_level?.length) {
      query = query.in('difficulty_level', filter.difficulty_level);
    }
    
    if (filter.cultural_region?.length) {
      query = query.in('cultural_region', filter.cultural_region);
    }
    
    if (filter.language?.length) {
      query = query.in('language', filter.language);
    }
    
    if (filter.min_duration) {
      query = query.gte('estimated_duration', filter.min_duration);
    }
    
    if (filter.max_duration) {
      query = query.lte('estimated_duration', filter.max_duration);
    }
    
    if (filter.search_query) {
      query = query.or(`title.ilike.%${filter.search_query}%,description.ilike.%${filter.search_query}%`);
    }

    // Apply sorting
    switch (sort) {
      case 'title_asc':
        query = query.order('title', { ascending: true });
        break;
      case 'title_desc':
        query = query.order('title', { ascending: false });
        break;
      case 'created_at_asc':
        query = query.order('created_at', { ascending: true });
        break;
      case 'created_at_desc':
        query = query.order('created_at', { ascending: false });
        break;
      case 'duration_asc':
        query = query.order('estimated_duration', { ascending: true });
        break;
      case 'duration_desc':
        query = query.order('estimated_duration', { ascending: false });
        break;
      case 'cultural_score_asc':
        query = query.order('cultural_authenticity_score', { ascending: true });
        break;
      case 'cultural_score_desc':
        query = query.order('cultural_authenticity_score', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    return query;
  }, [filter, sort]);

  // Load stories
  const loadStories = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      setError(undefined);

      const currentPage = reset ? 1 : page;
      const from = (currentPage - 1) * STORIES_PER_PAGE;
      const to = from + STORIES_PER_PAGE - 1;

      const query = buildQuery();
      const { data, error: queryError, count } = await query
        .range(from, to)
        .limit(STORIES_PER_PAGE);

      if (queryError) {
        throw queryError;
      }

      // Process stories with computed fields
      const processedStories: Story[] = (data || []).map(story => {
        const ratings = story.story_ratings || [];
        const progress = story.user_story_progress?.[0] as UserStoryProgress | undefined;
        
        const averageRating = ratings.length > 0 
          ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length 
          : 0;

        return {
          ...story,
          average_rating: averageRating,
          total_ratings: ratings.length,
          user_progress: progress,
          is_bookmarked: false // Will be loaded separately if needed
        };
      });

      if (reset) {
        setStories(processedStories);
        setPage(2);
      } else {
        setStories(prev => [...prev, ...processedStories]);
        setPage(prev => prev + 1);
      }

      setTotalCount(count || 0);
      setHasMore(processedStories.length === STORIES_PER_PAGE);
    } catch (err) {
      console.error('Error loading stories:', err);
      setError(err instanceof Error ? err.message : 'Failed to load stories');
    } finally {
      setLoading(false);
    }
  }, [buildQuery, page]);

  // Load initial stories
  useEffect(() => {
    loadStories(true);
  }, [filter, sort]);

  // Set filter with reset
  const setFilter = useCallback((newFilter: Partial<StoryFilter>) => {
    setFilterState(prev => ({ ...prev, ...newFilter }));
    setPage(1);
  }, []);

  // Set sort with reset
  const setSort = useCallback((newSort: StorySortOption) => {
    setSortState(newSort);
    setPage(1);
  }, []);

  // Load more stories
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadStories(false);
    }
  }, [loading, hasMore, loadStories]);

  // Refresh stories
  const refresh = useCallback(() => {
    setPage(1);
    loadStories(true);
  }, [loadStories]);

  return {
    stories,
    loading,
    error,
    filter,
    setFilter,
    sort,
    setSort,
    loadMore,
    refresh,
    hasMore
  };
}
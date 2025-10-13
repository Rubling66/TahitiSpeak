/**
 * Story System Optimization Service
 * Handles performance optimization for the Interactive Polynesian Story System
 */

import { CacheService } from './CacheService';
import { supabase } from '@/lib/supabase/client';
import type { 
  Story, 
  StoryPassage, 
  CulturalAnnotation,
  UserStoryProgress 
} from '@/types/story-system';

interface StoryOptimizationConfig {
  preloadPassages: number;
  cacheTimeout: number;
  batchSize: number;
  enablePrefetch: boolean;
  compressionLevel: number;
}

interface StoryMetrics {
  loadTime: number;
  cacheHitRate: number;
  memoryUsage: number;
  userEngagement: number;
}

export class StoryOptimizationService {
  private static instance: StoryOptimizationService;
  private cacheService: CacheService;
  private config: StoryOptimizationConfig;
  private metrics: Map<string, StoryMetrics>;
  private preloadQueue: Set<string>;
  private compressionWorker?: Worker;

  private constructor() {
    this.cacheService = CacheService.getInstance();
    this.config = {
      preloadPassages: 3,
      cacheTimeout: 30 * 60 * 1000, // 30 minutes
      batchSize: 10,
      enablePrefetch: true,
      compressionLevel: 6
    };
    this.metrics = new Map();
    this.preloadQueue = new Set();
    this.initializeCompressionWorker();
  }

  static getInstance(): StoryOptimizationService {
    if (!StoryOptimizationService.instance) {
      StoryOptimizationService.instance = new StoryOptimizationService();
    }
    return StoryOptimizationService.instance;
  }

  private initializeCompressionWorker(): void {
    if (typeof Worker !== 'undefined') {
      try {
        this.compressionWorker = new Worker('/workers/compression-worker.js');
      } catch (error) {
        console.warn('Compression worker not available:', error);
      }
    }
  }

  /**
   * Optimized story loading with intelligent caching
   */
  async loadStoryOptimized(storyId: string): Promise<{
    story: Story;
    passages: StoryPassage[];
    annotations: CulturalAnnotation[];
  }> {
    const startTime = performance.now();
    const cacheKey = `story:${storyId}`;

    try {
      // Check cache first
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        this.updateMetrics(storyId, {
          loadTime: performance.now() - startTime,
          cacheHitRate: 1,
          memoryUsage: this.estimateMemoryUsage(cached),
          userEngagement: 0
        });
        return cached;
      }

      // Load from database with optimized queries
      const [storyResult, passagesResult, annotationsResult] = await Promise.all([
        supabase
          .from('stories')
          .select('*')
          .eq('id', storyId)
          .single(),
        
        supabase
          .from('story_passages')
          .select('*')
          .eq('story_id', storyId)
          .order('passage_number'),
        
        supabase
          .from('cultural_annotations')
          .select('*')
          .eq('story_id', storyId)
      ]);

      if (storyResult.error) throw storyResult.error;
      if (passagesResult.error) throw passagesResult.error;
      if (annotationsResult.error) throw annotationsResult.error;

      const result = {
        story: storyResult.data as Story,
        passages: passagesResult.data as StoryPassage[],
        annotations: annotationsResult.data as CulturalAnnotation[]
      };

      // Cache the result with compression
      await this.cacheService.set(cacheKey, result, this.config.cacheTimeout);

      // Preload related content
      if (this.config.enablePrefetch) {
        this.preloadRelatedContent(storyId, result.story);
      }

      this.updateMetrics(storyId, {
        loadTime: performance.now() - startTime,
        cacheHitRate: 0,
        memoryUsage: this.estimateMemoryUsage(result),
        userEngagement: 0
      });

      return result;
    } catch (error) {
      console.error('Error loading story:', error);
      throw error;
    }
  }

  /**
   * Preload next passages for smooth navigation
   */
  async preloadPassages(storyId: string, currentPassageId: string): Promise<void> {
    const cacheKey = `passages:${storyId}:${currentPassageId}`;
    
    if (this.preloadQueue.has(cacheKey)) {
      return; // Already preloading
    }

    this.preloadQueue.add(cacheKey);

    try {
      // Get choices for current passage
      const { data: choices } = await supabase
        .from('story_choices')
        .select('to_passage_id')
        .eq('from_passage_id', currentPassageId);

      if (!choices || choices.length === 0) return;

      // Preload next passages
      const nextPassageIds = choices.map(c => c.to_passage_id);
      const preloadPromises = nextPassageIds.slice(0, this.config.preloadPassages).map(
        passageId => this.preloadSinglePassage(storyId, passageId)
      );

      await Promise.allSettled(preloadPromises);
    } catch (error) {
      console.warn('Error preloading passages:', error);
    } finally {
      this.preloadQueue.delete(cacheKey);
    }
  }

  private async preloadSinglePassage(storyId: string, passageId: string): Promise<void> {
    const cacheKey = `passage:${passageId}`;
    
    // Check if already cached
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return;

    try {
      const { data: passage } = await supabase
        .from('story_passages')
        .select('*')
        .eq('id', passageId)
        .single();

      if (passage) {
        await this.cacheService.set(cacheKey, passage, this.config.cacheTimeout);
      }
    } catch (error) {
      console.warn(`Error preloading passage ${passageId}:`, error);
    }
  }

  /**
   * Preload related content based on user behavior
   */
  private async preloadRelatedContent(storyId: string, story: Story): Promise<void> {
    try {
      // Preload stories in same category
      const { data: relatedStories } = await supabase
        .from('stories')
        .select('id, title, category, difficulty_level')
        .eq('category', story.category)
        .eq('is_published', true)
        .neq('id', storyId)
        .limit(5);

      if (relatedStories) {
        const cacheKey = `related:${storyId}`;
        await this.cacheService.set(cacheKey, relatedStories, this.config.cacheTimeout);
      }
    } catch (error) {
      console.warn('Error preloading related content:', error);
    }
  }

  /**
   * Optimize story images and media
   */
  async optimizeStoryMedia(storyId: string): Promise<void> {
    try {
      const { data: passages } = await supabase
        .from('story_passages')
        .select('id, image_url, audio_url')
        .eq('story_id', storyId)
        .not('image_url', 'is', null);

      if (!passages) return;

      const optimizationPromises = passages.map(async (passage) => {
        if (passage.image_url) {
          await this.optimizeImage(passage.image_url, passage.id);
        }
        if (passage.audio_url) {
          await this.preloadAudio(passage.audio_url, passage.id);
        }
      });

      await Promise.allSettled(optimizationPromises);
    } catch (error) {
      console.warn('Error optimizing story media:', error);
    }
  }

  private async optimizeImage(imageUrl: string, passageId: string): Promise<void> {
    try {
      const cacheKey = `image:${passageId}`;
      
      // Check if already optimized
      const cached = await this.cacheService.get(cacheKey);
      if (cached) return;

      // Create optimized image variants
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      // Create canvas for optimization
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Optimize for different screen sizes
      const variants = [
        { width: 400, quality: 0.8, suffix: 'mobile' },
        { width: 800, quality: 0.85, suffix: 'tablet' },
        { width: 1200, quality: 0.9, suffix: 'desktop' }
      ];

      const optimizedVariants: Record<string, string> = {};

      for (const variant of variants) {
        const aspectRatio = img.height / img.width;
        canvas.width = variant.width;
        canvas.height = variant.width * aspectRatio;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        optimizedVariants[variant.suffix] = canvas.toDataURL('image/webp', variant.quality);
      }

      await this.cacheService.set(cacheKey, optimizedVariants, this.config.cacheTimeout);
    } catch (error) {
      console.warn(`Error optimizing image for passage ${passageId}:`, error);
    }
  }

  private async preloadAudio(audioUrl: string, passageId: string): Promise<void> {
    try {
      const cacheKey = `audio:${passageId}`;
      
      // Check if already cached
      const cached = await this.cacheService.get(cacheKey);
      if (cached) return;

      // Preload audio
      const audio = new Audio();
      audio.preload = 'metadata';
      audio.src = audioUrl;

      await new Promise((resolve, reject) => {
        audio.onloadedmetadata = resolve;
        audio.onerror = reject;
      });

      await this.cacheService.set(cacheKey, { 
        url: audioUrl, 
        duration: audio.duration,
        preloaded: true 
      }, this.config.cacheTimeout);
    } catch (error) {
      console.warn(`Error preloading audio for passage ${passageId}:`, error);
    }
  }

  /**
   * Batch load stories for library view
   */
  async batchLoadStories(storyIds: string[]): Promise<Story[]> {
    const batches = this.chunkArray(storyIds, this.config.batchSize);
    const results: Story[] = [];

    for (const batch of batches) {
      try {
        const { data: stories } = await supabase
          .from('stories')
          .select(`
            *,
            story_ratings(rating),
            user_story_progress(completion_percentage, is_completed)
          `)
          .in('id', batch);

        if (stories) {
          results.push(...(stories as Story[]));
        }
      } catch (error) {
        console.warn('Error in batch loading stories:', error);
      }
    }

    return results;
  }

  /**
   * Update user progress with optimistic updates
   */
  async updateProgressOptimized(
    storyId: string, 
    passageId: string, 
    progress: Partial<UserStoryProgress>
  ): Promise<void> {
    const cacheKey = `progress:${storyId}`;
    
    try {
      // Optimistic update in cache
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        const updatedProgress = { ...cached, ...progress };
        await this.cacheService.set(cacheKey, updatedProgress, this.config.cacheTimeout);
      }

      // Update in database
      const { error } = await supabase
        .from('user_story_progress')
        .upsert({
          story_id: storyId,
          current_passage_id: passageId,
          ...progress,
          last_accessed_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error updating progress:', error);
        // Revert optimistic update on error
        if (cached) {
          await this.cacheService.set(cacheKey, cached, this.config.cacheTimeout);
        }
      }
    } catch (error) {
      console.error('Error in optimized progress update:', error);
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics(storyId?: string): StoryMetrics | Map<string, StoryMetrics> {
    if (storyId) {
      return this.metrics.get(storyId) || {
        loadTime: 0,
        cacheHitRate: 0,
        memoryUsage: 0,
        userEngagement: 0
      };
    }
    return this.metrics;
  }

  /**
   * Clear story cache
   */
  async clearStoryCache(storyId?: string): Promise<void> {
    if (storyId) {
      const keys = [
        `story:${storyId}`,
        `passages:${storyId}`,
        `progress:${storyId}`,
        `related:${storyId}`
      ];
      
      for (const key of keys) {
        await this.cacheService.delete(key);
      }
    } else {
      await this.cacheService.clear();
    }
  }

  /**
   * Optimize for mobile devices
   */
  async optimizeForMobile(): Promise<void> {
    // Reduce cache timeout for mobile
    this.config.cacheTimeout = 15 * 60 * 1000; // 15 minutes
    this.config.preloadPassages = 2; // Reduce preloading
    this.config.batchSize = 5; // Smaller batches
    this.config.compressionLevel = 8; // Higher compression
  }

  /**
   * Cleanup and resource management
   */
  cleanup(): void {
    this.metrics.clear();
    this.preloadQueue.clear();
    
    if (this.compressionWorker) {
      this.compressionWorker.terminate();
    }
  }

  // Utility methods
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private estimateMemoryUsage(data: any): number {
    return JSON.stringify(data).length * 2; // Rough estimate in bytes
  }

  private updateMetrics(storyId: string, metrics: Partial<StoryMetrics>): void {
    const existing = this.metrics.get(storyId) || {
      loadTime: 0,
      cacheHitRate: 0,
      memoryUsage: 0,
      userEngagement: 0
    };
    
    this.metrics.set(storyId, { ...existing, ...metrics });
  }
}

export default StoryOptimizationService;
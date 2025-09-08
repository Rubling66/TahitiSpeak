// Search service using MiniSearch for client-side lesson search

import MiniSearch from 'minisearch';
import type { Lesson, LessonSearchResult, SearchFilters } from '../../types';

export interface SearchOptions {
  fuzzy?: number;
  prefix?: boolean;
  boost?: Record<string, number>;
}

export class SearchService {
  private static instance: SearchService;
  private miniSearch: MiniSearch<Lesson>;
  private isInitialized = false;

  private constructor() {
    this.miniSearch = new MiniSearch({
      fields: [
        'title.fr',
        'title.ty', 
        'title.en',
        'summary',
        'tags',
        'level',
        'slug'
      ],
      storeFields: [
        'slug',
        'title',
        'summary',
        'level',
        'tags',
        'durationMin',
        'heroMediaId',
        'isPublished'
      ],
      searchOptions: {
        boost: {
          'title.fr': 3,
          'title.ty': 3,
          'title.en': 3,
          'summary': 2,
          'tags': 2,
          'level': 1
        },
        fuzzy: 0.2,
        prefix: true
      },
      extractField: (document, fieldName) => {
        // Handle nested fields like title.fr
        const parts = fieldName.split('.');
        let value: any = document;
        
        for (const part of parts) {
          value = value?.[part];
          if (value === undefined) break;
        }
        
        return value;
      }
    });
  }

  static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  async initialize(lessons: Lesson[]): Promise<void> {
    try {
      // Clear existing index
      this.miniSearch.removeAll();
      
      // Add lessons to search index
      this.miniSearch.addAll(lessons);
      
      this.isInitialized = true;
      console.log(`Search service initialized with ${lessons.length} lessons`);
    } catch (error) {
      console.error('Failed to initialize search service:', error);
      throw error;
    }
  }

  async search(
    query: string, 
    filters?: SearchFilters,
    options?: SearchOptions
  ): Promise<LessonSearchResult[]> {
    if (!this.isInitialized) {
      throw new Error('Search service not initialized');
    }

    if (!query.trim()) {
      return [];
    }

    try {
      const searchOptions = {
        prefix: true,
        fuzzy: 0.2,
        ...options
      };

      const results = this.miniSearch.search(query, searchOptions);
      
      // Apply filters
      let filteredResults = results;
      
      if (filters) {
        filteredResults = this.applyFilters(results, filters);
      }

      // Convert to LessonSearchResult format
      return filteredResults.map(result => ({
        lesson: result as unknown as Lesson,
        score: result.score || 0,
        highlights: this.getMatchedFields(result, query)
      }));
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }

  private applyFilters(results: any[], filters: SearchFilters): any[] {
    return results.filter(result => {
      // Level filter
      if (filters.level && result.level !== filters.level) {
        return false;
      }

      // Tags filter
      if (filters.tags && filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(tag => 
          result.tags?.includes(tag)
        );
        if (!hasMatchingTag) {
          return false;
        }
      }

      // Duration filter
      if (filters.minDuration && result.durationMin < filters.minDuration) {
        return false;
      }
      if (filters.maxDuration && result.durationMin > filters.maxDuration) {
        return false;
      }

      // Published filter
      if (filters.isPublished !== undefined && result.isPublished !== filters.isPublished) {
        return false;
      }

      return true;
    });
  }

  private getMatchedFields(result: any, query: string): string[] {
    const matchedFields: string[] = [];
    const queryLower = query.toLowerCase();

    // Check title fields
    if (result.title?.fr?.toLowerCase().includes(queryLower)) {
      matchedFields.push('title.fr');
    }
    if (result.title?.ty?.toLowerCase().includes(queryLower)) {
      matchedFields.push('title.ty');
    }
    if (result.title?.en?.toLowerCase().includes(queryLower)) {
      matchedFields.push('title.en');
    }

    // Check summary
    if (result.summary?.toLowerCase().includes(queryLower)) {
      matchedFields.push('summary');
    }

    // Check tags
    if (result.tags?.some((tag: string) => tag.toLowerCase().includes(queryLower))) {
      matchedFields.push('tags');
    }

    // Check level
    if (result.level?.toLowerCase().includes(queryLower)) {
      matchedFields.push('level');
    }

    return matchedFields;
  }

  async suggest(query: string, limit: number = 5): Promise<string[]> {
    if (!this.isInitialized || !query.trim()) {
      return [];
    }

    try {
      const results = this.miniSearch.search(query, {
        prefix: true,
        fuzzy: 0.1
      });

      // Extract unique suggestions from titles and tags
      const suggestions = new Set<string>();
      
      results.slice(0, limit * 2).forEach(result => {
        // Add title suggestions
        if (result.title?.fr) suggestions.add(result.title.fr);
        if (result.title?.ty) suggestions.add(result.title.ty);
        if (result.title?.en) suggestions.add(result.title.en);
        
        // Add tag suggestions
        result.tags?.forEach((tag: string) => suggestions.add(tag));
      });

      return Array.from(suggestions)
        .filter(suggestion => 
          suggestion.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, limit);
    } catch (error) {
      console.error('Suggestion failed:', error);
      return [];
    }
  }

  async addLesson(lesson: Lesson): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Search service not initialized');
    }

    try {
      this.miniSearch.add(lesson);
    } catch (error) {
      console.error('Failed to add lesson to search index:', error);
      throw error;
    }
  }

  async updateLesson(lesson: Lesson): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Search service not initialized');
    }

    try {
      this.miniSearch.replace(lesson);
    } catch (error) {
      console.error('Failed to update lesson in search index:', error);
      throw error;
    }
  }

  async removeLesson(lessonSlug: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Search service not initialized');
    }

    try {
      this.miniSearch.remove({ slug: lessonSlug } as Lesson);
    } catch (error) {
      console.error('Failed to remove lesson from search index:', error);
      throw error;
    }
  }

  getStats(): { totalDocuments: number; isInitialized: boolean } {
    return {
      totalDocuments: this.miniSearch.documentCount,
      isInitialized: this.isInitialized
    };
  }

  async reindex(lessons: Lesson[]): Promise<void> {
    await this.initialize(lessons);
  }

  clear(): void {
    this.miniSearch.removeAll();
    this.isInitialized = false;
  }
}

export const searchService = SearchService.getInstance();
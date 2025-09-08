import { logger } from './LoggingService';
import { performanceMonitoring } from './PerformanceMonitoringService';

export interface TranslationEntry {
  id: string;
  key: string;
  locale: string;
  value: string;
  context?: string;
  description?: string;
  pluralRules?: Record<string, string>;
  metadata?: {
    lastModified: Date;
    author: string;
    status: 'draft' | 'approved' | 'published';
    version: number;
  };
}

export interface TranslationNamespace {
  id: string;
  name: string;
  description?: string;
  keys: string[];
  locales: string[];
  lastUpdated: Date;
}

export interface TranslationProject {
  id: string;
  name: string;
  description?: string;
  defaultLocale: string;
  supportedLocales: string[];
  namespaces: TranslationNamespace[];
  settings: {
    fallbackLocale: string;
    enablePluralization: boolean;
    enableInterpolation: boolean;
    cacheTimeout: number;
  };
}

export interface TranslationCache {
  [locale: string]: {
    [namespace: string]: {
      data: Record<string, any>;
      timestamp: number;
      version: string;
    };
  };
}

export interface TranslationLoadOptions {
  locale: string;
  namespace?: string;
  fallback?: boolean;
  cache?: boolean;
  timeout?: number;
}

export interface TranslationUpdateOptions {
  locale: string;
  namespace: string;
  key: string;
  value: string;
  metadata?: Partial<TranslationEntry['metadata']>;
}

class TranslationService {
  private cache: TranslationCache = {};
  private loadingPromises: Map<string, Promise<any>> = new Map();
  private project: TranslationProject | null = null;
  private baseUrl: string = '/api/translations';
  private defaultTimeout: number = 5000;

  constructor() {
    this.initializeProject();
  }

  private async initializeProject(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/project`);
      if (response.ok) {
        this.project = await response.json();
        logger.info('Translation project initialized', { project: this.project?.name });
      }
    } catch (error) {
      logger.error('Failed to initialize translation project', { error });
    }
  }

  /**
   * Load translations for a specific locale and namespace
   */
  async loadTranslations(options: TranslationLoadOptions): Promise<Record<string, any>> {
    const { locale, namespace = 'common', fallback = true, cache = true, timeout = this.defaultTimeout } = options;
    const cacheKey = `${locale}:${namespace}`;

    // Check cache first
    if (cache && this.isCacheValid(locale, namespace)) {
      const cached = this.cache[locale]?.[namespace];
      if (cached) {
        logger.debug('Translations loaded from cache', { locale, namespace });
        return cached.data;
      }
    }

    // Check if already loading
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey)!;
    }

    // Load translations
    const loadPromise = this.fetchTranslations(locale, namespace, timeout)
      .then(data => {
        if (cache) {
          this.updateCache(locale, namespace, data);
        }
        this.loadingPromises.delete(cacheKey);
        return data;
      })
      .catch(async error => {
        this.loadingPromises.delete(cacheKey);
        
        // Try fallback locale if enabled
        if (fallback && locale !== this.project?.settings.fallbackLocale) {
          logger.warn('Failed to load translations, trying fallback', { locale, namespace, error });
          return this.loadTranslations({
            ...options,
            locale: this.project?.settings.fallbackLocale || 'en',
            fallback: false
          });
        }
        
        logger.error('Failed to load translations', { locale, namespace, error });
        throw error;
      });

    this.loadingPromises.set(cacheKey, loadPromise);
    return loadPromise;
  }

  /**
   * Fetch translations from the server
   */
  private async fetchTranslations(locale: string, namespace: string, timeout: number): Promise<Record<string, any>> {
    const startTime = performance.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${this.baseUrl}/${locale}/${namespace}`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      const loadTime = performance.now() - startTime;
      performanceMonitoring.recordMetric({
        name: 'translation_load_time',
        value: loadTime,
        unit: 'milliseconds',
        category: 'performance',
        tags: { locale, namespace }
      });

      logger.info('Translations loaded successfully', { 
        locale, 
        namespace, 
        loadTime: `${loadTime.toFixed(2)}ms`,
        keyCount: Object.keys(data).length
      });

      return data;
    } catch (error) {
      const loadTime = performance.now() - startTime;
      performanceMonitoring.recordMetric({
        name: 'translation_load_error',
        value: 1,
        unit: 'count',
        category: 'error',
        tags: { locale, namespace }
      });

      throw error;
    }
  }

  /**
   * Update a translation entry
   */
  async updateTranslation(options: TranslationUpdateOptions): Promise<void> {
    const { locale, namespace, key, value, metadata } = options;
    
    try {
      const response = await fetch(`${this.baseUrl}/${locale}/${namespace}/${key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value, metadata })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Invalidate cache
      this.invalidateCache(locale, namespace);
      
      logger.info('Translation updated successfully', { locale, namespace, key });
    } catch (error) {
      logger.error('Failed to update translation', { locale, namespace, key, error });
      throw error;
    }
  }

  /**
   * Batch update multiple translations
   */
  async batchUpdateTranslations(updates: TranslationUpdateOptions[]): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/batch`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ updates })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Invalidate affected caches
      const affectedCaches = new Set<string>();
      updates.forEach(update => {
        affectedCaches.add(`${update.locale}:${update.namespace}`);
      });

      affectedCaches.forEach(cacheKey => {
        const [locale, namespace] = cacheKey.split(':');
        this.invalidateCache(locale, namespace);
      });
      
      logger.info('Batch translation update completed', { updateCount: updates.length });
    } catch (error) {
      logger.error('Failed to batch update translations', { error });
      throw error;
    }
  }

  /**
   * Get available locales
   */
  getAvailableLocales(): string[] {
    return this.project?.supportedLocales || ['en', 'fr', 'ty'];
  }

  /**
   * Get available namespaces
   */
  getAvailableNamespaces(): string[] {
    return this.project?.namespaces.map(ns => ns.name) || ['common', 'auth', 'courses'];
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(locale: string, namespace: string): boolean {
    const cached = this.cache[locale]?.[namespace];
    if (!cached) return false;

    const cacheTimeout = this.project?.settings.cacheTimeout || 300000; // 5 minutes default
    const isExpired = Date.now() - cached.timestamp > cacheTimeout;
    
    return !isExpired;
  }

  /**
   * Update cache with new data
   */
  private updateCache(locale: string, namespace: string, data: Record<string, any>): void {
    if (!this.cache[locale]) {
      this.cache[locale] = {};
    }

    this.cache[locale][namespace] = {
      data,
      timestamp: Date.now(),
      version: '1.0.0' // TODO: Get from response headers
    };
  }

  /**
   * Invalidate cache for a specific locale and namespace
   */
  private invalidateCache(locale: string, namespace: string): void {
    if (this.cache[locale]?.[namespace]) {
      delete this.cache[locale][namespace];
      logger.debug('Cache invalidated', { locale, namespace });
    }
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache = {};
    logger.info('Translation cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { totalEntries: number; sizeEstimate: string; hitRate: number } {
    let totalEntries = 0;
    let sizeEstimate = 0;

    Object.values(this.cache).forEach(localeCache => {
      Object.values(localeCache).forEach(namespaceCache => {
        totalEntries++;
        sizeEstimate += JSON.stringify(namespaceCache.data).length;
      });
    });

    return {
      totalEntries,
      sizeEstimate: `${(sizeEstimate / 1024).toFixed(2)} KB`,
      hitRate: 0 // TODO: Implement hit rate tracking
    };
  }

  /**
   * Preload translations for multiple locales/namespaces
   */
  async preloadTranslations(preloadList: { locale: string; namespace: string }[]): Promise<void> {
    const promises = preloadList.map(({ locale, namespace }) => 
      this.loadTranslations({ locale, namespace, cache: true })
        .catch(error => {
          logger.warn('Failed to preload translations', { locale, namespace, error });
          return {};
        })
    );

    await Promise.all(promises);
    logger.info('Translation preloading completed', { count: preloadList.length });
  }
}

export const translationService = new TranslationService();
export default translationService;
import { cacheService } from './CacheService';
import { performanceMonitor } from './PerformanceMonitor';

export interface LazyLoadConfig {
  threshold: number; // Intersection threshold (0-1)
  rootMargin: string; // Root margin for intersection observer
  preloadDistance: number; // Distance in pixels to start preloading
  retryAttempts: number; // Number of retry attempts for failed loads
  retryDelay: number; // Delay between retry attempts
}

export interface LazyLoadItem {
  id: string;
  element: HTMLElement;
  src: string;
  loaded: boolean;
  loading: boolean;
  error: boolean;
  retryCount: number;
  priority: 'high' | 'medium' | 'low';
}

export interface ComponentChunk {
  name: string;
  path: string;
  size?: number;
  dependencies?: string[];
  preload?: boolean;
  critical?: boolean;
}

export interface BundleAnalysis {
  totalSize: number;
  chunks: ComponentChunk[];
  duplicates: string[];
  unusedExports: string[];
  recommendations: string[];
}

/**
 * Advanced lazy loading and code splitting service
 * Handles images, components, and dynamic imports with intelligent preloading
 */
export class LazyLoadingService {
  private observer: IntersectionObserver | null = null;
  private lazyItems: Map<string, LazyLoadItem> = new Map();
  private loadedChunks: Set<string> = new Set();
  private preloadQueue: string[] = [];
  private isProcessingQueue = false;
  private componentCache: Map<string, any> = new Map();

  private config: LazyLoadConfig = {
    threshold: 0.1,
    rootMargin: '50px',
    preloadDistance: 200,
    retryAttempts: 3,
    retryDelay: 1000
  };

  constructor(config?: Partial<LazyLoadConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    
    this.initializeIntersectionObserver();
    this.setupPreloadQueue();
  }

  /**
   * Initialize intersection observer for lazy loading
   */
  private initializeIntersectionObserver(): void {
    if (!('IntersectionObserver' in window)) {
      console.warn('IntersectionObserver not supported, falling back to immediate loading');
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const itemId = element.dataset.lazyId;
            
            if (itemId) {
              this.loadItem(itemId);
            }
          }
        });
      },
      {
        threshold: this.config.threshold,
        rootMargin: this.config.rootMargin
      }
    );
  }

  /**
   * Setup preload queue processing
   */
  private setupPreloadQueue(): void {
    // Process preload queue every 100ms
    setInterval(() => {
      if (!this.isProcessingQueue && this.preloadQueue.length > 0) {
        this.processPreloadQueue();
      }
    }, 100);
  }

  /**
   * Register an element for lazy loading
   */
  registerLazyLoad(
    element: HTMLElement,
    src: string,
    priority: LazyLoadItem['priority'] = 'medium'
  ): string {
    const id = `lazy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const item: LazyLoadItem = {
      id,
      element,
      src,
      loaded: false,
      loading: false,
      error: false,
      retryCount: 0,
      priority
    };

    this.lazyItems.set(id, item);
    element.dataset.lazyId = id;

    // Add to observer
    if (this.observer) {
      this.observer.observe(element);
    } else {
      // Fallback: load immediately
      this.loadItem(id);
    }

    // Add to preload queue if high priority
    if (priority === 'high') {
      this.preloadQueue.unshift(id);
    } else {
      this.preloadQueue.push(id);
    }

    return id;
  }

  /**
   * Load a lazy item
   */
  private async loadItem(id: string): Promise<void> {
    const item = this.lazyItems.get(id);
    if (!item || item.loaded || item.loading) return;

    item.loading = true;
    const startTime = performance.now();

    try {
      // Check cache first
      const cached = await cacheService.get(item.src);
      if (cached) {
        this.applyLoadedContent(item, cached);
        performanceMonitor.recordMetric(`lazy_load_${item.priority}`, performance.now() - startTime);
        return;
      }

      // Load content
      const content = await this.loadContent(item.src);
      
      // Cache the content
      await cacheService.set(item.src, content);
      
      // Apply content to element
      this.applyLoadedContent(item, content);
      
      item.loaded = true;
      item.loading = false;
      
      // Remove from observer
      if (this.observer) {
        this.observer.unobserve(item.element);
      }

      performanceMonitor.recordMetric(`lazy_load_${item.priority}`, performance.now() - startTime);
      
    } catch (error) {
      console.error(`Failed to load lazy item ${id}:`, error);
      item.loading = false;
      item.error = true;
      
      // Retry if attempts remaining
      if (item.retryCount < this.config.retryAttempts) {
        item.retryCount++;
        setTimeout(() => {
          item.error = false;
          this.loadItem(id);
        }, this.config.retryDelay * item.retryCount);
      }
    }
  }

  /**
   * Load content based on type
   */
  private async loadContent(src: string): Promise<any> {
    if (src.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
      return this.loadImage(src);
    } else if (src.match(/\.(mp4|webm|ogg)$/i)) {
      return this.loadVideo(src);
    } else {
      // Assume it's a URL or data
      const response = await fetch(src);
      return response.text();
    }
  }

  /**
   * Load image with optimization
   */
  private async loadImage(src: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        // Create optimized version if needed
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          ctx.drawImage(img, 0, 0);
          
          // Convert to WebP if supported
          if (canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0) {
            resolve(canvas.toDataURL('image/webp', 0.8));
          } else {
            resolve(src);
          }
        } else {
          resolve(src);
        }
      };
      
      img.onerror = reject;
      img.src = src;
    });
  }

  /**
   * Load video with preload metadata
   */
  private async loadVideo(src: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => resolve(src);
      video.onerror = reject;
      video.src = src;
    });
  }

  /**
   * Apply loaded content to element
   */
  private applyLoadedContent(item: LazyLoadItem, content: any): void {
    const element = item.element;
    
    if (element.tagName === 'IMG') {
      (element as HTMLImageElement).src = content;
      element.classList.add('lazy-loaded');
    } else if (element.tagName === 'VIDEO') {
      (element as HTMLVideoElement).src = content;
      element.classList.add('lazy-loaded');
    } else {
      // For other elements, set as background or content
      if (content.startsWith('data:image') || content.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
        element.style.backgroundImage = `url(${content})`;
      } else {
        element.innerHTML = content;
      }
      element.classList.add('lazy-loaded');
    }

    // Trigger loaded event
    element.dispatchEvent(new CustomEvent('lazy-loaded', {
      detail: { src: item.src, content }
    }));
  }

  /**
   * Process preload queue
   */
  private async processPreloadQueue(): Promise<void> {
    if (this.preloadQueue.length === 0) return;

    this.isProcessingQueue = true;
    
    // Process high priority items first
    const highPriorityItems = this.preloadQueue.filter(id => {
      const item = this.lazyItems.get(id);
      return item && item.priority === 'high' && !item.loaded && !item.loading;
    });

    for (const id of highPriorityItems.slice(0, 3)) { // Process max 3 at a time
      await this.loadItem(id);
      this.preloadQueue = this.preloadQueue.filter(queueId => queueId !== id);
    }

    this.isProcessingQueue = false;
  }

  /**
   * Dynamically import a component with caching
   */
  async loadComponent<T = any>(
    componentPath: string,
    componentName?: string
  ): Promise<T> {
    const cacheKey = `component_${componentPath}`;
    
    // Check memory cache first
    if (this.componentCache.has(cacheKey)) {
      return this.componentCache.get(cacheKey);
    }

    // Check persistent cache
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      this.componentCache.set(cacheKey, cached);
      return cached;
    }

    const startTime = performance.now();

    try {
      // Dynamic import
      const module = await import(componentPath);
      const component = componentName ? module[componentName] : module.default;
      
      // Cache the component
      this.componentCache.set(cacheKey, component);
      await cacheService.set(cacheKey, component, 24 * 60 * 60 * 1000); // 24 hours
      
      // Mark chunk as loaded
      this.loadedChunks.add(componentPath);
      
      performanceMonitor.recordMetric('component_load', performance.now() - startTime);
      
      return component;
    } catch (error) {
      console.error(`Failed to load component ${componentPath}:`, error);
      performanceMonitor.recordMetric('component_load_error', performance.now() - startTime);
      throw error;
    }
  }

  /**
   * Preload components based on route or user behavior
   */
  async preloadComponents(componentPaths: string[]): Promise<void> {
    const preloadPromises = componentPaths.map(async (path) => {
      if (!this.loadedChunks.has(path)) {
        try {
          await this.loadComponent(path);
        } catch (error) {
          console.warn(`Failed to preload component ${path}:`, error);
        }
      }
    });

    await Promise.allSettled(preloadPromises);
  }

  /**
   * Get bundle analysis and optimization recommendations
   */
  async analyzeBundles(): Promise<BundleAnalysis> {
    const chunks: ComponentChunk[] = [];
    const duplicates: string[] = [];
    const unusedExports: string[] = [];
    const recommendations: string[] = [];

    // Analyze loaded chunks
    for (const chunkPath of this.loadedChunks) {
      try {
        const module = await import(chunkPath);
        const chunk: ComponentChunk = {
          name: chunkPath.split('/').pop() || chunkPath,
          path: chunkPath,
          dependencies: this.extractDependencies(module)
        };
        chunks.push(chunk);
      } catch (error) {
        console.warn(`Failed to analyze chunk ${chunkPath}:`, error);
      }
    }

    // Find duplicates
    const dependencyMap = new Map<string, string[]>();
    chunks.forEach(chunk => {
      chunk.dependencies?.forEach(dep => {
        if (!dependencyMap.has(dep)) {
          dependencyMap.set(dep, []);
        }
        dependencyMap.get(dep)!.push(chunk.name);
      });
    });

    dependencyMap.forEach((chunks, dependency) => {
      if (chunks.length > 1) {
        duplicates.push(`${dependency} used in: ${chunks.join(', ')}`);
      }
    });

    // Generate recommendations
    if (chunks.length > 20) {
      recommendations.push('Consider implementing route-based code splitting');
    }
    
    if (duplicates.length > 5) {
      recommendations.push('Extract common dependencies into shared chunks');
    }

    const totalSize = chunks.reduce((sum, chunk) => sum + (chunk.size || 0), 0);

    return {
      totalSize,
      chunks,
      duplicates,
      unusedExports,
      recommendations
    };
  }

  /**
   * Extract dependencies from a module (simplified)
   */
  private extractDependencies(module: any): string[] {
    const dependencies: string[] = [];
    
    // This is a simplified implementation
    // In a real scenario, you'd use webpack bundle analyzer or similar tools
    if (module.default && module.default.toString) {
      const moduleString = module.default.toString();
      const importMatches = moduleString.match(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/g);
      
      if (importMatches) {
        importMatches.forEach(match => {
          const dep = match.match(/from\s+['"]([^'"]+)['"]/);
          if (dep && dep[1]) {
            dependencies.push(dep[1]);
          }
        });
      }
    }

    return dependencies;
  }

  /**
   * Optimize images for lazy loading
   */
  optimizeImage(
    src: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'webp' | 'jpeg' | 'png';
    } = {}
  ): string {
    const { width, height, quality = 80, format = 'webp' } = options;
    
    // In a real implementation, this would integrate with an image optimization service
    // For now, we'll return a placeholder that could be processed by a service worker
    const params = new URLSearchParams();
    if (width) params.set('w', width.toString());
    if (height) params.set('h', height.toString());
    params.set('q', quality.toString());
    params.set('f', format);
    
    return `${src}?${params.toString()}`;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    this.lazyItems.clear();
    this.componentCache.clear();
    this.preloadQueue = [];
  }

  /**
   * Get lazy loading statistics
   */
  getStats(): {
    totalItems: number;
    loadedItems: number;
    failedItems: number;
    loadingItems: number;
    cacheHitRate: number;
  } {
    const items = Array.from(this.lazyItems.values());
    
    return {
      totalItems: items.length,
      loadedItems: items.filter(item => item.loaded).length,
      failedItems: items.filter(item => item.error).length,
      loadingItems: items.filter(item => item.loading).length,
      cacheHitRate: 0 // Would need to track cache hits vs misses
    };
  }
}

// Export singleton instance
export const lazyLoadingService = new LazyLoadingService();
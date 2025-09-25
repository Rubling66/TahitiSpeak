// Service Worker Registration and Management
// Handles registration, updates, and offline functionality

export interface SwRegistrationCallbacks {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onOffline?: () => void;
  onOnline?: () => void;
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private callbacks: SwRegistrationCallbacks = {};
  private isOnline: boolean = false;

  constructor() {
    // Only access navigator and window in browser environment
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      this.isOnline = navigator.onLine;
      this.setupOnlineOfflineListeners();
    }
  }

  /**
   * Register the service worker
   */
  async register(callbacks: SwRegistrationCallbacks = {}): Promise<void> {
    this.callbacks = callbacks;

    // Check if we're in browser environment
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      console.warn('Service Worker registration skipped: not in browser environment');
      return;
    }

    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      this.registration = registration;
      console.log('Service Worker registered successfully:', registration.scope);

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available
              this.callbacks.onUpdate?.(registration);
            }
          });
        }
      });

      // Handle successful registration
      if (registration.active) {
        this.callbacks.onSuccess?.(registration);
      }

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', this.handleSwMessage.bind(this));

    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  /**
   * Update the service worker
   */
  async update(): Promise<void> {
    if (this.registration) {
      try {
        await this.registration.update();
        console.log('Service Worker update check completed');
      } catch (error) {
        console.error('Service Worker update failed:', error);
      }
    }
  }

  /**
   * Skip waiting and activate new service worker
   */
  skipWaiting(): void {
    if (this.registration?.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  /**
   * Check if the app is running offline
   */
  isOffline(): boolean {
    return !this.isOnline;
  }

  /**
   * Get cached lessons for offline use
   */
  async getCachedLessons(): Promise<string[]> {
    if (!('caches' in window)) {
      return [];
    }

    try {
      const cache = await caches.open('tahitian-tutor-dynamic-v1');
      const requests = await cache.keys();
      
      return requests
        .map(request => request.url)
        .filter(url => url.includes('/lessons/'))
        .map(url => {
          const match = url.match(/\/lessons\/([^/?]+)/);
          return match ? match[1] : null;
        })
        .filter(Boolean) as string[];
    } catch (error) {
      console.error('Failed to get cached lessons:', error);
      return [];
    }
  }

  /**
   * Preload lesson data for offline use
   */
  async preloadLesson(lessonSlug: string): Promise<void> {
    if (!('caches' in window)) {
      return;
    }

    try {
      const cache = await caches.open('tahitian-tutor-dynamic-v1');
      const lessonUrl = `/lessons/${lessonSlug}`;
      
      // Preload the lesson page
      await cache.add(lessonUrl);
      
      // Preload lesson data
      const dataUrl = `/data/lessons/${lessonSlug}.json`;
      try {
        await cache.add(dataUrl);
      } catch (error) {
        // Lesson data might not exist as separate file
        console.warn(`Could not preload lesson data for ${lessonSlug}:`, error);
      }
      
      console.log(`Lesson ${lessonSlug} preloaded for offline use`);
    } catch (error) {
      console.error(`Failed to preload lesson ${lessonSlug}:`, error);
    }
  }

  /**
   * Clear all caches
   */
  async clearCaches(): Promise<void> {
    if (!('caches' in window)) {
      return;
    }

    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('All caches cleared');
    } catch (error) {
      console.error('Failed to clear caches:', error);
    }
  }

  /**
   * Get cache storage usage
   */
  async getCacheSize(): Promise<{ used: number; quota: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          used: estimate.usage || 0,
          quota: estimate.quota || 0
        };
      } catch (error) {
        console.error('Failed to get storage estimate:', error);
      }
    }
    
    return { used: 0, quota: 0 };
  }

  private setupOnlineOfflineListeners(): void {
    // Only set up listeners in browser environment
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.callbacks.onOnline?.();
        console.log('App is online');
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.callbacks.onOffline?.();
        console.log('App is offline');
      });
    }
  }

  private handleSwMessage(event: MessageEvent): void {
    const { data } = event;
    
    switch (data.type) {
      case 'CACHE_UPDATED':
        console.log('Cache updated:', data.payload);
        break;
      case 'OFFLINE_READY':
        console.log('App ready for offline use');
        break;
      default:
        console.log('Unknown message from service worker:', data);
    }
  }
}

// Create singleton instance lazily
let _swManager: ServiceWorkerManager | null = null;

function getSwManager(): ServiceWorkerManager | null {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return null;
  }
  if (!_swManager) {
    _swManager = new ServiceWorkerManager();
  }
  return _swManager;
}

export const swManager = {
  register: (callbacks?: SwRegistrationCallbacks) => {
    const manager = getSwManager();
    return manager ? manager.register(callbacks) : Promise.resolve();
  },
  update: () => {
    const manager = getSwManager();
    return manager ? manager.update() : Promise.resolve();
  },
  skipWaiting: () => {
    const manager = getSwManager();
    if (manager) manager.skipWaiting();
  },
  isOffline: () => {
    const manager = getSwManager();
    return manager ? manager.isOffline() : false;
  },
  getCachedLessons: () => {
    const manager = getSwManager();
    return manager ? manager.getCachedLessons() : Promise.resolve([]);
  },
  preloadLesson: (lessonSlug: string) => {
    const manager = getSwManager();
    return manager ? manager.preloadLesson(lessonSlug) : Promise.resolve();
  },
  clearCaches: () => {
    const manager = getSwManager();
    return manager ? manager.clearCaches() : Promise.resolve();
  },
  getCacheSize: () => {
    const manager = getSwManager();
    return manager ? manager.getCacheSize() : Promise.resolve({ used: 0, quota: 0 });
  }
};

// Helper function for easy registration
export function registerServiceWorker(callbacks?: SwRegistrationCallbacks): Promise<void> {
  return swManager.register(callbacks);
}

// Helper function to check if app can work offline
export function isOfflineCapable(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }
  return 'serviceWorker' in navigator && 'caches' in window;
}

// Helper function to format cache size
export function formatCacheSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}
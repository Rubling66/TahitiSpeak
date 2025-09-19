'use client';

// PWA Service for managing service worker and PWA functionality

interface PWAInstallPrompt {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAServiceConfig {
  swPath?: string;
  scope?: string;
  updateCheckInterval?: number;
  enableNotifications?: boolean;
  enableBackgroundSync?: boolean;
}

interface PWAStatus {
  isSupported: boolean;
  isInstalled: boolean;
  isInstallable: boolean;
  isOnline: boolean;
  serviceWorkerRegistered: boolean;
  notificationsEnabled: boolean;
}

interface CacheInfo {
  name: string;
  size: number;
  lastUpdated: Date;
}

class PWAService {
  private config: PWAServiceConfig;
  private registration: ServiceWorkerRegistration | null = null;
  private installPrompt: PWAInstallPrompt | null = null;
  private updateAvailable = false;
  private listeners: Map<string, Set<Function>> = new Map();

  constructor(config: PWAServiceConfig = {}) {
    this.config = {
      swPath: '/sw.js',
      scope: '/',
      updateCheckInterval: 60000, // 1 minute
      enableNotifications: true,
      enableBackgroundSync: true,
      ...config
    };

    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  private async initialize(): Promise<void> {
    try {
      // Register service worker
      await this.registerServiceWorker();

      // Set up event listeners
      this.setupEventListeners();

      // Check for updates periodically
      if (this.config.updateCheckInterval) {
        setInterval(() => {
          this.checkForUpdates();
        }, this.config.updateCheckInterval);
      }

      // Request notification permission if enabled
      if (this.config.enableNotifications) {
        await this.requestNotificationPermission();
      }

      console.log('[PWA] Service initialized successfully');
    } catch (error) {
      console.error('[PWA] Failed to initialize:', error);
    }
  }

  private async registerServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker not supported');
    }

    try {
      this.registration = await navigator.serviceWorker.register(
        this.config.swPath!,
        { scope: this.config.scope }
      );

      console.log('[PWA] Service Worker registered:', this.registration.scope);

      // Handle service worker updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration!.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.updateAvailable = true;
              this.emit('updateAvailable', { registration: this.registration });
            }
          });
        }
      });

    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.installPrompt = event as any;
      this.emit('installable', { canInstall: true });
    });

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      this.installPrompt = null;
      this.emit('installed', { isInstalled: true });
    });

    // Listen for online/offline status
    window.addEventListener('online', () => {
      this.emit('online', { isOnline: true });
    });

    window.addEventListener('offline', () => {
      this.emit('offline', { isOnline: false });
    });

    // Listen for service worker messages
    navigator.serviceWorker?.addEventListener('message', (event) => {
      this.handleServiceWorkerMessage(event.data);
    });
  }

  private handleServiceWorkerMessage(data: any): void {
    switch (data.type) {
      case 'CACHE_UPDATED':
        this.emit('cacheUpdated', data);
        break;
      case 'BACKGROUND_SYNC':
        this.emit('backgroundSync', data);
        break;
      case 'PUSH_RECEIVED':
        this.emit('pushReceived', data);
        break;
      default:
        console.log('[PWA] Unknown message from service worker:', data);
    }
  }

  // Public API

  async install(): Promise<boolean> {
    if (!this.installPrompt) {
      console.warn('[PWA] Install prompt not available');
      return false;
    }

    try {
      await this.installPrompt.prompt();
      const choiceResult = await this.installPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] App installation accepted');
        this.installPrompt = null;
        return true;
      } else {
        console.log('[PWA] App installation dismissed');
        return false;
      }
    } catch (error) {
      console.error('[PWA] Install failed:', error);
      return false;
    }
  }

  async checkForUpdates(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      await this.registration.update();
      return this.updateAvailable;
    } catch (error) {
      console.error('[PWA] Update check failed:', error);
      return false;
    }
  }

  async applyUpdate(): Promise<void> {
    if (!this.registration || !this.updateAvailable) {
      return;
    }

    const waitingWorker = this.registration.waiting;
    if (waitingWorker) {
      // Tell the waiting service worker to skip waiting
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      
      // Reload the page to activate the new service worker
      window.location.reload();
    }
  }

  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('[PWA] Notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('[PWA] Notification permission request failed:', error);
      return false;
    }
  }

  async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (!this.registration) {
      throw new Error('Service Worker not registered');
    }

    if (Notification.permission !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    const defaultOptions: NotificationOptions = {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      vibrate: [100, 50, 100],
      ...options
    };

    await this.registration.showNotification(title, defaultOptions);
  }

  async getCacheInfo(): Promise<CacheInfo[]> {
    if (!('caches' in window)) {
      return [];
    }

    try {
      const cacheNames = await caches.keys();
      const cacheInfos: CacheInfo[] = [];

      for (const name of cacheNames) {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        
        cacheInfos.push({
          name,
          size: keys.length,
          lastUpdated: new Date() // This would need to be stored separately for accuracy
        });
      }

      return cacheInfos;
    } catch (error) {
      console.error('[PWA] Failed to get cache info:', error);
      return [];
    }
  }

  async clearCache(cacheName?: string): Promise<void> {
    if (!('caches' in window)) {
      return;
    }

    try {
      if (cacheName) {
        await caches.delete(cacheName);
        console.log(`[PWA] Cache '${cacheName}' cleared`);
      } else {
        // Clear all caches
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(name => caches.delete(name))
        );
        console.log('[PWA] All caches cleared');
      }

      // Notify service worker
      if (this.registration?.active) {
        this.registration.active.postMessage({ type: 'CLEAR_CACHE', cacheName });
      }
    } catch (error) {
      console.error('[PWA] Failed to clear cache:', error);
    }
  }

  getStatus(): PWAStatus {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return {
        isSupported: false,
        isInstalled: false,
        isInstallable: false,
        isOnline: false,
        serviceWorkerRegistered: false,
        notificationsEnabled: false
      };
    }

    return {
      isSupported: 'serviceWorker' in navigator,
      isInstalled: window.matchMedia('(display-mode: standalone)').matches,
      isInstallable: !!this.installPrompt,
      isOnline: navigator.onLine,
      serviceWorkerRegistered: !!this.registration,
      notificationsEnabled: typeof Notification !== 'undefined' && Notification.permission === 'granted'
    };
  }

  // Event system
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  private emit(event: string, data?: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[PWA] Error in event listener for '${event}':`, error);
        }
      });
    }
  }

  // Background sync (if supported)
  async registerBackgroundSync(tag: string): Promise<boolean> {
    if (!this.registration || !('sync' in this.registration)) {
      console.warn('[PWA] Background Sync not supported');
      return false;
    }

    try {
      await (this.registration as any).sync.register(tag);
      console.log(`[PWA] Background sync registered: ${tag}`);
      return true;
    } catch (error) {
      console.error('[PWA] Background sync registration failed:', error);
      return false;
    }
  }

  // Share API (if supported)
  async share(data: ShareData): Promise<boolean> {
    if (!('share' in navigator)) {
      console.warn('[PWA] Web Share API not supported');
      return false;
    }

    try {
      await (navigator as any).share(data);
      return true;
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('[PWA] Share failed:', error);
      }
      return false;
    }
  }

  // Cleanup
  destroy(): void {
    this.listeners.clear();
    
    if (this.registration) {
      // Unregister service worker if needed
      // this.registration.unregister();
    }
  }
}

// Create singleton instance
const pwaService = new PWAService();

export default pwaService;
export { PWAService, type PWAStatus, type CacheInfo, type PWAServiceConfig };

// React hook for PWA functionality
import { useEffect, useState } from 'react';

export function usePWA() {
  const [status, setStatus] = useState<PWAStatus>(pwaService.getStatus());
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Update status periodically
    const updateStatus = () => {
      setStatus(pwaService.getStatus());
    };

    const handleUpdateAvailable = () => {
      setUpdateAvailable(true);
    };

    const handleInstalled = () => {
      updateStatus();
    };

    const handleOnline = () => {
      updateStatus();
    };

    const handleOffline = () => {
      updateStatus();
    };

    // Set up event listeners
    pwaService.on('updateAvailable', handleUpdateAvailable);
    pwaService.on('installed', handleInstalled);
    pwaService.on('online', handleOnline);
    pwaService.on('offline', handleOffline);

    // Update status on mount and periodically
    updateStatus();
    const interval = setInterval(updateStatus, 5000);

    return () => {
      clearInterval(interval);
      pwaService.off('updateAvailable', handleUpdateAvailable);
      pwaService.off('installed', handleInstalled);
      pwaService.off('online', handleOnline);
      pwaService.off('offline', handleOffline);
    };
  }, []);

  return {
    ...status,
    updateAvailable,
    install: () => pwaService.install(),
    applyUpdate: () => pwaService.applyUpdate(),
    checkForUpdates: () => pwaService.checkForUpdates(),
    requestNotificationPermission: () => pwaService.requestNotificationPermission(),
    showNotification: (title: string, options?: NotificationOptions) => 
      pwaService.showNotification(title, options),
    getCacheInfo: () => pwaService.getCacheInfo(),
    clearCache: (cacheName?: string) => pwaService.clearCache(cacheName),
    share: (data: ShareData) => pwaService.share(data)
  };
}
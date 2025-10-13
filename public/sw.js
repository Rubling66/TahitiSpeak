// Enhanced Service Worker with Workbox
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst, NetworkOnly } from 'workbox-strategies';
import { BackgroundSync } from 'workbox-background-sync';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// Precache static assets
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Cache names
const CACHE_NAMES = {
  STATIC: 'tahiti-static-v1',
  DYNAMIC: 'tahiti-dynamic-v1',
  IMAGES: 'tahiti-images-v1',
  AUDIO: 'tahiti-audio-v1',
  API: 'tahiti-api-v1',
  LESSONS: 'tahiti-lessons-v1'
};

// Background sync for offline actions
const bgSync = new BackgroundSync('offline-actions', {
  maxRetentionTime: 24 * 60 // Retry for max of 24 Hours (specified in minutes)
});

// API caching strategy with background sync
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: CACHE_NAMES.API,
    networkTimeoutSeconds: 3,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 5 * 60 // 5 minutes
      }),
      {
        cacheKeyWillBeUsed: async ({ request }) => {
          // Remove auth headers from cache key for better cache hits
          const url = new URL(request.url);
          return url.href;
        },
        requestWillFetch: async ({ request }) => {
          // Add offline indicator to requests
          const headers = new Headers(request.headers);
          headers.set('X-Offline-Capable', 'true');
          
          return new Request(request, { headers });
        },
        fetchDidFail: async ({ originalRequest }) => {
          // Queue failed requests for background sync
          if (originalRequest.method === 'POST' || originalRequest.method === 'PUT') {
            await bgSync.replayRequests();
          }
        }
      }
    ]
  })
);

// Lesson content caching
registerRoute(
  ({ url }) => url.pathname.includes('/lessons/') || url.pathname.includes('/stories/'),
  new StaleWhileRevalidate({
    cacheName: CACHE_NAMES.LESSONS,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60 // 24 hours
      })
    ]
  })
);

// Image caching
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: CACHE_NAMES.IMAGES,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days
      })
    ]
  })
);

// Audio caching
registerRoute(
  ({ request }) => request.destination === 'audio' || request.url.includes('.mp3') || request.url.includes('.wav'),
  new CacheFirst({
    cacheName: CACHE_NAMES.AUDIO,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
      })
    ]
  })
);

// Static assets caching
registerRoute(
  ({ request }) => 
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font',
  new StaleWhileRevalidate({
    cacheName: CACHE_NAMES.STATIC,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      })
    ]
  })
);

// Navigation requests (SPA routing)
const navigationRoute = new NavigationRoute(
  new NetworkFirst({
    cacheName: CACHE_NAMES.DYNAMIC,
    networkTimeoutSeconds: 3,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      })
    ]
  }),
  {
    allowlist: [/^\/(?!api)/], // Cache all navigation except API routes
    denylist: [/\/admin/, /\/api/] // Don't cache admin or API routes
  }
);

registerRoute(navigationRoute);

// Offline fallback for navigation
registerRoute(
  ({ request }) => request.mode === 'navigate',
  async ({ event }) => {
    try {
      return await navigationRoute.handler(event);
    } catch (error) {
      return caches.match('/offline.html');
    }
  }
);

// Custom message handling
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: '1.0.0' });
  }
  
  if (event.data && event.data.type === 'CACHE_LESSON') {
    cacheLessonContent(event.data.lessonId);
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    clearAllCaches();
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'offline-actions') {
    event.waitUntil(syncOfflineActions());
  }
  
  if (event.tag === 'user-progress') {
    event.waitUntil(syncUserProgress());
  }
  
  if (event.tag === 'analytics') {
    event.waitUntil(syncAnalytics());
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.message,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: data.tag || 'default',
    data: data.data || {},
    actions: data.actions || [],
    requireInteraction: data.priority === 'high',
    silent: data.priority === 'low'
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const data = event.notification.data;
  let url = '/';
  
  if (data.url) {
    url = data.url;
  } else if (data.lessonId) {
    url = `/lessons/${data.lessonId}`;
  } else if (data.type === 'achievement') {
    url = '/profile/achievements';
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If not, open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Pre-cache critical resources
      caches.open(CACHE_NAMES.STATIC).then((cache) => {
        return cache.addAll([
          '/',
          '/offline.html',
          '/manifest.json',
          '/icon-192x192.png'
        ]);
      }),
      // Initialize IndexedDB
      initializeOfflineStorage()
    ])
  );
  
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      cleanupOldCaches(),
      // Claim all clients
      self.clients.claim(),
      // Set up periodic sync
      setupPeriodicSync()
    ])
  );
});

// Fetch event with enhanced offline handling
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Handle API requests with offline fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }
  
  // Handle lesson content requests
  if (url.pathname.includes('/lessons/') || url.pathname.includes('/stories/')) {
    event.respondWith(handleLessonRequest(request));
    return;
  }
  
  // Handle media requests
  if (request.destination === 'audio' || request.destination === 'image') {
    event.respondWith(handleMediaRequest(request));
    return;
  }
});

// Helper functions
async function handleApiRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);
    
    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(CACHE_NAMES.API);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If it's a POST/PUT request, queue it for background sync
    if (request.method === 'POST' || request.method === 'PUT') {
      await queueOfflineAction(request);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Request queued for when you\'re back online',
          offline: true 
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Return offline response for GET requests
    return new Response(
      JSON.stringify({ 
        error: 'You are offline and this content is not cached',
        offline: true 
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

async function handleLessonRequest(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(CACHE_NAMES.LESSONS);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Lesson not available offline', { status: 503 });
  }
}

async function handleMediaRequest(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(
        request.destination === 'audio' ? CACHE_NAMES.AUDIO : CACHE_NAMES.IMAGES
      );
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    return new Response('Media not available offline', { status: 503 });
  }
}

async function queueOfflineAction(request) {
  try {
    const body = await request.text();
    const action = {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: body,
      timestamp: Date.now()
    };
    
    // Store in IndexedDB for background sync
    const db = await openDB();
    const tx = db.transaction(['offline_actions'], 'readwrite');
    await tx.objectStore('offline_actions').add(action);
  } catch (error) {
    console.error('Error queuing offline action:', error);
  }
}

async function syncOfflineActions() {
  try {
    const db = await openDB();
    const tx = db.transaction(['offline_actions'], 'readonly');
    const actions = await tx.objectStore('offline_actions').getAll();
    
    for (const action of actions) {
      try {
        const response = await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body
        });
        
        if (response.ok) {
          // Remove successful action from queue
          const deleteTx = db.transaction(['offline_actions'], 'readwrite');
          await deleteTx.objectStore('offline_actions').delete(action.id);
        }
      } catch (error) {
        console.error('Error syncing action:', error);
      }
    }
  } catch (error) {
    console.error('Error syncing offline actions:', error);
  }
}

async function syncUserProgress() {
  try {
    const db = await openDB();
    const tx = db.transaction(['user_progress'], 'readonly');
    const progressItems = await tx.objectStore('user_progress')
      .index('syncStatus')
      .getAll('pending');
    
    for (const progress of progressItems) {
      try {
        const response = await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(progress)
        });
        
        if (response.ok) {
          // Mark as synced
          const updateTx = db.transaction(['user_progress'], 'readwrite');
          await updateTx.objectStore('user_progress').put({
            ...progress,
            syncStatus: 'synced'
          });
        }
      } catch (error) {
        console.error('Error syncing progress:', error);
      }
    }
  } catch (error) {
    console.error('Error syncing user progress:', error);
  }
}

async function syncAnalytics() {
  try {
    const db = await openDB();
    const tx = db.transaction(['analytics'], 'readonly');
    const events = await tx.objectStore('analytics')
      .index('synced')
      .getAll(false);
    
    if (events.length > 0) {
      try {
        const response = await fetch('/api/analytics/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events })
        });
        
        if (response.ok) {
          // Mark events as synced
          const updateTx = db.transaction(['analytics'], 'readwrite');
          for (const event of events) {
            await updateTx.objectStore('analytics').put({
              ...event,
              synced: true
            });
          }
        }
      } catch (error) {
        console.error('Error syncing analytics:', error);
      }
    }
  } catch (error) {
    console.error('Error syncing analytics:', error);
  }
}

async function cacheLessonContent(lessonId) {
  try {
    const cache = await caches.open(CACHE_NAMES.LESSONS);
    const urls = [
      `/api/lessons/${lessonId}`,
      `/api/lessons/${lessonId}/exercises`,
      `/api/lessons/${lessonId}/audio`
    ];
    
    await cache.addAll(urls);
    console.log(`Lesson ${lessonId} cached successfully`);
  } catch (error) {
    console.error('Error caching lesson content:', error);
  }
}

async function clearAllCaches() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    console.log('All caches cleared');
  } catch (error) {
    console.error('Error clearing caches:', error);
  }
}

async function cleanupOldCaches() {
  try {
    const cacheNames = await caches.keys();
    const oldCaches = cacheNames.filter(name => 
      !Object.values(CACHE_NAMES).includes(name)
    );
    
    await Promise.all(
      oldCaches.map(cacheName => caches.delete(cacheName))
    );
  } catch (error) {
    console.error('Error cleaning up old caches:', error);
  }
}

async function setupPeriodicSync() {
  try {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      // Register periodic sync for user progress
      await self.registration.sync.register('user-progress');
      
      // Register periodic sync for analytics
      await self.registration.sync.register('analytics');
    }
  } catch (error) {
    console.error('Error setting up periodic sync:', error);
  }
}

async function initializeOfflineStorage() {
  try {
    await openDB();
    console.log('Offline storage initialized in service worker');
  } catch (error) {
    console.error('Error initializing offline storage:', error);
  }
}

async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('TahitiSpeakOfflineDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('offline_actions')) {
        const store = db.createObjectStore('offline_actions', { keyPath: 'id', autoIncrement: true });
        store.createIndex('timestamp', 'timestamp');
      }
      
      if (!db.objectStoreNames.contains('user_progress')) {
        const store = db.createObjectStore('user_progress', { keyPath: 'id' });
        store.createIndex('syncStatus', 'syncStatus');
      }
      
      if (!db.objectStoreNames.contains('analytics')) {
        const store = db.createObjectStore('analytics', { keyPath: 'id' });
        store.createIndex('synced', 'synced');
      }
    };
  });
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    handleApiRequest,
    handleLessonRequest,
    handleMediaRequest,
    syncOfflineActions,
    syncUserProgress,
    syncAnalytics
  };
}
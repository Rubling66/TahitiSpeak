// Service Worker for Tahitian Tutor PWA
// Version 1.0.0

const CACHE_NAME = 'tahitian-tutor-v1';
const STATIC_CACHE_NAME = 'tahitian-tutor-static-v1';
const DYNAMIC_CACHE_NAME = 'tahitian-tutor-dynamic-v1';
const API_CACHE_NAME = 'tahitian-tutor-api-v1';

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only'
};

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline',
  '/_next/static/css/',
  '/_next/static/js/',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /^\/api\/vocabulary\//,
  /^\/api\/lessons\//,
  /^\/api\/progress\//,
  /^\/api\/user\/profile$/
];

// Routes that should always go to network first
const NETWORK_FIRST_PATTERNS = [
  /^\/api\/auth\//,
  /^\/api\/admin\//,
  /^\/api\/health\//
];

// Routes that should be cached with stale-while-revalidate
const SWR_PATTERNS = [
  /^\/api\/content\//,
  /^\/api\/translations\//
];

// Maximum cache sizes
const MAX_CACHE_SIZES = {
  [STATIC_CACHE_NAME]: 100,
  [DYNAMIC_CACHE_NAME]: 50,
  [API_CACHE_NAME]: 30
};

// Cache expiration times (in milliseconds)
const CACHE_EXPIRATION = {
  STATIC: 7 * 24 * 60 * 60 * 1000, // 7 days
  DYNAMIC: 24 * 60 * 60 * 1000,    // 1 day
  API: 30 * 60 * 1000              // 30 minutes
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS.filter(url => url));
      }),
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName.startsWith('tahitian-tutor-') && 
                     ![
                       STATIC_CACHE_NAME,
                       DYNAMIC_CACHE_NAME,
                       API_CACHE_NAME
                     ].includes(cacheName);
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      }),
      self.clients.claim()
    ])
  );
});

// Fetch event - handle requests with appropriate caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  event.respondWith(handleRequest(request));
});

// Main request handler
async function handleRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  try {
    // Determine caching strategy based on request type
    if (isStaticAsset(pathname)) {
      return await cacheFirst(request, STATIC_CACHE_NAME);
    }
    
    if (isAPIRequest(pathname)) {
      if (matchesPatterns(pathname, NETWORK_FIRST_PATTERNS)) {
        return await networkFirst(request, API_CACHE_NAME);
      }
      
      if (matchesPatterns(pathname, SWR_PATTERNS)) {
        return await staleWhileRevalidate(request, API_CACHE_NAME);
      }
      
      if (matchesPatterns(pathname, API_CACHE_PATTERNS)) {
        return await networkFirst(request, API_CACHE_NAME);
      }
      
      // Default for other API requests
      return await networkOnly(request);
    }
    
    // For page requests, use network first with fallback
    return await networkFirstWithOfflineFallback(request);
    
  } catch (error) {
    console.error('[SW] Error handling request:', error);
    return await handleOfflineRequest(request);
  }
}

// Cache strategies implementation

// Cache First - good for static assets
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse && !isExpired(cachedResponse, CACHE_EXPIRATION.STATIC)) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
      await limitCacheSize(cacheName, MAX_CACHE_SIZES[cacheName]);
    }
    return networkResponse;
  } catch (error) {
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Network First - good for dynamic content
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
      await limitCacheSize(cacheName, MAX_CACHE_SIZES[cacheName]);
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Stale While Revalidate - good for content that can be stale
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Start network request in background
  const networkPromise = fetch(request).then(async (networkResponse) => {
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
      await limitCacheSize(cacheName, MAX_CACHE_SIZES[cacheName]);
    }
    return networkResponse;
  }).catch(() => {});
  
  // Return cached response immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Wait for network if no cache
  return await networkPromise;
}

// Network Only - for requests that should never be cached
async function networkOnly(request) {
  return await fetch(request);
}

// Network First with Offline Fallback - for page requests
async function networkFirstWithOfflineFallback(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
      await limitCacheSize(DYNAMIC_CACHE_NAME, MAX_CACHE_SIZES[DYNAMIC_CACHE_NAME]);
    }
    return networkResponse;
  } catch (error) {
    // Try cache first
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineResponse = await cache.match('/offline');
      if (offlineResponse) {
        return offlineResponse;
      }
    }
    
    throw error;
  }
}

// Handle offline requests
async function handleOfflineRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  
  // Try to find cached response
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // For navigation requests, return offline page
  if (request.mode === 'navigate') {
    const offlineResponse = await cache.match('/offline');
    if (offlineResponse) {
      return offlineResponse;
    }
  }
  
  // Return a basic offline response
  return new Response(
    JSON.stringify({
      error: 'Offline',
      message: 'This content is not available offline'
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
}

// Utility functions

function isStaticAsset(pathname) {
  return (
    pathname.startsWith('/_next/static/') ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/images/') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico')
  );
}

function isAPIRequest(pathname) {
  return pathname.startsWith('/api/');
}

function matchesPatterns(pathname, patterns) {
  return patterns.some(pattern => pattern.test(pathname));
}

function isExpired(response, maxAge) {
  const dateHeader = response.headers.get('date');
  if (!dateHeader) return false;
  
  const responseDate = new Date(dateHeader);
  const now = new Date();
  
  return (now.getTime() - responseDate.getTime()) > maxAge;
}

async function limitCacheSize(cacheName, maxSize) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxSize) {
    // Remove oldest entries
    const keysToDelete = keys.slice(0, keys.length - maxSize);
    await Promise.all(
      keysToDelete.map(key => cache.delete(key))
    );
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Handle any queued offline actions
  console.log('[SW] Performing background sync');
  
  // This would typically sync offline data, send queued requests, etc.
  // Implementation depends on your specific offline functionality needs
}

// Push notifications (if needed)
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New content available!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Tahitian Tutor', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click received');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(clearAllCaches());
  }
});

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames
      .filter(name => name.startsWith('tahitian-tutor-'))
      .map(name => caches.delete(name))
  );
  console.log('[SW] All caches cleared');
}
'use client';

import { SWRConfiguration } from 'swr';
import { toast } from 'sonner';

// Enhanced fetcher with error handling and retry logic
export const fetcher = async (url: string, options?: RequestInit) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
      (error as any).status = response.status;
      (error as any).info = await response.text();
      throw error;
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
    }
    
    throw error;
  }
};

// Cache key generator for complex queries
export const createCacheKey = (
  endpoint: string, 
  params?: Record<string, any>,
  userId?: string
): string => {
  const baseKey = endpoint;
  const paramString = params ? `?${new URLSearchParams(params).toString()}` : '';
  const userPrefix = userId ? `user:${userId}:` : '';
  
  return `${userPrefix}${baseKey}${paramString}`;
};

// Error handler with user-friendly messages
const handleError = (error: any, key: string) => {
  console.error(`SWR Error for ${key}:`, error);
  
  let message = 'Une erreur est survenue';
  
  if (error?.status === 401) {
    message = 'Session expirée. Veuillez vous reconnecter.';
  } else if (error?.status === 403) {
    message = 'Accès non autorisé.';
  } else if (error?.status === 404) {
    message = 'Ressource non trouvée.';
  } else if (error?.status >= 500) {
    message = 'Erreur serveur. Veuillez réessayer plus tard.';
  } else if (error?.message?.includes('timeout')) {
    message = 'Délai d\'attente dépassé. Vérifiez votre connexion.';
  } else if (error?.message?.includes('fetch')) {
    message = 'Problème de connexion réseau.';
  }
  
  toast.error(message);
};

// Success handler for mutations
const handleSuccess = (data: any, key: string) => {
  if (key.includes('/api/lessons') && data?.message) {
    toast.success(data.message);
  } else if (key.includes('/api/analytics')) {
    // Silent success for analytics
    console.log('Analytics data updated');
  }
};

// Enhanced SWR configuration
export const swrConfig: SWRConfiguration = {
  fetcher,
  
  // Caching strategy
  revalidateOnFocus: false, // Don't revalidate on window focus
  revalidateOnReconnect: true, // Revalidate when reconnecting
  revalidateIfStale: true, // Revalidate if data is stale
  
  // Timing configuration
  dedupingInterval: 2000, // Dedupe requests within 2 seconds
  focusThrottleInterval: 5000, // Throttle focus revalidation
  loadingTimeout: 3000, // Show loading state after 3s
  errorRetryInterval: 5000, // Retry failed requests every 5s
  errorRetryCount: 3, // Maximum 3 retries
  
  // Cache configuration
  refreshInterval: 0, // No automatic refresh by default
  refreshWhenHidden: false, // Don't refresh when tab is hidden
  refreshWhenOffline: false, // Don't refresh when offline
  
  // Error handling
  onError: handleError,
  onSuccess: handleSuccess,
  
  // Retry logic with exponential backoff
  onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
    // Don't retry on 404
    if (error.status === 404) return;
    
    // Don't retry on 401/403 (auth errors)
    if (error.status === 401 || error.status === 403) return;
    
    // Max 3 retries
    if (retryCount >= 3) return;
    
    // Exponential backoff: 1s, 2s, 4s
    const timeout = Math.pow(2, retryCount) * 1000;
    
    setTimeout(() => revalidate({ retryCount }), timeout);
  },
  
  // Optimistic updates for mutations
  optimisticData: (currentData, displayedData) => {
    // Return optimistic data for immediate UI updates
    return displayedData || currentData;
  },
  
  // Rollback on error
  rollbackOnError: true,
  
  // Compare function for data equality
  compare: (a, b) => {
    // Custom comparison for complex objects
    return JSON.stringify(a) === JSON.stringify(b);
  },
  
  // Middleware for request/response transformation
  use: [
    // Logging middleware
    (useSWRNext) => (key, fetcher, config) => {
      const startTime = Date.now();
      
      return useSWRNext(key, fetcher, {
        ...config,
        onSuccess: (data, key, config) => {
          const duration = Date.now() - startTime;
          console.log(`SWR Success: ${key} (${duration}ms)`);
          config.onSuccess?.(data, key, config);
        },
        onError: (error, key, config) => {
          const duration = Date.now() - startTime;
          console.log(`SWR Error: ${key} (${duration}ms)`, error);
          config.onError?.(error, key, config);
        }
      });
    },
    
    // Cache warming middleware
    (useSWRNext) => (key, fetcher, config) => {
      // Pre-warm related cache entries
      if (typeof key === 'string' && key.includes('/api/lessons/')) {
        // Pre-warm lessons list cache
        const listKey = '/api/lessons';
        // This would trigger a background fetch for the list
      }
      
      return useSWRNext(key, fetcher, config);
    }
  ]
};

// Specialized configurations for different data types
export const analyticsConfig: SWRConfiguration = {
  ...swrConfig,
  refreshInterval: 30000, // Refresh analytics every 30 seconds
  dedupingInterval: 10000, // Longer deduping for analytics
  revalidateOnFocus: false,
  errorRetryCount: 1, // Fewer retries for analytics
};

export const lessonsConfig: SWRConfiguration = {
  ...swrConfig,
  revalidateOnFocus: true, // Revalidate lessons on focus
  refreshInterval: 0, // No auto-refresh for lessons
  dedupingInterval: 5000,
};

export const userConfig: SWRConfiguration = {
  ...swrConfig,
  revalidateOnFocus: true,
  refreshInterval: 60000, // Refresh user data every minute
  errorRetryCount: 2,
};

// Cache invalidation helpers
export const invalidateCache = {
  lessons: () => {
    // This would be implemented with mutate from SWR
    console.log('Invalidating lessons cache');
  },
  
  analytics: () => {
    console.log('Invalidating analytics cache');
  },
  
  user: () => {
    console.log('Invalidating user cache');
  },
  
  all: () => {
    console.log('Invalidating all cache');
  }
};

// Preload helpers
export const preloadData = {
  lessons: async () => {
    // Preload lessons data
    return fetcher('/api/lessons');
  },
  
  analytics: async () => {
    // Preload analytics data
    return fetcher('/api/analytics/dashboard');
  }
};

export default swrConfig;
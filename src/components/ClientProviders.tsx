'use client';

import { useEffect, ReactNode } from 'react';
import { initializeErrorHandling } from '@/utils/errorHandler';
import { performanceMonitoring } from '@/services/PerformanceMonitoringService';
import { logger } from '@/services/LoggingService';
import { Toaster } from 'sonner';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import pwaService from '@/services/PWAService';
import { I18nProvider } from '@/i18n/provider';

interface ClientProvidersProps {
  children: ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  useEffect(() => {
    // Initialize error handling
    initializeErrorHandling();
    
    // Configure logging for production
    if (process.env.NODE_ENV === 'production') {
      logger.configure({
        level: 'warn',
        enableConsole: false,
        enableRemote: true,
        enableLocalStorage: true,
      });
    }
    
    // Start performance monitoring
    performanceMonitoring.startSession();
    
    // Initialize PWA service
    // PWA service initializes automatically, but we can listen for events
    pwaService.on('installed', () => {
      logger.info('PWA installed successfully');
      performanceMonitoring.recordMetric({
        name: 'pwa_installed',
        value: 1,
        unit: 'count',
        category: 'custom',
      });
    });

    pwaService.on('updateAvailable', () => {
      logger.info('PWA update available');
    });
    
    // Log application start
    logger.info('Application initialized', {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      environment: process.env.NODE_ENV,
      pwaStatus: pwaService.getStatus()
    });
    
    // Monitor page visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        performanceMonitoring.recordMetric({
          name: 'page_visible',
          value: 1,
          unit: 'count',
          category: 'custom',
        });
        logger.debug('Page became visible');
      } else {
        performanceMonitoring.recordMetric({
          name: 'page_hidden',
          value: 1,
          unit: 'count',
          category: 'custom',
        });
        logger.debug('Page became hidden');
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Monitor online/offline status
    const handleOnline = () => {
      performanceMonitoring.recordMetric({
        name: 'connection_online',
        value: 1,
        unit: 'count',
        category: 'custom',
      });
      logger.info('Connection restored');
    };
    
    const handleOffline = () => {
      performanceMonitoring.recordMetric({
        name: 'connection_offline',
        value: 1,
        unit: 'count',
        category: 'custom',
      });
      logger.warn('Connection lost');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Monitor page load performance
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (navigationEntries.length > 0) {
        const entry = navigationEntries[0];
        
        // Record page load metrics
        performanceMonitoring.recordMetric({
          name: 'page_load_time',
          value: entry.loadEventEnd - entry.loadEventStart,
          unit: 'milliseconds',
          category: 'performance',
        });
        
        performanceMonitoring.recordMetric({
          name: 'dom_content_loaded',
          value: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
          unit: 'milliseconds',
          category: 'performance',
        });
        
        performanceMonitoring.recordMetric({
          name: 'first_byte_time',
          value: entry.responseStart - entry.requestStart,
          unit: 'milliseconds',
          category: 'performance',
        });
        
        logger.info('Page performance metrics recorded', {
          loadTime: entry.loadEventEnd - entry.loadEventStart,
          domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
          firstByteTime: entry.responseStart - entry.requestStart,
        });
      }
    }
    
    // Monitor memory usage (if available)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      performanceMonitoring.recordMetric({
        name: 'memory_used',
        value: memory.usedJSHeapSize,
        unit: 'bytes',
        category: 'performance',
      });
      
      performanceMonitoring.recordMetric({
        name: 'memory_total',
        value: memory.totalJSHeapSize,
        unit: 'bytes',
        category: 'performance',
      });
    }
    
    // Cleanup function
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      // End performance monitoring session
      performanceMonitoring.endSession();
      
      logger.info('Application cleanup completed');
    };
  }, []);
  
  return (
    <I18nProvider>
      {children}
      <PWAInstallPrompt 
        onInstall={() => {
          logger.info('PWA install prompt accepted');
          performanceMonitoring.recordMetric({
            name: 'pwa_install_prompt_accepted',
            value: 1,
            unit: 'count',
            category: 'custom',
          });
        }}
        onDismiss={() => {
          logger.info('PWA install prompt dismissed');
          performanceMonitoring.recordMetric({
            name: 'pwa_install_prompt_dismissed',
            value: 1,
            unit: 'count',
            category: 'custom',
          });
        }}
      />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'white',
            color: 'black',
            border: '1px solid #e5e7eb',
          },
          className: 'toast',
        }}
        closeButton
        richColors
      />
    </I18nProvider>
  );
}
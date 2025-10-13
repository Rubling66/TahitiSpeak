/**
 * Performance Monitoring Service
 * Provides comprehensive performance tracking, error logging, and system monitoring
 */

export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  category: 'web-vitals' | 'api' | 'database' | 'custom';
  metadata?: Record<string, string | number | boolean | null>;
}

export interface ErrorLog {
  id: string;
  message: string;
  stack?: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  timestamp: number;
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface SystemMetrics {
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  performance: {
    responseTime: number;
    throughput: number;
    errorRate: number;
  };
  webVitals: {
    fcp?: number; // First Contentful Paint
    lcp?: number; // Largest Contentful Paint
    fid?: number; // First Input Delay
    cls?: number; // Cumulative Layout Shift
    ttfb?: number; // Time to First Byte
  };
}

class PerformanceMonitoringService {
  private metrics: PerformanceMetric[] = [];
  private errors: ErrorLog[] = [];
  private maxMetrics = 1000;
  private maxErrors = 500;
  private sessionId: string;
  private isClient: boolean;
  private observers: PerformanceObserver[] = [];
  private eventListeners: Array<{ element: EventTarget; event: string; handler: EventListener }> = [];

  constructor() {
    this.sessionId = this.generateSessionId();
    this.isClient = typeof window !== 'undefined';
    
    if (this.isClient) {
      this.initializeClientMonitoring();
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeClientMonitoring(): void {
    // Monitor Web Vitals
    this.observeWebVitals();
    
    // Monitor unhandled errors
    const errorHandler = (event: ErrorEvent) => {
      this.logError({
        message: event.message,
        stack: event.error?.stack,
        level: 'error',
        url: event.filename,
        metadata: {
          lineno: event.lineno,
          colno: event.colno,
          type: 'javascript-error',
        },
      });
    };
    window.addEventListener('error', errorHandler);
    this.eventListeners.push({ element: window, event: 'error', handler: errorHandler });

    // Monitor unhandled promise rejections
    const rejectionHandler = (event: PromiseRejectionEvent) => {
      this.logError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        level: 'error',
        metadata: {
          type: 'promise-rejection',
          reason: event.reason,
        },
      });
    };
    window.addEventListener('unhandledrejection', rejectionHandler);
    this.eventListeners.push({ element: window, event: 'unhandledrejection', handler: rejectionHandler });

    // Monitor page visibility changes
    const visibilityHandler = () => {
      this.recordMetric({
        name: 'page_visibility',
        value: document.hidden ? 0 : 1,
        unit: 'boolean',
        category: 'custom',
        metadata: {
          hidden: document.hidden,
          visibilityState: document.visibilityState,
        },
      });
    };
    document.addEventListener('visibilitychange', visibilityHandler);
    this.eventListeners.push({ element: document, event: 'visibilitychange', handler: visibilityHandler });
  }

  private observeWebVitals(): void {
    if (!this.isClient) return;

    // Observe Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
          
          this.recordMetric({
            name: 'largest_contentful_paint',
            value: lastEntry.startTime,
            unit: 'ms',
            category: 'web-vitals',
          });
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (error) {
        console.warn('LCP observation failed:', error);
      }

      // Observe First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: PerformanceEntry & { processingStart: number; startTime: number }) => {
            this.recordMetric({
              name: 'first_input_delay',
              value: entry.processingStart - entry.startTime,
              unit: 'ms',
              category: 'web-vitals',
            });
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      } catch (error) {
        console.warn('FID observation failed:', error);
      }

      // Observe Cumulative Layout Shift (CLS)
      try {
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          const entries = list.getEntries();
          
          entries.forEach((entry: PerformanceEntry & { value: number; hadRecentInput: boolean }) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          
          this.recordMetric({
            name: 'cumulative_layout_shift',
            value: clsValue,
            unit: 'score',
            category: 'web-vitals',
          });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (error) {
        console.warn('CLS observation failed:', error);
      }
    }

    // Monitor First Contentful Paint (FCP)
    if ('performance' in window && 'getEntriesByType' in performance) {
      const paintEntries = performance.getEntriesByType('paint');
      paintEntries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          this.recordMetric({
            name: 'first_contentful_paint',
            value: entry.startTime,
            unit: 'ms',
            category: 'web-vitals',
          });
        }
      });
    }
  }

  /**
   * Start a new monitoring session
   */
  startSession(): void {
    this.sessionId = this.generateSessionId();
    
    if (this.isClient) {
      this.recordMetric({
        name: 'session_start',
        value: 1,
        unit: 'count',
        category: 'custom',
        metadata: {
          sessionId: this.sessionId,
          timestamp: Date.now(),
        },
      });
    }
  }

  /**
   * End the current monitoring session
   */
  endSession(): void {
    if (this.isClient) {
      this.recordMetric({
        name: 'session_end',
        value: 1,
        unit: 'count',
        category: 'custom',
        metadata: {
          sessionId: this.sessionId,
          timestamp: Date.now(),
        },
      });
    }
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): void {
    const fullMetric: PerformanceMetric = {
      id: this.generateId(),
      timestamp: Date.now(),
      ...metric,
    };

    this.metrics.push(fullMetric);
    
    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Send to analytics if configured
    this.sendMetricToAnalytics(fullMetric);
  }

  /**
   * Log an error with context
   */
  logError(error: Omit<ErrorLog, 'id' | 'timestamp' | 'sessionId'>): void {
    const fullError: ErrorLog = {
      id: this.generateId(),
      timestamp: Date.now(),
      sessionId: this.sessionId,
      url: this.isClient ? window.location.href : undefined,
      userAgent: this.isClient ? navigator.userAgent : undefined,
      ...error,
    };

    this.errors.push(fullError);
    
    // Keep only the most recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Console log for development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${fullError.level.toUpperCase()}]`, fullError.message, fullError);
    }

    // Send to error tracking service
    this.sendErrorToTracking(fullError);
  }

  /**
   * Measure API call performance
   */
  async measureApiCall<T>(
    name: string,
    apiCall: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const duration = performance.now() - startTime;
      
      this.recordMetric({
        name: `api_${name}`,
        value: duration,
        unit: 'ms',
        category: 'api',
        metadata: {
          success: true,
          ...metadata,
        },
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.recordMetric({
        name: `api_${name}`,
        value: duration,
        unit: 'ms',
        category: 'api',
        metadata: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          ...metadata,
        },
      });
      
      this.logError({
        message: `API call failed: ${name}`,
        stack: error instanceof Error ? error.stack : undefined,
        level: 'error',
        metadata: {
          apiName: name,
          duration,
          ...metadata,
        },
      });
      
      throw error;
    }
  }

  /**
   * Get current system metrics
   */
  getSystemMetrics(): SystemMetrics {
    const recentMetrics = this.metrics.filter(
      m => m.timestamp > Date.now() - 60000 // Last minute
    );
    
    const webVitals = recentMetrics
      .filter(m => m.category === 'web-vitals')
      .reduce((acc, metric) => {
        switch (metric.name) {
          case 'first_contentful_paint':
            acc.fcp = metric.value;
            break;
          case 'largest_contentful_paint':
            acc.lcp = metric.value;
            break;
          case 'first_input_delay':
            acc.fid = metric.value;
            break;
          case 'cumulative_layout_shift':
            acc.cls = metric.value;
            break;
        }
        return acc;
      }, {} as SystemMetrics['webVitals']);

    const apiMetrics = recentMetrics.filter(m => m.category === 'api');
    const avgResponseTime = apiMetrics.length > 0 
      ? apiMetrics.reduce((sum, m) => sum + m.value, 0) / apiMetrics.length 
      : 0;
    
    const errorRate = apiMetrics.length > 0
      ? apiMetrics.filter(m => !m.metadata?.success).length / apiMetrics.length
      : 0;

    return {
      memory: this.getMemoryUsage(),
      performance: {
        responseTime: avgResponseTime,
        throughput: apiMetrics.length,
        errorRate,
      },
      webVitals,
    };
  }

  private getMemoryUsage() {
    if (this.isClient && 'memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100,
      };
    }
    
    // Server-side memory usage
    if (typeof process !== 'undefined') {
      const usage = process.memoryUsage();
      return {
        used: usage.heapUsed,
        total: usage.heapTotal,
        percentage: (usage.heapUsed / usage.heapTotal) * 100,
      };
    }
    
    return { used: 0, total: 0, percentage: 0 };
  }

  /**
   * Get recent metrics
   */
  getMetrics(category?: PerformanceMetric['category'], limit = 100): PerformanceMetric[] {
    let filtered = this.metrics;
    
    if (category) {
      filtered = filtered.filter(m => m.category === category);
    }
    
    return filtered.slice(-limit);
  }

  /**
   * Get recent errors
   */
  getErrors(level?: ErrorLog['level'], limit = 50): ErrorLog[] {
    let filtered = this.errors;
    
    if (level) {
      filtered = filtered.filter(e => e.level === level);
    }
    
    return filtered.slice(-limit);
  }

  /**
   * Clear old data
   */
  cleanup(): void {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
    this.errors = this.errors.filter(e => e.timestamp > cutoff);
  }

  /**
   * Destroy the service and clean up all resources
   */
  destroy(): void {
    // Disconnect all PerformanceObservers
    this.observers.forEach(observer => {
      try {
        observer.disconnect();
      } catch (error) {
        console.warn('Error disconnecting PerformanceObserver:', error);
      }
    });
    this.observers = [];

    // Remove all event listeners
    this.eventListeners.forEach(({ element, event, handler }) => {
      try {
        element.removeEventListener(event, handler);
      } catch (error) {
        console.warn('Error removing event listener:', error);
      }
    });
    this.eventListeners = [];

    // Clear all data
    this.metrics = [];
    this.errors = [];
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sendMetricToAnalytics(metric: PerformanceMetric): void {
    // In a real application, send to analytics service
    if (process.env.NODE_ENV === 'development') {
      console.debug('📊 Metric:', metric);
    }
  }

  private sendErrorToTracking(error: ErrorLog): void {
    // In a real application, send to error tracking service (Sentry, etc.)
    if (process.env.NODE_ENV === 'development') {
      console.debug('🚨 Error:', error);
    }
  }
}

// Singleton instance
export const performanceMonitoring = new PerformanceMonitoringService();

// React hook for performance monitoring
export function usePerformanceMonitoring() {
  return {
    startSession: performanceMonitoring.startSession.bind(performanceMonitoring),
    endSession: performanceMonitoring.endSession.bind(performanceMonitoring),
    recordMetric: performanceMonitoring.recordMetric.bind(performanceMonitoring),
    logError: performanceMonitoring.logError.bind(performanceMonitoring),
    measureApiCall: performanceMonitoring.measureApiCall.bind(performanceMonitoring),
    getSystemMetrics: performanceMonitoring.getSystemMetrics.bind(performanceMonitoring),
    getMetrics: performanceMonitoring.getMetrics.bind(performanceMonitoring),
    getErrors: performanceMonitoring.getErrors.bind(performanceMonitoring),
    cleanup: performanceMonitoring.cleanup.bind(performanceMonitoring),
    destroy: performanceMonitoring.destroy.bind(performanceMonitoring),
  };
}
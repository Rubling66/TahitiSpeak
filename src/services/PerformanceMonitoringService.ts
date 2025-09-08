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
  metadata?: Record<string, any>;
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
  metadata?: Record<string, any>;
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
    window.addEventListener('error', (event) => {
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
    });

    // Monitor unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        level: 'error',
        metadata: {
          type: 'promise-rejection',
          reason: event.reason,
        },
      });
    });

    // Monitor page visibility changes
    document.addEventListener('visibilitychange', () => {
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
    });
  }

  private observeWebVitals(): void {
    if (!this.isClient) return;

    // Observe Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          
          this.recordMetric({
            name: 'largest_contentful_paint',
            value: lastEntry.startTime,
            unit: 'ms',
            category: 'web-vitals',
          });
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (error) {
        console.warn('LCP observation failed:', error);
      }

      // Observe First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.recordMetric({
              name: 'first_input_delay',
              value: entry.processingStart - entry.startTime,
              unit: 'ms',
              category: 'web-vitals',
            });
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (error) {
        console.warn('FID observation failed:', error);
      }

      // Observe Cumulative Layout Shift (CLS)
      try {
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          const entries = list.getEntries();
          
          entries.forEach((entry: any) => {
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
    recordMetric: performanceMonitoring.recordMetric.bind(performanceMonitoring),
    logError: performanceMonitoring.logError.bind(performanceMonitoring),
    measureApiCall: performanceMonitoring.measureApiCall.bind(performanceMonitoring),
    getSystemMetrics: performanceMonitoring.getSystemMetrics.bind(performanceMonitoring),
    getMetrics: performanceMonitoring.getMetrics.bind(performanceMonitoring),
    getErrors: performanceMonitoring.getErrors.bind(performanceMonitoring),
  };
}
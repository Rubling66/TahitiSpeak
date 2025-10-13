'use client';

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  url: string;
  userAgent: string;
}

interface WebVitalsData {
  CLS: PerformanceMetric | null;
  FID: PerformanceMetric | null;
  FCP: PerformanceMetric | null;
  LCP: PerformanceMetric | null;
  TTFB: PerformanceMetric | null;
  INP: PerformanceMetric | null;
}

interface PerformanceReport {
  metrics: WebVitalsData;
  navigation: PerformanceNavigationTiming | null;
  resources: PerformanceResourceTiming[];
  memory: any;
  connection: any;
  deviceInfo: {
    userAgent: string;
    platform: string;
    language: string;
    cookieEnabled: boolean;
    onLine: boolean;
  };
}

// Thresholds for Core Web Vitals (in milliseconds)
const THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  FID: { good: 100, poor: 300 },
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 }
};

// Rating function
const getRating = (metricName: keyof typeof THRESHOLDS, value: number): 'good' | 'needs-improvement' | 'poor' => {
  const threshold = THRESHOLDS[metricName];
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
};

// Performance monitoring class
class PerformanceMonitor {
  private metrics: WebVitalsData = {
    CLS: null,
    FID: null,
    FCP: null,
    LCP: null,
    TTFB: null,
    INP: null
  };

  private observers: PerformanceObserver[] = [];
  private reportCallback?: (report: PerformanceReport) => void;
  private isMonitoring = false;

  constructor(reportCallback?: (report: PerformanceReport) => void) {
    this.reportCallback = reportCallback;
  }

  // Start monitoring
  start(): void {
    if (this.isMonitoring || typeof window === 'undefined') return;
    
    this.isMonitoring = true;
    this.setupObservers();
    this.measureTTFB();
    
    // Report on page visibility change
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    
    // Report on page unload
    window.addEventListener('beforeunload', this.generateReport);
  }

  // Stop monitoring
  stop(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('beforeunload', this.generateReport);
  }

  // Setup performance observers
  private setupObservers(): void {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          
          if (lastEntry) {
            this.recordMetric('LCP', lastEntry.startTime);
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (e) {
        console.warn('LCP observer not supported');
      }

      // First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (entry.processingStart && entry.startTime) {
              this.recordMetric('FID', entry.processingStart - entry.startTime);
            }
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      } catch (e) {
        console.warn('FID observer not supported');
      }

      // Cumulative Layout Shift (CLS)
      try {
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          const entries = list.getEntries();
          
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          
          if (clsValue > 0) {
            this.recordMetric('CLS', clsValue);
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (e) {
        console.warn('CLS observer not supported');
      }

      // First Contentful Paint (FCP)
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (entry.name === 'first-contentful-paint') {
              this.recordMetric('FCP', entry.startTime);
            }
          });
        });
        fcpObserver.observe({ entryTypes: ['paint'] });
        this.observers.push(fcpObserver);
      } catch (e) {
        console.warn('FCP observer not supported');
      }

      // Interaction to Next Paint (INP) - experimental
      try {
        const inpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (entry.interactionId) {
              const duration = entry.processingEnd - entry.startTime;
              this.recordMetric('INP', duration);
            }
          });
        });
        inpObserver.observe({ entryTypes: ['event'] });
        this.observers.push(inpObserver);
      } catch (e) {
        console.warn('INP observer not supported');
      }
    }
  }

  // Measure Time to First Byte (TTFB)
  private measureTTFB(): void {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (navigationEntries.length > 0) {
        const entry = navigationEntries[0];
        const ttfb = entry.responseStart - entry.requestStart;
        this.recordMetric('TTFB', ttfb);
      }
    }
  }

  // Record a metric
  private recordMetric(name: keyof WebVitalsData, value: number): void {
    const metric: PerformanceMetric = {
      name,
      value,
      rating: getRating(name, value),
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    this.metrics[name] = metric;
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`${name}: ${value.toFixed(2)}ms (${metric.rating})`);
    }
  }

  // Handle visibility change
  private handleVisibilityChange = (): void => {
    if (document.visibilityState === 'hidden') {
      this.generateReport();
    }
  };

  // Generate performance report
  private generateReport = (): void => {
    if (!this.reportCallback) return;

    const report: PerformanceReport = {
      metrics: { ...this.metrics },
      navigation: this.getNavigationTiming(),
      resources: this.getResourceTiming(),
      memory: this.getMemoryInfo(),
      connection: this.getConnectionInfo(),
      deviceInfo: this.getDeviceInfo()
    };

    this.reportCallback(report);
  };

  // Get navigation timing
  private getNavigationTiming(): PerformanceNavigationTiming | null {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      return entries.length > 0 ? entries[0] : null;
    }
    return null;
  }

  // Get resource timing
  private getResourceTiming(): PerformanceResourceTiming[] {
    if ('performance' in window && 'getEntriesByType' in performance) {
      return performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    }
    return [];
  }

  // Get memory info
  private getMemoryInfo(): any {
    return (performance as any).memory || null;
  }

  // Get connection info
  private getConnectionInfo(): any {
    return (navigator as any).connection || null;
  }

  // Get device info
  private getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine
    };
  }

  // Get current metrics
  getMetrics(): WebVitalsData {
    return { ...this.metrics };
  }

  // Get performance score
  getPerformanceScore(): number {
    const scores = Object.values(this.metrics)
      .filter(metric => metric !== null)
      .map(metric => {
        switch (metric!.rating) {
          case 'good': return 100;
          case 'needs-improvement': return 50;
          case 'poor': return 0;
          default: return 0;
        }
      });

    return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  }
}

// Analytics reporting function
const reportToAnalytics = async (report: PerformanceReport): Promise<void> => {
  try {
    // Send to analytics service
    await fetch('/api/analytics/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...report,
        timestamp: Date.now(),
        sessionId: sessionStorage.getItem('sessionId') || 'unknown'
      })
    });
  } catch (error) {
    console.error('Failed to report performance metrics:', error);
  }
};

// Create global performance monitor instance
let performanceMonitor: PerformanceMonitor | null = null;

// Initialize performance monitoring
export const initPerformanceMonitoring = (): void => {
  if (typeof window === 'undefined' || performanceMonitor) return;

  performanceMonitor = new PerformanceMonitor(reportToAnalytics);
  performanceMonitor.start();

  // Report metrics periodically
  setInterval(() => {
    if (performanceMonitor) {
      const metrics = performanceMonitor.getMetrics();
      const score = performanceMonitor.getPerformanceScore();
      
      console.log('Performance Score:', score);
      console.log('Current Metrics:', metrics);
    }
  }, 30000); // Every 30 seconds
};

// Get current performance data
export const getPerformanceData = (): WebVitalsData | null => {
  return performanceMonitor ? performanceMonitor.getMetrics() : null;
};

// Get performance score
export const getPerformanceScore = (): number => {
  return performanceMonitor ? performanceMonitor.getPerformanceScore() : 0;
};

// Stop monitoring
export const stopPerformanceMonitoring = (): void => {
  if (performanceMonitor) {
    performanceMonitor.stop();
    performanceMonitor = null;
  }
};

// Performance dashboard component data
export const getPerformanceDashboardData = () => {
  const metrics = getPerformanceData();
  const score = getPerformanceScore();
  
  return {
    score,
    metrics,
    recommendations: generateRecommendations(metrics),
    status: getOverallStatus(score)
  };
};

// Generate performance recommendations
const generateRecommendations = (metrics: WebVitalsData | null): string[] => {
  if (!metrics) return [];
  
  const recommendations: string[] = [];
  
  if (metrics.LCP && metrics.LCP.rating !== 'good') {
    recommendations.push('Optimiser le Largest Contentful Paint en réduisant la taille des images et en utilisant un CDN');
  }
  
  if (metrics.FID && metrics.FID.rating !== 'good') {
    recommendations.push('Améliorer le First Input Delay en réduisant le JavaScript bloquant');
  }
  
  if (metrics.CLS && metrics.CLS.rating !== 'good') {
    recommendations.push('Réduire le Cumulative Layout Shift en définissant des dimensions pour les images et les publicités');
  }
  
  if (metrics.FCP && metrics.FCP.rating !== 'good') {
    recommendations.push('Accélérer le First Contentful Paint en optimisant les ressources critiques');
  }
  
  return recommendations;
};

// Get overall performance status
const getOverallStatus = (score: number): 'excellent' | 'good' | 'needs-improvement' | 'poor' => {
  if (score >= 90) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'needs-improvement';
  return 'poor';
};

export { PerformanceMonitor, THRESHOLDS, getRating };
export type { PerformanceMetric, WebVitalsData, PerformanceReport };
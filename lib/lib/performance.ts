// Performance monitoring utilities

import { useEffect, useRef, useState } from 'react';

// Performance metrics interface
export interface PerformanceMetrics {
  componentName: string;
  loadTime: number;
  renderTime: number;
  timestamp: number;
  memoryUsage?: number;
  bundleSize?: number;
}

// Performance monitoring hook
export const usePerformanceMonitor = (componentName: string) => {
  const startTimeRef = useRef<number>(Date.now());
  const renderStartRef = useRef<number>(performance.now());
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  useEffect(() => {
    const renderTime = performance.now() - renderStartRef.current;
    const loadTime = Date.now() - startTimeRef.current;
    
    const performanceMetrics: PerformanceMetrics = {
      componentName,
      loadTime,
      renderTime,
      timestamp: Date.now(),
      memoryUsage: (performance as any).memory?.usedJSHeapSize,
    };

    setMetrics(performanceMetrics);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 Performance Metrics for ${componentName}:`, performanceMetrics);
    }

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      sendPerformanceMetrics(performanceMetrics);
    }
  }, [componentName]);

  return metrics;
};

// Send performance metrics to analytics
const sendPerformanceMetrics = async (metrics: PerformanceMetrics) => {
  try {
    await fetch('/api/analytics/performance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metrics),
    });
  } catch (error) {
    console.warn('Failed to send performance metrics:', error);
  }
};

// Core Web Vitals monitoring
export const useCoreWebVitals = () => {
  const [vitals, setVitals] = useState<{
    lcp?: number;
    fid?: number;
    cls?: number;
    fcp?: number;
    ttfb?: number;
  }>({});

  useEffect(() => {
    // Largest Contentful Paint (LCP)
    const observeLCP = () => {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        setVitals(prev => ({ ...prev, lcp: lastEntry.startTime }));
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    };

    // First Input Delay (FID)
    const observeFID = () => {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          setVitals(prev => ({ ...prev, fid: entry.processingStart - entry.startTime }));
        });
      });
      observer.observe({ entryTypes: ['first-input'] });
    };

    // Cumulative Layout Shift (CLS)
    const observeCLS = () => {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            setVitals(prev => ({ ...prev, cls: clsValue }));
          }
        });
      });
      observer.observe({ entryTypes: ['layout-shift'] });
    };

    // First Contentful Paint (FCP)
    const observeFCP = () => {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            setVitals(prev => ({ ...prev, fcp: entry.startTime }));
          }
        });
      });
      observer.observe({ entryTypes: ['paint'] });
    };

    // Time to First Byte (TTFB)
    const observeTTFB = () => {
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigationEntry) {
        const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
        setVitals(prev => ({ ...prev, ttfb }));
      }
    };

    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      observeLCP();
      observeFID();
      observeCLS();
      observeFCP();
      observeTTFB();
    }
  }, []);

  return vitals;
};

// Bundle size analyzer
export const analyzeBundleSize = async () => {
  if (typeof window === 'undefined') return null;

  try {
    const response = await fetch('/_next/static/chunks/pages/_app.js', { method: 'HEAD' });
    const contentLength = response.headers.get('content-length');
    return contentLength ? parseInt(contentLength, 10) : null;
  } catch (error) {
    console.warn('Failed to analyze bundle size:', error);
    return null;
  }
};

// Memory usage monitoring
export const useMemoryMonitor = () => {
  const [memoryInfo, setMemoryInfo] = useState<{
    usedJSHeapSize?: number;
    totalJSHeapSize?: number;
    jsHeapSizeLimit?: number;
  }>({});

  useEffect(() => {
    const updateMemoryInfo = () => {
      if ((performance as any).memory) {
        const memory = (performance as any).memory;
        setMemoryInfo({
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        });
      }
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return memoryInfo;
};

// Loading state management
export const useLoadingState = (initialState = false) => {
  const [isLoading, setIsLoading] = useState(initialState);
  const [error, setError] = useState<Error | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);

  const startLoading = () => {
    setIsLoading(true);
    setError(null);
    setStartTime(Date.now());
  };

  const stopLoading = (errorResult?: Error) => {
    setIsLoading(false);
    if (errorResult) {
      setError(errorResult);
    }
    
    if (startTime) {
      const duration = Date.now() - startTime;
      console.log(`Loading completed in ${duration}ms`);
    }
  };

  return {
    isLoading,
    error,
    startLoading,
    stopLoading,
    duration: startTime ? Date.now() - startTime : 0,
  };
};

// Performance budget checker
export const checkPerformanceBudget = (metrics: PerformanceMetrics) => {
  const budgets = {
    loadTime: 2000, // 2 seconds
    renderTime: 100, // 100ms
    memoryUsage: 50 * 1024 * 1024, // 50MB
  };

  const violations: string[] = [];

  if (metrics.loadTime > budgets.loadTime) {
    violations.push(`Load time exceeded budget: ${metrics.loadTime}ms > ${budgets.loadTime}ms`);
  }

  if (metrics.renderTime > budgets.renderTime) {
    violations.push(`Render time exceeded budget: ${metrics.renderTime}ms > ${budgets.renderTime}ms`);
  }

  if (metrics.memoryUsage && metrics.memoryUsage > budgets.memoryUsage) {
    violations.push(`Memory usage exceeded budget: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB > ${budgets.memoryUsage / 1024 / 1024}MB`);
  }

  return {
    passed: violations.length === 0,
    violations,
  };
};

// Performance report generator
export const generatePerformanceReport = (metrics: PerformanceMetrics[]) => {
  const report = {
    totalComponents: metrics.length,
    averageLoadTime: metrics.reduce((sum, m) => sum + m.loadTime, 0) / metrics.length,
    averageRenderTime: metrics.reduce((sum, m) => sum + m.renderTime, 0) / metrics.length,
    slowestComponent: metrics.reduce((slowest, current) => 
      current.loadTime > slowest.loadTime ? current : slowest
    ),
    fastestComponent: metrics.reduce((fastest, current) => 
      current.loadTime < fastest.loadTime ? current : fastest
    ),
    budgetViolations: metrics.map(m => ({
      component: m.componentName,
      violations: checkPerformanceBudget(m).violations,
    })).filter(v => v.violations.length > 0),
  };

  return report;
};

// Lighthouse score estimator
export const estimateLighthouseScore = (vitals: ReturnType<typeof useCoreWebVitals>) => {
  const { lcp, fid, cls, fcp, ttfb } = vitals;
  
  let score = 100;

  // LCP scoring (25% weight)
  if (lcp) {
    if (lcp > 4000) score -= 25;
    else if (lcp > 2500) score -= 15;
    else if (lcp > 1200) score -= 5;
  }

  // FID scoring (25% weight)
  if (fid) {
    if (fid > 300) score -= 25;
    else if (fid > 100) score -= 15;
    else if (fid > 50) score -= 5;
  }

  // CLS scoring (25% weight)
  if (cls) {
    if (cls > 0.25) score -= 25;
    else if (cls > 0.1) score -= 15;
    else if (cls > 0.05) score -= 5;
  }

  // FCP scoring (15% weight)
  if (fcp) {
    if (fcp > 3000) score -= 15;
    else if (fcp > 1800) score -= 10;
    else if (fcp > 900) score -= 3;
  }

  // TTFB scoring (10% weight)
  if (ttfb) {
    if (ttfb > 800) score -= 10;
    else if (ttfb > 600) score -= 6;
    else if (ttfb > 200) score -= 2;
  }

  return Math.max(0, Math.round(score));
};

export default {
  usePerformanceMonitor,
  useCoreWebVitals,
  analyzeBundleSize,
  useMemoryMonitor,
  useLoadingState,
  checkPerformanceBudget,
  generatePerformanceReport,
  estimateLighthouseScore,
};
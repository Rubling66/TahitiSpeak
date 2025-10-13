export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  category: 'core-vitals' | 'custom' | 'network' | 'memory' | 'rendering';
  unit: 'ms' | 'bytes' | 'score' | 'count' | 'percentage';
}

export interface CoreWebVitals {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
}

export interface MemoryMetrics {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  memoryUsage: number;
}

export interface NetworkMetrics {
  downloadSpeed: number;
  uploadSpeed: number;
  latency: number;
  connectionType: string;
  effectiveType: string;
}

export interface RenderingMetrics {
  frameRate: number;
  droppedFrames: number;
  renderTime: number;
  layoutTime: number;
  paintTime: number;
}

export interface PerformanceAlert {
  id: string;
  metric: string;
  threshold: number;
  currentValue: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  message: string;
}

export interface PerformanceReport {
  timestamp: number;
  coreVitals: CoreWebVitals;
  memory: MemoryMetrics;
  network: NetworkMetrics;
  rendering: RenderingMetrics;
  customMetrics: PerformanceMetric[];
  alerts: PerformanceAlert[];
  score: number;
}

/**
 * Advanced performance monitoring service
 * Tracks Core Web Vitals, custom metrics, and provides real-time alerts
 */
export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private observers: Map<string, PerformanceObserver> = new Map();
  private alerts: PerformanceAlert[] = [];
  private thresholds: Map<string, number> = new Map();
  private isMonitoring = false;
  private reportInterval: number = 30000; // 30 seconds
  private maxMetricsHistory = 1000;

  constructor() {
    this.initializeThresholds();
    this.setupPerformanceObservers();
  }

  /**
   * Start performance monitoring
   */
  start(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.startCoreVitalsMonitoring();
    this.startMemoryMonitoring();
    this.startNetworkMonitoring();
    this.startRenderingMonitoring();
    this.startPeriodicReporting();

    console.log('Performance monitoring started');
  }

  /**
   * Stop performance monitoring
   */
  stop(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    
    // Disconnect all observers
    for (const observer of this.observers.values()) {
      observer.disconnect();
    }
    this.observers.clear();

    console.log('Performance monitoring stopped');
  }

  /**
   * Record a custom performance metric
   */
  recordMetric(
    name: string, 
    value: number, 
    category: PerformanceMetric['category'] = 'custom',
    unit: PerformanceMetric['unit'] = 'ms'
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      category,
      unit
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metricHistory = this.metrics.get(name)!;
    metricHistory.push(metric);

    // Keep only recent metrics
    if (metricHistory.length > this.maxMetricsHistory) {
      metricHistory.shift();
    }

    // Check for alerts
    this.checkThreshold(name, value);
  }

  /**
   * Get current performance report
   */
  async getPerformanceReport(): Promise<PerformanceReport> {
    const coreVitals = await this.getCoreWebVitals();
    const memory = this.getMemoryMetrics();
    const network = await this.getNetworkMetrics();
    const rendering = this.getRenderingMetrics();
    const customMetrics = this.getCustomMetrics();
    const score = this.calculatePerformanceScore(coreVitals, memory, rendering);

    return {
      timestamp: Date.now(),
      coreVitals,
      memory,
      network,
      rendering,
      customMetrics,
      alerts: [...this.alerts],
      score
    };
  }

  /**
   * Set performance threshold for alerts
   */
  setThreshold(metric: string, threshold: number): void {
    this.thresholds.set(metric, threshold);
  }

  /**
   * Get performance metrics history
   */
  getMetricsHistory(metric: string, limit?: number): PerformanceMetric[] {
    const history = this.metrics.get(metric) || [];
    return limit ? history.slice(-limit) : [...history];
  }

  /**
   * Get all active alerts
   */
  getAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  /**
   * Clear alerts
   */
  clearAlerts(): void {
    this.alerts = [];
  }

  /**
   * Measure function execution time
   */
  async measureFunction<T>(
    name: string, 
    fn: () => Promise<T> | T
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      this.recordMetric(`function_${name}`, duration, 'custom', 'ms');
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric(`function_${name}_error`, duration, 'custom', 'ms');
      throw error;
    }
  }

  /**
   * Measure component render time
   */
  measureRender(componentName: string, renderFn: () => void): void {
    const startTime = performance.now();
    renderFn();
    const duration = performance.now() - startTime;
    this.recordMetric(`render_${componentName}`, duration, 'rendering', 'ms');
  }

  // Private methods

  private initializeThresholds(): void {
    // Core Web Vitals thresholds (good values)
    this.thresholds.set('lcp', 2500); // 2.5s
    this.thresholds.set('fid', 100);  // 100ms
    this.thresholds.set('cls', 0.1);  // 0.1
    this.thresholds.set('fcp', 1800); // 1.8s
    this.thresholds.set('ttfb', 800); // 800ms

    // Memory thresholds
    this.thresholds.set('memory_usage', 80); // 80%
    this.thresholds.set('heap_size', 50 * 1024 * 1024); // 50MB

    // Network thresholds
    this.thresholds.set('latency', 200); // 200ms

    // Rendering thresholds
    this.thresholds.set('frame_rate', 55); // 55 FPS minimum
    this.thresholds.set('render_time', 16); // 16ms for 60fps
  }

  private setupPerformanceObservers(): void {
    if (!('PerformanceObserver' in window)) {
      console.warn('PerformanceObserver not supported');
      return;
    }

    // Navigation timing
    const navObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          this.recordMetric('ttfb', navEntry.responseStart - navEntry.requestStart, 'core-vitals', 'ms');
          this.recordMetric('dom_load', navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart, 'core-vitals', 'ms');
          this.recordMetric('page_load', navEntry.loadEventEnd - navEntry.loadEventStart, 'core-vitals', 'ms');
        }
      }
    });

    try {
      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.set('navigation', navObserver);
    } catch (error) {
      console.warn('Navigation observer failed:', error);
    }

    // Paint timing
    const paintObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          this.recordMetric('fcp', entry.startTime, 'core-vitals', 'ms');
        }
      }
    });

    try {
      paintObserver.observe({ entryTypes: ['paint'] });
      this.observers.set('paint', paintObserver);
    } catch (error) {
      console.warn('Paint observer failed:', error);
    }

    // Layout shift
    const layoutObserver = new PerformanceObserver((list) => {
      let clsValue = 0;
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      if (clsValue > 0) {
        this.recordMetric('cls', clsValue, 'core-vitals', 'score');
      }
    });

    try {
      layoutObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('layout-shift', layoutObserver);
    } catch (error) {
      console.warn('Layout shift observer failed:', error);
    }
  }

  private startCoreVitalsMonitoring(): void {
    // LCP monitoring
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.recordMetric('lcp', lastEntry.startTime, 'core-vitals', 'ms');
      });

      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.set('lcp', lcpObserver);
      } catch (error) {
        console.warn('LCP observer failed:', error);
      }
    }

    // FID monitoring
    if ('PerformanceObserver' in window) {
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('fid', (entry as any).processingStart - entry.startTime, 'core-vitals', 'ms');
        }
      });

      try {
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.set('fid', fidObserver);
      } catch (error) {
        console.warn('FID observer failed:', error);
      }
    }
  }

  private startMemoryMonitoring(): void {
    setInterval(() => {
      if (!this.isMonitoring) return;

      const memory = this.getMemoryMetrics();
      this.recordMetric('memory_used', memory.usedJSHeapSize, 'memory', 'bytes');
      this.recordMetric('memory_total', memory.totalJSHeapSize, 'memory', 'bytes');
      this.recordMetric('memory_usage', memory.memoryUsage, 'memory', 'percentage');
    }, 5000); // Every 5 seconds
  }

  private startNetworkMonitoring(): void {
    setInterval(async () => {
      if (!this.isMonitoring) return;

      const network = await this.getNetworkMetrics();
      this.recordMetric('network_latency', network.latency, 'network', 'ms');
      this.recordMetric('download_speed', network.downloadSpeed, 'network', 'bytes');
    }, 10000); // Every 10 seconds
  }

  private startRenderingMonitoring(): void {
    let lastFrameTime = performance.now();
    let frameCount = 0;
    let droppedFrames = 0;

    const measureFrame = () => {
      if (!this.isMonitoring) return;

      const currentTime = performance.now();
      const frameDuration = currentTime - lastFrameTime;
      
      frameCount++;
      
      if (frameDuration > 16.67) { // Dropped frame (60fps = 16.67ms per frame)
        droppedFrames++;
      }

      // Calculate FPS every second
      if (frameCount % 60 === 0) {
        const fps = 1000 / (frameDuration / 60);
        this.recordMetric('frame_rate', fps, 'rendering', 'count');
        this.recordMetric('dropped_frames', droppedFrames, 'rendering', 'count');
        droppedFrames = 0;
      }

      lastFrameTime = currentTime;
      requestAnimationFrame(measureFrame);
    };

    requestAnimationFrame(measureFrame);
  }

  private startPeriodicReporting(): void {
    setInterval(async () => {
      if (!this.isMonitoring) return;

      const report = await this.getPerformanceReport();
      
      // Emit performance report event
      window.dispatchEvent(new CustomEvent('performance-report', {
        detail: report
      }));

      // Log critical alerts
      const criticalAlerts = report.alerts.filter(alert => alert.severity === 'critical');
      if (criticalAlerts.length > 0) {
        console.warn('Critical performance alerts:', criticalAlerts);
      }
    }, this.reportInterval);
  }

  private async getCoreWebVitals(): Promise<CoreWebVitals> {
    const getLatestMetric = (name: string): number => {
      const history = this.metrics.get(name);
      return history && history.length > 0 ? history[history.length - 1].value : 0;
    };

    return {
      lcp: getLatestMetric('lcp'),
      fid: getLatestMetric('fid'),
      cls: getLatestMetric('cls'),
      fcp: getLatestMetric('fcp'),
      ttfb: getLatestMetric('ttfb')
    };
  }

  private getMemoryMetrics(): MemoryMetrics {
    const memory = (performance as any).memory;
    
    if (!memory) {
      return {
        usedJSHeapSize: 0,
        totalJSHeapSize: 0,
        jsHeapSizeLimit: 0,
        memoryUsage: 0
      };
    }

    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      memoryUsage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
    };
  }

  private async getNetworkMetrics(): Promise<NetworkMetrics> {
    const connection = (navigator as any).connection;
    
    // Measure latency with a small request
    const latency = await this.measureLatency();

    return {
      downloadSpeed: connection?.downlink * 1024 * 1024 || 0, // Convert Mbps to bytes
      uploadSpeed: 0, // Not available in browser
      latency,
      connectionType: connection?.type || 'unknown',
      effectiveType: connection?.effectiveType || 'unknown'
    };
  }

  private getRenderingMetrics(): RenderingMetrics {
    const getLatestMetric = (name: string): number => {
      const history = this.metrics.get(name);
      return history && history.length > 0 ? history[history.length - 1].value : 0;
    };

    return {
      frameRate: getLatestMetric('frame_rate'),
      droppedFrames: getLatestMetric('dropped_frames'),
      renderTime: getLatestMetric('render_time'),
      layoutTime: 0, // Would need specific measurement
      paintTime: 0   // Would need specific measurement
    };
  }

  private getCustomMetrics(): PerformanceMetric[] {
    const customMetrics: PerformanceMetric[] = [];
    
    for (const [name, history] of this.metrics) {
      if (history.length > 0 && history[history.length - 1].category === 'custom') {
        customMetrics.push(history[history.length - 1]);
      }
    }

    return customMetrics;
  }

  private async measureLatency(): Promise<number> {
    try {
      const startTime = performance.now();
      await fetch('/api/ping', { method: 'HEAD' });
      return performance.now() - startTime;
    } catch {
      return 0;
    }
  }

  private calculatePerformanceScore(
    coreVitals: CoreWebVitals,
    memory: MemoryMetrics,
    rendering: RenderingMetrics
  ): number {
    let score = 100;

    // Core Web Vitals scoring (60% weight)
    if (coreVitals.lcp > 4000) score -= 20;
    else if (coreVitals.lcp > 2500) score -= 10;

    if (coreVitals.fid > 300) score -= 15;
    else if (coreVitals.fid > 100) score -= 8;

    if (coreVitals.cls > 0.25) score -= 15;
    else if (coreVitals.cls > 0.1) score -= 8;

    // Memory scoring (20% weight)
    if (memory.memoryUsage > 90) score -= 10;
    else if (memory.memoryUsage > 80) score -= 5;

    // Rendering scoring (20% weight)
    if (rendering.frameRate < 30) score -= 10;
    else if (rendering.frameRate < 55) score -= 5;

    return Math.max(0, Math.min(100, score));
  }

  private checkThreshold(metric: string, value: number): void {
    const threshold = this.thresholds.get(metric);
    if (!threshold) return;

    let severity: PerformanceAlert['severity'] = 'low';
    let exceeded = false;

    // Determine if threshold is exceeded and severity
    if (metric === 'cls' || metric.includes('usage')) {
      // Lower is better for these metrics
      if (value > threshold * 2) {
        severity = 'critical';
        exceeded = true;
      } else if (value > threshold * 1.5) {
        severity = 'high';
        exceeded = true;
      } else if (value > threshold) {
        severity = 'medium';
        exceeded = true;
      }
    } else if (metric === 'frame_rate') {
      // Higher is better for frame rate
      if (value < threshold * 0.5) {
        severity = 'critical';
        exceeded = true;
      } else if (value < threshold * 0.75) {
        severity = 'high';
        exceeded = true;
      } else if (value < threshold) {
        severity = 'medium';
        exceeded = true;
      }
    } else {
      // Higher is worse for most metrics
      if (value > threshold * 2) {
        severity = 'critical';
        exceeded = true;
      } else if (value > threshold * 1.5) {
        severity = 'high';
        exceeded = true;
      } else if (value > threshold) {
        severity = 'medium';
        exceeded = true;
      }
    }

    if (exceeded) {
      const alert: PerformanceAlert = {
        id: `${metric}_${Date.now()}`,
        metric,
        threshold,
        currentValue: value,
        severity,
        timestamp: Date.now(),
        message: `${metric} exceeded threshold: ${value} > ${threshold}`
      };

      this.alerts.push(alert);

      // Keep only recent alerts
      if (this.alerts.length > 100) {
        this.alerts.shift();
      }
    }
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();
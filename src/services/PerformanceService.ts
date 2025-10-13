export enum PerformanceMetricType {
  LOAD_TIME = 'load_time',
  FIRST_CONTENTFUL_PAINT = 'first_contentful_paint',
  LARGEST_CONTENTFUL_PAINT = 'largest_contentful_paint',
  FIRST_INPUT_DELAY = 'first_input_delay',
  CUMULATIVE_LAYOUT_SHIFT = 'cumulative_layout_shift',
  TIME_TO_INTERACTIVE = 'time_to_interactive',
  MEMORY_USAGE = 'memory_usage',
  CPU_USAGE = 'cpu_usage',
  NETWORK_LATENCY = 'network_latency',
  BUNDLE_SIZE = 'bundle_size',
  CACHE_HIT_RATE = 'cache_hit_rate',
  API_RESPONSE_TIME = 'api_response_time',
  ERROR_RATE = 'error_rate',
  THROUGHPUT = 'throughput'
}

export enum PerformanceThreshold {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  NEEDS_IMPROVEMENT = 'needs_improvement',
  POOR = 'poor'
}

export enum OptimizationType {
  CODE_SPLITTING = 'code_splitting',
  LAZY_LOADING = 'lazy_loading',
  IMAGE_OPTIMIZATION = 'image_optimization',
  CACHING = 'caching',
  MINIFICATION = 'minification',
  COMPRESSION = 'compression',
  CDN = 'cdn',
  PRELOADING = 'preloading',
  SERVICE_WORKER = 'service_worker',
  BUNDLE_ANALYSIS = 'bundle_analysis'
}

export interface PerformanceMetric {
  id: string;
  type: PerformanceMetricType;
  value: number;
  unit: string;
  timestamp: Date;
  url?: string;
  userAgent?: string;
  connectionType?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  threshold: PerformanceThreshold;
  tags: string[];
}

export interface PerformanceBudget {
  id: string;
  name: string;
  description: string;
  metrics: {
    type: PerformanceMetricType;
    threshold: number;
    unit: string;
  }[];
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PerformanceReport {
  id: string;
  url: string;
  timestamp: Date;
  metrics: PerformanceMetric[];
  score: number;
  recommendations: PerformanceRecommendation[];
  budgetViolations: BudgetViolation[];
  deviceType: 'mobile' | 'tablet' | 'desktop';
  connectionType: string;
  userAgent: string;
}

export interface PerformanceRecommendation {
  id: string;
  type: OptimizationType;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  priority: number;
  estimatedImprovement: string;
  implementation: string;
  resources: string[];
}

export interface BudgetViolation {
  id: string;
  budgetId: string;
  budgetName: string;
  metricType: PerformanceMetricType;
  actualValue: number;
  thresholdValue: number;
  unit: string;
  severity: 'warning' | 'error';
  timestamp: Date;
}

export interface PerformanceAlert {
  id: string;
  type: PerformanceMetricType;
  threshold: number;
  operator: 'gt' | 'lt' | 'eq' | 'ne' | 'gte' | 'lte';
  enabled: boolean;
  notifications: string[];
  cooldown: number;
  lastTriggered?: Date;
  createdAt: Date;
}

export interface PerformanceOptimization {
  id: string;
  type: OptimizationType;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  estimatedCompletion?: Date;
  actualCompletion?: Date;
  beforeMetrics?: PerformanceMetric[];
  afterMetrics?: PerformanceMetric[];
  impact?: {
    improvement: number;
    metric: PerformanceMetricType;
    unit: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface PerformanceAnalytics {
  timeRange: {
    start: Date;
    end: Date;
  };
  totalMeasurements: number;
  averageScore: number;
  trends: {
    metric: PerformanceMetricType;
    trend: 'improving' | 'degrading' | 'stable';
    change: number;
    unit: string;
  }[];
  topIssues: {
    metric: PerformanceMetricType;
    frequency: number;
    averageValue: number;
    impact: 'low' | 'medium' | 'high';
  }[];
  deviceBreakdown: {
    device: string;
    count: number;
    averageScore: number;
  }[];
  pagePerformance: {
    url: string;
    visits: number;
    averageScore: number;
    issues: number;
  }[];
}

export interface PerformanceConfig {
  sampling: {
    rate: number;
    maxSamples: number;
  };
  thresholds: {
    [key in PerformanceMetricType]?: {
      excellent: number;
      good: number;
      needsImprovement: number;
      poor: number;
    };
  };
  alerts: {
    enabled: boolean;
    channels: string[];
  };
  reporting: {
    frequency: 'hourly' | 'daily' | 'weekly';
    recipients: string[];
  };
  optimization: {
    autoOptimize: boolean;
    strategies: OptimizationType[];
  };
}

class PerformanceService {
  private metrics: PerformanceMetric[] = [];
  private budgets: PerformanceBudget[] = [];
  private reports: PerformanceReport[] = [];
  private alerts: PerformanceAlert[] = [];
  private optimizations: PerformanceOptimization[] = [];
  private config: PerformanceConfig;

  constructor() {
    this.config = this.getDefaultConfig();
    this.loadData();
    this.initializeDefaultBudgets();
    this.startPerformanceMonitoring();
  }

  // Metric Management
  recordMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp' | 'threshold'>): string {
    const id = this.generateId();
    const threshold = this.calculateThreshold(metric.type, metric.value);
    
    const newMetric: PerformanceMetric = {
      ...metric,
      id,
      timestamp: new Date(),
      threshold
    };

    this.metrics.push(newMetric);
    this.checkAlerts(newMetric);
    this.saveData();
    
    return id;
  }

  getMetrics(filters?: {
    type?: PerformanceMetricType;
    timeRange?: { start: Date; end: Date };
    url?: string;
    deviceType?: string;
  }): PerformanceMetric[] {
    let filtered = [...this.metrics];

    if (filters?.type) {
      filtered = filtered.filter(m => m.type === filters.type);
    }

    if (filters?.timeRange) {
      filtered = filtered.filter(m => 
        m.timestamp >= filters.timeRange!.start && 
        m.timestamp <= filters.timeRange!.end
      );
    }

    if (filters?.url) {
      filtered = filtered.filter(m => m.url === filters.url);
    }

    if (filters?.deviceType) {
      filtered = filtered.filter(m => m.deviceType === filters.deviceType);
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Budget Management
  createBudget(budget: Omit<PerformanceBudget, 'id' | 'createdAt' | 'updatedAt'>): string {
    const id = this.generateId();
    const newBudget: PerformanceBudget = {
      ...budget,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.budgets.push(newBudget);
    this.saveData();
    
    return id;
  }

  updateBudget(id: string, updates: Partial<PerformanceBudget>): boolean {
    const index = this.budgets.findIndex(b => b.id === id);
    if (index === -1) return false;

    this.budgets[index] = {
      ...this.budgets[index],
      ...updates,
      updatedAt: new Date()
    };

    this.saveData();
    return true;
  }

  deleteBudget(id: string): boolean {
    const index = this.budgets.findIndex(b => b.id === id);
    if (index === -1) return false;

    this.budgets.splice(index, 1);
    this.saveData();
    return true;
  }

  getBudgets(): PerformanceBudget[] {
    return [...this.budgets];
  }

  getBudget(id: string): PerformanceBudget | null {
    return this.budgets.find(b => b.id === id) || null;
  }

  // Report Generation
  generateReport(url: string, options?: {
    deviceType?: 'mobile' | 'tablet' | 'desktop';
    connectionType?: string;
  }): PerformanceReport {
    const id = this.generateId();
    const timestamp = new Date();
    
    // Simulate performance measurement
    const metrics = this.simulatePerformanceMeasurement(url, options);
    const score = this.calculatePerformanceScore(metrics);
    const recommendations = this.generateRecommendations(metrics);
    const budgetViolations = this.checkBudgetViolations(metrics);

    const report: PerformanceReport = {
      id,
      url,
      timestamp,
      metrics,
      score,
      recommendations,
      budgetViolations,
      deviceType: options?.deviceType || 'desktop',
      connectionType: options?.connectionType || '4g',
      userAgent: navigator.userAgent
    };

    this.reports.push(report);
    
    // Store individual metrics
    metrics.forEach(metric => {
      this.metrics.push(metric);
    });

    this.saveData();
    return report;
  }

  getReports(filters?: {
    url?: string;
    timeRange?: { start: Date; end: Date };
    deviceType?: string;
  }): PerformanceReport[] {
    let filtered = [...this.reports];

    if (filters?.url) {
      filtered = filtered.filter(r => r.url === filters.url);
    }

    if (filters?.timeRange) {
      filtered = filtered.filter(r => 
        r.timestamp >= filters.timeRange!.start && 
        r.timestamp <= filters.timeRange!.end
      );
    }

    if (filters?.deviceType) {
      filtered = filtered.filter(r => r.deviceType === filters.deviceType);
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Alert Management
  createAlert(alert: Omit<PerformanceAlert, 'id' | 'createdAt'>): string {
    const id = this.generateId();
    const newAlert: PerformanceAlert = {
      ...alert,
      id,
      createdAt: new Date()
    };

    this.alerts.push(newAlert);
    this.saveData();
    
    return id;
  }

  updateAlert(id: string, updates: Partial<PerformanceAlert>): boolean {
    const index = this.alerts.findIndex(a => a.id === id);
    if (index === -1) return false;

    this.alerts[index] = { ...this.alerts[index], ...updates };
    this.saveData();
    return true;
  }

  deleteAlert(id: string): boolean {
    const index = this.alerts.findIndex(a => a.id === id);
    if (index === -1) return false;

    this.alerts.splice(index, 1);
    this.saveData();
    return true;
  }

  getAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  // Optimization Management
  createOptimization(optimization: Omit<PerformanceOptimization, 'id' | 'createdAt' | 'updatedAt'>): string {
    const id = this.generateId();
    const newOptimization: PerformanceOptimization = {
      ...optimization,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.optimizations.push(newOptimization);
    this.saveData();
    
    return id;
  }

  updateOptimization(id: string, updates: Partial<PerformanceOptimization>): boolean {
    const index = this.optimizations.findIndex(o => o.id === id);
    if (index === -1) return false;

    this.optimizations[index] = {
      ...this.optimizations[index],
      ...updates,
      updatedAt: new Date()
    };

    this.saveData();
    return true;
  }

  getOptimizations(): PerformanceOptimization[] {
    return [...this.optimizations];
  }

  startOptimization(id: string): boolean {
    const optimization = this.optimizations.find(o => o.id === id);
    if (!optimization || optimization.status !== 'pending') return false;

    optimization.status = 'in_progress';
    optimization.updatedAt = new Date();
    
    // Simulate optimization process
    this.simulateOptimizationProcess(optimization);
    
    this.saveData();
    return true;
  }

  // Analytics
  getAnalytics(timeRange: { start: Date; end: Date }): PerformanceAnalytics {
    const filteredMetrics = this.getMetrics({ timeRange });
    const filteredReports = this.getReports({ timeRange });

    return {
      timeRange,
      totalMeasurements: filteredMetrics.length,
      averageScore: this.calculateAverageScore(filteredReports),
      trends: this.calculateTrends(filteredMetrics),
      topIssues: this.identifyTopIssues(filteredMetrics),
      deviceBreakdown: this.calculateDeviceBreakdown(filteredReports),
      pagePerformance: this.calculatePagePerformance(filteredReports)
    };
  }

  // Configuration
  updateConfig(updates: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveData();
  }

  getConfig(): PerformanceConfig {
    return { ...this.config };
  }

  // Real-time Performance Monitoring
  startRealTimeMonitoring(): void {
    if ('PerformanceObserver' in window) {
      // Monitor Core Web Vitals
      this.observeWebVitals();
      
      // Monitor Resource Loading
      this.observeResourceTiming();
      
      // Monitor Navigation Timing
      this.observeNavigationTiming();
    }
  }

  // Bundle Analysis
  analyzeBundleSize(): Promise<{
    totalSize: number;
    chunks: { name: string; size: number; }[];
    recommendations: string[];
  }> {
    return new Promise((resolve) => {
      // Simulate bundle analysis
      setTimeout(() => {
        const analysis = {
          totalSize: 2.5 * 1024 * 1024, // 2.5MB
          chunks: [
            { name: 'main', size: 1.2 * 1024 * 1024 },
            { name: 'vendor', size: 800 * 1024 },
            { name: 'polyfills', size: 300 * 1024 },
            { name: 'runtime', size: 200 * 1024 }
          ],
          recommendations: [
            'Consider code splitting for vendor libraries',
            'Implement lazy loading for non-critical components',
            'Use tree shaking to eliminate unused code',
            'Compress images and optimize assets'
          ]
        };
        resolve(analysis);
      }, 1000);
    });
  }

  // Data Management
  exportData(): string {
    const data = {
      metrics: this.metrics,
      budgets: this.budgets,
      reports: this.reports,
      alerts: this.alerts,
      optimizations: this.optimizations,
      config: this.config,
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }

  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.metrics) this.metrics = data.metrics.map(this.deserializeMetric);
      if (data.budgets) this.budgets = data.budgets.map(this.deserializeBudget);
      if (data.reports) this.reports = data.reports.map(this.deserializeReport);
      if (data.alerts) this.alerts = data.alerts.map(this.deserializeAlert);
      if (data.optimizations) this.optimizations = data.optimizations.map(this.deserializeOptimization);
      if (data.config) this.config = { ...this.config, ...data.config };
      
      this.saveData();
      return true;
    } catch (error) {
      console.error('Failed to import performance data:', error);
      return false;
    }
  }

  // Private Methods
  private simulatePerformanceMeasurement(
    url: string, 
    options?: { deviceType?: string; connectionType?: string }
  ): PerformanceMetric[] {
    const baseValues = {
      [PerformanceMetricType.LOAD_TIME]: { base: 2000, variance: 500 },
      [PerformanceMetricType.FIRST_CONTENTFUL_PAINT]: { base: 1200, variance: 300 },
      [PerformanceMetricType.LARGEST_CONTENTFUL_PAINT]: { base: 2500, variance: 600 },
      [PerformanceMetricType.FIRST_INPUT_DELAY]: { base: 100, variance: 50 },
      [PerformanceMetricType.CUMULATIVE_LAYOUT_SHIFT]: { base: 0.1, variance: 0.05 },
      [PerformanceMetricType.TIME_TO_INTERACTIVE]: { base: 3000, variance: 800 }
    };

    const deviceMultiplier = options?.deviceType === 'mobile' ? 1.5 : 1;
    const connectionMultiplier = options?.connectionType === '3g' ? 2 : 1;

    return Object.entries(baseValues).map(([type, config]) => {
      const value = (config.base + (Math.random() - 0.5) * config.variance) * 
                   deviceMultiplier * connectionMultiplier;
      
      return {
        id: this.generateId(),
        type: type as PerformanceMetricType,
        value: Math.max(0, value),
        unit: this.getMetricUnit(type as PerformanceMetricType),
        timestamp: new Date(),
        url,
        userAgent: navigator.userAgent,
        connectionType: options?.connectionType || '4g',
        deviceType: (options?.deviceType as any) || 'desktop',
        threshold: this.calculateThreshold(type as PerformanceMetricType, value),
        tags: []
      };
    });
  }

  private calculatePerformanceScore(metrics: PerformanceMetric[]): number {
    const weights = {
      [PerformanceMetricType.FIRST_CONTENTFUL_PAINT]: 0.15,
      [PerformanceMetricType.LARGEST_CONTENTFUL_PAINT]: 0.25,
      [PerformanceMetricType.FIRST_INPUT_DELAY]: 0.25,
      [PerformanceMetricType.CUMULATIVE_LAYOUT_SHIFT]: 0.25,
      [PerformanceMetricType.TIME_TO_INTERACTIVE]: 0.1
    };

    let totalScore = 0;
    let totalWeight = 0;

    metrics.forEach(metric => {
      const weight = weights[metric.type] || 0;
      if (weight > 0) {
        const score = this.getMetricScore(metric);
        totalScore += score * weight;
        totalWeight += weight;
      }
    });

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }

  private getMetricScore(metric: PerformanceMetric): number {
    switch (metric.threshold) {
      case PerformanceThreshold.EXCELLENT:
        return 90 + Math.random() * 10;
      case PerformanceThreshold.GOOD:
        return 70 + Math.random() * 20;
      case PerformanceThreshold.NEEDS_IMPROVEMENT:
        return 40 + Math.random() * 30;
      case PerformanceThreshold.POOR:
        return Math.random() * 40;
      default:
        return 50;
    }
  }

  private generateRecommendations(metrics: PerformanceMetric[]): PerformanceRecommendation[] {
    const recommendations: PerformanceRecommendation[] = [];
    
    metrics.forEach(metric => {
      if (metric.threshold === PerformanceThreshold.NEEDS_IMPROVEMENT || 
          metric.threshold === PerformanceThreshold.POOR) {
        
        const recommendation = this.getRecommendationForMetric(metric);
        if (recommendation) {
          recommendations.push(recommendation);
        }
      }
    });

    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  private getRecommendationForMetric(metric: PerformanceMetric): PerformanceRecommendation | null {
    const recommendations = {
      [PerformanceMetricType.FIRST_CONTENTFUL_PAINT]: {
        type: OptimizationType.CODE_SPLITTING,
        title: 'Optimize First Contentful Paint',
        description: 'Reduce the time it takes for the first content to appear on screen',
        impact: 'high' as const,
        effort: 'medium' as const,
        priority: 90,
        estimatedImprovement: '20-30% faster FCP',
        implementation: 'Implement code splitting and optimize critical rendering path',
        resources: ['Web.dev FCP Guide', 'Critical Resource Hints']
      },
      [PerformanceMetricType.LARGEST_CONTENTFUL_PAINT]: {
        type: OptimizationType.IMAGE_OPTIMIZATION,
        title: 'Optimize Largest Contentful Paint',
        description: 'Improve the loading time of the largest content element',
        impact: 'high' as const,
        effort: 'medium' as const,
        priority: 85,
        estimatedImprovement: '25-40% faster LCP',
        implementation: 'Optimize images, preload critical resources, and use CDN',
        resources: ['LCP Optimization Guide', 'Image Optimization Best Practices']
      },
      [PerformanceMetricType.FIRST_INPUT_DELAY]: {
        type: OptimizationType.CODE_SPLITTING,
        title: 'Reduce First Input Delay',
        description: 'Minimize the delay between user interaction and browser response',
        impact: 'high' as const,
        effort: 'high' as const,
        priority: 80,
        estimatedImprovement: '50-70% faster FID',
        implementation: 'Reduce JavaScript execution time and implement code splitting',
        resources: ['FID Optimization Guide', 'JavaScript Performance Tips']
      }
    };

    const template = recommendations[metric.type];
    if (!template) return null;

    return {
      id: this.generateId(),
      ...template
    };
  }

  private checkBudgetViolations(metrics: PerformanceMetric[]): BudgetViolation[] {
    const violations: BudgetViolation[] = [];

    this.budgets.forEach(budget => {
      if (!budget.enabled) return;

      budget.metrics.forEach(budgetMetric => {
        const actualMetric = metrics.find(m => m.type === budgetMetric.type);
        if (!actualMetric) return;

        if (actualMetric.value > budgetMetric.threshold) {
          violations.push({
            id: this.generateId(),
            budgetId: budget.id,
            budgetName: budget.name,
            metricType: budgetMetric.type,
            actualValue: actualMetric.value,
            thresholdValue: budgetMetric.threshold,
            unit: budgetMetric.unit,
            severity: actualMetric.value > budgetMetric.threshold * 1.5 ? 'error' : 'warning',
            timestamp: new Date()
          });
        }
      });
    });

    return violations;
  }

  private calculateThreshold(type: PerformanceMetricType, value: number): PerformanceThreshold {
    const thresholds = this.config.thresholds[type];
    if (!thresholds) return PerformanceThreshold.GOOD;

    if (value <= thresholds.excellent) return PerformanceThreshold.EXCELLENT;
    if (value <= thresholds.good) return PerformanceThreshold.GOOD;
    if (value <= thresholds.needsImprovement) return PerformanceThreshold.NEEDS_IMPROVEMENT;
    return PerformanceThreshold.POOR;
  }

  private getMetricUnit(type: PerformanceMetricType): string {
    const units = {
      [PerformanceMetricType.LOAD_TIME]: 'ms',
      [PerformanceMetricType.FIRST_CONTENTFUL_PAINT]: 'ms',
      [PerformanceMetricType.LARGEST_CONTENTFUL_PAINT]: 'ms',
      [PerformanceMetricType.FIRST_INPUT_DELAY]: 'ms',
      [PerformanceMetricType.CUMULATIVE_LAYOUT_SHIFT]: 'score',
      [PerformanceMetricType.TIME_TO_INTERACTIVE]: 'ms',
      [PerformanceMetricType.MEMORY_USAGE]: 'MB',
      [PerformanceMetricType.CPU_USAGE]: '%',
      [PerformanceMetricType.NETWORK_LATENCY]: 'ms',
      [PerformanceMetricType.BUNDLE_SIZE]: 'KB',
      [PerformanceMetricType.CACHE_HIT_RATE]: '%',
      [PerformanceMetricType.API_RESPONSE_TIME]: 'ms',
      [PerformanceMetricType.ERROR_RATE]: '%',
      [PerformanceMetricType.THROUGHPUT]: 'req/s'
    };
    return units[type] || 'unit';
  }

  private checkAlerts(metric: PerformanceMetric): void {
    this.alerts.forEach(alert => {
      if (!alert.enabled) return;
      
      // Check cooldown
      if (alert.lastTriggered && 
          Date.now() - alert.lastTriggered.getTime() < alert.cooldown * 1000) {
        return;
      }

      if (metric.type === alert.type) {
        const shouldTrigger = this.evaluateAlertCondition(metric.value, alert.threshold, alert.operator);
        
        if (shouldTrigger) {
          alert.lastTriggered = new Date();
          this.triggerAlert(alert, metric);
        }
      }
    });
  }

  private evaluateAlertCondition(value: number, threshold: number, operator: string): boolean {
    switch (operator) {
      case 'gt': return value > threshold;
      case 'gte': return value >= threshold;
      case 'lt': return value < threshold;
      case 'lte': return value <= threshold;
      case 'eq': return value === threshold;
      case 'ne': return value !== threshold;
      default: return false;
    }
  }

  private triggerAlert(alert: PerformanceAlert, metric: PerformanceMetric): void {
    console.log(`Performance Alert: ${alert.type} - ${metric.value}${metric.unit}`);
    // In a real implementation, this would send notifications
  }

  private observeWebVitals(): void {
    // Observe FCP
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          this.recordMetric({
            type: PerformanceMetricType.FIRST_CONTENTFUL_PAINT,
            value: entry.startTime,
            unit: 'ms',
            url: window.location.href,
            deviceType: this.getDeviceType(),
            tags: ['web-vitals']
          });
        }
      }
    }).observe({ entryTypes: ['paint'] });

    // Observe LCP
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      this.recordMetric({
        type: PerformanceMetricType.LARGEST_CONTENTFUL_PAINT,
        value: lastEntry.startTime,
        unit: 'ms',
        url: window.location.href,
        deviceType: this.getDeviceType(),
        tags: ['web-vitals']
      });
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // Observe FID
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.recordMetric({
          type: PerformanceMetricType.FIRST_INPUT_DELAY,
          value: (entry as any).processingStart - entry.startTime,
          unit: 'ms',
          url: window.location.href,
          deviceType: this.getDeviceType(),
          tags: ['web-vitals']
        });
      }
    }).observe({ entryTypes: ['first-input'] });
  }

  private observeResourceTiming(): void {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const resourceEntry = entry as PerformanceResourceTiming;
        
        this.recordMetric({
          type: PerformanceMetricType.NETWORK_LATENCY,
          value: resourceEntry.responseEnd - resourceEntry.requestStart,
          unit: 'ms',
          url: resourceEntry.name,
          deviceType: this.getDeviceType(),
          tags: ['resource-timing']
        });
      }
    }).observe({ entryTypes: ['resource'] });
  }

  private observeNavigationTiming(): void {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const navEntry = entry as PerformanceNavigationTiming;
        
        this.recordMetric({
          type: PerformanceMetricType.LOAD_TIME,
          value: navEntry.loadEventEnd - navEntry.navigationStart,
          unit: 'ms',
          url: window.location.href,
          deviceType: this.getDeviceType(),
          tags: ['navigation-timing']
        });
      }
    }).observe({ entryTypes: ['navigation'] });
  }

  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  private simulateOptimizationProcess(optimization: PerformanceOptimization): void {
    const duration = 5000 + Math.random() * 10000; // 5-15 seconds
    const steps = 10;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      optimization.progress = (currentStep / steps) * 100;
      
      if (currentStep >= steps) {
        clearInterval(interval);
        optimization.status = 'completed';
        optimization.actualCompletion = new Date();
        
        // Simulate performance improvement
        optimization.impact = {
          improvement: 15 + Math.random() * 25, // 15-40% improvement
          metric: PerformanceMetricType.LOAD_TIME,
          unit: 'ms'
        };
        
        this.saveData();
      }
    }, stepDuration);
  }

  private calculateAverageScore(reports: PerformanceReport[]): number {
    if (reports.length === 0) return 0;
    const sum = reports.reduce((acc, report) => acc + report.score, 0);
    return Math.round(sum / reports.length);
  }

  private calculateTrends(metrics: PerformanceMetric[]): PerformanceAnalytics['trends'] {
    const metricTypes = Object.values(PerformanceMetricType);
    
    return metricTypes.map(type => {
      const typeMetrics = metrics.filter(m => m.type === type);
      if (typeMetrics.length < 2) {
        return {
          metric: type,
          trend: 'stable' as const,
          change: 0,
          unit: this.getMetricUnit(type)
        };
      }

      const recent = typeMetrics.slice(0, Math.floor(typeMetrics.length / 2));
      const older = typeMetrics.slice(Math.floor(typeMetrics.length / 2));

      const recentAvg = recent.reduce((sum, m) => sum + m.value, 0) / recent.length;
      const olderAvg = older.reduce((sum, m) => sum + m.value, 0) / older.length;

      const change = ((recentAvg - olderAvg) / olderAvg) * 100;
      const trend = Math.abs(change) < 5 ? 'stable' : 
                   change < 0 ? 'improving' : 'degrading';

      return {
        metric: type,
        trend,
        change: Math.abs(change),
        unit: this.getMetricUnit(type)
      };
    });
  }

  private identifyTopIssues(metrics: PerformanceMetric[]): PerformanceAnalytics['topIssues'] {
    const issues = metrics.filter(m => 
      m.threshold === PerformanceThreshold.NEEDS_IMPROVEMENT || 
      m.threshold === PerformanceThreshold.POOR
    );

    const issueGroups = issues.reduce((acc, metric) => {
      if (!acc[metric.type]) {
        acc[metric.type] = [];
      }
      acc[metric.type].push(metric);
      return acc;
    }, {} as Record<PerformanceMetricType, PerformanceMetric[]>);

    return Object.entries(issueGroups).map(([type, typeMetrics]) => ({
      metric: type as PerformanceMetricType,
      frequency: typeMetrics.length,
      averageValue: typeMetrics.reduce((sum, m) => sum + m.value, 0) / typeMetrics.length,
      impact: typeMetrics.some(m => m.threshold === PerformanceThreshold.POOR) ? 'high' as const :
              typeMetrics.length > 5 ? 'medium' as const : 'low' as const
    })).sort((a, b) => b.frequency - a.frequency);
  }

  private calculateDeviceBreakdown(reports: PerformanceReport[]): PerformanceAnalytics['deviceBreakdown'] {
    const deviceGroups = reports.reduce((acc, report) => {
      if (!acc[report.deviceType]) {
        acc[report.deviceType] = [];
      }
      acc[report.deviceType].push(report);
      return acc;
    }, {} as Record<string, PerformanceReport[]>);

    return Object.entries(deviceGroups).map(([device, deviceReports]) => ({
      device,
      count: deviceReports.length,
      averageScore: Math.round(deviceReports.reduce((sum, r) => sum + r.score, 0) / deviceReports.length)
    }));
  }

  private calculatePagePerformance(reports: PerformanceReport[]): PerformanceAnalytics['pagePerformance'] {
    const pageGroups = reports.reduce((acc, report) => {
      if (!acc[report.url]) {
        acc[report.url] = [];
      }
      acc[report.url].push(report);
      return acc;
    }, {} as Record<string, PerformanceReport[]>);

    return Object.entries(pageGroups).map(([url, pageReports]) => ({
      url,
      visits: pageReports.length,
      averageScore: Math.round(pageReports.reduce((sum, r) => sum + r.score, 0) / pageReports.length),
      issues: pageReports.reduce((sum, r) => sum + r.budgetViolations.length, 0)
    })).sort((a, b) => b.visits - a.visits);
  }

  private initializeDefaultBudgets(): void {
    if (this.budgets.length === 0) {
      this.createBudget({
        name: 'Core Web Vitals',
        description: 'Google Core Web Vitals performance budget',
        metrics: [
          { type: PerformanceMetricType.FIRST_CONTENTFUL_PAINT, threshold: 1800, unit: 'ms' },
          { type: PerformanceMetricType.LARGEST_CONTENTFUL_PAINT, threshold: 2500, unit: 'ms' },
          { type: PerformanceMetricType.FIRST_INPUT_DELAY, threshold: 100, unit: 'ms' },
          { type: PerformanceMetricType.CUMULATIVE_LAYOUT_SHIFT, threshold: 0.1, unit: 'score' }
        ],
        enabled: true
      });

      this.createBudget({
        name: 'Mobile Performance',
        description: 'Performance budget optimized for mobile devices',
        metrics: [
          { type: PerformanceMetricType.LOAD_TIME, threshold: 3000, unit: 'ms' },
          { type: PerformanceMetricType.BUNDLE_SIZE, threshold: 500, unit: 'KB' },
          { type: PerformanceMetricType.API_RESPONSE_TIME, threshold: 500, unit: 'ms' }
        ],
        enabled: true
      });
    }
  }

  private getDefaultConfig(): PerformanceConfig {
    return {
      sampling: {
        rate: 0.1, // 10% sampling
        maxSamples: 1000
      },
      thresholds: {
        [PerformanceMetricType.FIRST_CONTENTFUL_PAINT]: {
          excellent: 1000,
          good: 1800,
          needsImprovement: 3000,
          poor: 5000
        },
        [PerformanceMetricType.LARGEST_CONTENTFUL_PAINT]: {
          excellent: 1200,
          good: 2500,
          needsImprovement: 4000,
          poor: 6000
        },
        [PerformanceMetricType.FIRST_INPUT_DELAY]: {
          excellent: 50,
          good: 100,
          needsImprovement: 300,
          poor: 500
        },
        [PerformanceMetricType.CUMULATIVE_LAYOUT_SHIFT]: {
          excellent: 0.05,
          good: 0.1,
          needsImprovement: 0.25,
          poor: 0.5
        }
      },
      alerts: {
        enabled: true,
        channels: ['email', 'slack']
      },
      reporting: {
        frequency: 'daily',
        recipients: ['admin@example.com']
      },
      optimization: {
        autoOptimize: false,
        strategies: [
          OptimizationType.CODE_SPLITTING,
          OptimizationType.LAZY_LOADING,
          OptimizationType.IMAGE_OPTIMIZATION,
          OptimizationType.CACHING
        ]
      }
    };
  }

  private startPerformanceMonitoring(): void {
    // Start real-time monitoring if in browser environment
    if (typeof window !== 'undefined') {
      this.startRealTimeMonitoring();
    }
  }

  private generateId(): string {
    return `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private saveData(): void {
    try {
      const data = {
        metrics: this.metrics,
        budgets: this.budgets,
        reports: this.reports,
        alerts: this.alerts,
        optimizations: this.optimizations,
        config: this.config
      };
      localStorage.setItem('performanceService', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save performance data:', error);
    }
  }

  private loadData(): void {
    try {
      const data = localStorage.getItem('performanceService');
      if (data) {
        const parsed = JSON.parse(data);
        
        this.metrics = (parsed.metrics || []).map(this.deserializeMetric);
        this.budgets = (parsed.budgets || []).map(this.deserializeBudget);
        this.reports = (parsed.reports || []).map(this.deserializeReport);
        this.alerts = (parsed.alerts || []).map(this.deserializeAlert);
        this.optimizations = (parsed.optimizations || []).map(this.deserializeOptimization);
        
        if (parsed.config) {
          this.config = { ...this.config, ...parsed.config };
        }
      }
    } catch (error) {
      console.error('Failed to load performance data:', error);
    }
  }

  private deserializeMetric = (data: any): PerformanceMetric => ({
    ...data,
    timestamp: new Date(data.timestamp)
  });

  private deserializeBudget = (data: any): PerformanceBudget => ({
    ...data,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt)
  });

  private deserializeReport = (data: any): PerformanceReport => ({
    ...data,
    timestamp: new Date(data.timestamp),
    metrics: data.metrics.map(this.deserializeMetric)
  });

  private deserializeAlert = (data: any): PerformanceAlert => ({
    ...data,
    createdAt: new Date(data.createdAt),
    lastTriggered: data.lastTriggered ? new Date(data.lastTriggered) : undefined
  });

  private deserializeOptimization = (data: any): PerformanceOptimization => ({
    ...data,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
    estimatedCompletion: data.estimatedCompletion ? new Date(data.estimatedCompletion) : undefined,
    actualCompletion: data.actualCompletion ? new Date(data.actualCompletion) : undefined,
    beforeMetrics: data.beforeMetrics?.map(this.deserializeMetric),
    afterMetrics: data.afterMetrics?.map(this.deserializeMetric)
  });
}

export default PerformanceService;
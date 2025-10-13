import { logger } from './LoggingService';
import { notificationService } from './NotificationService';

export interface ErrorMetrics {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsByComponent: Record<string, number>;
  errorsByTimeframe: Record<string, number>;
  criticalErrors: number;
  resolvedErrors: number;
  averageResolutionTime: number;
  topErrors: Array<{
    message: string;
    count: number;
    lastOccurrence: Date;
    component?: string;
  }>;
}

export interface ErrorReport {
  id: string;
  timestamp: Date;
  error: {
    message: string;
    stack?: string;
    name: string;
  };
  context: {
    component?: string;
    action?: string;
    userId?: string;
    sessionId: string;
    url: string;
    userAgent: string;
    viewport: {
      width: number;
      height: number;
    };
    metadata?: Record<string, unknown>;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'network' | 'api' | 'auth' | 'data' | 'ui' | 'performance' | 'unknown';
  resolved: boolean;
  resolutionTime?: number;
  tags: string[];
  fingerprint: string; // For grouping similar errors
}

export interface ErrorPattern {
  id: string;
  fingerprint: string;
  message: string;
  count: number;
  firstSeen: Date;
  lastSeen: Date;
  severity: ErrorReport['severity'];
  category: ErrorReport['category'];
  affectedComponents: string[];
  suggestedFix?: string;
  isRecurring: boolean;
}

export interface MonitoringConfig {
  maxReports: number;
  retentionDays: number;
  enableAutoReporting: boolean;
  enablePerformanceTracking: boolean;
  enableUserTracking: boolean;
  samplingRate: number; // 0-1, for performance
  criticalErrorThreshold: number;
  recurringErrorThreshold: number;
}

export class ErrorMonitoringService {
  private static instance: ErrorMonitoringService;
  private errorReports: ErrorReport[] = [];
  private errorPatterns: Map<string, ErrorPattern> = new Map();
  private sessionId: string;
  private config: MonitoringConfig;
  private performanceObserver?: PerformanceObserver;
  private errorQueue: ErrorReport[] = [];
  private isProcessingQueue = false;
  private cleanupInterval?: NodeJS.Timeout;
  private queueProcessorInterval?: NodeJS.Timeout;
  private eventHandlers: {
    error?: (event: ErrorEvent) => void;
    unhandledrejection?: (event: PromiseRejectionEvent) => void;
    load?: () => void;
  } = {};

  static getInstance(): ErrorMonitoringService {
    if (!ErrorMonitoringService.instance) {
      ErrorMonitoringService.instance = new ErrorMonitoringService();
    }
    return ErrorMonitoringService.instance;
  }

  constructor() {
    this.sessionId = this.generateSessionId();
    this.config = {
      maxReports: 1000,
      retentionDays: 7,
      enableAutoReporting: true,
      enablePerformanceTracking: true,
      enableUserTracking: true,
      samplingRate: 1.0,
      criticalErrorThreshold: 5,
      recurringErrorThreshold: 3
    };
    
    this.initialize();
  }

  private initialize(): void {
    this.setupGlobalErrorHandlers();
    this.setupPerformanceMonitoring();
    this.setupStorageCleanup();
    this.loadPersistedData();
    this.startQueueProcessor();
  }

  private setupGlobalErrorHandlers(): void {
    // Catch unhandled JavaScript errors
    this.eventHandlers.error = (event) => {
      this.captureError(event.error || new Error(event.message), {
        component: 'Global',
        action: 'unhandled_error',
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    };
    window.addEventListener('error', this.eventHandlers.error);

    // Catch unhandled promise rejections
    this.eventHandlers.unhandledrejection = (event) => {
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason));
      
      this.captureError(error, {
        component: 'Global',
        action: 'unhandled_promise_rejection'
      });
    };
    window.addEventListener('unhandledrejection', this.eventHandlers.unhandledrejection);

    // Catch React errors (if using React)
    if (typeof window !== 'undefined' && (window as Record<string, unknown>).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      const originalConsoleError = console.error;
      console.error = (...args) => {
        const message = args.join(' ');
        if (message.includes('React') || message.includes('Warning:')) {
          this.captureError(new Error(message), {
            component: 'React',
            action: 'react_warning_or_error'
          });
        }
        originalConsoleError.apply(console, args);
      };
    }
  }

  private setupPerformanceMonitoring(): void {
    if (!this.config.enablePerformanceTracking || !('PerformanceObserver' in window)) {
      return;
    }

    try {
      // Monitor long tasks
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'longtask' && entry.duration > 50) {
            this.captureError(new Error('Long task detected'), {
              component: 'Performance',
              action: 'long_task',
              metadata: {
                duration: entry.duration,
                startTime: entry.startTime
              }
            });
          }
        }
      });

      this.performanceObserver.observe({ entryTypes: ['longtask'] });

      // Monitor navigation timing
      this.eventHandlers.load = () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          if (navigation && navigation.loadEventEnd - navigation.navigationStart > 5000) {
            this.captureError(new Error('Slow page load'), {
              component: 'Performance',
              action: 'slow_load',
              metadata: {
                loadTime: navigation.loadEventEnd - navigation.navigationStart,
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart
              }
            });
          }
        }, 1000);
      };
      window.addEventListener('load', this.eventHandlers.load);
    } catch (error) {
      logger.warn('Failed to setup performance monitoring', { error });
    }
  }

  private setupStorageCleanup(): void {
    // Clean up old reports periodically
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldReports();
    }, 60 * 60 * 1000); // Every hour
  }

  private loadPersistedData(): void {
    try {
      const stored = localStorage.getItem('errorMonitoring');
      if (stored) {
        const data = JSON.parse(stored);
        this.errorReports = data.reports?.map((r: Record<string, unknown>) => ({
          ...r,
          timestamp: new Date(r.timestamp)
        })) || [];
        
        // Rebuild patterns from reports
        this.rebuildPatterns();
      }
    } catch (error) {
      logger.warn('Failed to load persisted error data', { error });
    }
  }

  private persistData(): void {
    try {
      const data = {
        reports: this.errorReports.slice(-this.config.maxReports),
        timestamp: Date.now()
      };
      localStorage.setItem('errorMonitoring', JSON.stringify(data));
    } catch (error) {
      logger.warn('Failed to persist error data', { error });
    }
  }

  private startQueueProcessor(): void {
    this.queueProcessorInterval = setInterval(() => {
      if (!this.isProcessingQueue && this.errorQueue.length > 0) {
        this.processErrorQueue();
      }
    }, 1000);
  }

  private async processErrorQueue(): Promise<void> {
    if (this.isProcessingQueue || this.errorQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    
    try {
      const batch = this.errorQueue.splice(0, 10); // Process in batches
      
      for (const report of batch) {
        await this.processErrorReport(report);
      }
    } catch (error) {
      logger.error('Error processing error queue', { error });
    } finally {
      this.isProcessingQueue = false;
    }
  }

  private async processErrorReport(report: ErrorReport): Promise<void> {
    // Add to reports
    this.errorReports.unshift(report);
    
    // Update patterns
    this.updateErrorPattern(report);
    
    // Check for critical patterns
    this.checkCriticalPatterns(report);
    
    // Persist data
    this.persistData();
    
    // Send to external monitoring service if configured
    if (this.config.enableAutoReporting) {
      await this.sendToExternalService(report);
    }
  }

  captureError(
    error: Error,
    context: {
      component?: string;
      action?: string;
      userId?: string;
      metadata?: Record<string, unknown>;
    } = {}
  ): string {
    // Apply sampling
    if (Math.random() > this.config.samplingRate) {
      return '';
    }

    const report: ErrorReport = {
      id: this.generateErrorId(),
      timestamp: new Date(),
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      context: {
        ...context,
        sessionId: this.sessionId,
        url: window.location.href,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      },
      severity: this.determineSeverity(error, context),
      category: this.categorizeError(error, context),
      resolved: false,
      tags: this.generateTags(error, context),
      fingerprint: this.generateFingerprint(error, context)
    };

    // Add to queue for processing
    this.errorQueue.push(report);
    
    logger.error('Error captured by monitoring service', {
      errorId: report.id,
      message: error.message,
      component: context.component,
      severity: report.severity
    });

    return report.id;
  }

  private determineSeverity(
    error: Error,
    context: { component?: string; action?: string; metadata?: Record<string, unknown> }
  ): ErrorReport['severity'] {
    // Critical errors
    if (
      error.name === 'ChunkLoadError' ||
      error.message.includes('Loading chunk') ||
      context.component === 'Auth' ||
      context.action === 'payment_failure'
    ) {
      return 'critical';
    }

    // High severity errors
    if (
      error.name === 'TypeError' ||
      error.name === 'ReferenceError' ||
      context.component === 'API' ||
      context.action?.includes('save') ||
      context.action?.includes('submit')
    ) {
      return 'high';
    }

    // Medium severity errors
    if (
      error.name === 'NetworkError' ||
      context.component === 'UI' ||
      context.action?.includes('load')
    ) {
      return 'medium';
    }

    return 'low';
  }

  private categorizeError(
    error: Error,
    context: { component?: string; action?: string; metadata?: Record<string, unknown> }
  ): ErrorReport['category'] {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    if (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('timeout') ||
      error.name === 'NetworkError'
    ) {
      return 'network';
    }

    if (
      message.includes('api') ||
      message.includes('server') ||
      message.includes('http') ||
      context.component === 'API'
    ) {
      return 'api';
    }

    if (
      message.includes('auth') ||
      message.includes('token') ||
      message.includes('unauthorized') ||
      context.component === 'Auth'
    ) {
      return 'auth';
    }

    if (
      message.includes('validation') ||
      message.includes('invalid') ||
      message.includes('required') ||
      context.action?.includes('validation')
    ) {
      return 'data';
    }

    if (
      message.includes('render') ||
      message.includes('component') ||
      stack.includes('react') ||
      context.component === 'UI'
    ) {
      return 'ui';
    }

    if (
      message.includes('performance') ||
      message.includes('slow') ||
      context.component === 'Performance'
    ) {
      return 'performance';
    }

    return 'unknown';
  }

  private generateTags(
    error: Error,
    context: { component?: string; action?: string; metadata?: Record<string, unknown> }
  ): string[] {
    const tags: string[] = [];
    
    if (context.component) tags.push(`component:${context.component}`);
    if (context.action) tags.push(`action:${context.action}`);
    if (error.name) tags.push(`error:${error.name}`);
    
    // Add browser info
    tags.push(`browser:${this.getBrowserName()}`);
    tags.push(`platform:${navigator.platform}`);
    
    // Add page info
    tags.push(`page:${window.location.pathname}`);
    
    return tags;
  }

  private generateFingerprint(
    error: Error,
    context: { component?: string; action?: string; metadata?: Record<string, unknown> }
  ): string {
    // Create a unique fingerprint for grouping similar errors
    const parts = [
      error.name,
      error.message.replace(/\d+/g, 'N'), // Replace numbers with N
      context.component || 'unknown',
      context.action || 'unknown'
    ];
    
    return btoa(parts.join('|')).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  }

  private updateErrorPattern(report: ErrorReport): void {
    const existing = this.errorPatterns.get(report.fingerprint);
    
    if (existing) {
      existing.count++;
      existing.lastSeen = report.timestamp;
      existing.isRecurring = existing.count >= this.config.recurringErrorThreshold;
      
      if (report.context.component && !existing.affectedComponents.includes(report.context.component)) {
        existing.affectedComponents.push(report.context.component);
      }
    } else {
      const pattern: ErrorPattern = {
        id: report.fingerprint,
        fingerprint: report.fingerprint,
        message: report.error.message,
        count: 1,
        firstSeen: report.timestamp,
        lastSeen: report.timestamp,
        severity: report.severity,
        category: report.category,
        affectedComponents: report.context.component ? [report.context.component] : [],
        isRecurring: false
      };
      
      this.errorPatterns.set(report.fingerprint, pattern);
    }
  }

  private checkCriticalPatterns(report: ErrorReport): void {
    const pattern = this.errorPatterns.get(report.fingerprint);
    
    if (pattern && pattern.count >= this.config.criticalErrorThreshold) {
      notificationService.error('Critical error pattern detected', {
        description: `Error "${pattern.message}" has occurred ${pattern.count} times.`,
        severity: 'critical',
        duration: 0, // Don't auto-dismiss
        action: {
          label: 'View Details',
          onClick: () => this.showErrorDetails(pattern.id)
        }
      });
    }
  }

  private showErrorDetails(patternId: string): void {
    const pattern = this.errorPatterns.get(patternId);
    if (!pattern) return;

    const details = {
      pattern,
      recentOccurrences: this.errorReports
        .filter(r => r.fingerprint === patternId)
        .slice(0, 10)
    };

    console.group('🔍 Error Pattern Details');
    console.log('Pattern:', pattern);
    console.log('Recent Occurrences:', details.recentOccurrences);
    console.groupEnd();
  }

  private async sendToExternalService(report: ErrorReport): Promise<void> {
    // Placeholder for external monitoring service integration
    // This could send to Sentry, LogRocket, Bugsnag, etc.
    try {
      // Example: await fetch('/api/errors', { method: 'POST', body: JSON.stringify(report) });
      logger.debug('Error report would be sent to external service', { reportId: report.id });
    } catch (error) {
      logger.warn('Failed to send error to external service', { error });
    }
  }

  private cleanupOldReports(): void {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - this.config.retentionDays);
    
    const initialCount = this.errorReports.length;
    this.errorReports = this.errorReports.filter(report => report.timestamp > cutoff);
    
    const removedCount = initialCount - this.errorReports.length;
    if (removedCount > 0) {
      logger.info(`Cleaned up ${removedCount} old error reports`);
      this.persistData();
    }
  }

  private rebuildPatterns(): void {
    this.errorPatterns.clear();
    
    for (const report of this.errorReports) {
      this.updateErrorPattern(report);
    }
  }

  // Public API methods
  getMetrics(): ErrorMetrics {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentReports = this.errorReports.filter(r => r.timestamp > last24h);
    const weeklyReports = this.errorReports.filter(r => r.timestamp > last7d);

    const errorsByType: Record<string, number> = {};
    const errorsByComponent: Record<string, number> = {};
    const errorsByTimeframe: Record<string, number> = {
      'last24h': recentReports.length,
      'last7d': weeklyReports.length,
      'total': this.errorReports.length
    };

    for (const report of this.errorReports) {
      errorsByType[report.category] = (errorsByType[report.category] || 0) + 1;
      if (report.context.component) {
        errorsByComponent[report.context.component] = (errorsByComponent[report.context.component] || 0) + 1;
      }
    }

    const topErrors = Array.from(this.errorPatterns.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(pattern => ({
        message: pattern.message,
        count: pattern.count,
        lastOccurrence: pattern.lastSeen,
        component: pattern.affectedComponents[0]
      }));

    const resolvedErrors = this.errorReports.filter(r => r.resolved).length;
    const resolvedReports = this.errorReports.filter(r => r.resolved && r.resolutionTime);
    const averageResolutionTime = resolvedReports.length > 0
      ? resolvedReports.reduce((sum, r) => sum + (r.resolutionTime || 0), 0) / resolvedReports.length
      : 0;

    return {
      totalErrors: this.errorReports.length,
      errorsByType,
      errorsByComponent,
      errorsByTimeframe,
      criticalErrors: this.errorReports.filter(r => r.severity === 'critical').length,
      resolvedErrors,
      averageResolutionTime,
      topErrors
    };
  }

  getErrorPatterns(): ErrorPattern[] {
    return Array.from(this.errorPatterns.values())
      .sort((a, b) => b.count - a.count);
  }

  getRecentErrors(limit: number = 50): ErrorReport[] {
    return this.errorReports.slice(0, limit);
  }

  markErrorResolved(errorId: string): void {
    const report = this.errorReports.find(r => r.id === errorId);
    if (report && !report.resolved) {
      report.resolved = true;
      report.resolutionTime = Date.now() - report.timestamp.getTime();
      this.persistData();
    }
  }

  clearAllErrors(): void {
    this.errorReports = [];
    this.errorPatterns.clear();
    this.persistData();
    logger.info('All error reports cleared');
  }

  updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('Error monitoring config updated', { config: this.config });
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateErrorId(): string {
    return `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getBrowserName(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'chrome';
    if (userAgent.includes('Firefox')) return 'firefox';
    if (userAgent.includes('Safari')) return 'safari';
    if (userAgent.includes('Edge')) return 'edge';
    return 'unknown';
  }

  // Cleanup method
  destroy(): void {
    // Disconnect PerformanceObserver
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = undefined;
    }

    // Clear intervals
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
    if (this.queueProcessorInterval) {
      clearInterval(this.queueProcessorInterval);
      this.queueProcessorInterval = undefined;
    }

    // Remove event listeners
    if (this.eventHandlers.error) {
      window.removeEventListener('error', this.eventHandlers.error);
    }
    if (this.eventHandlers.unhandledrejection) {
      window.removeEventListener('unhandledrejection', this.eventHandlers.unhandledrejection);
    }
    if (this.eventHandlers.load) {
      window.removeEventListener('load', this.eventHandlers.load);
    }

    // Clear event handlers
    this.eventHandlers = {};

    // Clear data and persist final state
    this.errorQueue = [];
    this.isProcessingQueue = false;
    this.persistData();

    logger.info('ErrorMonitoringService destroyed and cleaned up');
  }
}

// Export singleton instance
export const errorMonitoringService = ErrorMonitoringService.getInstance();

// React hook for error monitoring
export function useErrorMonitoring() {
  const captureError = (error: Error, context?: Record<string, unknown>) => {
    return errorMonitoringService.captureError(error, context);
  };

  const getMetrics = () => {
    return errorMonitoringService.getMetrics();
  };

  const getRecentErrors = (limit?: number) => {
    return errorMonitoringService.getRecentErrors(limit);
  };

  const markResolved = (errorId: string) => {
    errorMonitoringService.markErrorResolved(errorId);
  };

  return {
    captureError,
    getMetrics,
    getRecentErrors,
    markResolved
  };
}
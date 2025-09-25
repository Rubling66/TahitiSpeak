import { logger } from '@/services/LoggingService';
import { performanceMonitoring } from '@/services/PerformanceMonitoringService';

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  timestamp: string;
  errorId: string;
}

export interface ErrorReport {
  error: Error;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'javascript' | 'network' | 'api' | 'auth' | 'ui' | 'data' | 'unknown';
}

class GlobalErrorHandler {
  private isInitialized = false;
  private errorQueue: ErrorReport[] = [];
  private maxQueueSize = 100;

  public initialize() {
    if (this.isInitialized || typeof window === 'undefined') {
      return;
    }

    // Handle uncaught JavaScript errors
    window.addEventListener('error', this.handleError.bind(this));

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));

    // Handle resource loading errors
    window.addEventListener('error', this.handleResourceError.bind(this), true);

    this.isInitialized = true;
    
    logger.info('Global error handler initialized', {
      timestamp: new Date().toISOString(),
    });
  }

  private handleError(event: ErrorEvent) {
    const error = new Error(event.message);
    error.stack = `${event.filename}:${event.lineno}:${event.colno}\n${error.stack}`;

    const context = this.createErrorContext();
    const category = this.categorizeError(error, 'javascript');
    const severity = this.determineSeverity(error, category);

    const report: ErrorReport = {
      error,
      context,
      severity,
      category,
    };

    this.processError(report);
  }

  private handlePromiseRejection(event: PromiseRejectionEvent) {
    let error: Error;
    
    if (event.reason instanceof Error) {
      error = event.reason;
    } else if (typeof event.reason === 'string') {
      error = new Error(event.reason);
    } else {
      error = new Error('Unhandled promise rejection: ' + JSON.stringify(event.reason));
    }

    const context = this.createErrorContext();
    const category = this.categorizeError(error, 'javascript');
    const severity = this.determineSeverity(error, category);

    const report: ErrorReport = {
      error,
      context,
      severity,
      category,
    };

    this.processError(report);

    // Prevent the default browser behavior
    event.preventDefault();
  }

  private handleResourceError(event: Event) {
    const target = event.target as HTMLElement;
    
    if (!target || target === window) {
      return;
    }

    let resourceType = 'unknown';
    let resourceUrl = '';

    if (target instanceof HTMLImageElement) {
      resourceType = 'image';
      resourceUrl = target.src;
    } else if (target instanceof HTMLScriptElement) {
      resourceType = 'script';
      resourceUrl = target.src;
    } else if (target instanceof HTMLLinkElement) {
      resourceType = 'stylesheet';
      resourceUrl = target.href;
    }

    if (resourceUrl) {
      const error = new Error(`Failed to load ${resourceType}: ${resourceUrl}`);
      const context = this.createErrorContext();
      
      const report: ErrorReport = {
        error,
        context,
        severity: 'medium',
        category: 'network',
      };

      this.processError(report);
    }
  }

  private createErrorContext(): ErrorContext {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      errorId,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      sessionId: logger.getSessionId(),
      userId: this.getCurrentUserId(),
    };
  }

  private getCurrentUserId(): string | undefined {
    if (typeof window === 'undefined') {
      return undefined;
    }

    try {
      // Try to get user ID from localStorage
      const userInfo = localStorage.getItem('user');
      if (userInfo) {
        const user = JSON.parse(userInfo);
        return user.id || user.userId;
      }

      // Try to get from session storage
      const sessionUser = sessionStorage.getItem('user');
      if (sessionUser) {
        const user = JSON.parse(sessionUser);
        return user.id || user.userId;
      }
    } catch (e) {
      // Ignore errors getting user ID
    }

    return undefined;
  }

  private categorizeError(error: Error, defaultCategory: ErrorReport['category'] = 'unknown'): ErrorReport['category'] {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    // Network errors
    if (message.includes('fetch') || message.includes('network') || message.includes('cors')) {
      return 'network';
    }

    // API errors
    if (message.includes('api') || message.includes('endpoint') || stack.includes('/api/')) {
      return 'api';
    }

    // Authentication errors
    if (message.includes('auth') || message.includes('unauthorized') || message.includes('forbidden')) {
      return 'auth';
    }

    // UI/React errors
    if (stack.includes('react') || stack.includes('component') || message.includes('render')) {
      return 'ui';
    }

    // Data errors
    if (message.includes('json') || message.includes('parse') || message.includes('serialize')) {
      return 'data';
    }

    return defaultCategory;
  }

  private determineSeverity(error: Error, category: ErrorReport['category']): ErrorReport['severity'] {
    const message = error.message.toLowerCase();

    // Critical errors
    if (
      message.includes('security') ||
      message.includes('csrf') ||
      message.includes('xss') ||
      category === 'auth' && message.includes('token')
    ) {
      return 'critical';
    }

    // High severity errors
    if (
      category === 'api' ||
      category === 'auth' ||
      message.includes('database') ||
      message.includes('server') ||
      message.includes('500')
    ) {
      return 'high';
    }

    // Medium severity errors
    if (
      category === 'network' ||
      category === 'data' ||
      message.includes('404') ||
      message.includes('timeout')
    ) {
      return 'medium';
    }

    // Low severity errors (UI, minor issues)
    return 'low';
  }

  private processError(report: ErrorReport) {
    // Add to queue
    this.errorQueue.push(report);
    
    // Trim queue if too large
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue = this.errorQueue.slice(-this.maxQueueSize);
    }

    // Log to our logging service
    const logLevel = this.getLogLevel(report.severity);
    logger[logLevel](
      `[${report.category.toUpperCase()}] ${report.error.message}`,
      {
        errorId: report.context.errorId,
        category: report.category,
        severity: report.severity,
        userId: report.context.userId,
        url: report.context.url,
        userAgent: report.context.userAgent,
        stack: report.error.stack,
      },
      report.error
    );

    // Send to performance monitoring
    performanceMonitoring.logError({
      message: report.error.message,
      stack: report.error.stack,
      level: logLevel,
      metadata: {
        errorId: report.context.errorId,
        category: report.category,
        severity: report.severity,
        userId: report.context.userId,
        sessionId: report.context.sessionId,
        url: report.context.url,
        timestamp: report.context.timestamp,
      },
    });

    // For critical errors, try to notify user (if in development)
    if (report.severity === 'critical' && process.env.NODE_ENV === 'development') {
      console.error('🚨 CRITICAL ERROR DETECTED:', report);
    }
  }

  private getLogLevel(severity: ErrorReport['severity']): 'debug' | 'info' | 'warn' | 'error' | 'fatal' {
    switch (severity) {
      case 'critical':
        return 'fatal';
      case 'high':
        return 'error';
      case 'medium':
        return 'warn';
      case 'low':
        return 'info';
      default:
        return 'error';
    }
  }

  // Public methods
  public reportError(
    error: Error,
    category: ErrorReport['category'] = 'unknown',
    severity?: ErrorReport['severity']
  ) {
    const context = this.createErrorContext();
    const finalSeverity = severity || this.determineSeverity(error, category);
    
    const report: ErrorReport = {
      error,
      context,
      severity: finalSeverity,
      category,
    };

    this.processError(report);
  }

  public getErrorQueue(): ErrorReport[] {
    return [...this.errorQueue];
  }

  public clearErrorQueue() {
    this.errorQueue = [];
  }

  public getErrorStats() {
    const stats = {
      total: this.errorQueue.length,
      bySeverity: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      },
      byCategory: {
        javascript: 0,
        network: 0,
        api: 0,
        auth: 0,
        ui: 0,
        data: 0,
        unknown: 0,
      },
    };

    this.errorQueue.forEach(report => {
      stats.bySeverity[report.severity]++;
      stats.byCategory[report.category]++;
    });

    return stats;
  }
}

// Create singleton instance
export const globalErrorHandler = new GlobalErrorHandler();

// Utility functions
export function reportError(
  error: Error,
  category: ErrorReport['category'] = 'unknown',
  severity?: ErrorReport['severity']
) {
  globalErrorHandler.reportError(error, category, severity);
}

export function initializeErrorHandling() {
  globalErrorHandler.initialize();
}

// React hook for error reporting
export function useErrorReporting() {
  return {
    reportError: globalErrorHandler.reportError.bind(globalErrorHandler),
    getErrorStats: globalErrorHandler.getErrorStats.bind(globalErrorHandler),
    clearErrors: globalErrorHandler.clearErrorQueue.bind(globalErrorHandler),
  };
}

// Higher-order function for wrapping async functions with error handling
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  category: ErrorReport['category'] = 'unknown'
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      globalErrorHandler.reportError(
        error instanceof Error ? error : new Error(String(error)),
        category
      );
      throw error;
    }
  }) as T;
}

// Decorator for class methods
export function HandleErrors(category: ErrorReport['category'] = 'unknown') {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      try {
        const result = originalMethod.apply(this, args);
        
        // Handle promises
        if (result && typeof result.then === 'function') {
          return result.catch((error: any) => {
            globalErrorHandler.reportError(
              error instanceof Error ? error : new Error(String(error)),
              category
            );
            throw error;
          });
        }
        
        return result;
      } catch (error) {
        globalErrorHandler.reportError(
          error instanceof Error ? error : new Error(String(error)),
          category
        );
        throw error;
      }
    };

    return descriptor;
  };
}
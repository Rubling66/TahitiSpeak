import { logger } from '@/services/LoggingService';
import { performanceMonitoring } from '@/services/PerformanceMonitoringService';
import { toast } from 'sonner';
import { notificationService, ErrorNotificationOptions } from '../services/NotificationService';

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
  retryCount?: number;
  maxRetries?: number;
  userNotified?: boolean;
  recoverable?: boolean;
}

class GlobalErrorHandler {
  private isInitialized = false;
  private errorQueue: ErrorReport[] = [];
  private maxQueueSize = 100;
  private retryQueue: Map<string, ErrorReport> = new Map();
  private notificationCooldown: Map<string, number> = new Map();
  private readonly NOTIFICATION_COOLDOWN_MS = 5000; // 5 seconds
  private readonly DEFAULT_MAX_RETRIES = 3;

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
    } catch (_e) {
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
    // Set default values
    report.retryCount = report.retryCount || 0;
    report.maxRetries = report.maxRetries || this.getMaxRetries(report.category);
    report.recoverable = this.isRecoverable(report);
    
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
        retryCount: report.retryCount,
        recoverable: report.recoverable,
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
        retryCount: report.retryCount,
        recoverable: report.recoverable,
      },
    });

    // Handle user notifications
    this.handleUserNotification(report);
    
    // Handle retry logic for recoverable errors
    if (report.recoverable && report.retryCount < report.maxRetries) {
      this.scheduleRetry(report);
    }

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

  private getMaxRetries(category: ErrorReport['category']): number {
    switch (category) {
      case 'network':
      case 'api':
        return 3;
      case 'auth':
        return 1;
      case 'data':
        return 2;
      default:
        return 0; // No retries for other categories
    }
  }

  private isRecoverable(report: ErrorReport): boolean {
    const { category, error } = report;
    const message = error.message.toLowerCase();

    // Network errors are usually recoverable
    if (category === 'network') {
      return !message.includes('cors') && !message.includes('blocked');
    }

    // API errors might be recoverable
    if (category === 'api') {
      return message.includes('timeout') || 
             message.includes('500') || 
             message.includes('502') || 
             message.includes('503') || 
             message.includes('504');
    }

    // Auth errors are recoverable if token-related
    if (category === 'auth') {
      return message.includes('token') && !message.includes('invalid');
    }

    // Data parsing errors might be recoverable
    if (category === 'data') {
      return message.includes('timeout') || message.includes('connection');
    }

    return false;
  }

  private handleUserNotification(report: ErrorReport): void {
    if (typeof window === 'undefined' || report.userNotified) {
      return;
    }

    const notificationKey = `${report.category}_${report.severity}`;
    const now = Date.now();
    const lastNotification = this.notificationCooldown.get(notificationKey) || 0;

    // Check cooldown to prevent spam
    if (now - lastNotification < this.NOTIFICATION_COOLDOWN_MS) {
      return;
    }

    const userMessage = this.getUserFriendlyMessage(report);
    
    // Use NotificationService for better categorized notifications
    const options: ErrorNotificationOptions = {
      title: this.getCategoryTitle(report.category),
      description: userMessage.description,
      category: report.category as 'network' | 'api' | 'auth' | 'data' | 'ui' | 'javascript' | 'unknown',
      severity: report.severity,
      errorId: report.context.errorId,
      retryAction: userMessage.action ? () => {
        userMessage.action!.onClick();
        // Dispatch retry event
        window.dispatchEvent(new CustomEvent('error-retry', {
          detail: { errorId: report.context.errorId, category: report.category }
        }));
      } : undefined,
      reportAction: () => {
        // Enhanced error reporting
        this.reportDetailedError(report);
      }
    };

    // Use appropriate notification method based on category
    switch (report.category) {
      case 'network':
        notificationService.networkError(undefined, options);
        break;
      case 'api':
        notificationService.apiError(undefined, options);
        break;
      case 'auth':
        notificationService.authError(undefined, options);
        break;
      case 'data':
        notificationService.validationError(userMessage.description, options);
        break;
      default:
        notificationService.error(userMessage.description, options);
    }

    report.userNotified = true;
    this.notificationCooldown.set(notificationKey, now);
  }

  private getCategoryTitle(category: string): string {
    const titles: Record<string, string> = {
      network: 'Connection Issue',
      api: 'Server Error',
      auth: 'Authentication Required',
      data: 'Data Error',
      ui: 'Display Issue',
      javascript: 'Application Error',
      unknown: 'Unexpected Error'
    };
    return titles[category] || 'Error';
  }

  private reportDetailedError(report: ErrorReport): void {
    // Create detailed error report for user feedback
    const errorReport = {
      id: report.context.errorId,
      timestamp: report.context.timestamp,
      category: report.category,
      severity: report.severity,
      message: report.error.message,
      stack: report.error.stack,
      context: report.context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      retryCount: report.retryCount
    };

    // Log detailed report
    logger.error('Detailed error report generated', errorReport);
    
    // Show success notification
    notificationService.success('Error report sent', {
      description: 'Thank you for helping us improve the application.',
      duration: 3000
    });
  }

  private getUserFriendlyMessage(report: ErrorReport): {
    title: string;
    description: string;
    action?: { label: string; onClick: () => void };
  } {
    const { category, severity, error } = report;

    switch (category) {
      case 'network':
        return {
          title: 'Connection Problem',
          description: 'Please check your internet connection and try again.',
          action: {
            label: 'Retry',
            onClick: () => this.retryError(report),
          },
        };
      case 'api':
        return {
          title: 'Service Unavailable',
          description: 'Our servers are experiencing issues. We\'re working to fix this.',
          action: report.recoverable ? {
            label: 'Retry',
            onClick: () => this.retryError(report),
          } : undefined,
        };
      case 'auth':
        return {
          title: 'Authentication Error',
          description: 'Please sign in again to continue.',
          action: {
            label: 'Sign In',
            onClick: () => window.location.href = '/login',
          },
        };
      case 'data':
        return {
          title: 'Data Loading Error',
          description: 'Failed to load some content. Please refresh the page.',
          action: {
            label: 'Refresh',
            onClick: () => window.location.reload(),
          },
        };
      default:
        if (severity === 'critical') {
          return {
            title: 'Critical Error',
            description: 'Something went wrong. Please refresh the page or contact support.',
            action: {
              label: 'Refresh',
              onClick: () => window.location.reload(),
            },
          };
        }
        return {
          title: 'Something went wrong',
          description: 'An unexpected error occurred. Please try again.',
        };
    }
  }

  private scheduleRetry(report: ErrorReport): void {
    const retryDelay = this.getRetryDelay(report.retryCount || 0);
    const retryKey = report.context.errorId;

    this.retryQueue.set(retryKey, report);

    setTimeout(() => {
      const queuedReport = this.retryQueue.get(retryKey);
      if (queuedReport) {
        this.retryError(queuedReport);
        this.retryQueue.delete(retryKey);
      }
    }, retryDelay);
  }

  private getRetryDelay(retryCount: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s...
    return Math.min(1000 * Math.pow(2, retryCount), 30000);
  }

  private retryError(report: ErrorReport): void {
    if (!report.recoverable || (report.retryCount || 0) >= (report.maxRetries || 0)) {
      return;
    }

    report.retryCount = (report.retryCount || 0) + 1;
    
    // For network/API errors, we can't automatically retry the original request
    // This would need to be handled by the calling code
    // For now, we just log the retry attempt
    logger.info(`Retrying error ${report.context.errorId} (attempt ${report.retryCount})`, {
      errorId: report.context.errorId,
      category: report.category,
      retryCount: report.retryCount,
    });

    // Emit a custom event that components can listen to for retry logic
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('error-retry', {
        detail: {
          errorId: report.context.errorId,
          category: report.category,
          retryCount: report.retryCount,
        },
      }));
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

  public retryErrorById(errorId: string): boolean {
    const report = this.errorQueue.find(r => r.context.errorId === errorId);
    if (report && report.recoverable) {
      this.retryError(report);
      return true;
    }
    return false;
  }

  public clearRetryQueue(): void {
    this.retryQueue.clear();
  }

  public getRetryQueueSize(): number {
    return this.retryQueue.size;
  }

  public setMaxRetries(category: ErrorReport['category'], maxRetries: number): void {
    // This could be extended to store custom retry limits per category
    // For now, we'll just log the configuration
    logger.info(`Setting max retries for ${category} to ${maxRetries}`);
  }

  public enableUserNotifications(enabled: boolean = true): void {
    // This could be used to globally enable/disable user notifications
    // For now, we'll just log the setting
    logger.info(`User notifications ${enabled ? 'enabled' : 'disabled'}`);
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
export function withErrorHandling<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  category: ErrorReport['category'] = 'unknown'
): T {
  return (async (...args: unknown[]) => {
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
  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: unknown[]) {
      try {
        const result = originalMethod.apply(this, args);
        
        // Handle promises
        if (result && typeof result.then === 'function') {
          return result.catch((error: unknown) => {
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
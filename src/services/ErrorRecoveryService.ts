import { notificationService } from './NotificationService';
import { logger } from './LoggingService';
import { reportError } from '../utils/errorHandler';

export interface RecoveryStrategy {
  id: string;
  name: string;
  priority: number;
  canRecover: (error: Error, context?: RecoveryContext) => boolean;
  recover: (error: Error, context?: RecoveryContext) => Promise<unknown>;
  fallback?: () => Promise<unknown>;
}

export interface RecoveryContext {
  component?: string;
  action?: string;
  retryCount?: number;
  maxRetries?: number;
  metadata?: Record<string, unknown>;
  originalData?: Record<string, unknown>;
  timestamp?: number;
}

export interface FallbackData {
  [key: string]: unknown;
}

export class ErrorRecoveryService {
  private static instance: ErrorRecoveryService;
  private strategies: Map<string, RecoveryStrategy> = new Map();
  private fallbackCache: Map<string, FallbackData> = new Map();
  private recoveryHistory: Array<{
    errorId: string;
    strategy: string;
    success: boolean;
    timestamp: Date;
    context?: RecoveryContext;
  }> = [];
  private maxHistorySize = 100;

  static getInstance(): ErrorRecoveryService {
    if (!ErrorRecoveryService.instance) {
      ErrorRecoveryService.instance = new ErrorRecoveryService();
      ErrorRecoveryService.instance.initializeDefaultStrategies();
    }
    return ErrorRecoveryService.instance;
  }

  private initializeDefaultStrategies(): void {
    // Network retry strategy
    this.registerStrategy({
      id: 'network-retry',
      name: 'Network Retry',
      priority: 1,
      canRecover: (error) => {
        return error.name === 'NetworkError' || 
               error.message.includes('fetch') ||
               error.message.includes('network') ||
               error.message.includes('timeout');
      },
      recover: async (error, context) => {
        const retryCount = context?.retryCount || 0;
        const maxRetries = context?.maxRetries || 3;
        
        if (retryCount >= maxRetries) {
          throw new Error('Max retries exceeded');
        }

        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
        await this.delay(delay);

        // Retry the original operation
        if (context?.originalData?.retryFunction) {
          return await context.originalData.retryFunction();
        }
        
        throw error;
      }
    });

    // API fallback strategy
    this.registerStrategy({
      id: 'api-fallback',
      name: 'API Fallback',
      priority: 2,
      canRecover: (error) => {
        return error.message.includes('API') || 
               error.message.includes('server') ||
               error.message.includes('500') ||
               error.message.includes('503');
      },
      recover: async (error, context) => {
        // Try to get cached data first
        const cacheKey = context?.metadata?.cacheKey;
        if (cacheKey && this.fallbackCache.has(cacheKey)) {
          const cachedData = this.fallbackCache.get(cacheKey);
          notificationService.warning('Using cached data', {
            description: 'Server is temporarily unavailable. Showing cached content.',
            duration: 5000
          });
          return cachedData;
        }

        // Try alternative API endpoint
        if (context?.originalData?.fallbackEndpoint) {
          try {
            const response = await fetch(context.originalData.fallbackEndpoint);
            if (response.ok) {
              const data = await response.json();
              notificationService.info('Using backup server', {
                description: 'Connected to backup server successfully.',
                duration: 3000
              });
              return data;
            }
          } catch (fallbackError) {
            logger.warn('Fallback endpoint also failed', { fallbackError });
          }
        }

        throw error;
      },
      fallback: async () => {
        return {
          message: 'Service temporarily unavailable',
          data: [],
          cached: true
        };
      }
    });

    // Authentication recovery strategy
    this.registerStrategy({
      id: 'auth-recovery',
      name: 'Authentication Recovery',
      priority: 3,
      canRecover: (error) => {
        return error.message.includes('401') ||
               error.message.includes('unauthorized') ||
               error.message.includes('token');
      },
      recover: async (error, context) => {
        try {
          // Try to refresh token
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            const response = await fetch('/api/auth/refresh', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken })
            });

            if (response.ok) {
              const { accessToken } = await response.json();
              localStorage.setItem('accessToken', accessToken);
              
              // Retry original request with new token
              if (context?.originalData?.retryWithNewToken) {
                return await context.originalData.retryWithNewToken(accessToken);
              }
            }
          }
        } catch (refreshError) {
          logger.error('Token refresh failed', { refreshError });
        }

        // Redirect to login
        notificationService.authError('Please log in again', {
          description: 'Your session has expired.',
          action: {
            label: 'Login',
            onClick: () => {
              window.location.href = '/login';
            }
          }
        });
        
        throw error;
      }
    });

    // Data validation recovery
    this.registerStrategy({
      id: 'data-validation',
      name: 'Data Validation Recovery',
      priority: 4,
      canRecover: (error) => {
        return error.message.includes('validation') ||
               error.message.includes('invalid') ||
               error.message.includes('required');
      },
      recover: async (error, context) => {
        // Try to sanitize and fix data
        if (context?.originalData?.data) {
          const sanitizedData = this.sanitizeData(context.originalData.data);
          
          if (context.originalData.retryWithData) {
            return await context.originalData.retryWithData(sanitizedData);
          }
        }

        // Show user-friendly validation error
        notificationService.validationError(error.message, {
          description: 'Please check your input and try again.',
          duration: 6000
        });
        
        throw error;
      }
    });

    // Generic graceful degradation
    this.registerStrategy({
      id: 'graceful-degradation',
      name: 'Graceful Degradation',
      priority: 10, // Lowest priority - last resort
      canRecover: () => true, // Can handle any error
      recover: async (error, context) => {
        // Log the error for debugging
        reportError(error, {
          component: context?.component || 'ErrorRecoveryService',
          action: 'graceful_degradation',
          metadata: context?.metadata
        });

        // Return minimal fallback data
        return {
          error: true,
          message: 'Something went wrong, but the application is still working.',
          fallback: true,
          timestamp: new Date().toISOString()
        };
      }
    });
  }

  registerStrategy(strategy: RecoveryStrategy): void {
    this.strategies.set(strategy.id, strategy);
  }

  unregisterStrategy(strategyId: string): void {
    this.strategies.delete(strategyId);
  }

  async attemptRecovery(error: Error, context?: RecoveryContext): Promise<unknown> {
    const errorId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Sort strategies by priority
    const sortedStrategies = Array.from(this.strategies.values())
      .sort((a, b) => a.priority - b.priority);

    for (const strategy of sortedStrategies) {
      if (strategy.canRecover(error, context)) {
        try {
          logger.info(`Attempting recovery with strategy: ${strategy.name}`, {
            errorId,
            strategy: strategy.id,
            error: error.message
          });

          const result = await strategy.recover(error, context);
          
          // Record successful recovery
          this.recordRecovery(errorId, strategy.id, true, context);
          
          notificationService.success('Issue resolved', {
            description: `Recovered using ${strategy.name}`,
            duration: 3000
          });

          return result;
        } catch (recoveryError) {
          logger.warn(`Recovery strategy ${strategy.name} failed`, {
            errorId,
            strategy: strategy.id,
            recoveryError: recoveryError instanceof Error ? recoveryError.message : recoveryError
          });

          // Record failed recovery attempt
          this.recordRecovery(errorId, strategy.id, false, context);
          
          // Try fallback if available
          if (strategy.fallback) {
            try {
              const fallbackResult = await strategy.fallback();
              notificationService.warning('Using fallback data', {
                description: 'Primary recovery failed, using backup data.',
                duration: 4000
              });
              return fallbackResult;
            } catch (fallbackError) {
              logger.error('Fallback also failed', { fallbackError });
            }
          }
        }
      }
    }

    // If all strategies failed, throw the original error
    this.recordRecovery(errorId, 'none', false, context);
    throw error;
  }

  setCachedFallback(key: string, data: FallbackData): void {
    this.fallbackCache.set(key, {
      ...data,
      cached: true,
      timestamp: Date.now()
    });
  }

  getCachedFallback(key: string): FallbackData | null {
    const cached = this.fallbackCache.get(key);
    if (!cached) return null;

    // Check if cache is still valid (24 hours)
    const maxAge = 24 * 60 * 60 * 1000;
    if (Date.now() - cached.timestamp > maxAge) {
      this.fallbackCache.delete(key);
      return null;
    }

    return cached;
  }

  clearCache(): void {
    this.fallbackCache.clear();
  }

  getRecoveryHistory(): typeof this.recoveryHistory {
    return [...this.recoveryHistory];
  }

  getRecoveryStats(): {
    totalAttempts: number;
    successfulRecoveries: number;
    failedRecoveries: number;
    successRate: number;
    strategiesUsed: Record<string, number>;
  } {
    const totalAttempts = this.recoveryHistory.length;
    const successfulRecoveries = this.recoveryHistory.filter(r => r.success).length;
    const failedRecoveries = totalAttempts - successfulRecoveries;
    const successRate = totalAttempts > 0 ? (successfulRecoveries / totalAttempts) * 100 : 0;
    
    const strategiesUsed: Record<string, number> = {};
    this.recoveryHistory.forEach(record => {
      strategiesUsed[record.strategy] = (strategiesUsed[record.strategy] || 0) + 1;
    });

    return {
      totalAttempts,
      successfulRecoveries,
      failedRecoveries,
      successRate,
      strategiesUsed
    };
  }

  private recordRecovery(
    errorId: string,
    strategy: string,
    success: boolean,
    context?: RecoveryContext
  ): void {
    this.recoveryHistory.unshift({
      errorId,
      strategy,
      success,
      timestamp: new Date(),
      context
    });

    // Keep history size manageable
    if (this.recoveryHistory.length > this.maxHistorySize) {
      this.recoveryHistory = this.recoveryHistory.slice(0, this.maxHistorySize);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private sanitizeData(data: unknown): unknown {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sanitized: Record<string, unknown> | unknown[] = Array.isArray(data) ? [] : {};
    
    for (const [key, value] of Object.entries(data)) {
      if (value === null || value === undefined) {
        continue; // Skip null/undefined values
      }
      
      if (typeof value === 'string') {
        // Basic string sanitization
        sanitized[key] = value.trim();
      } else if (typeof value === 'object') {
        sanitized[key] = this.sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}

// Export singleton instance
export const errorRecoveryService = ErrorRecoveryService.getInstance();

// Convenience function for easy recovery attempts
export const recoverFromError = async (error: Error, context?: RecoveryContext): Promise<unknown> => {
  return errorRecoveryService.attemptRecovery(error, context);
};

// Higher-order function to wrap functions with automatic error recovery
export function withErrorRecovery<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  context?: Omit<RecoveryContext, 'retryCount'>
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof Error) {
        return await errorRecoveryService.attemptRecovery(error, {
          ...context,
          originalData: {
            retryFunction: () => fn(...args)
          }
        });
      }
      throw error;
    }
  }) as T;
}

// React hook for error recovery
export function useErrorRecovery() {
  const recover = async (error: Error, context?: RecoveryContext) => {
    return errorRecoveryService.attemptRecovery(error, context);
  };

  const setCachedFallback = (key: string, data: FallbackData) => {
    errorRecoveryService.setCachedFallback(key, data);
  };

  const getCachedFallback = (key: string) => {
    return errorRecoveryService.getCachedFallback(key);
  };

  const getStats = () => {
    return errorRecoveryService.getRecoveryStats();
  };

  return {
    recover,
    setCachedFallback,
    getCachedFallback,
    getStats,
    withRecovery: withErrorRecovery
  };
}
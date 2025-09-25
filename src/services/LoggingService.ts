import { performanceMonitoring } from './PerformanceMonitoringService';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  category?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
  stack?: string;
  userAgent?: string;
  url?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  enableLocalStorage: boolean;
  maxLocalEntries: number;
  remoteEndpoint?: string;
  apiKey?: string;
  batchSize: number;
  flushInterval: number;
}

class LoggingService {
  private config: LoggerConfig;
  private logBuffer: LogEntry[] = [];
  private sessionId: string;
  private flushTimer?: NodeJS.Timeout;
  private readonly logLevels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    fatal: 4,
  };

  constructor() {
    this.sessionId = this.generateSessionId();
    this.config = this.getDefaultConfig();
    this.initializeLogger();
  }

  private getDefaultConfig(): LoggerConfig {
    return {
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
      enableConsole: process.env.NODE_ENV === 'development',
      enableRemote: process.env.NODE_ENV === 'production',
      enableLocalStorage: typeof window !== 'undefined',
      maxLocalEntries: 1000,
      remoteEndpoint: process.env.NEXT_PUBLIC_LOG_ENDPOINT,
      apiKey: process.env.NEXT_PUBLIC_LOG_API_KEY,
      batchSize: 10,
      flushInterval: 30000, // 30 seconds
    };
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeLogger() {
    // Set up periodic flushing
    if (this.config.enableRemote && this.config.flushInterval > 0) {
      this.flushTimer = setInterval(() => {
        this.flush();
      }, this.config.flushInterval);
    }

    // Handle page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flush(true);
      });

      // Handle visibility change (tab switching)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.flush();
        }
      });
    }
  }

  public configure(config: Partial<LoggerConfig>) {
    this.config = { ...this.config, ...config };
    
    // Restart flush timer if interval changed
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    if (this.config.enableRemote && this.config.flushInterval > 0) {
      this.flushTimer = setInterval(() => {
        this.flush();
      }, this.config.flushInterval);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return this.logLevels[level] >= this.logLevels[this.config.level];
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    metadata?: Record<string, any>,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      sessionId: this.sessionId,
      metadata,
    };

    // Add error stack if provided
    if (error) {
      entry.stack = error.stack;
    }

    // Add browser context if available
    if (typeof window !== 'undefined') {
      entry.userAgent = navigator.userAgent;
      entry.url = window.location.href;
    }

    // Add user context if available
    try {
      const userContext = this.getUserContext();
      if (userContext.userId) {
        entry.userId = userContext.userId;
      }
      if (userContext.requestId) {
        entry.requestId = userContext.requestId;
      }
    } catch (e) {
      // Ignore errors getting user context
    }

    return entry;
  }

  private getUserContext(): { userId?: string; requestId?: string } {
    // Try to get user context from various sources
    const context: { userId?: string; requestId?: string } = {};

    // Check localStorage for user info
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const userInfo = localStorage.getItem('user');
        if (userInfo) {
          const user = JSON.parse(userInfo);
          context.userId = user.id || user.userId;
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }

    // Check for request ID in headers or metadata
    if (typeof window !== 'undefined') {
      const requestId = (window as any).__REQUEST_ID__;
      if (requestId) {
        context.requestId = requestId;
      }
    }

    return context;
  }

  private processLog(entry: LogEntry) {
    // Console logging
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    // Local storage
    if (this.config.enableLocalStorage) {
      this.logToLocalStorage(entry);
    }

    // Buffer for remote logging
    if (this.config.enableRemote) {
      this.logBuffer.push(entry);
      
      // Flush if buffer is full
      if (this.logBuffer.length >= this.config.batchSize) {
        this.flush();
      }
    }

    // Send to performance monitoring for errors
    if (entry.level === 'error' || entry.level === 'fatal') {
      performanceMonitoring.logError({
        message: entry.message,
        stack: entry.stack,
        level: entry.level,
        metadata: {
          ...entry.metadata,
          sessionId: entry.sessionId,
          userId: entry.userId,
          url: entry.url,
        },
      });
    }
  }

  private logToConsole(entry: LogEntry) {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}]`;
    
    const style = this.getConsoleStyle(entry.level);
    const message = `${prefix} ${entry.message}`;
    
    switch (entry.level) {
      case 'debug':
        console.debug(`%c${message}`, style, entry.metadata);
        break;
      case 'info':
        console.info(`%c${message}`, style, entry.metadata);
        break;
      case 'warn':
        console.warn(`%c${message}`, style, entry.metadata);
        break;
      case 'error':
      case 'fatal':
        console.error(`%c${message}`, style, entry.metadata);
        if (entry.stack) {
          console.error(entry.stack);
        }
        break;
    }
  }

  private getConsoleStyle(level: LogLevel): string {
    const styles = {
      debug: 'color: #6B7280; font-weight: normal;',
      info: 'color: #3B82F6; font-weight: normal;',
      warn: 'color: #F59E0B; font-weight: bold;',
      error: 'color: #EF4444; font-weight: bold;',
      fatal: 'color: #DC2626; font-weight: bold; background: #FEE2E2;',
    };
    return styles[level];
  }

  private logToLocalStorage(entry: LogEntry) {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    try {
      const key = 'app_logs';
      const existingLogs = localStorage.getItem(key);
      let logs: LogEntry[] = existingLogs ? JSON.parse(existingLogs) : [];
      
      logs.push(entry);
      
      // Trim logs if exceeding max entries
      if (logs.length > this.config.maxLocalEntries) {
        logs = logs.slice(-this.config.maxLocalEntries);
      }
      
      localStorage.setItem(key, JSON.stringify(logs));
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  private async flush(immediate = false) {
    if (!this.config.enableRemote || this.logBuffer.length === 0) {
      return;
    }

    const logsToSend = [...this.logBuffer];
    this.logBuffer = [];

    try {
      await this.sendLogsToRemote(logsToSend, immediate);
    } catch (error) {
      // If sending fails, put logs back in buffer (up to a limit)
      if (this.logBuffer.length < this.config.maxLocalEntries) {
        this.logBuffer.unshift(...logsToSend.slice(0, this.config.maxLocalEntries - this.logBuffer.length));
      }
      
      // Log the error locally
      this.error('Failed to send logs to remote endpoint', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  private async sendLogsToRemote(logs: LogEntry[], immediate = false) {
    if (!this.config.remoteEndpoint) {
      return;
    }

    const payload = {
      logs,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
    };

    const options: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
      },
      body: JSON.stringify(payload),
    };

    // Use sendBeacon for immediate sends (page unload)
    if (immediate && typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon(this.config.remoteEndpoint, blob);
    } else {
      await fetch(this.config.remoteEndpoint, options);
    }
  }

  // Public logging methods
  public debug(message: string, metadata?: Record<string, any>) {
    if (!this.shouldLog('debug')) return;
    const entry = this.createLogEntry('debug', message, metadata);
    this.processLog(entry);
  }

  public info(message: string, metadata?: Record<string, any>) {
    if (!this.shouldLog('info')) return;
    const entry = this.createLogEntry('info', message, metadata);
    this.processLog(entry);
  }

  public warn(message: string, metadata?: Record<string, any>) {
    if (!this.shouldLog('warn')) return;
    const entry = this.createLogEntry('warn', message, metadata);
    this.processLog(entry);
  }

  public error(message: string, metadata?: Record<string, any>, error?: Error) {
    if (!this.shouldLog('error')) return;
    const entry = this.createLogEntry('error', message, metadata, error);
    this.processLog(entry);
  }

  public fatal(message: string, metadata?: Record<string, any>, error?: Error) {
    if (!this.shouldLog('fatal')) return;
    const entry = this.createLogEntry('fatal', message, metadata, error);
    this.processLog(entry);
    
    // Immediately flush fatal errors
    this.flush(true);
  }

  // Utility methods
  public getSessionId(): string {
    return this.sessionId;
  }

  public getLogs(): LogEntry[] {
    if (typeof window === 'undefined' || !window.localStorage) {
      return [];
    }

    try {
      const logs = localStorage.getItem('app_logs');
      return logs ? JSON.parse(logs) : [];
    } catch (e) {
      return [];
    }
  }

  public clearLogs() {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('app_logs');
    }
    this.logBuffer = [];
  }

  public destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush(true);
  }
}

// Create singleton instance
export const logger = new LoggingService();

// React hook for logging
export function useLogger() {
  return {
    debug: logger.debug.bind(logger),
    info: logger.info.bind(logger),
    warn: logger.warn.bind(logger),
    error: logger.error.bind(logger),
    fatal: logger.fatal.bind(logger),
    getSessionId: logger.getSessionId.bind(logger),
  };
}

// Higher-order function for API logging
export function withLogging<T extends (...args: any[]) => any>(
  fn: T,
  category: string
): T {
  return ((...args: any[]) => {
    const start = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    logger.debug(`${category} started`, {
      requestId,
      args: args.length > 0 ? args : undefined,
    });
    
    try {
      const result = fn(...args);
      
      // Handle promises
      if (result && typeof result.then === 'function') {
        return result
          .then((data: any) => {
            const duration = Date.now() - start;
            logger.info(`${category} completed`, {
              requestId,
              duration,
              success: true,
            });
            return data;
          })
          .catch((error: any) => {
            const duration = Date.now() - start;
            logger.error(`${category} failed`, {
              requestId,
              duration,
              success: false,
            }, error);
            throw error;
          });
      }
      
      // Handle synchronous results
      const duration = Date.now() - start;
      logger.info(`${category} completed`, {
        requestId,
        duration,
        success: true,
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error(`${category} failed`, {
        requestId,
        duration,
        success: false,
      }, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }) as T;
}
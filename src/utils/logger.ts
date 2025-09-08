/**
 * Simple logger utility for the application
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: Date;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private log(level: LogLevel, message: string, data?: any): void {
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date(),
    };

    // In development, log to console
    if (this.isDevelopment) {
      const logMethod = console[level] || console.log;
      if (data) {
        logMethod(`[${level.toUpperCase()}] ${message}`, data);
      } else {
        logMethod(`[${level.toUpperCase()}] ${message}`);
      }
    }

    // In production, you might want to send logs to a service
    // This is where you'd integrate with services like LogRocket, Sentry, etc.
  }

  debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: any): void {
    this.log('error', message, data);
  }
}

export const logger = new Logger();
export default logger;
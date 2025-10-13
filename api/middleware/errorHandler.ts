import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Error types and classifications
export enum ErrorType {
  VALIDATION_ERROR = 'validation_error',
  AUTHENTICATION_ERROR = 'authentication_error',
  AUTHORIZATION_ERROR = 'authorization_error',
  NOT_FOUND_ERROR = 'not_found_error',
  RATE_LIMIT_ERROR = 'rate_limit_error',
  DATABASE_ERROR = 'database_error',
  EXTERNAL_API_ERROR = 'external_api_error',
  INTERNAL_SERVER_ERROR = 'internal_server_error',
  NETWORK_ERROR = 'network_error',
  TIMEOUT_ERROR = 'timeout_error',
  PAYMENT_ERROR = 'payment_error',
  FILE_UPLOAD_ERROR = 'file_upload_error'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Custom error classes
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: any;
  public readonly timestamp: Date;

  constructor(
    message: string,
    type: ErrorType = ErrorType.INTERNAL_SERVER_ERROR,
    statusCode: number = 500,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    isOperational: boolean = true,
    context?: any
  ) {
    super(message);
    
    this.type = type;
    this.severity = severity;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;
    this.timestamp = new Date();
    
    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error classes
export class ValidationError extends AppError {
  constructor(message: string, context?: any) {
    super(message, ErrorType.VALIDATION_ERROR, 400, ErrorSeverity.LOW, true, context);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', context?: any) {
    super(message, ErrorType.AUTHENTICATION_ERROR, 401, ErrorSeverity.MEDIUM, true, context);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions', context?: any) {
    super(message, ErrorType.AUTHORIZATION_ERROR, 403, ErrorSeverity.MEDIUM, true, context);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', context?: any) {
    super(message, ErrorType.NOT_FOUND_ERROR, 404, ErrorSeverity.LOW, true, context);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', context?: any) {
    super(message, ErrorType.RATE_LIMIT_ERROR, 429, ErrorSeverity.MEDIUM, true, context);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, context?: any) {
    super(message, ErrorType.DATABASE_ERROR, 500, ErrorSeverity.HIGH, true, context);
  }
}

export class ExternalAPIError extends AppError {
  constructor(message: string, context?: any) {
    super(message, ErrorType.EXTERNAL_API_ERROR, 502, ErrorSeverity.MEDIUM, true, context);
  }
}

export class PaymentError extends AppError {
  constructor(message: string, context?: any) {
    super(message, ErrorType.PAYMENT_ERROR, 402, ErrorSeverity.HIGH, true, context);
  }
}

// Error logging and monitoring
class ErrorLogger {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  // Log error to database
  async logError(
    error: Error | AppError,
    request: NextRequest,
    userId?: string,
    additionalContext?: any
  ): Promise<void> {
    try {
      const errorData = {
        message: error.message,
        stack: error.stack,
        type: error instanceof AppError ? error.type : ErrorType.INTERNAL_SERVER_ERROR,
        severity: error instanceof AppError ? error.severity : ErrorSeverity.MEDIUM,
        status_code: error instanceof AppError ? error.statusCode : 500,
        user_id: userId,
        endpoint: request.nextUrl.pathname,
        method: request.method,
        url: request.url,
        user_agent: request.headers.get('user-agent'),
        ip_address: this.getClientIP(request),
        timestamp: new Date().toISOString(),
        context: {
          ...(error instanceof AppError ? error.context : {}),
          ...additionalContext
        }
      };

      await this.supabase
        .from('error_logs')
        .insert(errorData);

      // Log to console for development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error logged:', errorData);
      }
    } catch (loggingError) {
      console.error('Failed to log error to database:', loggingError);
      console.error('Original error:', error);
    }
  }

  // Log performance metrics
  async logPerformanceMetric(
    endpoint: string,
    method: string,
    duration: number,
    statusCode: number,
    userId?: string
  ): Promise<void> {
    try {
      await this.supabase
        .from('performance_metrics')
        .insert({
          endpoint,
          method,
          duration_ms: duration,
          status_code: statusCode,
          user_id: userId,
          timestamp: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log performance metric:', error);
    }
  }

  // Get client IP address
  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    return forwarded ? forwarded.split(',')[0] : 
           request.headers.get('x-real-ip') || 
           'unknown';
  }

  // Send alert for critical errors
  async sendCriticalErrorAlert(error: AppError, request: NextRequest): Promise<void> {
    if (error.severity === ErrorSeverity.CRITICAL) {
      try {
        // In a real implementation, you'd send alerts via email, Slack, etc.
        console.error('CRITICAL ERROR ALERT:', {
          message: error.message,
          endpoint: request.nextUrl.pathname,
          timestamp: error.timestamp,
          context: error.context
        });

        // You could integrate with services like:
        // - SendGrid for email alerts
        // - Slack webhooks
        // - PagerDuty
        // - Discord webhooks
        // - SMS services
      } catch (alertError) {
        console.error('Failed to send critical error alert:', alertError);
      }
    }
  }
}

// Singleton error logger
const errorLogger = new ErrorLogger();

// Error response formatter
function formatErrorResponse(error: Error | AppError, includeStack: boolean = false): any {
  const isAppError = error instanceof AppError;
  
  const response: any = {
    error: true,
    message: error.message,
    type: isAppError ? error.type : ErrorType.INTERNAL_SERVER_ERROR,
    timestamp: isAppError ? error.timestamp : new Date(),
  };

  // Include additional context for operational errors
  if (isAppError && error.isOperational && error.context) {
    response.context = error.context;
  }

  // Include stack trace in development
  if (includeStack && process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  return response;
}

// Main error handler middleware
export function createErrorHandler(options: {
  logErrors?: boolean;
  includeStackTrace?: boolean;
  sendAlerts?: boolean;
} = {}) {
  const {
    logErrors = true,
    includeStackTrace = process.env.NODE_ENV === 'development',
    sendAlerts = process.env.NODE_ENV === 'production'
  } = options;

  return async function errorHandler(
    error: Error | AppError,
    request: NextRequest,
    userId?: string,
    additionalContext?: any
  ): Promise<NextResponse> {
    try {
      // Log error if enabled
      if (logErrors) {
        await errorLogger.logError(error, request, userId, additionalContext);
      }

      // Send alerts for critical errors
      if (sendAlerts && error instanceof AppError) {
        await errorLogger.sendCriticalErrorAlert(error, request);
      }

      // Determine status code
      const statusCode = error instanceof AppError ? error.statusCode : 500;

      // Format error response
      const errorResponse = formatErrorResponse(error, includeStackTrace);

      // Add correlation ID for tracking
      const correlationId = crypto.randomUUID();
      errorResponse.correlationId = correlationId;

      return NextResponse.json(errorResponse, { 
        status: statusCode,
        headers: {
          'X-Correlation-ID': correlationId,
          'X-Error-Type': error instanceof AppError ? error.type : ErrorType.INTERNAL_SERVER_ERROR
        }
      });
    } catch (handlerError) {
      console.error('Error in error handler:', handlerError);
      
      // Fallback error response
      return NextResponse.json(
        {
          error: true,
          message: 'An unexpected error occurred',
          type: ErrorType.INTERNAL_SERVER_ERROR,
          timestamp: new Date(),
          correlationId: crypto.randomUUID()
        },
        { status: 500 }
      );
    }
  };
}

// Default error handler
export const defaultErrorHandler = createErrorHandler();

// Async error wrapper for API routes
export function withErrorHandling(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>,
  errorHandler: (error: Error | AppError, req: NextRequest, userId?: string, context?: any) => Promise<NextResponse> = defaultErrorHandler
) {
  return async function (req: NextRequest, context?: any): Promise<NextResponse> {
    const startTime = Date.now();
    let response: NextResponse;
    let userId: string | undefined;

    try {
      // Extract user ID from context if available
      if (context?.authContext?.user?.id) {
        userId = context.authContext.user.id;
      }

      // Execute the handler
      response = await handler(req, context);
      
      // Log performance metrics
      const duration = Date.now() - startTime;
      await errorLogger.logPerformanceMetric(
        req.nextUrl.pathname,
        req.method,
        duration,
        response.status,
        userId
      );

      return response;
    } catch (error) {
      console.error('Handler error:', error);
      
      // Log performance metrics for failed requests
      const duration = Date.now() - startTime;
      const statusCode = error instanceof AppError ? error.statusCode : 500;
      
      await errorLogger.logPerformanceMetric(
        req.nextUrl.pathname,
        req.method,
        duration,
        statusCode,
        userId
      );

      // Handle the error
      return errorHandler(error as Error | AppError, req, userId, context);
    }
  };
}

// Validation helper
export function validateRequired(data: any, fields: string[]): void {
  const missing = fields.filter(field => {
    const value = data[field];
    return value === undefined || value === null || value === '';
  });

  if (missing.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missing.join(', ')}`,
      { missingFields: missing, providedData: Object.keys(data) }
    );
  }
}

// Email validation
export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format', { email });
  }
}

// Password validation
export function validatePassword(password: string): void {
  if (password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters long');
  }
  
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    throw new ValidationError(
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    );
  }
}

// Database error handler
export function handleDatabaseError(error: any): never {
  console.error('Database error:', error);
  
  if (error.code === '23505') { // Unique constraint violation
    throw new ValidationError('Resource already exists', { dbError: error.code });
  }
  
  if (error.code === '23503') { // Foreign key constraint violation
    throw new ValidationError('Referenced resource does not exist', { dbError: error.code });
  }
  
  if (error.code === '42P01') { // Table does not exist
    throw new DatabaseError('Database schema error', { dbError: error.code });
  }
  
  throw new DatabaseError('Database operation failed', { originalError: error.message });
}

// Async operation timeout wrapper
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new AppError(errorMessage, ErrorType.TIMEOUT_ERROR, 408, ErrorSeverity.MEDIUM));
      }, timeoutMs);
    })
  ]);
}

// Export error logger for direct use
export { errorLogger };

// Example usage in API routes:
/*
import { withErrorHandling, ValidationError, validateRequired } from '@/api/middleware/errorHandler';

export const POST = withErrorHandling(
  async function handler(request: NextRequest) {
    const body = await request.json();
    
    // Validate required fields
    validateRequired(body, ['email', 'password']);
    
    // Your API logic here
    return NextResponse.json({ message: 'Success' });
  }
);
*/
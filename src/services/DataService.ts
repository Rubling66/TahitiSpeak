// DataService.ts - Core data service for the application
import { reportError } from '../utils/errorHandler';
import { isMaintenanceMode } from '../utils/maintenance';

export interface DataServiceConfig {
  apiUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  enableRetry?: boolean;
  retryDelay?: number;
}

export interface RetryConfig {
  maxAttempts: number;
  delay: number;
  backoffMultiplier: number;
  retryCondition?: (error: Error, response?: Response) => boolean;
}

export interface RequestOptions {
  timeout?: number;
  retries?: number;
  skipErrorReporting?: boolean;
  abortSignal?: AbortSignal;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface QueryOptions {
  page?: number;
  limit?: number;
  sort?: string;
  filter?: Record<string, unknown>;
  search?: string;
}

export class DataService {
  private config: DataServiceConfig;
  private baseUrl: string;
  private defaultRetryConfig: RetryConfig;

  constructor(config: DataServiceConfig = {}) {
    this.config = {
      apiUrl: '/api',
      timeout: 10000,
      retryAttempts: 3,
      enableRetry: true,
      retryDelay: 1000,
      ...config
    };
    this.baseUrl = this.config.apiUrl!;
    this.defaultRetryConfig = {
      maxAttempts: this.config.retryAttempts!,
      delay: this.config.retryDelay!,
      backoffMultiplier: 2,
      retryCondition: this.shouldRetry.bind(this),
    };
  }

  private shouldRetry(error: Error, response?: Response): boolean {
    // Don't retry on client errors (4xx) except for specific cases
    if (response) {
      const status = response.status;
      if (status >= 400 && status < 500) {
        // Retry on 408 (timeout), 429 (rate limit), and 499 (client closed request)
        return status === 408 || status === 429 || status === 499;
      }
      // Retry on server errors (5xx)
      return status >= 500;
    }

    // Retry on network errors
    const message = error.message.toLowerCase();
    return message.includes('network') ||
           message.includes('timeout') ||
           message.includes('connection') ||
           message.includes('fetch');
  }

  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    retryConfig: Partial<RetryConfig> = {},
    context: string = 'API request'
  ): Promise<T> {
    const config = { ...this.defaultRetryConfig, ...retryConfig };
    let lastError: Error;
    let lastResponse: Response | undefined;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Check if we should retry
        if (attempt === config.maxAttempts || !config.retryCondition?.(lastError, lastResponse)) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = config.delay * Math.pow(config.backoffMultiplier, attempt - 1);
        
        // Report retry attempt
        reportError(new Error(`${context} failed, retrying (attempt ${attempt}/${config.maxAttempts})`), {
          component: 'DataService',
          action: 'retry',
          metadata: {
            attempt,
            maxAttempts: config.maxAttempts,
            delay,
            originalError: lastError.message,
          },
        }, 'api');

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  // Generic CRUD operations
  async get<T>(endpoint: string, options?: QueryOptions, requestOptions?: RequestOptions): Promise<ApiResponse<T>> {
    const context = `GET ${endpoint}`;
    
    try {
      if (isMaintenanceMode() && endpoint.startsWith('/')) {
        return { data: {} as T, success: false, error: 'Service unavailable (maintenance mode)' };
      }
      if (this.config.enableRetry && !requestOptions?.skipErrorReporting) {
        return await this.executeWithRetry(async () => {
          const url = this.buildUrl(endpoint, options);
          const response = await this.fetchWithTimeout(url, {
            method: 'GET',
            headers: this.getHeaders(),
            signal: requestOptions?.abortSignal,
          }, requestOptions?.timeout);
          
          return await this.handleResponse<T>(response, context);
        }, { maxAttempts: requestOptions?.retries || this.defaultRetryConfig.maxAttempts }, context);
      } else {
        const url = this.buildUrl(endpoint, options);
        const response = await this.fetchWithTimeout(url, {
          method: 'GET',
          headers: this.getHeaders(),
          signal: requestOptions?.abortSignal,
        }, requestOptions?.timeout);
        
        return await this.handleResponse<T>(response, context);
      }
    } catch (error) {
      return this.handleError<T>(error, context, requestOptions?.skipErrorReporting);
    }
  }

  async post<T>(endpoint: string, data: unknown, requestOptions?: RequestOptions): Promise<ApiResponse<T>> {
    const context = `POST ${endpoint}`;
    
    try {
      if (isMaintenanceMode()) {
        return { data: {} as T, success: false, error: 'Service unavailable (maintenance mode)' };
      }
      if (this.config.enableRetry && !requestOptions?.skipErrorReporting) {
        return await this.executeWithRetry(async () => {
          const response = await this.fetchWithTimeout(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(data),
            signal: requestOptions?.abortSignal,
          }, requestOptions?.timeout);
          
          return await this.handleResponse<T>(response, context);
        }, { maxAttempts: requestOptions?.retries || this.defaultRetryConfig.maxAttempts }, context);
      } else {
        const response = await this.fetchWithTimeout(`${this.baseUrl}${endpoint}`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(data),
          signal: requestOptions?.abortSignal,
        }, requestOptions?.timeout);
        
        return await this.handleResponse<T>(response, context);
      }
    } catch (error) {
      return this.handleError<T>(error, context, requestOptions?.skipErrorReporting);
    }
  }

  async put<T>(endpoint: string, data: unknown, requestOptions?: RequestOptions): Promise<ApiResponse<T>> {
    const context = `PUT ${endpoint}`;
    
    try {
      if (isMaintenanceMode()) {
        return { data: {} as T, success: false, error: 'Service unavailable (maintenance mode)' };
      }
      if (this.config.enableRetry && !requestOptions?.skipErrorReporting) {
        return await this.executeWithRetry(async () => {
          const response = await this.fetchWithTimeout(`${this.baseUrl}${endpoint}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(data),
            signal: requestOptions?.abortSignal,
          }, requestOptions?.timeout);
          
          return await this.handleResponse<T>(response, context);
        }, { maxAttempts: requestOptions?.retries || this.defaultRetryConfig.maxAttempts }, context);
      } else {
        const response = await this.fetchWithTimeout(`${this.baseUrl}${endpoint}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify(data),
          signal: requestOptions?.abortSignal,
        }, requestOptions?.timeout);
        
        return await this.handleResponse<T>(response, context);
      }
    } catch (error) {
      return this.handleError<T>(error, context, requestOptions?.skipErrorReporting);
    }
  }

  async delete<T>(endpoint: string, requestOptions?: RequestOptions): Promise<ApiResponse<T>> {
    const context = `DELETE ${endpoint}`;
    
    try {
      if (isMaintenanceMode()) {
        return { data: {} as T, success: false, error: 'Service unavailable (maintenance mode)' };
      }
      if (this.config.enableRetry && !requestOptions?.skipErrorReporting) {
        return await this.executeWithRetry(async () => {
          const response = await this.fetchWithTimeout(`${this.baseUrl}${endpoint}`, {
            method: 'DELETE',
            headers: this.getHeaders(),
            signal: requestOptions?.abortSignal,
          }, requestOptions?.timeout);
          
          return await this.handleResponse<T>(response, context);
        }, { maxAttempts: requestOptions?.retries || this.defaultRetryConfig.maxAttempts }, context);
      } else {
        const response = await this.fetchWithTimeout(`${this.baseUrl}${endpoint}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
          signal: requestOptions?.abortSignal,
        }, requestOptions?.timeout);
        
        return await this.handleResponse<T>(response, context);
      }
    } catch (error) {
      return this.handleError<T>(error, context, requestOptions?.skipErrorReporting);
    }
  }

  // Paginated queries
  async getPaginated<T>(endpoint: string, options?: QueryOptions): Promise<PaginatedResponse<T>> {
    const context = `GET PAGINATED ${endpoint}`;
    
    try {
      const url = this.buildUrl(endpoint, options);
      const response = await this.fetchWithTimeout(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      
      const result = await this.handleResponse<T[]>(response, context);
      
      // Mock pagination for now
      return {
        ...result,
        pagination: {
          page: options?.page || 1,
          limit: options?.limit || 10,
          total: Array.isArray(result.data) ? result.data.length : 0,
          totalPages: Math.ceil((Array.isArray(result.data) ? result.data.length : 0) / (options?.limit || 10))
        }
      };
    } catch (error) {
      const errorResult = this.handleError<T[]>(error, context);
      return {
        data: [],
        success: false,
        error: errorResult.error,
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        }
      };
    }
  }

  // File upload
  async uploadFile(endpoint: string, file: File, additionalData?: Record<string, unknown>, requestOptions?: RequestOptions): Promise<ApiResponse<unknown>> {
    const context = `UPLOAD ${endpoint}`;
    
    try {
      if (isMaintenanceMode()) {
        return { data: {}, success: false, error: 'Service unavailable (maintenance mode)' };
      }
      const formData = new FormData();
      formData.append('file', file);
      
      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          formData.append(key, String(value));
        });
      }

      const response = await this.fetchWithTimeout(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(),
        },
        body: formData,
        signal: requestOptions?.abortSignal,
      }, requestOptions?.timeout);
      
      return await this.handleResponse(response, context);
    } catch (error) {
      return this.handleError(error, context, requestOptions?.skipErrorReporting);
    }
  }

  // Batch operations
  async batch<T>(operations: Array<{ method: string; endpoint: string; data?: unknown }>, requestOptions?: RequestOptions): Promise<ApiResponse<T[]>> {
    const context = `BATCH ${operations.length} operations`;
    
    try {
      if (isMaintenanceMode()) {
        return { data: [] as T[], success: false, error: 'Service unavailable (maintenance mode)' };
      }
      const promises = operations.map(op => {
        switch (op.method.toLowerCase()) {
          case 'get':
            return this.get(op.endpoint, undefined, { ...requestOptions, skipErrorReporting: true });
          case 'post':
            return this.post(op.endpoint, op.data, { ...requestOptions, skipErrorReporting: true });
          case 'put':
            return this.put(op.endpoint, op.data, { ...requestOptions, skipErrorReporting: true });
          case 'delete':
            return this.delete(op.endpoint, { ...requestOptions, skipErrorReporting: true });
          default:
            throw new Error(`Unsupported method: ${op.method}`);
        }
      });

      const results = await Promise.allSettled(promises);
      const data = results.map(result => 
        result.status === 'fulfilled' ? result.value.data : null
      ).filter(Boolean);
      
      const failedCount = results.filter(result => result.status === 'rejected').length;
      if (failedCount > 0) {
        reportError(new Error(`${failedCount} operations failed in batch`), {
          component: 'DataService',
          action: context,
          metadata: {
            totalOperations: operations.length,
            failedOperations: failedCount,
            successfulOperations: operations.length - failedCount,
          },
        }, 'api');
      }

      return {
        data: data as T[],
        success: true,
        message: `Batch operation completed: ${operations.length - failedCount}/${operations.length} successful`
      };
    } catch (error) {
      return this.handleError<T[]>(error, context, requestOptions?.skipErrorReporting);
    }
  }

  // Helper methods
  private buildUrl(endpoint: string, options?: QueryOptions): string {
    const url = new URL(`${this.baseUrl}${endpoint}`, window.location.origin);
    
    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === 'object') {
            url.searchParams.append(key, JSON.stringify(value));
          } else {
            url.searchParams.append(key, String(value));
          }
        }
      });
    }
    
    return url.toString();
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': this.getAuthHeader(),
    };
  }

  private getAuthHeader(): string {
    // Get auth token from localStorage or context
    if (typeof window === 'undefined') return '';
    const token = localStorage.getItem('auth_token');
    return token ? `Bearer ${token}` : '';
  }

  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number = this.config.timeout!
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: options.signal || controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      throw error;
    }
  }

  private async handleResponse<T>(response: Response, context: string = 'API request'): Promise<ApiResponse<T>> {
    try {
      const data = await response.json();
      
      if (!response.ok) {
        const errorMessage = data.message || `HTTP ${response.status}: ${response.statusText}`;
        const error = new Error(errorMessage);
        
        // Report API errors to GlobalErrorHandler
        reportError(error, {
          component: 'DataService',
          action: context,
          metadata: {
            status: response.status,
            statusText: response.statusText,
            url: response.url,
            headers: Object.fromEntries(response.headers.entries()),
          },
        }, 'api');
        
        return {
          data: data,
          success: false,
          error: errorMessage
        };
      }
      
      return {
        data,
        success: true,
        message: data.message
      };
    } catch (error) {
      const parseError = new Error('Failed to parse response');
      
      reportError(parseError, {
        component: 'DataService',
        action: context,
        metadata: {
          originalError: error instanceof Error ? error.message : String(error),
          status: response.status,
          url: response.url,
        },
      }, 'data');
      
      return {
        data: {} as T,
        success: false,
        error: 'Failed to parse response'
      };
    }
  }

  private handleError<T>(error: unknown, context: string = 'API request', skipReporting = false): ApiResponse<T> {
    const errorInstance = error instanceof Error ? error : new Error(String(error));
    
    if (!skipReporting) {
      // Determine error category based on error message
      let category: 'network' | 'api' | 'auth' | 'data' | 'unknown' = 'unknown';
      const message = errorInstance.message.toLowerCase();
      
      if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
        category = 'network';
      } else if (message.includes('timeout')) {
        category = 'network';
      } else if (message.includes('unauthorized') || message.includes('forbidden')) {
        category = 'auth';
      } else if (message.includes('parse') || message.includes('json')) {
        category = 'data';
      } else if (message.includes('http') || message.includes('status')) {
        category = 'api';
      }
      
      reportError(errorInstance, {
        component: 'DataService',
        action: context,
        metadata: {
          category,
          timestamp: new Date().toISOString(),
        },
      }, category);
    }
    
    return {
      data: {} as T,
      success: false,
      error: errorInstance.message
    };
  }

  // Cache management
  private cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();

  async getCached<T>(key: string, fetcher: () => Promise<ApiResponse<T>>, ttl = 300000): Promise<ApiResponse<T>> {
    const cached = this.cache.get(key);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < cached.ttl) {
      return {
        data: cached.data,
        success: true,
        message: 'Data retrieved from cache'
      };
    }
    
    const result = await fetcher();
    
    if (result.success) {
      this.cache.set(key, {
        data: result.data,
        timestamp: now,
        ttl
      });
    }
    
    return result;
  }

  clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}

// Export singleton instance
export const dataService = new DataService();
export default dataService;

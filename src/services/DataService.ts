// DataService.ts - Core data service for the application

export interface DataServiceConfig {
  apiUrl?: string;
  timeout?: number;
  retryAttempts?: number;
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
  filter?: Record<string, any>;
  search?: string;
}

export class DataService {
  private config: DataServiceConfig;
  private baseUrl: string;

  constructor(config: DataServiceConfig = {}) {
    this.config = {
      apiUrl: '/api',
      timeout: 10000,
      retryAttempts: 3,
      ...config
    };
    this.baseUrl = this.config.apiUrl!;
  }

  // Generic CRUD operations
  async get<T>(endpoint: string, options?: QueryOptions): Promise<ApiResponse<T>> {
    try {
      const url = this.buildUrl(endpoint, options);
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      
      return await this.handleResponse<T>(response);
    } catch (error) {
      return this.handleError<T>(error);
    }
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      
      return await this.handleResponse<T>(response);
    } catch (error) {
      return this.handleError<T>(error);
    }
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      
      return await this.handleResponse<T>(response);
    } catch (error) {
      return this.handleError<T>(error);
    }
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      
      return await this.handleResponse<T>(response);
    } catch (error) {
      return this.handleError<T>(error);
    }
  }

  // Paginated queries
  async getPaginated<T>(endpoint: string, options?: QueryOptions): Promise<PaginatedResponse<T>> {
    try {
      const url = this.buildUrl(endpoint, options);
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      
      const result = await this.handleResponse<T[]>(response);
      
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
      return {
        data: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
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
  async uploadFile(endpoint: string, file: File, additionalData?: Record<string, any>): Promise<ApiResponse<any>> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          formData.append(key, String(value));
        });
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(),
        },
        body: formData,
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Batch operations
  async batch<T>(operations: Array<{ method: string; endpoint: string; data?: any }>): Promise<ApiResponse<T[]>> {
    try {
      const promises = operations.map(op => {
        switch (op.method.toLowerCase()) {
          case 'get':
            return this.get(op.endpoint);
          case 'post':
            return this.post(op.endpoint, op.data);
          case 'put':
            return this.put(op.endpoint, op.data);
          case 'delete':
            return this.delete(op.endpoint);
          default:
            throw new Error(`Unsupported method: ${op.method}`);
        }
      });

      const results = await Promise.allSettled(promises);
      const data = results.map(result => 
        result.status === 'fulfilled' ? result.value.data : null
      ).filter(Boolean);

      return {
        data: data as T[],
        success: true,
        message: `Batch operation completed: ${results.length} operations`
      };
    } catch (error) {
      return this.handleError<T[]>(error);
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
    const token = localStorage.getItem('auth_token');
    return token ? `Bearer ${token}` : '';
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      const data = await response.json();
      
      if (!response.ok) {
        return {
          data: data,
          success: false,
          error: data.message || `HTTP ${response.status}: ${response.statusText}`
        };
      }
      
      return {
        data,
        success: true,
        message: data.message
      };
    } catch (error) {
      return {
        data: {} as T,
        success: false,
        error: 'Failed to parse response'
      };
    }
  }

  private handleError<T>(error: any): ApiResponse<T> {
    return {
      data: {} as T,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }

  // Cache management
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

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
/**
 * DeepSeek 3.1 Local AI Service
 * Handles communication with local DeepSeek 3.1 instance
 */

export interface DeepSeekConfig {
  baseUrl: string;
  model: string;
  maxTokens: number;
  temperature: number;
  timeout: number;
}

export interface DeepSeekRequest {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface DeepSeekResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason: string;
}

export class DeepSeekService {
  private config: DeepSeekConfig;
  private cache: Map<string, { response: DeepSeekResponse; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(config?: Partial<DeepSeekConfig>) {
    this.config = {
      baseUrl: config?.baseUrl || 'http://localhost:11434',
      model: config?.model || 'deepseek-r1:latest',
      maxTokens: config?.maxTokens || 2048,
      temperature: config?.temperature || 0.7,
      timeout: config?.timeout || 30000,
    };
  }

  /**
   * Generate content using DeepSeek 3.1
   */
  async generateContent(request: DeepSeekRequest): Promise<DeepSeekResponse> {
    const startTime = Date.now();
    
    try {
      // Check cache first
      const cacheKey = this.getCacheKey(request);
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        console.log('DeepSeek: Using cached response');
        return cached;
      }

      // Prepare the request payload
      const payload = {
        model: this.config.model,
        prompt: this.buildPrompt(request),
        options: {
          temperature: request.temperature ?? this.config.temperature,
          num_predict: request.maxTokens ?? this.config.maxTokens,
        },
        stream: request.stream ?? false,
      };

      console.log('DeepSeek: Sending request to local instance...');
      
      const response = await fetch(`${this.config.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      const result: DeepSeekResponse = {
        content: data.response || '',
        usage: {
          promptTokens: data.prompt_eval_count || 0,
          completionTokens: data.eval_count || 0,
          totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
        },
        model: data.model || this.config.model,
        finishReason: data.done ? 'stop' : 'length',
      };

      // Cache the response
      this.setCache(cacheKey, result);

      const duration = Date.now() - startTime;
      console.log(`DeepSeek: Response generated in ${duration}ms`);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`DeepSeek: Error after ${duration}ms:`, error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('DeepSeek request timed out. Please try again.');
        }
        throw new Error(`DeepSeek error: ${error.message}`);
      }
      
      throw new Error('Unknown DeepSeek error occurred');
    }
  }

  /**
   * Stream content generation (for real-time preview)
   */
  async *streamContent(request: DeepSeekRequest): AsyncGenerator<string, void, unknown> {
    try {
      const payload = {
        model: this.config.model,
        prompt: this.buildPrompt(request),
        options: {
          temperature: request.temperature ?? this.config.temperature,
          num_predict: request.maxTokens ?? this.config.maxTokens,
        },
        stream: true,
      };

      const response = await fetch(`${this.config.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get response stream');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim()) {
              try {
                const data = JSON.parse(line);
                if (data.response) {
                  yield data.response;
                }
              } catch (e) {
                // Skip invalid JSON lines
                continue;
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('DeepSeek streaming error:', error);
      throw error;
    }
  }

  /**
   * Check if DeepSeek service is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch (error) {
      console.error('DeepSeek health check failed:', error);
      return false;
    }
  }

  /**
   * Get available models
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/tags`);
      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }
      
      const data = await response.json();
      return data.models?.map((model: any) => model.name) || [];
    } catch (error) {
      console.error('Failed to get available models:', error);
      return [];
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<DeepSeekConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0, // TODO: Implement hit rate tracking
    };
  }

  private buildPrompt(request: DeepSeekRequest): string {
    if (request.systemPrompt) {
      return `${request.systemPrompt}\n\nUser: ${request.prompt}\n\nAssistant:`;
    }
    return request.prompt;
  }

  private getCacheKey(request: DeepSeekRequest): string {
    const key = JSON.stringify({
      prompt: request.prompt,
      systemPrompt: request.systemPrompt,
      temperature: request.temperature ?? this.config.temperature,
      maxTokens: request.maxTokens ?? this.config.maxTokens,
    });
    return btoa(key).slice(0, 32); // Use base64 hash for cache key
  }

  private getFromCache(key: string): DeepSeekResponse | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > this.CACHE_TTL;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.response;
  }

  private setCache(key: string, response: DeepSeekResponse): void {
    // Limit cache size to prevent memory issues
    if (this.cache.size >= 100) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      response,
      timestamp: Date.now(),
    });
  }
}

// Export singleton instance
export const deepSeekService = new DeepSeekService();
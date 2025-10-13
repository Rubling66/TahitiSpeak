import Redis from 'ioredis';
import { RateLimiter as IRateLimiter, RateLimitConfig, RateLimitResult } from '../../types/email';

export class RateLimiter implements IRateLimiter {
  private redis: Redis;
  private config: RateLimitConfig;

  constructor(redisConfig: { host: string; port: number; password?: string }, config: RateLimitConfig) {
    this.redis = new Redis({
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    });
    
    this.config = config;
  }

  async checkRateLimit(identifier: string, action: string = 'send'): Promise<RateLimitResult> {
    try {
      const limits = this.config.limits[action] || this.config.limits.default;
      if (!limits) {
        return { allowed: true, remaining: Infinity, resetTime: new Date() };
      }

      const results = await Promise.all([
        this.checkWindow(identifier, action, 'second', limits.perSecond),
        this.checkWindow(identifier, action, 'minute', limits.perMinute),
        this.checkWindow(identifier, action, 'hour', limits.perHour),
        this.checkWindow(identifier, action, 'day', limits.perDay)
      ]);

      // Find the most restrictive limit
      const restrictiveResult = results.find(result => !result.allowed);
      
      if (restrictiveResult) {
        return restrictiveResult;
      }

      // All limits passed, return the most restrictive remaining count
      const minRemaining = Math.min(...results.map(r => r.remaining));
      const earliestReset = new Date(Math.min(...results.map(r => r.resetTime.getTime())));

      return {
        allowed: true,
        remaining: minRemaining,
        resetTime: earliestReset
      };
    } catch (error) {
      console.error('Rate limit check failed:', error);
      // Fail open - allow the request if rate limiting fails
      return { allowed: true, remaining: 0, resetTime: new Date() };
    }
  }

  private async checkWindow(
    identifier: string, 
    action: string, 
    window: 'second' | 'minute' | 'hour' | 'day',
    limit?: number
  ): Promise<RateLimitResult> {
    if (!limit || limit <= 0) {
      return { allowed: true, remaining: Infinity, resetTime: new Date() };
    }

    const now = Date.now();
    const windowMs = this.getWindowMs(window);
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const windowEnd = windowStart + windowMs;
    
    const key = `rate_limit:${identifier}:${action}:${window}:${windowStart}`;
    
    try {
      // Use Redis pipeline for atomic operations
      const pipeline = this.redis.pipeline();
      pipeline.incr(key);
      pipeline.expire(key, Math.ceil(windowMs / 1000));
      
      const results = await pipeline.exec();
      const count = results?.[0]?.[1] as number || 0;
      
      const allowed = count <= limit;
      const remaining = Math.max(0, limit - count);
      const resetTime = new Date(windowEnd);

      return { allowed, remaining, resetTime };
    } catch (error) {
      console.error(`Rate limit check failed for ${key}:`, error);
      return { allowed: true, remaining: 0, resetTime: new Date() };
    }
  }

  async updateRateLimit(identifier: string, action: string = 'send', count: number = 1): Promise<void> {
    try {
      const windows: Array<'second' | 'minute' | 'hour' | 'day'> = ['second', 'minute', 'hour', 'day'];
      const now = Date.now();
      
      const pipeline = this.redis.pipeline();
      
      for (const window of windows) {
        const windowMs = this.getWindowMs(window);
        const windowStart = Math.floor(now / windowMs) * windowMs;
        const key = `rate_limit:${identifier}:${action}:${window}:${windowStart}`;
        
        pipeline.incrby(key, count);
        pipeline.expire(key, Math.ceil(windowMs / 1000));
      }
      
      await pipeline.exec();
      console.log(`Updated rate limit for ${identifier}:${action} by ${count}`);
    } catch (error) {
      console.error('Failed to update rate limit:', error);
    }
  }

  private getWindowMs(window: 'second' | 'minute' | 'hour' | 'day'): number {
    switch (window) {
      case 'second':
        return 1000;
      case 'minute':
        return 60 * 1000;
      case 'hour':
        return 60 * 60 * 1000;
      case 'day':
        return 24 * 60 * 60 * 1000;
      default:
        return 1000;
    }
  }

  async getRateLimitStatus(identifier: string, action: string = 'send'): Promise<{
    current: Record<string, number>;
    limits: Record<string, number>;
    resetTimes: Record<string, Date>;
  }> {
    try {
      const limits = this.config.limits[action] || this.config.limits.default;
      if (!limits) {
        return { current: {}, limits: {}, resetTimes: {} };
      }

      const windows: Array<'second' | 'minute' | 'hour' | 'day'> = ['second', 'minute', 'hour', 'day'];
      const now = Date.now();
      
      const current: Record<string, number> = {};
      const resetTimes: Record<string, Date> = {};
      const limitValues: Record<string, number> = {};
      
      for (const window of windows) {
        const limit = limits[`per${window.charAt(0).toUpperCase() + window.slice(1)}` as keyof typeof limits];
        if (limit && limit > 0) {
          const windowMs = this.getWindowMs(window);
          const windowStart = Math.floor(now / windowMs) * windowMs;
          const key = `rate_limit:${identifier}:${action}:${window}:${windowStart}`;
          
          const count = await this.redis.get(key);
          current[window] = parseInt(count || '0', 10);
          limitValues[window] = limit;
          resetTimes[window] = new Date(windowStart + windowMs);
        }
      }
      
      return { current, limits: limitValues, resetTimes };
    } catch (error) {
      console.error('Failed to get rate limit status:', error);
      return { current: {}, limits: {}, resetTimes: {} };
    }
  }

  async resetRateLimit(identifier: string, action: string = 'send'): Promise<void> {
    try {
      const pattern = `rate_limit:${identifier}:${action}:*`;
      const keys = await this.redis.keys(pattern);
      
      if (keys.length > 0) {
        await this.redis.del(...keys);
        console.log(`Reset rate limit for ${identifier}:${action}`);
      }
    } catch (error) {
      console.error('Failed to reset rate limit:', error);
    }
  }

  async getTopUsers(action: string = 'send', limit: number = 10): Promise<Array<{ identifier: string; count: number }>> {
    try {
      const pattern = `rate_limit:*:${action}:hour:*`;
      const keys = await this.redis.keys(pattern);
      
      const userCounts: Record<string, number> = {};
      
      for (const key of keys) {
        const parts = key.split(':');
        if (parts.length >= 4) {
          const identifier = parts[2];
          const count = await this.redis.get(key);
          const countNum = parseInt(count || '0', 10);
          
          userCounts[identifier] = (userCounts[identifier] || 0) + countNum;
        }
      }
      
      return Object.entries(userCounts)
        .map(([identifier, count]) => ({ identifier, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to get top users:', error);
      return [];
    }
  }

  async getGlobalStats(action: string = 'send'): Promise<{
    totalRequests: number;
    uniqueUsers: number;
    averageRequestsPerUser: number;
  }> {
    try {
      const pattern = `rate_limit:*:${action}:hour:*`;
      const keys = await this.redis.keys(pattern);
      
      let totalRequests = 0;
      const uniqueUsers = new Set<string>();
      
      for (const key of keys) {
        const parts = key.split(':');
        if (parts.length >= 4) {
          const identifier = parts[2];
          const count = await this.redis.get(key);
          const countNum = parseInt(count || '0', 10);
          
          totalRequests += countNum;
          uniqueUsers.add(identifier);
        }
      }
      
      const uniqueUserCount = uniqueUsers.size;
      const averageRequestsPerUser = uniqueUserCount > 0 ? totalRequests / uniqueUserCount : 0;
      
      return {
        totalRequests,
        uniqueUsers: uniqueUserCount,
        averageRequestsPerUser: Math.round(averageRequestsPerUser * 100) / 100
      };
    } catch (error) {
      console.error('Failed to get global stats:', error);
      return { totalRequests: 0, uniqueUsers: 0, averageRequestsPerUser: 0 };
    }
  }

  // Provider-specific rate limiting
  async checkProviderRateLimit(provider: string, action: string = 'send'): Promise<RateLimitResult> {
    const providerLimits = this.config.providerLimits?.[provider];
    if (!providerLimits) {
      return { allowed: true, remaining: Infinity, resetTime: new Date() };
    }

    return this.checkRateLimit(`provider:${provider}`, action);
  }

  async updateProviderRateLimit(provider: string, action: string = 'send', count: number = 1): Promise<void> {
    await this.updateRateLimit(`provider:${provider}`, action, count);
  }

  // Burst protection
  async checkBurstLimit(identifier: string, burstLimit: number = 10, burstWindow: number = 60): Promise<RateLimitResult> {
    try {
      const now = Date.now();
      const windowStart = Math.floor(now / (burstWindow * 1000)) * (burstWindow * 1000);
      const key = `burst_limit:${identifier}:${windowStart}`;
      
      const pipeline = this.redis.pipeline();
      pipeline.incr(key);
      pipeline.expire(key, burstWindow);
      
      const results = await pipeline.exec();
      const count = results?.[0]?.[1] as number || 0;
      
      const allowed = count <= burstLimit;
      const remaining = Math.max(0, burstLimit - count);
      const resetTime = new Date(windowStart + (burstWindow * 1000));
      
      return { allowed, remaining, resetTime };
    } catch (error) {
      console.error('Burst limit check failed:', error);
      return { allowed: true, remaining: 0, resetTime: new Date() };
    }
  }

  // Cleanup old rate limit data
  async cleanup(olderThanHours: number = 24): Promise<number> {
    try {
      const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
      const patterns = ['rate_limit:*', 'burst_limit:*'];
      
      let deletedKeys = 0;
      
      for (const pattern of patterns) {
        const keys = await this.redis.keys(pattern);
        
        for (const key of keys) {
          const ttl = await this.redis.ttl(key);
          if (ttl === -1) { // Key without expiration
            const parts = key.split(':');
            const timestamp = parseInt(parts[parts.length - 1], 10);
            
            if (!isNaN(timestamp) && timestamp < cutoffTime) {
              await this.redis.del(key);
              deletedKeys++;
            }
          }
        }
      }
      
      console.log(`Cleaned up ${deletedKeys} old rate limit keys`);
      return deletedKeys;
    } catch (error) {
      console.error('Failed to cleanup rate limit data:', error);
      return 0;
    }
  }

  // Health check
  async isHealthy(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      console.error('Rate limiter health check failed:', error);
      return false;
    }
  }

  // Configuration management
  updateConfig(config: Partial<RateLimitConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('Rate limiter configuration updated');
  }

  getConfig(): RateLimitConfig {
    return { ...this.config };
  }

  // Shutdown
  async shutdown(): Promise<void> {
    try {
      this.redis.disconnect();
      console.log('Rate limiter shutdown complete');
    } catch (error) {
      console.error('Error during rate limiter shutdown:', error);
    }
  }
}
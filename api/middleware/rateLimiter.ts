import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Rate limiting configuration
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

// Default rate limit configurations for different endpoints
export const RATE_LIMITS = {
  // Authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    message: 'Too many authentication attempts, please try again later.'
  },
  
  // Password reset
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 attempts per hour
    message: 'Too many password reset attempts, please try again later.'
  },
  
  // General API endpoints
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per 15 minutes
    message: 'Too many requests, please try again later.'
  },
  
  // File upload endpoints
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20, // 20 uploads per hour
    message: 'Too many upload attempts, please try again later.'
  },
  
  // Payment endpoints
  payment: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 payment attempts per hour
    message: 'Too many payment attempts, please try again later.'
  },
  
  // Email sending
  email: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 emails per hour
    message: 'Too many email requests, please try again later.'
  }
};

// In-memory store for rate limiting (in production, use Redis)
class MemoryStore {
  private store: Map<string, { count: number; resetTime: number }> = new Map();

  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    const data = this.store.get(key);
    if (!data) return null;
    
    // Clean up expired entries
    if (Date.now() > data.resetTime) {
      this.store.delete(key);
      return null;
    }
    
    return data;
  }

  async set(key: string, value: { count: number; resetTime: number }): Promise<void> {
    this.store.set(key, value);
  }

  async increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }> {
    const now = Date.now();
    const existing = await this.get(key);
    
    if (!existing) {
      const data = { count: 1, resetTime: now + windowMs };
      await this.set(key, data);
      return data;
    }
    
    existing.count += 1;
    await this.set(key, existing);
    return existing;
  }

  // Clean up expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, data] of this.store.entries()) {
      if (now > data.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

// Singleton memory store
const memoryStore = new MemoryStore();

// Clean up expired entries every 5 minutes
setInterval(() => {
  memoryStore.cleanup();
}, 5 * 60 * 1000);

// Get client identifier for rate limiting
function getClientIdentifier(request: NextRequest): string {
  // Try to get user ID from JWT token
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      // In a real implementation, you'd decode the JWT to get user ID
      // For now, we'll use a hash of the token
      return `user:${btoa(token).substring(0, 10)}`;
    } catch (error) {
      // Fall back to IP-based limiting
    }
  }
  
  // Fall back to IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  return `ip:${ip}`;
}

// Rate limiter middleware
export function createRateLimiter(config: RateLimitConfig) {
  return async function rateLimiter(
    request: NextRequest,
    context?: { params?: any }
  ): Promise<NextResponse | null> {
    try {
      const clientId = getClientIdentifier(request);
      const key = `rate_limit:${clientId}:${request.nextUrl.pathname}`;
      
      const result = await memoryStore.increment(key, config.windowMs);
      
      // Add rate limit headers
      const headers = new Headers();
      headers.set('X-RateLimit-Limit', config.maxRequests.toString());
      headers.set('X-RateLimit-Remaining', Math.max(0, config.maxRequests - result.count).toString());
      headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());
      
      // Check if rate limit exceeded
      if (result.count > config.maxRequests) {
        const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
        headers.set('Retry-After', retryAfter.toString());
        
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: config.message || 'Too many requests, please try again later.',
            retryAfter
          },
          { 
            status: 429,
            headers
          }
        );
      }
      
      // Rate limit not exceeded, continue with request
      return null;
    } catch (error) {
      console.error('Rate limiter error:', error);
      // On error, allow the request to continue
      return null;
    }
  };
}

// Specific rate limiters for different use cases
export const authRateLimiter = createRateLimiter(RATE_LIMITS.auth);
export const passwordResetRateLimiter = createRateLimiter(RATE_LIMITS.passwordReset);
export const apiRateLimiter = createRateLimiter(RATE_LIMITS.api);
export const uploadRateLimiter = createRateLimiter(RATE_LIMITS.upload);
export const paymentRateLimiter = createRateLimiter(RATE_LIMITS.payment);
export const emailRateLimiter = createRateLimiter(RATE_LIMITS.email);

// Advanced rate limiter with Supabase storage (for production)
export class SupabaseRateLimiter {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  async checkRateLimit(
    clientId: string,
    endpoint: string,
    config: RateLimitConfig
  ): Promise<{
    allowed: boolean;
    count: number;
    resetTime: number;
    remaining: number;
  }> {
    const now = Date.now();
    const windowStart = now - config.windowMs;
    const key = `${clientId}:${endpoint}`;

    try {
      // Get current count within the time window
      const { data: requests, error } = await this.supabase
        .from('rate_limit_requests')
        .select('*')
        .eq('client_id', clientId)
        .eq('endpoint', endpoint)
        .gte('timestamp', new Date(windowStart).toISOString());

      if (error) {
        console.error('Rate limit check error:', error);
        // On error, allow the request
        return {
          allowed: true,
          count: 0,
          resetTime: now + config.windowMs,
          remaining: config.maxRequests
        };
      }

      const currentCount = requests?.length || 0;
      const allowed = currentCount < config.maxRequests;

      if (allowed) {
        // Record this request
        await this.supabase
          .from('rate_limit_requests')
          .insert({
            client_id: clientId,
            endpoint,
            timestamp: new Date().toISOString()
          });
      }

      return {
        allowed,
        count: currentCount + (allowed ? 1 : 0),
        resetTime: now + config.windowMs,
        remaining: Math.max(0, config.maxRequests - currentCount - (allowed ? 1 : 0))
      };
    } catch (error) {
      console.error('Rate limiter error:', error);
      // On error, allow the request
      return {
        allowed: true,
        count: 0,
        resetTime: now + config.windowMs,
        remaining: config.maxRequests
      };
    }
  }

  // Clean up old rate limit records
  async cleanup(): Promise<void> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    try {
      await this.supabase
        .from('rate_limit_requests')
        .delete()
        .lt('timestamp', oneDayAgo);
    } catch (error) {
      console.error('Rate limit cleanup error:', error);
    }
  }
}

// Utility function to apply rate limiting to API routes
export function withRateLimit(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>,
  rateLimiter: (req: NextRequest, context?: any) => Promise<NextResponse | null>
) {
  return async function (req: NextRequest, context?: any): Promise<NextResponse> {
    // Apply rate limiting
    const rateLimitResponse = await rateLimiter(req, context);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Continue with the original handler
    return handler(req, context);
  };
}

// Example usage in API routes:
/*
import { withRateLimit, apiRateLimiter } from '@/api/middleware/rateLimiter';

export const GET = withRateLimit(
  async function handler(request: NextRequest) {
    // Your API logic here
    return NextResponse.json({ message: 'Success' });
  },
  apiRateLimiter
);
*/
import { NextRequest, NextResponse } from 'next/server';
import { createRateLimiter, RateLimitConfig } from './rateLimiter';
import { createAuthMiddleware, AuthConfig } from './auth';
import { createErrorHandler, ErrorConfig } from './errorHandler';
import { createSecurityMiddleware, SecurityConfig } from './security';

// Combined middleware configuration
export interface MiddlewareConfig {
  security?: SecurityConfig;
  rateLimit?: RateLimitConfig;
  auth?: AuthConfig;
  error?: ErrorConfig;
  order?: ('security' | 'rateLimit' | 'auth' | 'error')[];
}

// Middleware function type
export type MiddlewareFunction = (
  request: NextRequest,
  context?: any
) => Promise<NextResponse | null>;

// Middleware orchestrator class
export class MiddlewareOrchestrator {
  private middlewares: Map<string, MiddlewareFunction> = new Map();
  private order: string[];

  constructor(config: MiddlewareConfig = {}) {
    this.order = config.order || ['security', 'rateLimit', 'auth', 'error'];
    this.setupMiddlewares(config);
  }

  private setupMiddlewares(config: MiddlewareConfig): void {
    // Security middleware
    if (config.security !== false) {
      this.middlewares.set('security', createSecurityMiddleware(config.security));
    }

    // Rate limiting middleware
    if (config.rateLimit !== false) {
      this.middlewares.set('rateLimit', createRateLimiter(config.rateLimit));
    }

    // Authentication middleware
    if (config.auth !== false) {
      this.middlewares.set('auth', createAuthMiddleware(config.auth));
    }

    // Error handling middleware (always last)
    if (config.error !== false) {
      this.middlewares.set('error', createErrorHandler(config.error));
    }
  }

  // Apply all middlewares in order
  async apply(request: NextRequest, context?: any): Promise<NextResponse | null> {
    for (const middlewareName of this.order) {
      const middleware = this.middlewares.get(middlewareName);
      if (middleware) {
        try {
          const result = await middleware(request, context);
          if (result) {
            return result; // Middleware returned a response, stop processing
          }
        } catch (error) {
          // If error middleware exists and this isn't the error middleware, let it handle
          if (middlewareName !== 'error' && this.middlewares.has('error')) {
            const errorMiddleware = this.middlewares.get('error')!;
            return await errorMiddleware(request, { ...context, error });
          }
          throw error;
        }
      }
    }
    return null; // All middlewares passed
  }
}

// Create a combined middleware function
export function createMiddleware(config: MiddlewareConfig = {}) {
  const orchestrator = new MiddlewareOrchestrator(config);
  
  return async function combinedMiddleware(
    request: NextRequest,
    context?: any
  ): Promise<NextResponse | null> {
    return orchestrator.apply(request, context);
  };
}

// Wrapper function for API routes
export function withMiddleware(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>,
  config: MiddlewareConfig = {}
) {
  const middleware = createMiddleware(config);
  
  return async function (req: NextRequest, context?: any): Promise<NextResponse> {
    // Apply middleware
    const middlewareResponse = await middleware(req, context);
    if (middlewareResponse) {
      return middlewareResponse;
    }

    // Execute the actual handler
    return await handler(req, context);
  };
}

// Predefined middleware configurations
export const publicAPIMiddleware = createMiddleware({
  security: {
    cors: {
      origin: true,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type'],
      credentials: false
    },
    headers: {
      hsts: true,
      noSniff: true,
      frameOptions: 'DENY',
      xssProtection: true
    }
  },
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100
  },
  auth: false, // No auth required for public APIs
  error: {
    logErrors: true,
    includeStack: false
  }
});

export const protectedAPIMiddleware = createMiddleware({
  security: {
    cors: {
      origin: [process.env.NEXT_PUBLIC_APP_URL!],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    },
    headers: {
      hsts: true,
      noSniff: true,
      frameOptions: 'DENY',
      xssProtection: true
    }
  },
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60
  },
  auth: {
    required: true,
    checkEmailVerification: true,
    allowedRoles: ['user', 'admin']
  },
  error: {
    logErrors: true,
    includeStack: false
  }
});

export const adminAPIMiddleware = createMiddleware({
  security: {
    cors: {
      origin: [process.env.NEXT_PUBLIC_APP_URL!],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    },
    headers: {
      hsts: true,
      noSniff: true,
      frameOptions: 'DENY',
      xssProtection: true
    }
  },
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30
  },
  auth: {
    required: true,
    checkEmailVerification: true,
    allowedRoles: ['admin'],
    requireMFA: true
  },
  error: {
    logErrors: true,
    includeStack: false,
    alertOnError: true
  }
});

export const uploadAPIMiddleware = createMiddleware({
  security: {
    cors: {
      origin: [process.env.NEXT_PUBLIC_APP_URL!],
      methods: ['POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    },
    validation: {
      maxBodySize: 50 * 1024 * 1024, // 50MB for uploads
      allowedContentTypes: ['multipart/form-data'],
      requireContentType: true
    }
  },
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10 // Stricter for uploads
  },
  auth: {
    required: true,
    checkEmailVerification: true
  },
  error: {
    logErrors: true,
    includeStack: false
  }
});

export const webhookAPIMiddleware = createMiddleware({
  security: {
    cors: false, // No CORS for webhooks
    validation: {
      maxBodySize: 1024 * 1024, // 1MB
      allowedContentTypes: ['application/json'],
      requireContentType: true
    },
    signing: {
      required: true,
      algorithm: 'sha256',
      timestampTolerance: 300000 // 5 minutes
    }
  },
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100
  },
  auth: false, // Webhooks use signature verification instead
  error: {
    logErrors: true,
    includeStack: false
  }
});

// Utility functions for common middleware patterns
export function withPublicAPI(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>
) {
  return withMiddleware(handler, {
    security: {
      cors: { origin: true, credentials: false }
    },
    rateLimit: { windowMs: 60000, maxRequests: 100 },
    auth: false
  });
}

export function withProtectedAPI(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>
) {
  return withMiddleware(handler, {
    security: {
      cors: { origin: [process.env.NEXT_PUBLIC_APP_URL!], credentials: true }
    },
    rateLimit: { windowMs: 60000, maxRequests: 60 },
    auth: { required: true, checkEmailVerification: true }
  });
}

export function withAdminAPI(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>
) {
  return withMiddleware(handler, {
    security: {
      cors: { origin: [process.env.NEXT_PUBLIC_APP_URL!], credentials: true }
    },
    rateLimit: { windowMs: 60000, maxRequests: 30 },
    auth: { 
      required: true, 
      checkEmailVerification: true, 
      allowedRoles: ['admin'],
      requireMFA: true 
    }
  });
}

export function withUploadAPI(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>
) {
  return withMiddleware(handler, {
    security: {
      cors: { origin: [process.env.NEXT_PUBLIC_APP_URL!], credentials: true },
      validation: {
        maxBodySize: 50 * 1024 * 1024,
        allowedContentTypes: ['multipart/form-data']
      }
    },
    rateLimit: { windowMs: 60000, maxRequests: 10 },
    auth: { required: true, checkEmailVerification: true }
  });
}

export function withWebhookAPI(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>
) {
  return withMiddleware(handler, {
    security: {
      cors: false,
      validation: {
        maxBodySize: 1024 * 1024,
        allowedContentTypes: ['application/json']
      },
      signing: { required: true, algorithm: 'sha256' }
    },
    rateLimit: { windowMs: 60000, maxRequests: 100 },
    auth: false
  });
}

// Export all middleware components
export * from './rateLimiter';
export * from './auth';
export * from './errorHandler';
export * from './security';

// Example usage in API routes:
/*
// Basic protected API
export const GET = withProtectedAPI(async (request, context) => {
  return NextResponse.json({ message: 'Protected data' });
});

// Admin API with custom config
export const POST = withMiddleware(
  async (request, context) => {
    return NextResponse.json({ message: 'Admin action completed' });
  },
  {
    auth: { required: true, allowedRoles: ['admin'] },
    rateLimit: { windowMs: 60000, maxRequests: 10 }
  }
);

// Upload API
export const POST = withUploadAPI(async (request, context) => {
  // Handle file upload
  return NextResponse.json({ message: 'File uploaded' });
});

// Webhook API
export const POST = withWebhookAPI(async (request, context) => {
  // Handle webhook
  return NextResponse.json({ message: 'Webhook processed' });
});
*/
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Security configuration interface
export interface SecurityConfig {
  // CORS settings
  cors?: {
    origin?: string | string[] | boolean;
    methods?: string[];
    allowedHeaders?: string[];
    credentials?: boolean;
    maxAge?: number;
  };
  
  // Content Security Policy
  csp?: {
    directives?: Record<string, string[]>;
    reportOnly?: boolean;
  };
  
  // Rate limiting
  rateLimit?: {
    windowMs: number;
    maxRequests: number;
    message?: string;
  };
  
  // Request validation
  validation?: {
    maxBodySize?: number;
    allowedContentTypes?: string[];
    requireContentType?: boolean;
  };
  
  // Security headers
  headers?: {
    hsts?: boolean;
    noSniff?: boolean;
    frameOptions?: 'DENY' | 'SAMEORIGIN' | string;
    xssProtection?: boolean;
    referrerPolicy?: string;
  };
  
  // API key validation
  apiKey?: {
    required?: boolean;
    headerName?: string;
    validateKey?: (key: string) => Promise<boolean>;
  };
  
  // Request signing
  signing?: {
    required?: boolean;
    algorithm?: string;
    secretKey?: string;
    timestampTolerance?: number;
  };
}

// Default security configuration
const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [process.env.NEXT_PUBLIC_APP_URL!] 
      : true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Signature', 'X-Timestamp'],
    credentials: true,
    maxAge: 86400 // 24 hours
  },
  
  csp: {
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'https:'],
      'font-src': ["'self'", 'https:'],
      'connect-src': ["'self'", 'https:'],
      'media-src': ["'self'"],
      'object-src': ["'none'"],
      'frame-ancestors': ["'none'"]
    },
    reportOnly: false
  },
  
  validation: {
    maxBodySize: 10 * 1024 * 1024, // 10MB
    allowedContentTypes: [
      'application/json',
      'application/x-www-form-urlencoded',
      'multipart/form-data',
      'text/plain'
    ],
    requireContentType: true
  },
  
  headers: {
    hsts: true,
    noSniff: true,
    frameOptions: 'DENY',
    xssProtection: true,
    referrerPolicy: 'strict-origin-when-cross-origin'
  }
};

// Security middleware class
export class SecurityMiddleware {
  private config: SecurityConfig;
  private supabase;

  constructor(config: SecurityConfig = {}) {
    this.config = { ...DEFAULT_SECURITY_CONFIG, ...config };
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  // Main security middleware function
  async apply(request: NextRequest): Promise<NextResponse | null> {
    try {
      // Handle preflight requests
      if (request.method === 'OPTIONS') {
        return this.handlePreflight(request);
      }

      // Validate request size
      await this.validateRequestSize(request);

      // Validate content type
      this.validateContentType(request);

      // Validate API key if required
      if (this.config.apiKey?.required) {
        await this.validateAPIKey(request);
      }

      // Validate request signature if required
      if (this.config.signing?.required) {
        await this.validateSignature(request);
      }

      // Check for suspicious patterns
      await this.detectSuspiciousActivity(request);

      // All security checks passed
      return null;
    } catch (error) {
      console.error('Security validation failed:', error);
      return this.createSecurityErrorResponse(error);
    }
  }

  // Handle CORS preflight requests
  private handlePreflight(request: NextRequest): NextResponse {
    const response = new NextResponse(null, { status: 200 });
    this.applyCORSHeaders(response, request);
    return response;
  }

  // Apply CORS headers to response
  applyCORSHeaders(response: NextResponse, request: NextRequest): void {
    const corsConfig = this.config.cors;
    if (!corsConfig) return;

    const origin = request.headers.get('origin');
    
    // Handle origin
    if (corsConfig.origin === true) {
      response.headers.set('Access-Control-Allow-Origin', '*');
    } else if (typeof corsConfig.origin === 'string') {
      response.headers.set('Access-Control-Allow-Origin', corsConfig.origin);
    } else if (Array.isArray(corsConfig.origin) && origin) {
      if (corsConfig.origin.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
      }
    }

    // Handle methods
    if (corsConfig.methods) {
      response.headers.set('Access-Control-Allow-Methods', corsConfig.methods.join(', '));
    }

    // Handle headers
    if (corsConfig.allowedHeaders) {
      response.headers.set('Access-Control-Allow-Headers', corsConfig.allowedHeaders.join(', '));
    }

    // Handle credentials
    if (corsConfig.credentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    // Handle max age
    if (corsConfig.maxAge) {
      response.headers.set('Access-Control-Max-Age', corsConfig.maxAge.toString());
    }
  }

  // Apply security headers to response
  applySecurityHeaders(response: NextResponse): void {
    const headersConfig = this.config.headers;
    if (!headersConfig) return;

    // HSTS
    if (headersConfig.hsts) {
      response.headers.set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      );
    }

    // Content type sniffing protection
    if (headersConfig.noSniff) {
      response.headers.set('X-Content-Type-Options', 'nosniff');
    }

    // Frame options
    if (headersConfig.frameOptions) {
      response.headers.set('X-Frame-Options', headersConfig.frameOptions);
    }

    // XSS protection
    if (headersConfig.xssProtection) {
      response.headers.set('X-XSS-Protection', '1; mode=block');
    }

    // Referrer policy
    if (headersConfig.referrerPolicy) {
      response.headers.set('Referrer-Policy', headersConfig.referrerPolicy);
    }

    // Content Security Policy
    if (this.config.csp) {
      const cspHeader = this.buildCSPHeader();
      const headerName = this.config.csp.reportOnly 
        ? 'Content-Security-Policy-Report-Only'
        : 'Content-Security-Policy';
      response.headers.set(headerName, cspHeader);
    }

    // Additional security headers
    response.headers.set('X-Powered-By', ''); // Remove server information
    response.headers.set('Server', ''); // Remove server information
  }

  // Build Content Security Policy header
  private buildCSPHeader(): string {
    const directives = this.config.csp?.directives || {};
    return Object.entries(directives)
      .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
      .join('; ');
  }

  // Validate request size
  private async validateRequestSize(request: NextRequest): Promise<void> {
    const maxSize = this.config.validation?.maxBodySize;
    if (!maxSize) return;

    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > maxSize) {
      throw new Error(`Request body too large. Maximum size: ${maxSize} bytes`);
    }
  }

  // Validate content type
  private validateContentType(request: NextRequest): void {
    const validationConfig = this.config.validation;
    if (!validationConfig?.requireContentType) return;

    const contentType = request.headers.get('content-type');
    
    if (!contentType && request.method !== 'GET' && request.method !== 'DELETE') {
      throw new Error('Content-Type header is required');
    }

    if (contentType && validationConfig.allowedContentTypes) {
      const isAllowed = validationConfig.allowedContentTypes.some(allowed =>
        contentType.startsWith(allowed)
      );
      
      if (!isAllowed) {
        throw new Error(`Unsupported content type: ${contentType}`);
      }
    }
  }

  // Validate API key
  private async validateAPIKey(request: NextRequest): Promise<void> {
    const apiKeyConfig = this.config.apiKey;
    if (!apiKeyConfig?.required) return;

    const headerName = apiKeyConfig.headerName || 'X-API-Key';
    const apiKey = request.headers.get(headerName);

    if (!apiKey) {
      throw new Error('API key is required');
    }

    // Custom validation function
    if (apiKeyConfig.validateKey) {
      const isValid = await apiKeyConfig.validateKey(apiKey);
      if (!isValid) {
        throw new Error('Invalid API key');
      }
    } else {
      // Default validation against environment variable
      const validKey = process.env.API_KEY;
      if (validKey && apiKey !== validKey) {
        throw new Error('Invalid API key');
      }
    }
  }

  // Validate request signature
  private async validateSignature(request: NextRequest): Promise<void> {
    const signingConfig = this.config.signing;
    if (!signingConfig?.required) return;

    const signature = request.headers.get('X-Signature');
    const timestamp = request.headers.get('X-Timestamp');

    if (!signature || !timestamp) {
      throw new Error('Request signature and timestamp are required');
    }

    // Check timestamp tolerance
    const now = Date.now();
    const requestTime = parseInt(timestamp);
    const tolerance = signingConfig.timestampTolerance || 300000; // 5 minutes

    if (Math.abs(now - requestTime) > tolerance) {
      throw new Error('Request timestamp is outside acceptable range');
    }

    // Verify signature
    const secretKey = signingConfig.secretKey || process.env.SIGNING_SECRET;
    if (!secretKey) {
      throw new Error('Signing secret not configured');
    }

    const body = await request.text();
    const expectedSignature = this.generateSignature(
      request.method,
      request.nextUrl.pathname,
      body,
      timestamp,
      secretKey,
      signingConfig.algorithm || 'sha256'
    );

    if (signature !== expectedSignature) {
      throw new Error('Invalid request signature');
    }
  }

  // Generate request signature
  private generateSignature(
    method: string,
    path: string,
    body: string,
    timestamp: string,
    secret: string,
    algorithm: string = 'sha256'
  ): string {
    const payload = `${method}:${path}:${body}:${timestamp}`;
    return crypto
      .createHmac(algorithm, secret)
      .update(payload)
      .digest('hex');
  }

  // Detect suspicious activity
  private async detectSuspiciousActivity(request: NextRequest): Promise<void> {
    const suspiciousPatterns = [
      // SQL injection patterns
      /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/i,
      
      // XSS patterns
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      
      // Path traversal
      /\.\.\//g,
      /\.\.\\/g,
      
      // Command injection
      /[;&|`$()]/g,
      
      // Common attack strings
      /eval\s*\(/gi,
      /expression\s*\(/gi,
      /vbscript:/gi
    ];

    const url = request.url;
    const userAgent = request.headers.get('user-agent') || '';
    
    // Check URL for suspicious patterns
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(url)) {
        await this.logSuspiciousActivity(request, 'Suspicious URL pattern detected');
        throw new Error('Suspicious request detected');
      }
    }

    // Check for suspicious user agents
    const suspiciousUserAgents = [
      /sqlmap/i,
      /nikto/i,
      /nessus/i,
      /burp/i,
      /nmap/i,
      /masscan/i
    ];

    for (const pattern of suspiciousUserAgents) {
      if (pattern.test(userAgent)) {
        await this.logSuspiciousActivity(request, 'Suspicious user agent detected');
        throw new Error('Suspicious request detected');
      }
    }
  }

  // Log suspicious activity
  private async logSuspiciousActivity(request: NextRequest, reason: string): Promise<void> {
    try {
      const clientIP = this.getClientIP(request);
      
      await this.supabase
        .from('security_events')
        .insert({
          event_type: 'suspicious_activity',
          ip_address: clientIP,
          user_agent: request.headers.get('user-agent'),
          url: request.url,
          method: request.method,
          reason,
          timestamp: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log suspicious activity:', error);
    }
  }

  // Get client IP address
  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    return forwarded ? forwarded.split(',')[0] : 
           request.headers.get('x-real-ip') || 
           'unknown';
  }

  // Create security error response
  private createSecurityErrorResponse(error: any): NextResponse {
    const response = NextResponse.json(
      {
        error: 'Security validation failed',
        message: error.message || 'Request blocked by security policy'
      },
      { status: 403 }
    );

    // Apply security headers even to error responses
    this.applySecurityHeaders(response);
    
    return response;
  }
}

// Create security middleware with configuration
export function createSecurityMiddleware(config: SecurityConfig = {}) {
  const middleware = new SecurityMiddleware(config);
  
  return async function securityMiddleware(
    request: NextRequest,
    context?: { params?: any }
  ): Promise<NextResponse | null> {
    return middleware.apply(request);
  };
}

// Apply security headers to any response
export function withSecurityHeaders(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>,
  config: SecurityConfig = {}
) {
  const middleware = new SecurityMiddleware(config);
  
  return async function (req: NextRequest, context?: any): Promise<NextResponse> {
    // Check security before processing
    const securityResponse = await middleware.apply(req);
    if (securityResponse) {
      return securityResponse;
    }

    // Process the request
    const response = await handler(req, context);
    
    // Apply security headers to response
    middleware.applyCORSHeaders(response, req);
    middleware.applySecurityHeaders(response);
    
    return response;
  };
}

// Predefined security configurations
export const basicSecurity = createSecurityMiddleware();

export const strictSecurity = createSecurityMiddleware({
  ...DEFAULT_SECURITY_CONFIG,
  apiKey: {
    required: true,
    headerName: 'X-API-Key'
  },
  signing: {
    required: true,
    algorithm: 'sha256',
    timestampTolerance: 300000 // 5 minutes
  }
});

export const publicAPISecurity = createSecurityMiddleware({
  ...DEFAULT_SECURITY_CONFIG,
  cors: {
    origin: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false
  }
});

// IP whitelist middleware
export function createIPWhitelist(allowedIPs: string[]) {
  return async function ipWhitelist(
    request: NextRequest,
    context?: { params?: any }
  ): Promise<NextResponse | null> {
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                    request.headers.get('x-real-ip') || 
                    'unknown';

    if (!allowedIPs.includes(clientIP)) {
      return NextResponse.json(
        { error: 'Access denied', message: 'IP address not allowed' },
        { status: 403 }
      );
    }

    return null;
  };
}

// Request ID middleware for tracing
export function withRequestID(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async function (req: NextRequest, context?: any): Promise<NextResponse> {
    const requestId = crypto.randomUUID();
    
    // Add request ID to context
    const enhancedContext = {
      ...context,
      requestId
    };

    const response = await handler(req, enhancedContext);
    
    // Add request ID to response headers
    response.headers.set('X-Request-ID', requestId);
    
    return response;
  };
}

// Example usage in API routes:
/*
import { withSecurityHeaders, strictSecurity } from '@/api/middleware/security';

export const POST = withSecurityHeaders(
  async function handler(request: NextRequest) {
    // Your API logic here
    return NextResponse.json({ message: 'Success' });
  },
  {
    apiKey: { required: true },
    rateLimit: { windowMs: 60000, maxRequests: 10 }
  }
);
*/
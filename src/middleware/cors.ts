import { NextRequest, NextResponse } from 'next/server';

// Production-ready CORS configuration
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://tahitispeak.vercel.app',
  'https://tahitispeak.com',
  'https://www.tahitispeak.com',
  // Add your production domains here
];

const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'];
const ALLOWED_HEADERS = [
  'Content-Type',
  'Authorization',
  'X-Requested-With',
  'X-CSRF-Token',
  'X-Request-Signature',
  'Accept',
  'Origin',
  'User-Agent',
  'DNT',
  'Cache-Control',
  'X-Mx-ReqToken',
  'Keep-Alive',
  'If-Modified-Since',
];

export function createCORSHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get('origin');
  const isAllowedOrigin = origin && ALLOWED_ORIGINS.includes(origin);
  
  // For development, allow localhost with any port
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isLocalhost = origin && origin.match(/^https?:\/\/localhost(:\d+)?$/);
  
  const allowedOrigin = isAllowedOrigin || (isDevelopment && isLocalhost) ? origin : 'null';
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': ALLOWED_METHODS.join(', '),
    'Access-Control-Allow-Headers': ALLOWED_HEADERS.join(', '),
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours
    'Vary': 'Origin',
  };
}

export function handleCORSPreflight(request: NextRequest): NextResponse {
  const corsHeaders = createCORSHeaders(request);
  
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export function addCORSHeaders(response: NextResponse, request: NextRequest): NextResponse {
  const corsHeaders = createCORSHeaders(request);
  
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

// Security headers for all responses
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://va.vercel-scripts.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "media-src 'self' data: https: blob:",
    "connect-src 'self' https://api.openai.com https://*.supabase.co wss://*.supabase.co https://vercel.live",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  
  // HSTS for HTTPS
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  return response;
}
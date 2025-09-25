import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Types
interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  name: string;
  iat: number;
  exp: number;
  jti: string;
}

// Protected routes configuration
const protectedRoutes = {
  // Routes that require authentication
  authenticated: [
    '/dashboard',
    '/profile',
    '/lessons',
    '/vocabulary',
    '/progress',
    '/settings'
  ],
  // Routes that require admin role
  admin: [
    '/admin',
    '/admin/dashboard',
    '/admin/users',
    '/admin/content',
    '/admin/analytics',
    '/admin/settings'
  ],
  // Routes that require instructor role or higher
  instructor: [
    '/instructor',
    '/instructor/dashboard',
    '/instructor/lessons',
    '/instructor/students'
  ],
  // Public routes (no authentication required)
  public: [
    '/',
    '/login',
    '/register',
    '/reset-password',
    '/about',
    '/contact',
    '/privacy',
    '/terms'
  ],
  // API routes that need authentication
  apiProtected: [
    '/api/lessons',
    '/api/vocabulary',
    '/api/progress',
    '/api/user'
  ],
  // API routes that need admin access
  apiAdmin: [
    '/api/admin',
    '/api/users',
    '/api/analytics'
  ]
};

// Verify JWT token
function verifyToken(token: string): JWTPayload | null {
  try {
    const jwtSecret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT secret not configured');
      return null;
    }

    const decoded = jwt.verify(token, jwtSecret, {
      issuer: 'tahitian-tutor',
      audience: 'tahitian-tutor-app'
    }) as JWTPayload;

    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// Check if route requires authentication
function requiresAuth(pathname: string): boolean {
  return protectedRoutes.authenticated.some(route => 
    pathname.startsWith(route)
  ) || requiresAdminAuth(pathname) || requiresInstructorAuth(pathname);
}

// Check if route requires admin authentication
function requiresAdminAuth(pathname: string): boolean {
  return protectedRoutes.admin.some(route => 
    pathname.startsWith(route)
  ) || protectedRoutes.apiAdmin.some(route => 
    pathname.startsWith(route)
  );
}

// Check if route requires instructor authentication
function requiresInstructorAuth(pathname: string): boolean {
  return protectedRoutes.instructor.some(route => 
    pathname.startsWith(route)
  );
}

// Check if route is public
function isPublicRoute(pathname: string): boolean {
  return protectedRoutes.public.some(route => 
    pathname === route || (route === '/' && pathname === '/')
  ) || pathname.startsWith('/api/auth') || pathname.startsWith('/api/test') || 
     pathname.startsWith('/_next') || pathname.startsWith('/favicon') || 
     pathname.startsWith('/manifest') || pathname.startsWith('/sw.js') || 
     pathname.startsWith('/offline');
}

// Check if user has required role
function hasRequiredRole(userRole: string, requiredRole: string): boolean {
  const roleHierarchy = {
    'student': 1,
    'instructor': 2,
    'admin': 3
  };

  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

  return userLevel >= requiredLevel;
}

// Get authentication token from request
function getAuthToken(request: NextRequest): string | null {
  // Check Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check cookies for web routes
  const tokenCookie = request.cookies.get('access_token');
  if (tokenCookie) {
    return tokenCookie.value;
  }

  return null;
}

// Create redirect response
function createRedirectResponse(url: string, request: NextRequest): NextResponse {
  const redirectUrl = new URL(url, request.url);
  
  // Add return URL for post-login redirect
  if (url === '/login' && request.nextUrl.pathname !== '/login') {
    redirectUrl.searchParams.set('returnUrl', request.nextUrl.pathname);
  }
  
  return NextResponse.redirect(redirectUrl);
}

// Create unauthorized response
function createUnauthorizedResponse(request: NextRequest): NextResponse {
  const isApiRoute = request.nextUrl.pathname.startsWith('/api');
  
  if (isApiRoute) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  return createRedirectResponse('/login', request);
}

// Create forbidden response
function createForbiddenResponse(request: NextRequest): NextResponse {
  const isApiRoute = request.nextUrl.pathname.startsWith('/api');
  
  if (isApiRoute) {
    return NextResponse.json(
      { error: 'Forbidden - Insufficient permissions' },
      { status: 403 }
    );
  }
  
  return createRedirectResponse('/dashboard', request);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/_next/') ||
    pathname.includes('.') && !pathname.startsWith('/api/') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return NextResponse.next();
  }

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Get authentication token
  const token = getAuthToken(request);
  
  if (!token) {
    return createUnauthorizedResponse(request);
  }

  // Verify token
  const payload = verifyToken(token);
  if (!payload) {
    return createUnauthorizedResponse(request);
  }

  // Check if token is expired
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) {
    return createUnauthorizedResponse(request);
  }

  // Check role-based access
  if (requiresAdminAuth(pathname)) {
    if (!hasRequiredRole(payload.role, 'admin')) {
      return createForbiddenResponse(request);
    }
  } else if (requiresInstructorAuth(pathname)) {
    if (!hasRequiredRole(payload.role, 'instructor')) {
      return createForbiddenResponse(request);
    }
  }

  // Add user info to headers for API routes
  if (pathname.startsWith('/api/')) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.sub);
    requestHeaders.set('x-user-email', payload.email);
    requestHeaders.set('x-user-role', payload.role);
    requestHeaders.set('x-user-name', payload.name);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Continue to the requested page
  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
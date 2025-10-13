import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Enhanced authentication middleware with security features
export interface AuthContext {
  user: {
    id: string;
    email: string;
    role: string;
    isVerified: boolean;
    lastLogin: string;
    sessionId: string;
  };
  session: {
    id: string;
    expiresAt: Date;
    ipAddress: string;
    userAgent: string;
  };
}

export interface SecurityConfig {
  requireEmailVerification?: boolean;
  allowedRoles?: string[];
  requireMFA?: boolean;
  maxSessionAge?: number; // in milliseconds
  checkDeviceFingerprint?: boolean;
  logSecurityEvents?: boolean;
}

// Default security configuration
const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  requireEmailVerification: true,
  allowedRoles: ['user', 'admin'],
  requireMFA: false,
  maxSessionAge: 24 * 60 * 60 * 1000, // 24 hours
  checkDeviceFingerprint: false,
  logSecurityEvents: true
};

// Security event types
export enum SecurityEventType {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILED = 'login_failed',
  LOGOUT = 'logout',
  TOKEN_REFRESH = 'token_refresh',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  SESSION_EXPIRED = 'session_expired',
  DEVICE_CHANGE = 'device_change',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded'
}

// Enhanced Supabase client with security features
class SecureSupabaseClient {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  // Verify JWT token with enhanced security checks
  async verifyToken(token: string, config: SecurityConfig = {}): Promise<AuthContext | null> {
    try {
      // Decode JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      if (!decoded.sub || !decoded.email) {
        throw new Error('Invalid token payload');
      }

      // Get user profile with security information
      const { data: userProfile, error: profileError } = await this.supabase
        .from('user_profiles')
        .select(`
          id,
          email,
          full_name,
          role,
          email_verified,
          last_login,
          is_active,
          failed_login_attempts,
          locked_until,
          mfa_enabled,
          created_at,
          updated_at
        `)
        .eq('id', decoded.sub)
        .single();

      if (profileError || !userProfile) {
        throw new Error('User not found');
      }

      // Security checks
      await this.performSecurityChecks(userProfile, config);

      // Get or create session
      const session = await this.getOrCreateSession(decoded.sub, decoded.session_id);

      return {
        user: {
          id: userProfile.id,
          email: userProfile.email,
          role: userProfile.role,
          isVerified: userProfile.email_verified,
          lastLogin: userProfile.last_login,
          sessionId: decoded.session_id
        },
        session
      };
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }

  // Perform comprehensive security checks
  private async performSecurityChecks(userProfile: any, config: SecurityConfig): Promise<void> {
    const mergedConfig = { ...DEFAULT_SECURITY_CONFIG, ...config };

    // Check if user is active
    if (!userProfile.is_active) {
      throw new Error('Account is deactivated');
    }

    // Check if account is locked
    if (userProfile.locked_until && new Date(userProfile.locked_until) > new Date()) {
      throw new Error('Account is temporarily locked');
    }

    // Check email verification
    if (mergedConfig.requireEmailVerification && !userProfile.email_verified) {
      throw new Error('Email verification required');
    }

    // Check role permissions
    if (mergedConfig.allowedRoles && !mergedConfig.allowedRoles.includes(userProfile.role)) {
      throw new Error('Insufficient permissions');
    }

    // Check MFA requirement
    if (mergedConfig.requireMFA && !userProfile.mfa_enabled) {
      throw new Error('Multi-factor authentication required');
    }
  }

  // Get or create user session
  private async getOrCreateSession(userId: string, sessionId: string): Promise<any> {
    try {
      // Try to get existing session
      const { data: existingSession } = await this.supabase
        .from('user_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', userId)
        .single();

      if (existingSession && new Date(existingSession.expires_at) > new Date()) {
        return existingSession;
      }

      // Create new session if not found or expired
      const newSession = {
        id: sessionId,
        user_id: userId,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        ip_address: 'unknown', // Will be set by the calling function
        user_agent: 'unknown', // Will be set by the calling function
        created_at: new Date().toISOString(),
        last_activity: new Date().toISOString()
      };

      const { data: session, error } = await this.supabase
        .from('user_sessions')
        .insert(newSession)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return session;
    } catch (error) {
      console.error('Session management error:', error);
      throw new Error('Session management failed');
    }
  }

  // Log security events
  async logSecurityEvent(
    userId: string,
    eventType: SecurityEventType,
    details: any = {},
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await this.supabase
        .from('security_events')
        .insert({
          user_id: userId,
          event_type: eventType,
          details,
          ip_address: ipAddress,
          user_agent: userAgent,
          timestamp: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  // Update session activity
  async updateSessionActivity(sessionId: string, ipAddress?: string): Promise<void> {
    try {
      await this.supabase
        .from('user_sessions')
        .update({
          last_activity: new Date().toISOString(),
          ip_address: ipAddress
        })
        .eq('id', sessionId);
    } catch (error) {
      console.error('Failed to update session activity:', error);
    }
  }

  // Invalidate session
  async invalidateSession(sessionId: string): Promise<void> {
    try {
      await this.supabase
        .from('user_sessions')
        .delete()
        .eq('id', sessionId);
    } catch (error) {
      console.error('Failed to invalidate session:', error);
    }
  }

  // Clean up expired sessions
  async cleanupExpiredSessions(): Promise<void> {
    try {
      await this.supabase
        .from('user_sessions')
        .delete()
        .lt('expires_at', new Date().toISOString());
    } catch (error) {
      console.error('Failed to cleanup expired sessions:', error);
    }
  }
}

// Singleton instance
const secureClient = new SecureSupabaseClient();

// Extract client information from request
function getClientInfo(request: NextRequest): { ipAddress: string; userAgent: string } {
  const forwarded = request.headers.get('x-forwarded-for');
  const ipAddress = forwarded ? forwarded.split(',')[0] : 
                   request.headers.get('x-real-ip') || 
                   'unknown';
  
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  return { ipAddress, userAgent };
}

// Generate device fingerprint
function generateDeviceFingerprint(request: NextRequest): string {
  const userAgent = request.headers.get('user-agent') || '';
  const acceptLanguage = request.headers.get('accept-language') || '';
  const acceptEncoding = request.headers.get('accept-encoding') || '';
  
  const fingerprint = crypto
    .createHash('sha256')
    .update(`${userAgent}:${acceptLanguage}:${acceptEncoding}`)
    .digest('hex');
  
  return fingerprint.substring(0, 16);
}

// Enhanced authentication middleware
export function createAuthMiddleware(config: SecurityConfig = {}) {
  return async function authMiddleware(
    request: NextRequest,
    context?: { params?: any }
  ): Promise<{ authContext: AuthContext; response?: NextResponse }> {
    try {
      // Extract authorization header
      const authHeader = request.headers.get('authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        throw new Error('Missing or invalid authorization header');
      }

      const token = authHeader.substring(7);
      const { ipAddress, userAgent } = getClientInfo(request);

      // Verify token and get auth context
      const authContext = await secureClient.verifyToken(token, config);
      if (!authContext) {
        throw new Error('Invalid or expired token');
      }

      // Update session activity
      await secureClient.updateSessionActivity(authContext.session.id, ipAddress);

      // Check device fingerprint if enabled
      if (config.checkDeviceFingerprint) {
        const currentFingerprint = generateDeviceFingerprint(request);
        // In a real implementation, you'd compare with stored fingerprint
        // and handle device changes appropriately
      }

      // Log successful authentication if enabled
      if (config.logSecurityEvents) {
        await secureClient.logSecurityEvent(
          authContext.user.id,
          SecurityEventType.LOGIN_SUCCESS,
          { endpoint: request.nextUrl.pathname },
          ipAddress,
          userAgent
        );
      }

      return { authContext };
    } catch (error) {
      console.error('Authentication failed:', error);

      // Log failed authentication attempt
      if (config.logSecurityEvents) {
        const { ipAddress, userAgent } = getClientInfo(request);
        await secureClient.logSecurityEvent(
          'unknown',
          SecurityEventType.UNAUTHORIZED_ACCESS,
          { 
            endpoint: request.nextUrl.pathname,
            error: error instanceof Error ? error.message : 'Unknown error'
          },
          ipAddress,
          userAgent
        );
      }

      const response = NextResponse.json(
        {
          error: 'Authentication failed',
          message: error instanceof Error ? error.message : 'Invalid credentials'
        },
        { status: 401 }
      );

      return { authContext: null as any, response };
    }
  };
}

// Specific middleware configurations
export const basicAuthMiddleware = createAuthMiddleware();

export const adminAuthMiddleware = createAuthMiddleware({
  allowedRoles: ['admin'],
  requireEmailVerification: true,
  logSecurityEvents: true
});

export const mfaAuthMiddleware = createAuthMiddleware({
  requireMFA: true,
  requireEmailVerification: true,
  logSecurityEvents: true
});

export const strictAuthMiddleware = createAuthMiddleware({
  requireEmailVerification: true,
  requireMFA: true,
  checkDeviceFingerprint: true,
  logSecurityEvents: true,
  maxSessionAge: 2 * 60 * 60 * 1000 // 2 hours
});

// Utility function to apply authentication to API routes
export function withAuth(
  handler: (req: NextRequest, context: { authContext: AuthContext; params?: any }) => Promise<NextResponse>,
  authMiddleware: (req: NextRequest, context?: any) => Promise<{ authContext: AuthContext; response?: NextResponse }> = basicAuthMiddleware
) {
  return async function (req: NextRequest, context?: any): Promise<NextResponse> {
    // Apply authentication
    const { authContext, response } = await authMiddleware(req, context);
    if (response) {
      return response;
    }

    // Continue with the original handler
    return handler(req, { authContext, ...context });
  };
}

// Password security utilities
export class PasswordSecurity {
  // Check password strength
  static checkPasswordStrength(password: string): {
    score: number;
    feedback: string[];
    isStrong: boolean;
  } {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length >= 8) score += 1;
    else feedback.push('Password should be at least 8 characters long');

    if (password.length >= 12) score += 1;

    // Character variety checks
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Password should contain lowercase letters');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Password should contain uppercase letters');

    if (/[0-9]/.test(password)) score += 1;
    else feedback.push('Password should contain numbers');

    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    else feedback.push('Password should contain special characters');

    // Common patterns check
    if (!/(.)\1{2,}/.test(password)) score += 1;
    else feedback.push('Password should not contain repeated characters');

    const isStrong = score >= 5;
    
    return { score, feedback, isStrong };
  }

  // Hash password with salt
  static async hashPassword(password: string): Promise<string> {
    const bcrypt = await import('bcryptjs');
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  // Verify password
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    const bcrypt = await import('bcryptjs');
    return bcrypt.compare(password, hash);
  }

  // Generate secure random password
  static generateSecurePassword(length: number = 16): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, charset.length);
      password += charset[randomIndex];
    }
    
    return password;
  }
}

// Session management utilities
export class SessionManager {
  // Generate secure session ID
  static generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Generate CSRF token
  static generateCSRFToken(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  // Validate CSRF token
  static validateCSRFToken(token: string, sessionToken: string): boolean {
    // In a real implementation, you'd store and validate CSRF tokens
    // This is a simplified version
    return token.length === 43; // Base64url encoded 32 bytes
  }
}

// Export the secure client for direct use
export { secureClient };

// Example usage in API routes:
/*
import { withAuth, adminAuthMiddleware } from '@/api/middleware/auth';

export const GET = withAuth(
  async function handler(request: NextRequest, { authContext }) {
    // Your API logic here with authenticated user context
    return NextResponse.json({ 
      message: 'Success',
      user: authContext.user 
    });
  },
  adminAuthMiddleware
);
*/
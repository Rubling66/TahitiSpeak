import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
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

// Initialize Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Verify access token
function verifyAccessToken(token: string): JWTPayload {
  const jwtSecret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT secret not configured');
  }

  try {
    const decoded = jwt.verify(token, jwtSecret, {
      issuer: 'tahitian-tutor',
      audience: 'tahitian-tutor-app'
    }) as JWTPayload;

    return decoded;
  } catch (error) {
    throw new Error('Invalid access token');
  }
}

// Invalidate all user sessions
async function invalidateUserSessions(supabase: any, userId: string): Promise<void> {
  const { error } = await supabase
    .from('user_sessions')
    .update({ 
      is_active: false,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) {
    console.error('Failed to invalidate user sessions:', error);
    throw new Error('Failed to invalidate sessions');
  }
}

// Log logout activity
async function logLogoutActivity(supabase: any, userId: string, request: NextRequest): Promise<void> {
  try {
    await supabase
      .from('user_activity_logs')
      .insert({
        user_id: userId,
        action: 'user_logout',
        details: {
          logout_method: 'manual',
          timestamp: new Date().toISOString()
        },
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Failed to log logout activity:', error);
    // Don't throw here, as logout should still succeed
  }
}

// Update user last activity
async function updateUserLastActivity(supabase: any, userId: string): Promise<void> {
  try {
    await supabase
      .from('users')
      .update({ 
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
  } catch (error) {
    console.error('Failed to update user last activity:', error);
    // Don't throw here, as logout should still succeed
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const accessToken = authHeader.substring(7);

    // Verify access token
    let decoded: JWTPayload;
    try {
      decoded = verifyAccessToken(accessToken);
    } catch (error) {
      // Even if token is invalid, we should still try to clear cookies
      const response = NextResponse.json({
        success: true,
        message: 'Logged out successfully'
      });

      // Clear refresh token cookie
      response.cookies.set('refresh_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0,
        path: '/'
      });

      return response;
    }

    const userId = decoded.sub;

    // Initialize Supabase
    const supabase = getSupabaseClient();

    // Invalidate all user sessions and log activity
    await Promise.all([
      invalidateUserSessions(supabase, userId),
      logLogoutActivity(supabase, userId, request),
      updateUserLastActivity(supabase, userId)
    ]);

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    // Clear refresh token cookie
    response.cookies.set('refresh_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('[Auth] Logout error:', error);

    if (error instanceof Error) {
      // Handle specific errors
      if (error.message.includes('Missing Supabase configuration') || 
          error.message.includes('JWT secret not configured')) {
        return NextResponse.json(
          { error: 'Service temporarily unavailable' },
          { status: 503 }
        );
      }

      if (error.message.includes('Failed to invalidate sessions')) {
        return NextResponse.json(
          { error: 'Failed to complete logout process' },
          { status: 500 }
        );
      }
    }

    // Even if there's an error, we should still clear cookies and return success
    // to ensure the client-side logout completes
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    response.cookies.set('refresh_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    });

    return response;
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
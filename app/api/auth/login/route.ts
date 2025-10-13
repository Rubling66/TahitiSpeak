import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

// Validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false)
});

// Types
interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'instructor' | 'student';
  avatar?: string;
  preferences?: any;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
  is_email_verified: boolean;
  is_active: boolean;
  password_hash: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
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

// Generate JWT tokens
function generateTokens(user: User): AuthTokens {
  const jwtSecret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT secret not configured');
  }

  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    iat: Math.floor(Date.now() / 1000),
    jti: `${user.id}_${Date.now()}` // Unique token ID
  };

  // Access token (15 minutes)
  const accessToken = jwt.sign(payload, jwtSecret, {
    expiresIn: '15m',
    issuer: 'tahitian-tutor',
    audience: 'tahitian-tutor-app'
  });

  // Refresh token (7 days or 30 days if remember me)
  const refreshTokenPayload = {
    sub: user.id,
    type: 'refresh',
    jti: `refresh_${user.id}_${Date.now()}`
  };

  const refreshToken = jwt.sign(refreshTokenPayload, jwtSecret, {
    expiresIn: '7d', // Always 7 days for security
    issuer: 'tahitian-tutor',
    audience: 'tahitian-tutor-app'
  });

  const expiresAt = Date.now() + (15 * 60 * 1000); // 15 minutes

  return {
    accessToken,
    refreshToken,
    expiresAt
  };
}

// Update user last login
async function updateLastLogin(supabase: any, userId: string): Promise<void> {
  const { error } = await supabase
    .from('user_profiles')
    .update({ 
      last_login_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  if (error) {
    console.error('Failed to update last login:', error);
    // Don't throw here, as login should still succeed
  }
}

// Store refresh token
async function storeRefreshToken(supabase: any, userId: string, refreshToken: string): Promise<void> {
  const { error } = await supabase
    .from('user_sessions')
    .insert({
      user_id: userId,
      refresh_token: refreshToken,
      expires_at: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString(), // 7 days
      created_at: new Date().toISOString(),
      is_active: true
    });

  if (error) {
    console.error('Failed to store refresh token:', error);
    // Don't throw here, as login should still succeed
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = loginSchema.parse(body);
    const { email, password, rememberMe } = validatedData;

    // Initialize Supabase
    const supabase = getSupabaseClient();

    // Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password: password
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    const user = {
      id: authData.user.id,
      email: authData.user.email,
      name: profile.full_name,
      role: profile.role
    };

    // Supabase Auth already verified the password and user status

    // Generate tokens
    const tokens = generateTokens(user);

    // Update last login and store refresh token
    await Promise.all([
      updateLastLogin(supabase, user.id),
      storeRefreshToken(supabase, user.id, tokens.refreshToken)
    ]);

    // Prepare user data (exclude sensitive information)
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      preferences: user.preferences,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      lastLoginAt: new Date().toISOString(),
      isEmailVerified: user.is_email_verified,
      isActive: user.is_active
    };

    // Set secure HTTP-only cookie for refresh token (optional)
    const response = NextResponse.json({
      success: true,
      user: userData,
      tokens
    });

    // Set refresh token as HTTP-only cookie if remember me is enabled
    if (rememberMe) {
      response.cookies.set('refresh_token', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/'
      });
    }

    return response;

  } catch (error) {
    console.error('[Auth] Login error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid input data',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      // Don't expose internal errors to client
      if (error.message.includes('Missing Supabase configuration') || 
          error.message.includes('JWT secret not configured')) {
        return NextResponse.json(
          { error: 'Service temporarily unavailable' },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://tahitispeak.vercel.app',
    'https://tahitispeak.com',
    'https://www.tahitispeak.com'
  ];
  
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isLocalhost = origin && origin.match(/^https?:\/\/localhost(:\d+)?$/);
  const isAllowedOrigin = origin && allowedOrigins.includes(origin);
  
  const allowedOrigin = isAllowedOrigin || (isDevelopment && isLocalhost) ? origin : null;
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin || 'null',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Vary': 'Origin',
    },
  });
}
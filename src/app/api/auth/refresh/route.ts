import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

// Validation schema
const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

// Types
interface RefreshTokenPayload {
  sub: string;
  type: string;
  jti: string;
  iat: number;
  exp: number;
}

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

// Verify refresh token
function verifyRefreshToken(token: string): RefreshTokenPayload {
  const jwtSecret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT secret not configured');
  }

  try {
    const decoded = jwt.verify(token, jwtSecret, {
      issuer: 'tahitian-tutor',
      audience: 'tahitian-tutor-app'
    }) as RefreshTokenPayload;

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
}

// Generate new JWT tokens
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

  // New refresh token (7 days)
  const refreshTokenPayload = {
    sub: user.id,
    type: 'refresh',
    jti: `refresh_${user.id}_${Date.now()}`
  };

  const refreshToken = jwt.sign(refreshTokenPayload, jwtSecret, {
    expiresIn: '7d',
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

// Validate refresh token in database
async function validateRefreshTokenInDB(supabase: any, userId: string, refreshToken: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('refresh_token', refreshToken)
    .eq('is_active', true)
    .gte('expires_at', new Date().toISOString())
    .single();

  return !error && !!data;
}

// Invalidate old refresh token
async function invalidateRefreshToken(supabase: any, refreshToken: string): Promise<void> {
  const { error } = await supabase
    .from('user_sessions')
    .update({ 
      is_active: false,
      updated_at: new Date().toISOString()
    })
    .eq('refresh_token', refreshToken);

  if (error) {
    console.error('Failed to invalidate refresh token:', error);
  }
}

// Store new refresh token
async function storeNewRefreshToken(supabase: any, userId: string, refreshToken: string): Promise<void> {
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
    console.error('Failed to store new refresh token:', error);
  }
}

// Get user by ID
async function getUserById(supabase: any, userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

// Update user last activity
async function updateLastActivity(supabase: any, userId: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ 
      last_login_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  if (error) {
    console.error('Failed to update last activity:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = refreshSchema.parse(body);
    const { refreshToken } = validatedData;

    // Also check for refresh token in cookies
    const cookieRefreshToken = request.cookies.get('refresh_token')?.value;
    const tokenToUse = refreshToken || cookieRefreshToken;

    if (!tokenToUse) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      );
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(tokenToUse);
    const userId = decoded.sub;

    // Initialize Supabase
    const supabase = getSupabaseClient();

    // Validate refresh token in database
    const isValidInDB = await validateRefreshTokenInDB(supabase, userId, tokenToUse);
    if (!isValidInDB) {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    // Get user data
    const user = await getUserById(supabase, userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 401 }
      );
    }

    // Generate new tokens
    const newTokens = generateTokens(user);

    // Invalidate old refresh token and store new one
    await Promise.all([
      invalidateRefreshToken(supabase, tokenToUse),
      storeNewRefreshToken(supabase, userId, newTokens.refreshToken),
      updateLastActivity(supabase, userId)
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
      lastLoginAt: user.last_login_at,
      isEmailVerified: user.is_email_verified,
      isActive: user.is_active
    };

    // Create response
    const response = NextResponse.json({
      success: true,
      tokens: newTokens,
      user: userData
    });

    // Update refresh token cookie if it was provided via cookie
    if (cookieRefreshToken) {
      response.cookies.set('refresh_token', newTokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/'
      });
    }

    return response;

  } catch (error) {
    console.error('[Auth] Token refresh error:', error);

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
      // Handle specific errors
      if (error.message.includes('Invalid refresh token') || 
          error.message.includes('Invalid token type')) {
        return NextResponse.json(
          { error: 'Invalid refresh token' },
          { status: 401 }
        );
      }

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
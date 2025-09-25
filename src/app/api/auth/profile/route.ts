import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

// Validation schemas
const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  email: z.string().email('Invalid email format').optional(),
  currentPassword: z.string().min(1, 'Current password is required').optional(),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number')
    .optional(),
  preferences: z.object({
    language: z.enum(['en', 'fr', 'ty']).optional(),
    theme: z.enum(['light', 'dark', 'system']).optional(),
    notifications: z.object({
      email: z.boolean().optional(),
      push: z.boolean().optional(),
      reminders: z.boolean().optional()
    }).optional(),
    learning: z.object({
      daily_goal: z.number().min(1).max(1000).optional(),
      difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
      auto_play_audio: z.boolean().optional()
    }).optional()
  }).optional()
}).refine((data) => {
  // If newPassword is provided, currentPassword must also be provided
  if (data.newPassword && !data.currentPassword) {
    return false;
  }
  return true;
}, {
  message: 'Current password is required when changing password',
  path: ['currentPassword']
});

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

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  preferences: any;
  created_at: string;
  updated_at: string;
  last_login_at: string;
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

// Get user profile
async function getUserProfile(supabase: any, userId: string): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, name, role, preferences, created_at, updated_at, last_login_at')
    .eq('id', userId)
    .single();

  if (error || !data) {
    throw new Error('User not found');
  }

  return data;
}

// Verify current password
async function verifyCurrentPassword(supabase: any, userId: string, currentPassword: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('users')
    .select('password_hash')
    .eq('id', userId)
    .single();

  if (error || !data) {
    throw new Error('User not found');
  }

  return await bcrypt.compare(currentPassword, data.password_hash);
}

// Check if email is already taken
async function isEmailTaken(supabase: any, email: string, excludeUserId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .neq('id', excludeUserId)
    .single();

  return !error && data;
}

// Update user profile
async function updateUserProfile(supabase: any, userId: string, updates: any): Promise<UserProfile> {
  const updateData: any = {
    updated_at: new Date().toISOString()
  };

  // Handle basic profile updates
  if (updates.name) updateData.name = updates.name;
  if (updates.email) updateData.email = updates.email;
  if (updates.preferences) {
    // Merge with existing preferences
    const { data: currentUser } = await supabase
      .from('users')
      .select('preferences')
      .eq('id', userId)
      .single();

    updateData.preferences = {
      ...currentUser?.preferences,
      ...updates.preferences
    };
  }

  // Handle password update
  if (updates.newPassword) {
    const saltRounds = 12;
    updateData.password_hash = await bcrypt.hash(updates.newPassword, saltRounds);
  }

  const { data, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId)
    .select('id, email, name, role, preferences, created_at, updated_at, last_login_at')
    .single();

  if (error) {
    console.error('Failed to update user profile:', error);
    throw new Error('Failed to update profile');
  }

  return data;
}

// Log profile update activity
async function logProfileUpdateActivity(supabase: any, userId: string, updates: any, request: NextRequest): Promise<void> {
  try {
    const changedFields = Object.keys(updates).filter(key => key !== 'currentPassword');
    
    await supabase
      .from('user_activity_logs')
      .insert({
        user_id: userId,
        action: 'profile_updated',
        details: {
          changed_fields: changedFields,
          timestamp: new Date().toISOString()
        },
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Failed to log profile update activity:', error);
    // Don't throw here
  }
}

// GET - Retrieve user profile
export async function GET(request: NextRequest) {
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
    const decoded = verifyAccessToken(accessToken);
    const userId = decoded.sub;

    // Initialize Supabase
    const supabase = getSupabaseClient();

    // Get user profile
    const profile = await getUserProfile(supabase, userId);

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role,
          preferences: profile.preferences || {},
          created_at: profile.created_at,
          updated_at: profile.updated_at,
          last_login_at: profile.last_login_at
        }
      }
    });

  } catch (error) {
    console.error('[Auth] Get profile error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Invalid access token')) {
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        );
      }

      if (error.message.includes('User not found')) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
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

// PUT - Update user profile
export async function PUT(request: NextRequest) {
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
    const decoded = verifyAccessToken(accessToken);
    const userId = decoded.sub;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    // Initialize Supabase
    const supabase = getSupabaseClient();

    // Verify current password if changing password
    if (validatedData.newPassword && validatedData.currentPassword) {
      const isValidPassword = await verifyCurrentPassword(supabase, userId, validatedData.currentPassword);
      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        );
      }
    }

    // Check if email is already taken
    if (validatedData.email) {
      const emailTaken = await isEmailTaken(supabase, validatedData.email, userId);
      if (emailTaken) {
        return NextResponse.json(
          { error: 'Email is already in use' },
          { status: 400 }
        );
      }
    }

    // Update user profile
    const updatedProfile = await updateUserProfile(supabase, userId, validatedData);

    // Log activity
    await logProfileUpdateActivity(supabase, userId, validatedData, request);

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: updatedProfile.id,
          email: updatedProfile.email,
          name: updatedProfile.name,
          role: updatedProfile.role,
          preferences: updatedProfile.preferences || {},
          created_at: updatedProfile.created_at,
          updated_at: updatedProfile.updated_at,
          last_login_at: updatedProfile.last_login_at
        }
      }
    });

  } catch (error) {
    console.error('[Auth] Update profile error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message.includes('Invalid access token')) {
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        );
      }

      if (error.message.includes('User not found')) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      if (error.message.includes('Failed to update profile')) {
        return NextResponse.json(
          { error: 'Failed to update profile' },
          { status: 500 }
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
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// Validation schema
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  role: z.enum(['student', 'instructor']).optional().default('student')
});

// Types
interface UserPreferences {
  language: string;
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    lessons: boolean;
    progress: boolean;
  };
  learningGoals: {
    dailyMinutes: number;
    weeklyLessons: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
  };
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

// Generate default user preferences
function generateDefaultPreferences(): UserPreferences {
  return {
    language: 'en',
    theme: 'system',
    notifications: {
      email: true,
      push: true,
      lessons: true,
      progress: true
    },
    learningGoals: {
      dailyMinutes: 30,
      weeklyLessons: 5,
      difficulty: 'beginner'
    }
  };
}

// Check if email already exists
async function checkEmailExists(supabase: any, email: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase())
    .single();

  return !error && !!data;
}

// Create user account
async function createUser(supabase: any, userData: any): Promise<any> {
  const { data, error } = await supabase
    .from('users')
    .insert(userData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create user: ${error.message}`);
  }

  return data;
}

// Send welcome email (placeholder)
async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  // TODO: Implement email service integration
  console.log(`Welcome email would be sent to ${email} for ${name}`);
}

// Send email verification (placeholder)
async function sendEmailVerification(email: string, verificationToken: string): Promise<void> {
  // TODO: Implement email verification service
  console.log(`Email verification would be sent to ${email} with token ${verificationToken}`);
}

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = registerSchema.parse(body);
    const { email, password, name, role } = validatedData;

    // Initialize Supabase
    const supabase = getSupabaseClient();

    // Check if email already exists
    const emailExists = await checkEmailExists(supabase, email);
    if (emailExists) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Generate user ID and verification token
    const userId = uuidv4();
    const verificationToken = uuidv4();
    const now = new Date().toISOString();

    // Prepare user data
    const userData = {
      id: userId,
      email: email.toLowerCase(),
      name: name.trim(),
      role,
      password_hash: passwordHash,
      preferences: generateDefaultPreferences(),
      created_at: now,
      updated_at: now,
      is_email_verified: false,
      is_active: true,
      email_verification_token: verificationToken,
      email_verification_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };

    // Create user
    const createdUser = await createUser(supabase, userData);

    // Send welcome and verification emails
    try {
      await Promise.all([
        sendWelcomeEmail(email, name),
        sendEmailVerification(email, verificationToken)
      ]);
    } catch (emailError) {
      console.error('[Auth] Failed to send emails:', emailError);
      // Don't fail registration if emails fail
    }

    // Log registration event
    try {
      await supabase
        .from('user_activity_logs')
        .insert({
          user_id: userId,
          action: 'user_registered',
          details: {
            email,
            name,
            role,
            registration_method: 'email'
          },
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
          created_at: now
        });
    } catch (logError) {
      console.error('[Auth] Failed to log registration:', logError);
      // Don't fail registration if logging fails
    }

    // Return success response (don't include sensitive data)
    return NextResponse.json({
      success: true,
      message: 'Account created successfully. Please check your email to verify your account.',
      user: {
        id: createdUser.id,
        email: createdUser.email,
        name: createdUser.name,
        role: createdUser.role,
        isEmailVerified: false,
        createdAt: createdUser.created_at
      }
    }, { status: 201 });

  } catch (error) {
    console.error('[Auth] Registration error:', error);

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
      if (error.message.includes('Missing Supabase configuration')) {
        return NextResponse.json(
          { error: 'Service temporarily unavailable' },
          { status: 503 }
        );
      }

      if (error.message.includes('Failed to create user')) {
        return NextResponse.json(
          { error: 'Failed to create account. Please try again.' },
          { status: 500 }
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
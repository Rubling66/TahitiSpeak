import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
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
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
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

// Create user with Supabase Auth
async function createUserWithAuth(supabase: any, email: string, password: string, name: string, role: string): Promise<any> {
  // Create user with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: email.toLowerCase(),
    password: password,
    email_confirm: true, // Auto-confirm for development
    user_metadata: {
      name: name.trim(),
      role: role
    }
  });

  if (authError) {
    throw new Error(`Failed to create user account: ${authError.message}`);
  }

  // Create user profile
  const { data: profileData, error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      id: authData.user.id,
      email: email.toLowerCase(),
      full_name: name.trim(),
      role: role === 'instructor' ? 'admin' : 'regular_user', // Map to available roles
      is_beta_tester: true, // Since this is a beta system
      preferences: generateDefaultPreferences(),
      onboarding_completed: false
    })
    .select()
    .single();

  if (profileError) {
    // If profile creation fails, we should clean up the auth user
    await supabase.auth.admin.deleteUser(authData.user.id);
    throw new Error(`Failed to create user profile: ${profileError.message}`);
  }

  return { user: authData.user, profile: profileData };
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

    // Create user with Supabase Auth and profile
    const { user: createdUser, profile: createdProfile } = await createUserWithAuth(
      supabase, 
      email, 
      password, 
      name, 
      role
    );

    // Send welcome and verification emails
    try {
      const verificationToken = uuidv4();
      await Promise.all([
        sendWelcomeEmail(email, name),
        sendEmailVerification(email, verificationToken)
      ]);
    } catch (emailError) {
      console.error('[Auth] Failed to send emails:', emailError);
      // Don't fail registration if emails fail
    }

    // Log registration event (if table exists)
    try {
      await supabase
        .from('beta_user_analytics')
        .insert({
          user_id: createdUser.id,
          event_type: 'user_registered',
          event_data: {
            email,
            name,
            role,
            registration_method: 'email'
          },
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown'
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
        name: createdProfile.full_name,
        role: createdProfile.role,
        isEmailVerified: createdUser.email_confirmed_at !== null,
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
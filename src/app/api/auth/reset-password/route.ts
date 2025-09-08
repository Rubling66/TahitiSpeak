import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import crypto from 'crypto';

// Validation schemas
const resetRequestSchema = z.object({
  email: z.string().email('Invalid email format')
});

const resetConfirmSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number')
});

// Types
interface ResetToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  used: boolean;
  created_at: string;
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

// Generate secure reset token
function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Create password reset token
async function createResetToken(supabase: any, userId: string): Promise<string> {
  const token = generateResetToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

  // Invalidate any existing tokens for this user
  await supabase
    .from('password_reset_tokens')
    .update({ used: true })
    .eq('user_id', userId)
    .eq('used', false);

  // Create new reset token
  const { error } = await supabase
    .from('password_reset_tokens')
    .insert({
      user_id: userId,
      token,
      expires_at: expiresAt.toISOString(),
      used: false,
      created_at: new Date().toISOString()
    });

  if (error) {
    console.error('Failed to create reset token:', error);
    throw new Error('Failed to create reset token');
  }

  return token;
}

// Verify reset token
async function verifyResetToken(supabase: any, token: string): Promise<{ userId: string; tokenId: string }> {
  const { data, error } = await supabase
    .from('password_reset_tokens')
    .select('id, user_id, expires_at, used')
    .eq('token', token)
    .eq('used', false)
    .single();

  if (error || !data) {
    throw new Error('Invalid or expired reset token');
  }

  // Check if token is expired
  if (new Date(data.expires_at) < new Date()) {
    throw new Error('Reset token has expired');
  }

  return { userId: data.user_id, tokenId: data.id };
}

// Update user password
async function updateUserPassword(supabase: any, userId: string, newPassword: string): Promise<void> {
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

  const { error } = await supabase
    .from('users')
    .update({ 
      password_hash: hashedPassword,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  if (error) {
    console.error('Failed to update password:', error);
    throw new Error('Failed to update password');
  }
}

// Mark reset token as used
async function markTokenAsUsed(supabase: any, tokenId: string): Promise<void> {
  const { error } = await supabase
    .from('password_reset_tokens')
    .update({ 
      used: true,
      used_at: new Date().toISOString()
    })
    .eq('id', tokenId);

  if (error) {
    console.error('Failed to mark token as used:', error);
    // Don't throw here, as password update was successful
  }
}

// Log password reset activity
async function logPasswordResetActivity(supabase: any, userId: string, action: string, request: NextRequest): Promise<void> {
  try {
    await supabase
      .from('user_activity_logs')
      .insert({
        user_id: userId,
        action: `password_${action}`,
        details: {
          action,
          timestamp: new Date().toISOString()
        },
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Failed to log password reset activity:', error);
    // Don't throw here
  }
}

// Send password reset email (placeholder)
async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  // TODO: Implement actual email sending
  // For now, just log the reset link
  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
  console.log(`Password reset link for ${email}: ${resetLink}`);
  
  // In production, you would use a service like:
  // - SendGrid
  // - AWS SES
  // - Resend
  // - Nodemailer with SMTP
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'request';

    const supabase = getSupabaseClient();

    if (action === 'request') {
      // Handle password reset request
      const validatedData = resetRequestSchema.parse(body);
      const { email } = validatedData;

      // Check if user exists
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, email, name')
        .eq('email', email)
        .single();

      if (userError || !user) {
        // Don't reveal if email exists or not for security
        return NextResponse.json({
          success: true,
          message: 'If an account with that email exists, a password reset link has been sent.'
        });
      }

      // Create reset token
      const resetToken = await createResetToken(supabase, user.id);

      // Send reset email
      await sendPasswordResetEmail(email, resetToken);

      // Log activity
      await logPasswordResetActivity(supabase, user.id, 'reset_requested', request);

      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });

    } else if (action === 'confirm') {
      // Handle password reset confirmation
      const validatedData = resetConfirmSchema.parse(body);
      const { token, newPassword } = validatedData;

      // Verify reset token
      const { userId, tokenId } = await verifyResetToken(supabase, token);

      // Update password
      await updateUserPassword(supabase, userId, newPassword);

      // Mark token as used
      await markTokenAsUsed(supabase, tokenId);

      // Invalidate all user sessions (force re-login)
      await supabase
        .from('user_sessions')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('is_active', true);

      // Log activity
      await logPasswordResetActivity(supabase, userId, 'reset_completed', request);

      return NextResponse.json({
        success: true,
        message: 'Password has been reset successfully. Please log in with your new password.'
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action parameter' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('[Auth] Password reset error:', error);

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
      // Handle specific errors
      if (error.message.includes('Missing Supabase configuration')) {
        return NextResponse.json(
          { error: 'Service temporarily unavailable' },
          { status: 503 }
        );
      }

      if (error.message.includes('Invalid or expired reset token') || 
          error.message.includes('Reset token has expired')) {
        return NextResponse.json(
          { error: 'Invalid or expired reset token' },
          { status: 400 }
        );
      }

      if (error.message.includes('Failed to create reset token') ||
          error.message.includes('Failed to update password')) {
        return NextResponse.json(
          { error: 'Failed to process password reset' },
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
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
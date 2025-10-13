import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyJWT } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyJWT(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { token: fcmToken } = body;

    if (!fcmToken) {
      return NextResponse.json({ error: 'FCM token is required' }, { status: 400 });
    }

    // Update or create notification preferences with FCM token
    const { data: preferences, error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: decoded.userId,
        fcm_token: fcmToken,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving FCM token:', error);
      return NextResponse.json({ error: 'Failed to save FCM token' }, { status: 500 });
    }

    return NextResponse.json({ success: true, preferences });
  } catch (error) {
    console.error('Error in FCM token POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
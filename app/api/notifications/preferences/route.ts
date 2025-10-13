import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyJWT } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/notifications/preferences - Get user notification preferences
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { data: preferences, error } = await supabase
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', payload.sub)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching preferences:', error);
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
    }

    // Return default preferences if none exist
    const defaultPreferences = {
      user_id: payload.sub,
      push_enabled: true,
      email_enabled: true,
      in_app_enabled: true,
      learning_reminders: true,
      story_updates: true,
      achievement_notifications: true,
      community_notifications: false,
      marketing_notifications: false,
      quiet_hours_enabled: false,
      quiet_hours_start: '22:00',
      quiet_hours_end: '08:00',
      timezone: 'UTC'
    };

    return NextResponse.json({
      preferences: preferences || defaultPreferences
    });

  } catch (error) {
    console.error('Error in preferences GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/notifications/preferences - Update user notification preferences
export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const {
      push_enabled,
      email_enabled,
      in_app_enabled,
      learning_reminders,
      story_updates,
      achievement_notifications,
      community_notifications,
      marketing_notifications,
      quiet_hours_enabled,
      quiet_hours_start,
      quiet_hours_end,
      timezone
    } = body;

    // Validate timezone if provided
    if (timezone) {
      try {
        Intl.DateTimeFormat(undefined, { timeZone: timezone });
      } catch (error) {
        return NextResponse.json({ error: 'Invalid timezone' }, { status: 400 });
      }
    }

    // Validate quiet hours format if provided
    if (quiet_hours_start && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(quiet_hours_start)) {
      return NextResponse.json({ error: 'Invalid quiet_hours_start format (HH:MM)' }, { status: 400 });
    }

    if (quiet_hours_end && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(quiet_hours_end)) {
      return NextResponse.json({ error: 'Invalid quiet_hours_end format (HH:MM)' }, { status: 400 });
    }

    const updateData = {
      user_id: payload.sub,
      ...(push_enabled !== undefined && { push_enabled }),
      ...(email_enabled !== undefined && { email_enabled }),
      ...(in_app_enabled !== undefined && { in_app_enabled }),
      ...(learning_reminders !== undefined && { learning_reminders }),
      ...(story_updates !== undefined && { story_updates }),
      ...(achievement_notifications !== undefined && { achievement_notifications }),
      ...(community_notifications !== undefined && { community_notifications }),
      ...(marketing_notifications !== undefined && { marketing_notifications }),
      ...(quiet_hours_enabled !== undefined && { quiet_hours_enabled }),
      ...(quiet_hours_start && { quiet_hours_start }),
      ...(quiet_hours_end && { quiet_hours_end }),
      ...(timezone && { timezone })
    };

    const { data: preferences, error } = await supabase
      .from('user_notification_preferences')
      .upsert(updateData, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error('Error updating preferences:', error);
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      preferences
    });

  } catch (error) {
    console.error('Error in preferences PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/notifications/preferences/reset - Reset to default preferences
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const defaultPreferences = {
      user_id: payload.sub,
      push_enabled: true,
      email_enabled: true,
      in_app_enabled: true,
      learning_reminders: true,
      story_updates: true,
      achievement_notifications: true,
      community_notifications: false,
      marketing_notifications: false,
      quiet_hours_enabled: false,
      quiet_hours_start: '22:00',
      quiet_hours_end: '08:00',
      timezone: 'UTC'
    };

    const { data: preferences, error } = await supabase
      .from('user_notification_preferences')
      .upsert(defaultPreferences, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error('Error resetting preferences:', error);
      return NextResponse.json({ error: 'Failed to reset preferences' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      preferences,
      message: 'Preferences reset to defaults'
    });

  } catch (error) {
    console.error('Error in preferences reset:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
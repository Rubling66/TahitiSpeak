import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyJWT } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/notifications - Get user notifications
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const unreadOnly = searchParams.get('unread_only') === 'true';

    const offset = (page - 1) * limit;

    let query = supabase
      .from('notification_history')
      .select('*')
      .eq('user_id', payload.sub)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (type) {
      query = query.eq('type', type);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (unreadOnly) {
      query = query.neq('read_at', null);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('notification_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', payload.sub);

    if (type) countQuery = countQuery.eq('type', type);
    if (status) countQuery = countQuery.eq('status', status);
    if (unreadOnly) countQuery = countQuery.neq('read_at', null);

    const { count } = await countQuery;

    return NextResponse.json({
      notifications,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Error in notifications GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/notifications - Send notification
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

    const body = await request.json();
    const { userIds, templateName, variables, scheduledFor, priority = 'normal' } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'userIds array is required' }, { status: 400 });
    }

    if (!templateName) {
      return NextResponse.json({ error: 'templateName is required' }, { status: 400 });
    }

    // Get notification template
    const { data: template, error: templateError } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('name', templateName)
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Process template variables
    let processedTitle = template.title || '';
    let processedBody = template.body || '';

    if (variables && typeof variables === 'object') {
      Object.entries(variables).forEach(([key, value]) => {
        const placeholder = `{${key}}`;
        processedTitle = processedTitle.replace(new RegExp(placeholder, 'g'), String(value));
        processedBody = processedBody.replace(new RegExp(placeholder, 'g'), String(value));
      });
    }

    // Create notification records
    const notifications = userIds.map(userId => ({
      user_id: userId,
      template_id: template.id,
      type: template.type,
      title: processedTitle,
      body: processedBody,
      data: { variables, priority },
      status: scheduledFor ? 'pending' : 'sent',
      sent_at: scheduledFor ? null : new Date().toISOString()
    }));

    const { data: createdNotifications, error: insertError } = await supabase
      .from('notification_history')
      .insert(notifications)
      .select();

    if (insertError) {
      console.error('Error creating notifications:', insertError);
      return NextResponse.json({ error: 'Failed to create notifications' }, { status: 500 });
    }

    // If not scheduled, send immediately
    if (!scheduledFor) {
      // Here you would integrate with FCM, email service, etc.
      // For now, we'll just update the status
      for (const notification of createdNotifications) {
        await sendNotification(notification);
      }
    }

    return NextResponse.json({
      success: true,
      notificationIds: createdNotifications.map(n => n.id),
      message: `${createdNotifications.length} notifications ${scheduledFor ? 'scheduled' : 'sent'}`
    });

  } catch (error) {
    console.error('Error in notifications POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to send notifications
async function sendNotification(notification: any) {
  try {
    // Get user preferences
    const { data: preferences } = await supabase
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', notification.user_id)
      .single();

    const prefs = preferences || {
      push_enabled: true,
      email_enabled: true,
      in_app_enabled: true
    };

    // Send based on notification type and user preferences
    switch (notification.type) {
      case 'push':
        if (prefs.push_enabled) {
          await sendPushNotification(notification);
        }
        break;
      case 'email':
        if (prefs.email_enabled) {
          await sendEmailNotification(notification);
        }
        break;
      case 'in_app':
        if (prefs.in_app_enabled) {
          await sendInAppNotification(notification);
        }
        break;
    }

    // Update notification status
    await supabase
      .from('notification_history')
      .update({ 
        status: 'delivered',
        delivered_at: new Date().toISOString()
      })
      .eq('id', notification.id);

  } catch (error) {
    console.error('Error sending notification:', error);
    
    // Update notification status to failed
    await supabase
      .from('notification_history')
      .update({ 
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      })
      .eq('id', notification.id);
  }
}

async function sendPushNotification(notification: any) {
  // Get user device tokens
  const { data: tokens } = await supabase
    .from('user_device_tokens')
    .select('*')
    .eq('user_id', notification.user_id)
    .eq('is_active', true);

  if (!tokens || tokens.length === 0) {
    throw new Error('No active device tokens found');
  }

  // Here you would integrate with FCM
  // For now, we'll simulate the push notification
  console.log('Sending push notification:', {
    tokens: tokens.map(t => t.token),
    title: notification.title,
    body: notification.body
  });

  // Track analytics
  await supabase.rpc('track_notification_event', {
    p_template_id: notification.template_id,
    p_user_id: notification.user_id,
    p_type: 'push',
    p_event: 'sent',
    p_platform: tokens[0]?.platform || 'unknown'
  });
}

async function sendEmailNotification(notification: any) {
  // Here you would integrate with email service (SendGrid, etc.)
  console.log('Sending email notification:', {
    userId: notification.user_id,
    subject: notification.title,
    body: notification.body
  });

  // Track analytics
  await supabase.rpc('track_notification_event', {
    p_template_id: notification.template_id,
    p_user_id: notification.user_id,
    p_type: 'email',
    p_event: 'sent'
  });
}

async function sendInAppNotification(notification: any) {
  // In-app notifications are handled by the frontend polling or WebSocket
  console.log('In-app notification ready:', {
    userId: notification.user_id,
    title: notification.title,
    body: notification.body
  });

  // Track analytics
  await supabase.rpc('track_notification_event', {
    p_template_id: notification.template_id,
    p_user_id: notification.user_id,
    p_type: 'in_app',
    p_event: 'sent'
  });
}
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyJWT } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/notifications/[id]/read - Mark notification as read
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const notificationId = params.id;

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
    }

    // Check if notification exists and belongs to user
    const { data: notification, error: fetchError } = await supabase
      .from('notification_history')
      .select('*')
      .eq('id', notificationId)
      .eq('user_id', payload.sub)
      .single();

    if (fetchError || !notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    if (notification.read_at) {
      return NextResponse.json({
        success: true,
        message: 'Notification already marked as read',
        notification
      });
    }

    // Mark as read
    const { data: updatedNotification, error } = await supabase
      .from('notification_history')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', payload.sub)
      .select()
      .single();

    if (error) {
      console.error('Error marking notification as read:', error);
      return NextResponse.json({ error: 'Failed to mark notification as read' }, { status: 500 });
    }

    // Track analytics event
    try {
      await supabase.rpc('track_notification_event', {
        p_template_id: notification.template_id,
        p_user_id: payload.sub,
        p_type: notification.type,
        p_event: 'read'
      });
    } catch (analyticsError) {
      console.error('Error tracking read event:', analyticsError);
      // Don't fail the request if analytics fails
    }

    return NextResponse.json({
      success: true,
      message: 'Notification marked as read',
      notification: updatedNotification
    });

  } catch (error) {
    console.error('Error in notification read POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/notifications/[id]/read - Mark notification as unread
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const notificationId = params.id;

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
    }

    // Check if notification exists and belongs to user
    const { data: notification, error: fetchError } = await supabase
      .from('notification_history')
      .select('*')
      .eq('id', notificationId)
      .eq('user_id', payload.sub)
      .single();

    if (fetchError || !notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    if (!notification.read_at) {
      return NextResponse.json({
        success: true,
        message: 'Notification already marked as unread',
        notification
      });
    }

    // Mark as unread
    const { data: updatedNotification, error } = await supabase
      .from('notification_history')
      .update({ read_at: null })
      .eq('id', notificationId)
      .eq('user_id', payload.sub)
      .select()
      .single();

    if (error) {
      console.error('Error marking notification as unread:', error);
      return NextResponse.json({ error: 'Failed to mark notification as unread' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Notification marked as unread',
      notification: updatedNotification
    });

  } catch (error) {
    console.error('Error in notification read DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
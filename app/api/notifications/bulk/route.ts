import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyJWT } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/notifications/bulk - Bulk operations on notifications
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
    const { action, notificationIds, filters } = body;

    if (!action || !['mark_read', 'mark_unread', 'delete'].includes(action)) {
      return NextResponse.json({ 
        error: 'Valid action is required (mark_read, mark_unread, delete)' 
      }, { status: 400 });
    }

    let query = supabase
      .from('notification_history')
      .select('id, template_id, type')
      .eq('user_id', payload.sub);

    // Apply filters or specific IDs
    if (notificationIds && Array.isArray(notificationIds) && notificationIds.length > 0) {
      query = query.in('id', notificationIds);
    } else if (filters) {
      // Apply filters for bulk operations
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.unread_only) {
        query = query.is('read_at', null);
      }
      if (filters.read_only) {
        query = query.not('read_at', 'is', null);
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }
    }

    // Get notifications to operate on
    const { data: notifications, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching notifications for bulk operation:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    if (!notifications || notifications.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No notifications found matching criteria',
        affected: 0
      });
    }

    const notificationIdsToUpdate = notifications.map(n => n.id);
    let updateQuery = supabase
      .from('notification_history')
      .update({})
      .eq('user_id', payload.sub)
      .in('id', notificationIdsToUpdate);

    let analyticsEvents: any[] = [];

    switch (action) {
      case 'mark_read':
        updateQuery = updateQuery.update({ read_at: new Date().toISOString() });
        analyticsEvents = notifications.map(n => ({
          p_template_id: n.template_id,
          p_user_id: payload.sub,
          p_type: n.type,
          p_event: 'read'
        }));
        break;

      case 'mark_unread':
        updateQuery = updateQuery.update({ read_at: null });
        break;

      case 'delete':
        // For delete, we use a different approach
        const { error: deleteError } = await supabase
          .from('notification_history')
          .delete()
          .eq('user_id', payload.sub)
          .in('id', notificationIdsToUpdate);

        if (deleteError) {
          console.error('Error deleting notifications:', deleteError);
          return NextResponse.json({ error: 'Failed to delete notifications' }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message: `${notifications.length} notifications deleted`,
          affected: notifications.length
        });
    }

    // Execute update for mark_read/mark_unread
    const { error: updateError } = await updateQuery;

    if (updateError) {
      console.error('Error updating notifications:', updateError);
      return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
    }

    // Track analytics events for read operations
    if (action === 'mark_read' && analyticsEvents.length > 0) {
      try {
        for (const event of analyticsEvents) {
          await supabase.rpc('track_notification_event', event);
        }
      } catch (analyticsError) {
        console.error('Error tracking bulk read events:', analyticsError);
        // Don't fail the request if analytics fails
      }
    }

    const actionMessages = {
      mark_read: 'marked as read',
      mark_unread: 'marked as unread'
    };

    return NextResponse.json({
      success: true,
      message: `${notifications.length} notifications ${actionMessages[action as keyof typeof actionMessages]}`,
      affected: notifications.length
    });

  } catch (error) {
    console.error('Error in notifications bulk POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/notifications/bulk/stats - Get notification statistics
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

    // Get total notifications
    const { count: totalCount } = await supabase
      .from('notification_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', payload.sub);

    // Get unread notifications
    const { count: unreadCount } = await supabase
      .from('notification_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', payload.sub)
      .is('read_at', null);

    // Get notifications by type
    const { data: typeStats } = await supabase
      .from('notification_history')
      .select('type')
      .eq('user_id', payload.sub);

    const typeBreakdown = typeStats?.reduce((acc: any, notification: any) => {
      acc[notification.type] = (acc[notification.type] || 0) + 1;
      return acc;
    }, {}) || {};

    // Get notifications by status
    const { data: statusStats } = await supabase
      .from('notification_history')
      .select('status')
      .eq('user_id', payload.sub);

    const statusBreakdown = statusStats?.reduce((acc: any, notification: any) => {
      acc[notification.status] = (acc[notification.status] || 0) + 1;
      return acc;
    }, {}) || {};

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: recentCount } = await supabase
      .from('notification_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', payload.sub)
      .gte('created_at', sevenDaysAgo.toISOString());

    return NextResponse.json({
      stats: {
        total: totalCount || 0,
        unread: unreadCount || 0,
        read: (totalCount || 0) - (unreadCount || 0),
        recent: recentCount || 0,
        typeBreakdown,
        statusBreakdown
      }
    });

  } catch (error) {
    console.error('Error in notifications bulk stats GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
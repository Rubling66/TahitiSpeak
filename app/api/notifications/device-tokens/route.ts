import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyJWT } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/notifications/device-tokens - Register device token
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
    const { deviceToken, platform, deviceInfo } = body;

    if (!deviceToken) {
      return NextResponse.json({ error: 'deviceToken is required' }, { status: 400 });
    }

    if (!platform || !['web', 'ios', 'android'].includes(platform)) {
      return NextResponse.json({ error: 'Valid platform is required (web, ios, android)' }, { status: 400 });
    }

    // Check if token already exists for this user
    const { data: existingToken } = await supabase
      .from('user_device_tokens')
      .select('*')
      .eq('user_id', payload.sub)
      .eq('token', deviceToken)
      .single();

    if (existingToken) {
      // Update existing token
      const { data: updatedToken, error } = await supabase
        .from('user_device_tokens')
        .update({
          platform,
          device_info: deviceInfo,
          is_active: true,
          last_used_at: new Date().toISOString()
        })
        .eq('id', existingToken.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating device token:', error);
        return NextResponse.json({ error: 'Failed to update device token' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        deviceToken: updatedToken,
        message: 'Device token updated'
      });
    }

    // Create new token
    const { data: newToken, error } = await supabase
      .from('user_device_tokens')
      .insert({
        user_id: payload.sub,
        token: deviceToken,
        platform,
        device_info: deviceInfo,
        is_active: true,
        last_used_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating device token:', error);
      return NextResponse.json({ error: 'Failed to register device token' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      deviceToken: newToken,
      message: 'Device token registered'
    });

  } catch (error) {
    console.error('Error in device-tokens POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/notifications/device-tokens - Get user device tokens
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

    const { data: deviceTokens, error } = await supabase
      .from('user_device_tokens')
      .select('*')
      .eq('user_id', payload.sub)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching device tokens:', error);
      return NextResponse.json({ error: 'Failed to fetch device tokens' }, { status: 500 });
    }

    return NextResponse.json({
      deviceTokens: deviceTokens || []
    });

  } catch (error) {
    console.error('Error in device-tokens GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/notifications/device-tokens - Remove device token
export async function DELETE(request: NextRequest) {
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
    const deviceToken = searchParams.get('token');
    const tokenId = searchParams.get('id');

    if (!deviceToken && !tokenId) {
      return NextResponse.json({ error: 'Either token or id parameter is required' }, { status: 400 });
    }

    let query = supabase
      .from('user_device_tokens')
      .delete()
      .eq('user_id', payload.sub);

    if (tokenId) {
      query = query.eq('id', tokenId);
    } else if (deviceToken) {
      query = query.eq('token', deviceToken);
    }

    const { error } = await query;

    if (error) {
      console.error('Error deleting device token:', error);
      return NextResponse.json({ error: 'Failed to delete device token' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Device token removed'
    });

  } catch (error) {
    console.error('Error in device-tokens DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyJWT } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/notifications/templates - Get notification templates
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
    const type = searchParams.get('type');
    const activeOnly = searchParams.get('active_only') === 'true';

    let query = supabase
      .from('notification_templates')
      .select('*')
      .order('name');

    if (type) {
      query = query.eq('type', type);
    }

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data: templates, error } = await query;

    if (error) {
      console.error('Error fetching templates:', error);
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
    }

    return NextResponse.json({
      templates: templates || []
    });

  } catch (error) {
    console.error('Error in templates GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/notifications/templates - Create notification template
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

    // Check if user is admin
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', payload.sub)
      .single();

    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      type,
      title,
      body: templateBody,
      variables,
      is_active = true
    } = body;

    if (!name || !type || !title || !templateBody) {
      return NextResponse.json({ 
        error: 'name, type, title, and body are required' 
      }, { status: 400 });
    }

    if (!['push', 'email', 'in_app'].includes(type)) {
      return NextResponse.json({ 
        error: 'type must be one of: push, email, in_app' 
      }, { status: 400 });
    }

    // Check if template name already exists
    const { data: existingTemplate } = await supabase
      .from('notification_templates')
      .select('id')
      .eq('name', name)
      .single();

    if (existingTemplate) {
      return NextResponse.json({ 
        error: 'Template with this name already exists' 
      }, { status: 409 });
    }

    const { data: template, error } = await supabase
      .from('notification_templates')
      .insert({
        name,
        type,
        title,
        body: templateBody,
        variables: variables || [],
        is_active
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating template:', error);
      return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      template,
      message: 'Template created successfully'
    });

  } catch (error) {
    console.error('Error in templates POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/notifications/templates - Update notification template
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

    // Check if user is admin
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', payload.sub)
      .single();

    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      id,
      name,
      type,
      title,
      body: templateBody,
      variables,
      is_active
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Template id is required' }, { status: 400 });
    }

    if (type && !['push', 'email', 'in_app'].includes(type)) {
      return NextResponse.json({ 
        error: 'type must be one of: push, email, in_app' 
      }, { status: 400 });
    }

    // Check if template exists
    const { data: existingTemplate } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Check if new name conflicts with existing template
    if (name && name !== existingTemplate.name) {
      const { data: nameConflict } = await supabase
        .from('notification_templates')
        .select('id')
        .eq('name', name)
        .neq('id', id)
        .single();

      if (nameConflict) {
        return NextResponse.json({ 
          error: 'Template with this name already exists' 
        }, { status: 409 });
      }
    }

    const updateData = {
      ...(name && { name }),
      ...(type && { type }),
      ...(title && { title }),
      ...(templateBody && { body: templateBody }),
      ...(variables !== undefined && { variables }),
      ...(is_active !== undefined && { is_active })
    };

    const { data: template, error } = await supabase
      .from('notification_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating template:', error);
      return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      template,
      message: 'Template updated successfully'
    });

  } catch (error) {
    console.error('Error in templates PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/notifications/templates - Delete notification template
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

    // Check if user is admin
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', payload.sub)
      .single();

    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('id');

    if (!templateId) {
      return NextResponse.json({ error: 'Template id is required' }, { status: 400 });
    }

    // Check if template exists
    const { data: existingTemplate } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('notification_templates')
      .delete()
      .eq('id', templateId);

    if (error) {
      console.error('Error deleting template:', error);
      return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    });

  } catch (error) {
    console.error('Error in templates DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
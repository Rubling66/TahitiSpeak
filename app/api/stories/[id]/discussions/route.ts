import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Story Discussions API endpoint
 * GET: Fetch discussions for a story
 * POST: Create new discussion/reply
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const storyId = params.id;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const sortBy = searchParams.get('sort') || 'created_at';
    const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc';
    const parentId = searchParams.get('parent_id');

    // Create Supabase client
    const supabase = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY!);

    // Build query for discussions
    let query = supabase
      .from('story_discussions')
      .select(`
        id,
        user_id,
        story_id,
        parent_id,
        title,
        content,
        discussion_type,
        is_pinned,
        likes_count,
        replies_count,
        created_at,
        updated_at
      `)
      .eq('story_id', storyId);

    // Filter by parent_id (null for top-level discussions, specific ID for replies)
    if (parentId === 'null' || parentId === null) {
      query = query.is('parent_id', null);
    } else if (parentId) {
      query = query.eq('parent_id', parentId);
    }

    // Apply sorting
    const validSortFields = ['created_at', 'updated_at', 'likes_count', 'replies_count'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    query = query.order(sortField, { ascending: order === 'asc' });

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: discussions, error, count } = await query;

    if (error) {
      console.error('Error fetching discussions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch discussions' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('story_discussions')
      .select('*', { count: 'exact', head: true })
      .eq('story_id', storyId)
      .is('parent_id', parentId === 'null' ? null : parentId);

    // For each top-level discussion, get recent replies if not fetching specific parent
    let discussionsWithReplies = discussions;
    if (!parentId || parentId === 'null') {
      discussionsWithReplies = await Promise.all(
        discussions?.map(async (discussion) => {
          const { data: replies } = await supabase
            .from('story_discussions')
            .select(`
              id,
              user_id,
              content,
              created_at
            `)
            .eq('parent_id', discussion.id)
            .order('created_at', { ascending: true })
            .limit(3); // Show only 3 most recent replies

          return {
            ...discussion,
            recent_replies: replies || []
          };
        }) || []
      );
    }

    return NextResponse.json({
      discussions: discussionsWithReplies,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        total_pages: Math.ceil((totalCount || 0) / limit),
        has_next: page * limit < (totalCount || 0),
        has_prev: page > 1
      }
    });

  } catch (error) {
    console.error('Get discussions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const storyId = params.id;
    
    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Create client with user's token for RLS
    const userToken = authHeader.replace('Bearer ', '');
    const userSupabase = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY!, {
      global: {
        headers: {
          Authorization: `Bearer ${userToken}`
        }
      }
    });

    // Verify user authentication
    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      title,
      content, 
      discussion_type = 'general', 
      parent_id = null
    } = body;

    // Validate required fields
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: 'Content must be less than 2000 characters' },
        { status: 400 }
      );
    }

    // Validate discussion type
    const validTypes = ['question', 'insight', 'cultural_note', 'interpretation', 'general'];
    if (!validTypes.includes(discussion_type)) {
      return NextResponse.json(
        { error: 'Invalid discussion type' },
        { status: 400 }
      );
    }

    // If this is a reply, verify parent discussion exists
    if (parent_id) {
      const { data: parentDiscussion, error: parentError } = await userSupabase
        .from('story_discussions')
        .select('id, story_id')
        .eq('id', parent_id)
        .eq('story_id', storyId)
        .single();

      if (parentError || !parentDiscussion) {
        return NextResponse.json(
          { error: 'Parent discussion not found' },
          { status: 404 }
        );
      }
    }

    // Verify story exists
    const { data: story, error: storyError } = await userSupabase
      .from('stories')
      .select('id, is_published')
      .eq('id', storyId)
      .single();

    if (storyError || !story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }

    if (!story.is_published) {
      return NextResponse.json(
        { error: 'Cannot discuss unpublished stories' },
        { status: 403 }
      );
    }

    // Create discussion
    const discussionData = {
      user_id: user.id,
      story_id: storyId,
      parent_id,
      title: title?.trim() || null,
      content: content.trim(),
      discussion_type,
      is_pinned: false,
      likes_count: 0,
      replies_count: 0
    };

    const { data: discussion, error: createError } = await userSupabase
      .from('story_discussions')
      .insert(discussionData)
      .select(`
        id,
        user_id,
        story_id,
        parent_id,
        title,
        content,
        discussion_type,
        is_pinned,
        likes_count,
        replies_count,
        created_at,
        updated_at
      `)
      .single();

    if (createError) {
      console.error('Error creating discussion:', createError);
      return NextResponse.json(
        { error: 'Failed to create discussion', details: createError.message },
        { status: 500 }
      );
    }

    // If this is a reply, increment parent's replies_count
    if (parent_id) {
      await userSupabase
        .from('story_discussions')
        .update({ 
          replies_count: supabase.sql`replies_count + 1`,
          updated_at: new Date().toISOString()
        })
        .eq('id', parent_id);
    }

    return NextResponse.json({
      discussion,
      message: parent_id ? 'Reply created successfully' : 'Discussion created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Create discussion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
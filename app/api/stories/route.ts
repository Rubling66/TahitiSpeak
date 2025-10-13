import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Story, StoryFilter, StorySortOption } from '@/types/story-system';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Stories API endpoint
 * GET: Fetch published stories with filtering and sorting
 * POST: Create new story (authenticated users only)
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters for filtering and sorting
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');
    const cultural_region = searchParams.get('cultural_region');
    const search_query = searchParams.get('search');
    const sort_by = searchParams.get('sort_by') as StorySortOption || 'created_at';
    const sort_order = searchParams.get('sort_order') || 'desc';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('stories')
      .select(`
        id,
        title,
        description,
        category,
        difficulty_level,
        estimated_duration,
        cultural_region,
        language,
        cover_image_url,
        cultural_authenticity_score,
        total_passages,
        created_at,
        updated_at
      `)
      .eq('is_published', true);

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }
    if (difficulty) {
      query = query.eq('difficulty_level', difficulty);
    }
    if (cultural_region) {
      query = query.eq('cultural_region', cultural_region);
    }
    if (search_query) {
      query = query.or(`title.ilike.%${search_query}%,description.ilike.%${search_query}%`);
    }

    // Apply sorting
    const sortColumn = sort_by === 'popularity' ? 'cultural_authenticity_score' : sort_by;
    query = query.order(sortColumn, { ascending: sort_order === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: stories, error, count } = await query;

    if (error) {
      console.error('Error fetching stories:', error);
      return NextResponse.json(
        { error: 'Failed to fetch stories', details: error.message },
        { status: 500 }
      );
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('stories')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true);

    return NextResponse.json({
      stories: stories || [],
      pagination: {
        total: totalCount || 0,
        limit,
        offset,
        hasMore: (offset + limit) < (totalCount || 0)
      }
    });

  } catch (error) {
    console.error('Stories API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
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
    
    // Validate required fields
    const requiredFields = ['title', 'description', 'category', 'difficulty_level', 'estimated_duration', 'cultural_region'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Create story with user as author
    const storyData = {
      title: body.title,
      description: body.description,
      category: body.category,
      difficulty_level: body.difficulty_level,
      estimated_duration: body.estimated_duration,
      cultural_region: body.cultural_region,
      language: body.language || 'tahitian',
      cover_image_url: body.cover_image_url,
      cultural_authenticity_score: body.cultural_authenticity_score || 0,
      author_id: user.id,
      is_published: false // New stories start as drafts
    };

    const { data: story, error } = await userSupabase
      .from('stories')
      .insert(storyData)
      .select()
      .single();

    if (error) {
      console.error('Error creating story:', error);
      return NextResponse.json(
        { error: 'Failed to create story', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ story }, { status: 201 });

  } catch (error) {
    console.error('Create story error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
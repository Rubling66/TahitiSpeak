import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Story Progress API endpoint
 * GET: Get user's progress for a story
 * POST: Update user's progress
 * PUT: Mark story as completed
 */

export async function GET(
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

    // Get user's progress for this story
    const { data: progress, error } = await userSupabase
      .from('user_story_progress')
      .select(`
        id,
        current_passage_id,
        completion_percentage,
        is_completed,
        cultural_knowledge_gained,
        choices_made,
        annotations_viewed,
        time_spent,
        started_at,
        completed_at,
        last_accessed_at,
        story_passages:current_passage_id (
          passage_number,
          title
        )
      `)
      .eq('story_id', storyId)
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching progress:', error);
      return NextResponse.json(
        { error: 'Failed to fetch progress' },
        { status: 500 }
      );
    }

    // If no progress exists, return default values
    if (!progress) {
      return NextResponse.json({
        progress: {
          current_passage_id: null,
          completion_percentage: 0,
          is_completed: false,
          cultural_knowledge_gained: 0,
          choices_made: [],
          annotations_viewed: [],
          time_spent: 0,
          started_at: null,
          completed_at: null,
          last_accessed_at: null
        }
      });
    }

    return NextResponse.json({ progress });

  } catch (error) {
    console.error('Get progress error:', error);
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
      passage_id, 
      choices_made, 
      annotations_viewed, 
      time_spent_increment = 0,
      cultural_knowledge_gained_increment = 0 
    } = body;

    // Get current progress or create new one
    const { data: existingProgress } = await userSupabase
      .from('user_story_progress')
      .select('*')
      .eq('story_id', storyId)
      .eq('user_id', user.id)
      .single();

    // Calculate completion percentage based on passage number
    const { data: totalPassages } = await userSupabase
      .from('story_passages')
      .select('passage_number')
      .eq('story_id', storyId)
      .order('passage_number', { ascending: false })
      .limit(1)
      .single();

    const { data: currentPassage } = await userSupabase
      .from('story_passages')
      .select('passage_number')
      .eq('id', passage_id)
      .single();

    const completionPercentage = totalPassages && currentPassage 
      ? Math.round((currentPassage.passage_number / totalPassages.passage_number) * 100)
      : 0;

    const progressData = {
      user_id: user.id,
      story_id: storyId,
      current_passage_id: passage_id,
      completion_percentage: completionPercentage,
      cultural_knowledge_gained: (existingProgress?.cultural_knowledge_gained || 0) + cultural_knowledge_gained_increment,
      choices_made: choices_made || existingProgress?.choices_made || [],
      annotations_viewed: annotations_viewed || existingProgress?.annotations_viewed || [],
      time_spent: (existingProgress?.time_spent || 0) + time_spent_increment,
      last_accessed_at: new Date().toISOString(),
      started_at: existingProgress?.started_at || new Date().toISOString()
    };

    const { data: progress, error } = await userSupabase
      .from('user_story_progress')
      .upsert(progressData, { 
        onConflict: 'user_id,story_id',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating progress:', error);
      return NextResponse.json(
        { error: 'Failed to update progress', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ progress });

  } catch (error) {
    console.error('Update progress error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    // Mark story as completed
    const { data: progress, error } = await userSupabase
      .from('user_story_progress')
      .update({
        is_completed: true,
        completion_percentage: 100,
        completed_at: new Date().toISOString(),
        last_accessed_at: new Date().toISOString()
      })
      .eq('story_id', storyId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error marking story as completed:', error);
      return NextResponse.json(
        { error: 'Failed to mark story as completed', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      progress,
      message: 'Story marked as completed successfully' 
    });

  } catch (error) {
    console.error('Complete story error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
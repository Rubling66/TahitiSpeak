import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Story Details API endpoint
 * GET: Fetch specific story with passages and choices
 * PUT: Update story (author only)
 * DELETE: Delete story (author only)
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const storyId = params.id;

    // Fetch story details
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('*')
      .eq('id', storyId)
      .eq('is_published', true)
      .single();

    if (storyError || !story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }

    // Fetch story passages with choices
    const { data: passages, error: passagesError } = await supabase
      .from('story_passages')
      .select(`
        id,
        passage_number,
        title,
        content,
        audio_url,
        image_url,
        is_starting_passage,
        is_ending_passage,
        cultural_context,
        created_at,
        story_choices:story_choices!from_passage_id (
          id,
          to_passage_id,
          choice_text,
          choice_description,
          cultural_significance,
          choice_order
        )
      `)
      .eq('story_id', storyId)
      .order('passage_number');

    if (passagesError) {
      console.error('Error fetching passages:', passagesError);
      return NextResponse.json(
        { error: 'Failed to fetch story passages' },
        { status: 500 }
      );
    }

    // Fetch cultural annotations
    const { data: annotations, error: annotationsError } = await supabase
      .from('cultural_annotations')
      .select('*')
      .eq('story_id', storyId)
      .order('created_at');

    if (annotationsError) {
      console.error('Error fetching annotations:', annotationsError);
    }

    // Get story statistics
    const { data: stats } = await supabase
      .from('story_ratings')
      .select('rating, cultural_accuracy_rating, educational_value_rating')
      .eq('story_id', storyId);

    const averageRating = stats && stats.length > 0 
      ? stats.reduce((sum, rating) => sum + rating.rating, 0) / stats.length 
      : 0;

    const response = {
      story: {
        ...story,
        average_rating: Math.round(averageRating * 10) / 10,
        total_ratings: stats?.length || 0
      },
      passages: passages || [],
      annotations: annotations || []
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Story details API error:', error);
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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
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

    // Check if user is the author
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('author_id')
      .eq('id', storyId)
      .single();

    if (storyError || !story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }

    if (story.author_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized: You can only update your own stories' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Update story
    const { data: updatedStory, error: updateError } = await userSupabase
      .from('stories')
      .update({
        title: body.title,
        description: body.description,
        category: body.category,
        difficulty_level: body.difficulty_level,
        estimated_duration: body.estimated_duration,
        cultural_region: body.cultural_region,
        language: body.language,
        cover_image_url: body.cover_image_url,
        cultural_authenticity_score: body.cultural_authenticity_score,
        is_published: body.is_published,
        updated_at: new Date().toISOString()
      })
      .eq('id', storyId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating story:', updateError);
      return NextResponse.json(
        { error: 'Failed to update story', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ story: updatedStory });

  } catch (error) {
    console.error('Update story error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
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

    // Check if user is the author
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('author_id')
      .eq('id', storyId)
      .single();

    if (storyError || !story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }

    if (story.author_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized: You can only delete your own stories' },
        { status: 403 }
      );
    }

    // Delete story (cascading deletes will handle related data)
    const { error: deleteError } = await userSupabase
      .from('stories')
      .delete()
      .eq('id', storyId);

    if (deleteError) {
      console.error('Error deleting story:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete story', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Story deleted successfully' });

  } catch (error) {
    console.error('Delete story error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
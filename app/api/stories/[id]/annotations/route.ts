import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Cultural Annotations API endpoint
 * GET: Fetch annotations for a story/passage
 * POST: Mark annotation as viewed
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const storyId = params.id;
    const { searchParams } = new URL(request.url);
    const passageId = searchParams.get('passage_id');
    const annotationType = searchParams.get('type');

    // Create Supabase client
    const supabase = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY!);

    // Fetch cultural annotations for the story
    let query = supabase
      .from('cultural_annotations')
      .select(`
        id,
        annotation_type,
        title,
        content,
        highlighted_text,
        position_start,
        position_end,
        media_url,
        external_links,
        passage_id,
        created_at
      `)
      .eq('story_id', storyId);

    // Filter by passage if specified
    if (passageId) {
      query = query.eq('passage_id', passageId);
    }

    // Filter by annotation type if specified
    if (annotationType) {
      query = query.eq('annotation_type', annotationType);
    }

    const { data: annotations, error } = await query.order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching annotations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch annotations' },
        { status: 500 }
      );
    }

    // Get user's viewed annotations if authenticated
    let viewedAnnotations: string[] = [];
    const authHeader = request.headers.get('authorization');
    
    if (authHeader) {
      const userToken = authHeader.replace('Bearer ', '');
      const userSupabase = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY!, {
        global: {
          headers: {
            Authorization: `Bearer ${userToken}`
          }
        }
      });

      const { data: { user } } = await userSupabase.auth.getUser();
      
      if (user) {
        const { data: progress } = await userSupabase
          .from('user_story_progress')
          .select('annotations_viewed')
          .eq('story_id', storyId)
          .eq('user_id', user.id)
          .single();

        viewedAnnotations = progress?.annotations_viewed || [];
      }
    }

    // Add viewed status to annotations
    const annotationsWithStatus = annotations?.map(annotation => ({
      ...annotation,
      is_viewed: viewedAnnotations.includes(annotation.id)
    }));

    return NextResponse.json({ 
      annotations: annotationsWithStatus,
      total: annotations?.length || 0
    });

  } catch (error) {
    console.error('Get annotations error:', error);
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
    const { annotation_id } = body;

    if (!annotation_id) {
      return NextResponse.json(
        { error: 'Annotation ID is required' },
        { status: 400 }
      );
    }

    // Verify annotation exists and belongs to this story
    const { data: annotation, error: annotationError } = await userSupabase
      .from('cultural_annotations')
      .select('id, story_id')
      .eq('id', annotation_id)
      .eq('story_id', storyId)
      .single();

    if (annotationError || !annotation) {
      return NextResponse.json(
        { error: 'Annotation not found' },
        { status: 404 }
      );
    }

    // Get current progress
    const { data: currentProgress } = await userSupabase
      .from('user_story_progress')
      .select('annotations_viewed, cultural_knowledge_gained')
      .eq('story_id', storyId)
      .eq('user_id', user.id)
      .single();

    const currentAnnotationsViewed = currentProgress?.annotations_viewed || [];
    const currentKnowledge = currentProgress?.cultural_knowledge_gained || 0;

    // Check if annotation is already viewed
    if (currentAnnotationsViewed.includes(annotation_id)) {
      return NextResponse.json({
        message: 'Annotation already marked as viewed',
        annotation_id
      });
    }

    // Add annotation to viewed list and increment cultural knowledge
    const updatedAnnotationsViewed = [...currentAnnotationsViewed, annotation_id];
    const updatedKnowledge = currentKnowledge + 1; // +1 point per annotation

    // Update user progress
    const { data: progress, error: updateError } = await userSupabase
      .from('user_story_progress')
      .upsert({
        user_id: user.id,
        story_id: storyId,
        annotations_viewed: updatedAnnotationsViewed,
        cultural_knowledge_gained: updatedKnowledge,
        last_accessed_at: new Date().toISOString(),
        started_at: currentProgress?.started_at || new Date().toISOString()
      }, {
        onConflict: 'user_id,story_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (updateError) {
      console.error('Error updating progress:', updateError);
      return NextResponse.json(
        { error: 'Failed to mark annotation as viewed', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Annotation marked as viewed successfully',
      annotation_id,
      cultural_knowledge_gained: updatedKnowledge,
      total_annotations_viewed: updatedAnnotationsViewed.length
    });

  } catch (error) {
    console.error('Mark annotation viewed error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
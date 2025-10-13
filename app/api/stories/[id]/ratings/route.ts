import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Story Ratings API endpoint
 * GET: Fetch ratings for a story
 * POST: Submit/update user rating
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const storyId = params.id;
    const { searchParams } = new URL(request.url);
    const includeReviews = searchParams.get('include_reviews') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

    // Create Supabase client
    const supabase = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY!);

    // Get rating statistics
    const { data: ratingStats, error: statsError } = await supabase
      .from('story_ratings')
      .select('rating')
      .eq('story_id', storyId);

    if (statsError) {
      console.error('Error fetching rating stats:', statsError);
      return NextResponse.json(
        { error: 'Failed to fetch rating statistics' },
        { status: 500 }
      );
    }

    // Calculate statistics
    const ratings = ratingStats || [];
    const totalRatings = ratings.length;
    const averageRating = totalRatings > 0 
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings 
      : 0;

    // Calculate rating distribution
    const distribution = {
      1: ratings.filter(r => r.rating === 1).length,
      2: ratings.filter(r => r.rating === 2).length,
      3: ratings.filter(r => r.rating === 3).length,
      4: ratings.filter(r => r.rating === 4).length,
      5: ratings.filter(r => r.rating === 5).length
    };

    let reviews = [];
    let reviewsPagination = null;

    // Get reviews if requested
    if (includeReviews) {
      const offset = (page - 1) * limit;
      
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('story_ratings')
        .select(`
          id,
          user_id,
          rating,
          review,
          created_at,
          updated_at,
          profiles:user_id (
            id,
            username,
            avatar_url
          )
        `)
        .eq('story_id', storyId)
        .not('review', 'is', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (reviewsError) {
        console.error('Error fetching reviews:', reviewsError);
      } else {
        reviews = reviewsData || [];
      }

      // Get total count for pagination
      const { count: totalReviews } = await supabase
        .from('story_ratings')
        .select('*', { count: 'exact', head: true })
        .eq('story_id', storyId)
        .not('review', 'is', null);

      reviewsPagination = {
        page,
        limit,
        total: totalReviews || 0,
        total_pages: Math.ceil((totalReviews || 0) / limit),
        has_next: page * limit < (totalReviews || 0),
        has_prev: page > 1
      };
    }

    // Get user's rating if authenticated
    let userRating = null;
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
        const { data: rating } = await userSupabase
          .from('story_ratings')
          .select('id, rating, review, created_at, updated_at')
          .eq('story_id', storyId)
          .eq('user_id', user.id)
          .single();

        userRating = rating;
      }
    }

    const response: any = {
      statistics: {
        total_ratings: totalRatings,
        average_rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        distribution
      },
      user_rating: userRating
    };

    if (includeReviews) {
      response.reviews = reviews;
      response.reviews_pagination = reviewsPagination;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Get ratings error:', error);
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
    const { rating, review } = body;

    // Validate rating
    if (!rating || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be an integer between 1 and 5' },
        { status: 400 }
      );
    }

    // Validate review if provided
    if (review && review.length > 1000) {
      return NextResponse.json(
        { error: 'Review must be less than 1000 characters' },
        { status: 400 }
      );
    }

    // Verify story exists and is published
    const { data: story, error: storyError } = await userSupabase
      .from('stories')
      .select('id, status, author_id')
      .eq('id', storyId)
      .single();

    if (storyError || !story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }

    if (story.status !== 'published') {
      return NextResponse.json(
        { error: 'Cannot rate unpublished stories' },
        { status: 403 }
      );
    }

    // Prevent authors from rating their own stories
    if (story.author_id === user.id) {
      return NextResponse.json(
        { error: 'Authors cannot rate their own stories' },
        { status: 403 }
      );
    }

    // Check if user has completed the story (optional requirement)
    const { data: progress } = await userSupabase
      .from('user_story_progress')
      .select('is_completed, completion_percentage')
      .eq('story_id', storyId)
      .eq('user_id', user.id)
      .single();

    // Require at least 50% completion to rate
    if (!progress || progress.completion_percentage < 50) {
      return NextResponse.json(
        { error: 'You must complete at least 50% of the story to rate it' },
        { status: 403 }
      );
    }

    // Create or update rating
    const ratingData = {
      user_id: user.id,
      story_id: storyId,
      rating,
      review: review?.trim() || null
    };

    const { data: ratingResult, error: ratingError } = await userSupabase
      .from('story_ratings')
      .upsert(ratingData, {
        onConflict: 'user_id,story_id',
        ignoreDuplicates: false
      })
      .select(`
        id,
        user_id,
        story_id,
        rating,
        review,
        created_at,
        updated_at
      `)
      .single();

    if (ratingError) {
      console.error('Error submitting rating:', ratingError);
      return NextResponse.json(
        { error: 'Failed to submit rating', details: ratingError.message },
        { status: 500 }
      );
    }

    // Update story's average rating (this could be done via database triggers in production)
    const { data: allRatings } = await userSupabase
      .from('story_ratings')
      .select('rating')
      .eq('story_id', storyId);

    if (allRatings && allRatings.length > 0) {
      const newAverage = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;
      
      await userSupabase
        .from('stories')
        .update({ 
          average_rating: Math.round(newAverage * 10) / 10,
          ratings_count: allRatings.length
        })
        .eq('id', storyId);
    }

    return NextResponse.json({
      rating: ratingResult,
      message: 'Rating submitted successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Submit rating error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
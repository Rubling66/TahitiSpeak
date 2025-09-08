import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Database health check endpoint
 * Tests database connectivity and basic operations
 */
export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: 'Database configuration missing',
          details: {
            supabaseUrl: !!supabaseUrl,
            supabaseKey: !!supabaseKey,
          },
        },
        { status: 503 }
      );
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test basic connectivity with a simple query
    const startTime = Date.now();
    const { data, error } = await supabase
      .from('courses')
      .select('count')
      .limit(1)
      .single();
    
    const responseTime = Date.now() - startTime;
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned", which is OK
      console.error('Database health check failed:', error);
      
      return NextResponse.json(
        {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: 'Database query failed',
          details: {
            message: error.message,
            code: error.code,
            responseTime,
          },
        },
        { status: 503 }
      );
    }

    // Test authentication status
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        responseTime,
        url: supabaseUrl.replace(/\/\/([^@]+@)?/, '//***@'), // Mask credentials
      },
      auth: {
        configured: !authError,
        userSession: !!user,
      },
    };

    return NextResponse.json(healthData, { status: 200 });
    
  } catch (error) {
    console.error('Database health check error:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown database error',
        database: {
          connected: false,
        },
      },
      { status: 503 }
    );
  }
}
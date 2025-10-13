import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Registration debug endpoint hit');
    
    // Parse request body
    const body = await request.json();
    console.log('Request body:', body);
    
    return NextResponse.json({
      success: true,
      message: 'Debug endpoint working',
      receivedData: body
    }, { status: 200 });
    
  } catch (error) {
    console.error('Debug registration error:', error);
    
    return NextResponse.json(
      { 
        error: 'Debug error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
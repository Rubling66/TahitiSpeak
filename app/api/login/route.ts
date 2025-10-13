// API route to handle external login requests (likely from IDE integrations)
// This prevents 404 errors in the console

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Log the request for debugging
  console.log('External login request received:', request.url);
  
  // Return a simple response to prevent errors
  return NextResponse.json(
    { 
      message: 'Login endpoint not implemented in this application',
      source: 'tahitian-tutor-web',
      timestamp: new Date().toISOString()
    },
    { status: 501 } // Not Implemented
  );
}

export async function POST(request: NextRequest) {
  // Log the request for debugging
  console.log('External login POST request received:', request.url);
  
  // Return a simple response to prevent errors
  return NextResponse.json(
    { 
      message: 'Login endpoint not implemented in this application',
      source: 'tahitian-tutor-web',
      timestamp: new Date().toISOString()
    },
    { status: 501 } // Not Implemented
  );
}
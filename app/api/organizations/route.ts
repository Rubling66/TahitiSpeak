// API route to handle external organizations requests (likely from IDE integrations)
// This prevents JSON parsing errors in the console

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Log the request for debugging
  console.log('External organizations request received:', request.url);
  
  // Return a proper JSON response to prevent parsing errors
  return NextResponse.json(
    { 
      organizations: [],
      message: 'Organizations endpoint not implemented in this application',
      source: 'tahitian-tutor-web',
      timestamp: new Date().toISOString()
    },
    { status: 501 } // Not Implemented
  );
}

export async function POST(request: NextRequest) {
  // Log the request for debugging
  console.log('External organizations POST request received:', request.url);
  
  // Return a proper JSON response to prevent parsing errors
  return NextResponse.json(
    { 
      organizations: [],
      message: 'Organizations endpoint not implemented in this application',
      source: 'tahitian-tutor-web',
      timestamp: new Date().toISOString()
    },
    { status: 501 } // Not Implemented
  );
}
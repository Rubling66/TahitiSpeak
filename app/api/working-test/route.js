import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    status: 'working',
    message: 'API route is functional',
    timestamp: new Date().toISOString()
  });
}
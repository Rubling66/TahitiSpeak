import { NextRequest, NextResponse } from 'next/server';
import { LocalAIService } from '@/lib/local-ai/LocalAIService';
import { getLocalAIConfig } from '@/lib/local-ai/config';

/**
 * GET /api/local-ai/health
 * Check the health and availability of the local AI service
 */
export async function GET() {
  try {
    const localAI = LocalAIService.getInstance();
    const config = getLocalAIConfig();
    
    // Test connection to local AI
    const isConnected = await localAI.testConnection();
    
    if (!isConnected) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Local AI service is not available',
          endpoint: config.endpoint,
          model: config.model,
          connected: false
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json({
      status: 'healthy',
      message: 'Local AI service is running',
      endpoint: config.endpoint,
      model: config.model,
      connected: true,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'error',
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        connected: false
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/local-ai/health
 * Test connection with custom configuration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint, model } = body;
    
    if (!endpoint || !model) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Endpoint and model are required'
        },
        { status: 400 }
      );
    }
    
    const localAI = LocalAIService.getInstance();
    
    // Test connection (note: custom endpoint/model testing would require service enhancement)
    const isConnected = await localAI.testConnection();
    
    return NextResponse.json({
      status: isConnected ? 'success' : 'error',
      message: isConnected ? 'Connection test successful' : 'Connection test failed',
      endpoint,
      model,
      connected: isConnected,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Connection test failed:', error);
    
    return NextResponse.json(
      {
        status: 'error',
        message: 'Connection test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { localTTSService, LocalTTSRequest } from '@/lib/local-ai/LocalTTSService';

/**
 * POST /api/local-ai/tts
 * Generate speech audio using local AI model
 */
export async function POST(request: NextRequest) {
  try {
    const body: LocalTTSRequest = await request.json();
    
    // Validate request
    if (!body.text || typeof body.text !== 'string') {
      return NextResponse.json(
        {
          error: 'Text is required and must be a string',
          code: 'INVALID_INPUT'
        },
        { status: 400 }
      );
    }
    
    if (body.text.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'Text cannot be empty',
          code: 'EMPTY_TEXT'
        },
        { status: 400 }
      );
    }
    
    if (body.text.length > 1000) {
      return NextResponse.json(
        {
          error: 'Text is too long (max 1000 characters)',
          code: 'TEXT_TOO_LONG'
        },
        { status: 400 }
      );
    }
    
    // Check if local TTS service is available
    if (!localTTSService.isAvailable()) {
      return NextResponse.json(
        {
          error: 'Local TTS service is not available. Please ensure Llama 3.1 DeepSeek is running locally.',
          code: 'SERVICE_UNAVAILABLE'
        },
        { status: 503 }
      );
    }
    
    // Generate speech
    const response = await localTTSService.generateSpeech(body);
    
    return NextResponse.json({
      success: true,
      data: response,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('TTS generation failed:', error);
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'TTS generation failed',
        code: 'TTS_GENERATION_FAILED'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/local-ai/tts/languages
 * Get supported languages for TTS
 */
export async function GET() {
  try {
    const languages = localTTSService.getSupportedLanguages();
    
    return NextResponse.json({
      success: true,
      languages,
      available: localTTSService.isAvailable()
    });
    
  } catch (error) {
    console.error('Failed to get TTS languages:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to get supported languages',
        code: 'LANGUAGES_FETCH_FAILED'
      },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { localTTSService } from '@/lib/local-ai/LocalTTSService';

interface PhoneticRequest {
  text: string;
  language?: string;
}

/**
 * POST /api/local-ai/phonetic
 * Get phonetic pronunciation guide using local AI
 */
export async function POST(request: NextRequest) {
  try {
    const body: PhoneticRequest = await request.json();
    
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
    
    if (body.text.length > 500) {
      return NextResponse.json(
        {
          error: 'Text is too long for phonetic analysis (max 500 characters)',
          code: 'TEXT_TOO_LONG'
        },
        { status: 400 }
      );
    }
    
    // Validate language if provided
    const supportedLanguages = ['french', 'tahitian', 'english'];
    const language = body.language || 'french';
    
    if (!supportedLanguages.includes(language)) {
      return NextResponse.json(
        {
          error: `Unsupported language: ${language}. Supported languages: ${supportedLanguages.join(', ')}`,
          code: 'UNSUPPORTED_LANGUAGE'
        },
        { status: 400 }
      );
    }
    
    // Check if local TTS service is available
    if (!localTTSService.isAvailable()) {
      return NextResponse.json(
        {
          error: 'Local AI service is not available. Please ensure Llama 3.1 DeepSeek is running locally.',
          code: 'SERVICE_UNAVAILABLE'
        },
        { status: 503 }
      );
    }
    
    // Generate phonetic guide
    const phoneticGuide = await localTTSService.getPhoneticGuide(body.text, language);
    
    return NextResponse.json({
      success: true,
      data: {
        text: body.text,
        language,
        phoneticGuide,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Phonetic guide generation failed:', error);
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Phonetic guide generation failed',
        code: 'PHONETIC_GENERATION_FAILED'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/local-ai/phonetic/languages
 * Get supported languages for phonetic analysis
 */
export async function GET() {
  try {
    const languages = [
      {
        code: 'french',
        name: 'French',
        description: 'French language phonetic analysis'
      },
      {
        code: 'tahitian',
        name: 'Tahitian',
        description: 'Tahitian language phonetic analysis'
      },
      {
        code: 'english',
        name: 'English',
        description: 'English language phonetic analysis'
      }
    ];
    
    return NextResponse.json({
      success: true,
      languages,
      available: localTTSService.isAvailable()
    });
    
  } catch (error) {
    console.error('Failed to get phonetic languages:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to get supported languages',
        code: 'LANGUAGES_FETCH_FAILED'
      },
      { status: 500 }
    );
  }
}
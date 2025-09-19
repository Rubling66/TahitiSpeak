import { NextRequest, NextResponse } from 'next/server';
import AIService from '@/lib/genkit/AIService';

export async function POST(request: NextRequest) {
  try {
    const { targetText, userAudio, language } = await request.json();
    
    if (!targetText || !userAudio || !language) {
      return NextResponse.json(
        { error: 'Missing required fields: targetText, userAudio, language' },
        { status: 400 }
      );
    }
    
    const result = await AIService.analyzePronunciation(targetText, userAudio, language);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Pronunciation analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze pronunciation' },
      { status: 500 }
    );
  }
}
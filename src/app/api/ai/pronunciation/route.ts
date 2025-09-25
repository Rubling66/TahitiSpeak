import { NextRequest, NextResponse } from 'next/server';
import { LocalAIService } from '@/lib/local-ai/LocalAIService';

export async function POST(request: NextRequest) {
  try {
    const { targetText, userAudio, language } = await request.json();
    
    if (!targetText || !userAudio || !language) {
      return NextResponse.json(
        { error: 'Missing required fields: targetText, userAudio, language' },
        { status: 400 }
      );
    }
    
    const localAI = LocalAIService.getInstance();
    const result = await localAI.analyzePronunciation(targetText, userAudio, language);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Pronunciation analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze pronunciation' },
      { status: 500 }
    );
  }
}
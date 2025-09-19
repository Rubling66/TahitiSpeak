import { NextRequest, NextResponse } from 'next/server';
import AIService from '@/lib/genkit/AIService';

export async function POST(request: NextRequest) {
  try {
    const translationRequest = await request.json();
    
    if (!translationRequest.text || !translationRequest.fromLanguage || !translationRequest.toLanguage) {
      return NextResponse.json(
        { error: 'Missing required fields: text, fromLanguage, toLanguage' },
        { status: 400 }
      );
    }
    
    const result = await AIService.translateText(translationRequest);
    
    return NextResponse.json({ translation: result });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: 'Failed to translate text' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import AIService from '@/lib/genkit/AIService';

export async function POST(request: NextRequest) {
  try {
    const { topic, level, focusAreas } = await request.json();
    
    if (!topic || !level || !focusAreas) {
      return NextResponse.json(
        { error: 'Missing required fields: topic, level, focusAreas' },
        { status: 400 }
      );
    }
    
    const result = await AIService.generateLesson(topic, level, focusAreas);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Lesson generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate lesson' },
      { status: 500 }
    );
  }
}
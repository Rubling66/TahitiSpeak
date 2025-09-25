import { NextRequest, NextResponse } from 'next/server';
import { LocalAIService } from '@/lib/local-ai/LocalAIService';

export async function POST(request: NextRequest) {
  try {
    const { topic, level, focusAreas } = await request.json();
    
    if (!topic || !level || !focusAreas) {
      return NextResponse.json(
        { error: 'Missing required fields: topic, level, focusAreas' },
        { status: 400 }
      );
    }
    
    const localAI = LocalAIService.getInstance();
    const result = await localAI.generateLesson(topic, level, focusAreas);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Lesson generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate lesson' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { LocalAIService } from '@/lib/local-ai/LocalAIService';

export async function POST(request: NextRequest) {
  try {
    const { context, userLevel } = await request.json();
    
    if (!context || !userLevel) {
      return NextResponse.json(
        { error: 'Missing required fields: context, userLevel' },
        { status: 400 }
      );
    }
    
    const localAI = LocalAIService.getInstance();
    const result = await localAI.getConversationSuggestions(context, userLevel);
    
    return NextResponse.json({ suggestions: result });
  } catch (error) {
    console.error('Conversation suggestions error:', error);
    return NextResponse.json(
      { error: 'Failed to get conversation suggestions' },
      { status: 500 }
    );
  }
}
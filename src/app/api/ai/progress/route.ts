import { NextRequest, NextResponse } from 'next/server';
import AIService from '@/lib/genkit/AIService';

export async function POST(request: NextRequest) {
  try {
    const userStats = await request.json();
    
    if (!userStats.lessonsCompleted && userStats.lessonsCompleted !== 0 || 
        !userStats.averageScore && userStats.averageScore !== 0 || 
        !userStats.weakAreas || !userStats.strongAreas) {
      return NextResponse.json(
        { error: 'Missing required fields: lessonsCompleted, averageScore, weakAreas, strongAreas' },
        { status: 400 }
      );
    }
    
    const result = await AIService.analyzeProgress(userStats);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Progress analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze progress' },
      { status: 500 }
    );
  }
}
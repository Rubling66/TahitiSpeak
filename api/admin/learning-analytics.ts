import { Request, Response } from 'express';
import { supabase } from '../../src/lib/supabase';

interface LearningAnalytics {
  lessonId: string;
  lessonName: string;
  completions: number;
  averageScore: number;
  timeSpent: number;
  difficulty: number;
  dropoffRate: number;
}

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { timeRange = '7d', limit = 20 } = req.query;
    const timeRangeMap: { [key: string]: number } = {
      '1d': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90
    };

    const days = timeRangeMap[timeRange as string] || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all lessons/content
    const { data: lessonsData, error: lessonsError } = await supabase
      .from('content')
      .select('id, title, difficulty_level')
      .eq('type', 'lesson')
      .limit(parseInt(limit as string));

    if (lessonsError) throw lessonsError;

    const analytics: LearningAnalytics[] = [];

    for (const lesson of lessonsData || []) {
      // Get completion data
      const { data: completionData, error: completionError } = await supabase
        .from('learning_analytics')
        .select('user_id, score, time_spent, progress_percentage')
        .eq('content_id', lesson.id)
        .eq('event_type', 'lesson_completed')
        .gte('created_at', startDate.toISOString());

      if (completionError) throw completionError;

      // Get lesson start data (for dropoff calculation)
      const { data: startData, error: startError } = await supabase
        .from('learning_analytics')
        .select('user_id')
        .eq('content_id', lesson.id)
        .eq('event_type', 'lesson_started')
        .gte('created_at', startDate.toISOString());

      if (startError) throw startError;

      // Calculate metrics
      const completions = completionData?.length || 0;
      const starts = startData?.length || 0;
      
      const averageScore = completionData && completionData.length > 0
        ? completionData.reduce((sum, item) => sum + (item.score || 0), 0) / completionData.length
        : 0;

      const timeSpent = completionData && completionData.length > 0
        ? completionData.reduce((sum, item) => sum + (item.time_spent || 0), 0) / completionData.length
        : 0;

      const dropoffRate = starts > 0 ? ((starts - completions) / starts) * 100 : 0;

      // Get difficulty from content or calculate based on performance
      let difficulty = lesson.difficulty_level || 0;
      if (difficulty === 0 && completionData && completionData.length > 0) {
        // Calculate difficulty based on average score and time spent
        const avgScore = averageScore;
        const avgTime = timeSpent;
        
        // Simple difficulty calculation (lower scores and higher time = more difficult)
        if (avgScore < 60 || avgTime > 300) { // 5 minutes
          difficulty = 3; // Hard
        } else if (avgScore < 80 || avgTime > 180) { // 3 minutes
          difficulty = 2; // Medium
        } else {
          difficulty = 1; // Easy
        }
      }

      analytics.push({
        lessonId: lesson.id,
        lessonName: lesson.title,
        completions,
        averageScore,
        timeSpent,
        difficulty,
        dropoffRate
      });
    }

    // Sort by completions (most popular first)
    analytics.sort((a, b) => b.completions - a.completions);

    res.status(200).json(analytics);
  } catch (error) {
    console.error('Error fetching learning analytics:', error);
    res.status(500).json({ error: 'Failed to fetch learning analytics' });
  }
}
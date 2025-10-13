import express from 'express';
import { supabase } from '../config/supabase';
import { authenticateUser } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

const router = express.Router();

// Validation schemas
const trackEventSchema = z.object({
  eventType: z.string().min(1),
  eventName: z.string().min(1),
  eventData: z.record(z.any()).optional(),
  pageUrl: z.string().optional(),
  sessionId: z.string().optional(),
  timestamp: z.string().datetime().optional()
});

const trackLearningEventSchema = z.object({
  lessonId: z.string().min(1),
  exerciseId: z.string().optional(),
  activityType: z.enum(['lesson_start', 'lesson_complete', 'exercise_attempt', 'hint_used', 'mistake_made']),
  timeSpentSeconds: z.number().min(0).optional(),
  successRate: z.number().min(0).max(100).optional(),
  mistakesCount: z.number().min(0).optional(),
  hintsUsed: z.number().min(0).optional(),
  difficultyLevel: z.string().optional(),
  result: z.record(z.any()).optional()
});

const analyticsQuerySchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  timeframe: z.enum(['hour', 'day', 'week', 'month']).optional().default('day'),
  userId: z.string().optional(),
  eventType: z.string().optional(),
  includeUserGrowth: z.boolean().optional().default(false),
  includeLearningProgress: z.boolean().optional().default(false),
  includeEngagement: z.boolean().optional().default(false),
  includeTopContent: z.boolean().optional().default(false)
});

// Track general analytics event
router.post('/events', authenticateUser, validateRequest(trackEventSchema), async (req, res) => {
  try {
    const { eventType, eventName, eventData, pageUrl, sessionId, timestamp } = req.body;
    const userId = req.user?.id;

    const { data, error } = await supabase
      .from('analytics_events')
      .insert({
        user_id: userId,
        session_id: sessionId,
        event_type: eventType,
        event_name: eventName,
        event_data: eventData || {},
        page_url: pageUrl || req.headers.referer,
        user_agent: req.headers['user-agent'],
        ip_address: req.ip,
        timestamp: timestamp || new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error tracking event:', error);
      return res.status(500).json({ error: 'Failed to track event' });
    }

    res.json({ success: true, eventId: data.id });
  } catch (error) {
    console.error('Error in track event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Track learning analytics
router.post('/learning', authenticateUser, validateRequest(trackLearningEventSchema), async (req, res) => {
  try {
    const {
      lessonId,
      exerciseId,
      activityType,
      timeSpentSeconds,
      successRate,
      mistakesCount,
      hintsUsed,
      difficultyLevel,
      result
    } = req.body;
    const userId = req.user?.id;

    const { data, error } = await supabase
      .from('learning_analytics')
      .insert({
        user_id: userId,
        lesson_id: lessonId,
        exercise_id: exerciseId,
        activity_type: activityType,
        time_spent_seconds: timeSpentSeconds,
        success_rate: successRate,
        mistakes_count: mistakesCount,
        hints_used: hintsUsed,
        difficulty_level: difficultyLevel,
        result: result || {},
        completed_at: activityType.includes('complete') ? new Date().toISOString() : null
      })
      .select()
      .single();

    if (error) {
      console.error('Error tracking learning event:', error);
      return res.status(500).json({ error: 'Failed to track learning event' });
    }

    // Update user engagement score
    if (activityType === 'lesson_complete') {
      await updateEngagementScore(userId, successRate || 0, timeSpentSeconds || 0);
    }

    res.json({ success: true, eventId: data.id });
  } catch (error) {
    console.error('Error in track learning event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start user session
router.post('/sessions/start', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { deviceInfo, location } = req.body;

    const { data, error } = await supabase
      .from('user_sessions')
      .insert({
        user_id: userId,
        session_start: new Date().toISOString(),
        device_info: deviceInfo || {},
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        location: location || 'Unknown'
      })
      .select()
      .single();

    if (error) {
      console.error('Error starting session:', error);
      return res.status(500).json({ error: 'Failed to start session' });
    }

    res.json({ success: true, sessionId: data.id });
  } catch (error) {
    console.error('Error in start session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// End user session
router.post('/sessions/:sessionId/end', authenticateUser, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { pageViews, totalEvents } = req.body;

    const { data, error } = await supabase
      .from('user_sessions')
      .update({
        session_end: new Date().toISOString(),
        page_views: pageViews || 0,
        total_events: totalEvents || 0
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('Error ending session:', error);
      return res.status(500).json({ error: 'Failed to end session' });
    }

    res.json({ success: true, session: data });
  } catch (error) {
    console.error('Error in end session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get dashboard data
router.get('/dashboard', authenticateUser, validateRequest(analyticsQuerySchema, 'query'), async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      timeframe,
      userId,
      eventType,
      includeUserGrowth,
      includeLearningProgress,
      includeEngagement,
      includeTopContent
    } = req.query as any;

    const dashboardData: any = {};

    // Get total users
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    dashboardData.totalUsers = totalUsers || 0;

    // Get active users in date range
    const { count: activeUsers } = await supabase
      .from('user_sessions')
      .select('user_id', { count: 'exact', head: true })
      .gte('session_start', startDate)
      .lte('session_start', endDate);
    dashboardData.activeUsers = activeUsers || 0;

    // Get total sessions
    const { count: totalSessions } = await supabase
      .from('user_sessions')
      .select('*', { count: 'exact', head: true })
      .gte('session_start', startDate)
      .lte('session_start', endDate);
    dashboardData.totalSessions = totalSessions || 0;

    // Get average session duration
    const { data: sessionDurations } = await supabase
      .from('user_sessions')
      .select('session_start, session_end')
      .gte('session_start', startDate)
      .lte('session_start', endDate)
      .not('session_end', 'is', null);

    if (sessionDurations && sessionDurations.length > 0) {
      const totalDuration = sessionDurations.reduce((sum, session) => {
        const start = new Date(session.session_start).getTime();
        const end = new Date(session.session_end).getTime();
        return sum + (end - start);
      }, 0);
      dashboardData.averageSessionDuration = Math.floor(totalDuration / sessionDurations.length);
    } else {
      dashboardData.averageSessionDuration = 0;
    }

    // Get lessons completed
    const { count: lessonsCompleted } = await supabase
      .from('learning_analytics')
      .select('*', { count: 'exact', head: true })
      .eq('activity_type', 'lesson_complete')
      .gte('created_at', startDate)
      .lte('created_at', endDate);
    dashboardData.lessonsCompleted = lessonsCompleted || 0;

    // Get engagement score
    const { data: engagementData } = await supabase
      .from('user_engagement_scores')
      .select('engagement_score')
      .gte('calculated_at', startDate)
      .lte('calculated_at', endDate);

    if (engagementData && engagementData.length > 0) {
      const avgEngagement = engagementData.reduce((sum, item) => sum + item.engagement_score, 0) / engagementData.length;
      dashboardData.engagementScore = Math.round(avgEngagement);
    } else {
      dashboardData.engagementScore = 0;
    }

    // Include additional data based on flags
    if (includeUserGrowth) {
      dashboardData.userGrowth = await getUserGrowthData(startDate, endDate, timeframe);
    }

    if (includeLearningProgress) {
      dashboardData.learningProgress = await getLearningProgressData(startDate, endDate, timeframe);
    }

    if (includeEngagement) {
      dashboardData.engagementMetrics = await getEngagementMetrics(startDate, endDate);
    }

    if (includeTopContent) {
      dashboardData.topContent = await getTopContentData(startDate, endDate);
    }

    res.json(dashboardData);
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user behavior patterns
router.get('/behavior-patterns', authenticateUser, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const { data, error } = await supabase
      .from('user_behavior_patterns')
      .select('*')
      .gte('identified_at', startDate)
      .lte('identified_at', endDate)
      .order('frequency', { ascending: false });

    if (error) {
      console.error('Error getting behavior patterns:', error);
      return res.status(500).json({ error: 'Failed to get behavior patterns' });
    }

    res.json(data || []);
  } catch (error) {
    console.error('Error in get behavior patterns:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get performance metrics
router.get('/performance', authenticateUser, async (req, res) => {
  try {
    const { startDate, endDate, metricType } = req.query;

    let query = supabase
      .from('performance_metrics')
      .select('*')
      .gte('recorded_at', startDate)
      .lte('recorded_at', endDate);

    if (metricType) {
      query = query.eq('metric_type', metricType);
    }

    const { data, error } = await query.order('recorded_at', { ascending: false });

    if (error) {
      console.error('Error getting performance metrics:', error);
      return res.status(500).json({ error: 'Failed to get performance metrics' });
    }

    res.json(data || []);
  } catch (error) {
    console.error('Error in get performance metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Calculate engagement score for user
router.post('/engagement/calculate/:userId', authenticateUser, async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.body;

    const score = await calculateEngagementScore(userId, startDate, endDate);
    
    res.json({ userId, engagementScore: score, calculatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Error calculating engagement score:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export analytics data
router.get('/export', authenticateUser, async (req, res) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;

    // Get all analytics data
    const [events, learning, sessions, engagement] = await Promise.all([
      supabase
        .from('analytics_events')
        .select('*')
        .gte('timestamp', startDate)
        .lte('timestamp', endDate),
      supabase
        .from('learning_analytics')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate),
      supabase
        .from('user_sessions')
        .select('*')
        .gte('session_start', startDate)
        .lte('session_start', endDate),
      supabase
        .from('user_engagement_scores')
        .select('*')
        .gte('calculated_at', startDate)
        .lte('calculated_at', endDate)
    ]);

    const exportData = {
      events: events.data || [],
      learning: learning.data || [],
      sessions: sessions.data || [],
      engagement: engagement.data || [],
      exportedAt: new Date().toISOString(),
      dateRange: { startDate, endDate }
    };

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(exportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=analytics-export.csv');
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=analytics-export.json');
      res.json(exportData);
    }
  } catch (error) {
    console.error('Error exporting analytics data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper functions
async function updateEngagementScore(userId: string, successRate: number, timeSpent: number) {
  try {
    // Calculate engagement score based on success rate and time spent
    const baseScore = successRate;
    const timeBonus = Math.min(timeSpent / 300, 1) * 20; // Max 20 points for time
    const engagementScore = Math.min(baseScore + timeBonus, 100);

    await supabase
      .from('user_engagement_scores')
      .upsert({
        user_id: userId,
        engagement_score: engagementScore,
        calculated_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Error updating engagement score:', error);
  }
}

async function calculateEngagementScore(userId: string, startDate: string, endDate: string): Promise<number> {
  try {
    // Get user's learning activities
    const { data: learningData } = await supabase
      .from('learning_analytics')
      .select('success_rate, time_spent_seconds, activity_type')
      .eq('user_id', userId)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (!learningData || learningData.length === 0) {
      return 0;
    }

    // Calculate weighted engagement score
    let totalScore = 0;
    let totalWeight = 0;

    learningData.forEach(activity => {
      const weight = activity.activity_type === 'lesson_complete' ? 2 : 1;
      const score = (activity.success_rate || 0) + Math.min((activity.time_spent_seconds || 0) / 300, 1) * 20;
      
      totalScore += score * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  } catch (error) {
    console.error('Error calculating engagement score:', error);
    return 0;
  }
}

async function getUserGrowthData(startDate: string, endDate: string, timeframe: string) {
  // Implementation for user growth data aggregation
  const { data } = await supabase
    .from('profiles')
    .select('created_at')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at');

  // Group by timeframe and return growth data
  return data || [];
}

async function getLearningProgressData(startDate: string, endDate: string, timeframe: string) {
  // Implementation for learning progress data aggregation
  const { data } = await supabase
    .from('learning_analytics')
    .select('created_at, activity_type, success_rate')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at');

  // Group by timeframe and return progress data
  return data || [];
}

async function getEngagementMetrics(startDate: string, endDate: string) {
  // Implementation for engagement metrics
  const { data } = await supabase
    .from('user_engagement_scores')
    .select('*')
    .gte('calculated_at', startDate)
    .lte('calculated_at', endDate);

  return data || [];
}

async function getTopContentData(startDate: string, endDate: string) {
  // Implementation for top content data
  const { data } = await supabase
    .from('learning_analytics')
    .select('lesson_id, activity_type')
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  // Aggregate and return top content
  return data || [];
}

function convertToCSV(data: any): string {
  // Simple CSV conversion implementation
  const headers = Object.keys(data);
  const csvContent = headers.join(',') + '\n';
  
  // Add data rows (simplified implementation)
  return csvContent + JSON.stringify(data);
}

export default router;
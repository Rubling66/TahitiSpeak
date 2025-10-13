import { Request, Response } from 'express';
import { supabase } from '../../src/lib/supabase';

interface UserAnalytics {
  timestamp: string;
  activeUsers: number;
  newUsers: number;
  sessions: number;
  bounceRate: number;
  avgSessionDuration: number;
}

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { timeRange = '7d' } = req.query;
    const timeRangeMap: { [key: string]: number } = {
      '1d': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90
    };

    const days = timeRangeMap[timeRange as string] || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Generate time intervals based on the time range
    const intervals = generateTimeIntervals(startDate, new Date(), timeRange as string);
    
    const analytics: UserAnalytics[] = [];

    for (const interval of intervals) {
      const intervalStart = interval.start;
      const intervalEnd = interval.end;

      // Get active users for this interval
      const { data: activeUsersData, error: activeUsersError } = await supabase
        .from('analytics_events')
        .select('user_id')
        .gte('created_at', intervalStart.toISOString())
        .lt('created_at', intervalEnd.toISOString())
        .not('user_id', 'is', null);

      if (activeUsersError) throw activeUsersError;

      const uniqueActiveUsers = new Set(activeUsersData?.map(event => event.user_id) || []).size;

      // Get new users for this interval
      const { data: newUsersData, error: newUsersError } = await supabase
        .from('profiles')
        .select('id')
        .gte('created_at', intervalStart.toISOString())
        .lt('created_at', intervalEnd.toISOString());

      if (newUsersError) throw newUsersError;

      // Get session data for this interval
      const { data: sessionData, error: sessionError } = await supabase
        .from('analytics_events')
        .select('session_id, user_id, created_at, event_type')
        .gte('created_at', intervalStart.toISOString())
        .lt('created_at', intervalEnd.toISOString())
        .not('session_id', 'is', null);

      if (sessionError) throw sessionError;

      // Calculate sessions and session metrics
      const sessions = new Map<string, {
        userId: string;
        startTime: Date;
        endTime: Date;
        events: number;
      }>();

      sessionData?.forEach(event => {
        const sessionId = event.session_id;
        const eventTime = new Date(event.created_at);

        if (!sessions.has(sessionId)) {
          sessions.set(sessionId, {
            userId: event.user_id,
            startTime: eventTime,
            endTime: eventTime,
            events: 0
          });
        }

        const session = sessions.get(sessionId)!;
        session.events++;
        
        if (eventTime < session.startTime) {
          session.startTime = eventTime;
        }
        if (eventTime > session.endTime) {
          session.endTime = eventTime;
        }
      });

      // Calculate bounce rate (sessions with only 1 event)
      const bouncedSessions = Array.from(sessions.values()).filter(session => session.events <= 1).length;
      const bounceRate = sessions.size > 0 ? (bouncedSessions / sessions.size) * 100 : 0;

      // Calculate average session duration
      const sessionDurations = Array.from(sessions.values()).map(session => 
        session.endTime.getTime() - session.startTime.getTime()
      );
      const avgSessionDuration = sessionDurations.length > 0
        ? sessionDurations.reduce((sum, duration) => sum + duration, 0) / sessionDurations.length / 1000 // Convert to seconds
        : 0;

      analytics.push({
        timestamp: intervalStart.toISOString(),
        activeUsers: uniqueActiveUsers,
        newUsers: newUsersData?.length || 0,
        sessions: sessions.size,
        bounceRate,
        avgSessionDuration
      });
    }

    res.status(200).json(analytics);
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({ error: 'Failed to fetch user analytics' });
  }
}

function generateTimeIntervals(startDate: Date, endDate: Date, timeRange: string): Array<{ start: Date; end: Date }> {
  const intervals: Array<{ start: Date; end: Date }> = [];
  
  let intervalSize: number;
  let intervalUnit: 'hour' | 'day';

  switch (timeRange) {
    case '1d':
      intervalSize = 1;
      intervalUnit = 'hour';
      break;
    case '7d':
      intervalSize = 1;
      intervalUnit = 'day';
      break;
    case '30d':
      intervalSize = 1;
      intervalUnit = 'day';
      break;
    case '90d':
      intervalSize = 7;
      intervalUnit = 'day';
      break;
    default:
      intervalSize = 1;
      intervalUnit = 'day';
  }

  let currentStart = new Date(startDate);
  
  while (currentStart < endDate) {
    const currentEnd = new Date(currentStart);
    
    if (intervalUnit === 'hour') {
      currentEnd.setHours(currentEnd.getHours() + intervalSize);
    } else {
      currentEnd.setDate(currentEnd.getDate() + intervalSize);
    }

    if (currentEnd > endDate) {
      intervals.push({ start: new Date(currentStart), end: new Date(endDate) });
      break;
    }

    intervals.push({ start: new Date(currentStart), end: new Date(currentEnd) });
    currentStart = currentEnd;
  }

  return intervals;
}
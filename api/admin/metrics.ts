import { Request, Response } from 'express';
import { supabase } from '../../src/lib/supabase';

interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  userGrowth: number;
  totalLessons: number;
  completedLessons: number;
  averageProgress: number;
  engagementRate: number;
  retentionRate: number;
  performanceScore: number;
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

    // Get total users
    const { data: totalUsersData, error: totalUsersError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' });

    if (totalUsersError) throw totalUsersError;

    // Get active users (users who have activity in the time range)
    const { data: activeUsersData, error: activeUsersError } = await supabase
      .from('analytics_events')
      .select('user_id', { count: 'exact' })
      .gte('created_at', startDate.toISOString())
      .not('user_id', 'is', null);

    if (activeUsersError) throw activeUsersError;

    // Get new users in time range
    const { data: newUsersData, error: newUsersError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .gte('created_at', startDate.toISOString());

    if (newUsersError) throw newUsersError;

    // Get user growth (compare with previous period)
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - days);

    const { data: previousNewUsersData, error: previousNewUsersError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .gte('created_at', previousStartDate.toISOString())
      .lt('created_at', startDate.toISOString());

    if (previousNewUsersError) throw previousNewUsersError;

    // Calculate user growth percentage
    const currentNewUsers = newUsersData?.length || 0;
    const previousNewUsers = previousNewUsersData?.length || 0;
    const userGrowth = previousNewUsers > 0 
      ? ((currentNewUsers - previousNewUsers) / previousNewUsers) * 100 
      : 0;

    // Get lesson statistics
    const { data: lessonsData, error: lessonsError } = await supabase
      .from('content')
      .select('id', { count: 'exact' })
      .eq('type', 'lesson');

    if (lessonsError) throw lessonsError;

    // Get completed lessons
    const { data: completedLessonsData, error: completedLessonsError } = await supabase
      .from('learning_analytics')
      .select('content_id', { count: 'exact' })
      .gte('created_at', startDate.toISOString())
      .eq('event_type', 'lesson_completed');

    if (completedLessonsError) throw completedLessonsError;

    // Get average progress
    const { data: progressData, error: progressError } = await supabase
      .from('learning_analytics')
      .select('progress_percentage')
      .gte('created_at', startDate.toISOString())
      .not('progress_percentage', 'is', null);

    if (progressError) throw progressError;

    const averageProgress = progressData && progressData.length > 0
      ? progressData.reduce((sum, item) => sum + (item.progress_percentage || 0), 0) / progressData.length
      : 0;

    // Calculate engagement rate (users with multiple sessions)
    const { data: engagementData, error: engagementError } = await supabase
      .from('analytics_events')
      .select('user_id, session_id')
      .gte('created_at', startDate.toISOString())
      .not('user_id', 'is', null);

    if (engagementError) throw engagementError;

    const userSessions = new Map<string, Set<string>>();
    engagementData?.forEach(event => {
      if (!userSessions.has(event.user_id)) {
        userSessions.set(event.user_id, new Set());
      }
      userSessions.get(event.user_id)!.add(event.session_id);
    });

    const engagedUsers = Array.from(userSessions.values()).filter(sessions => sessions.size > 1).length;
    const engagementRate = activeUsersData?.length ? (engagedUsers / activeUsersData.length) * 100 : 0;

    // Calculate retention rate (users who returned after first visit)
    const { data: retentionData, error: retentionError } = await supabase
      .rpc('calculate_retention_rate', { 
        start_date: startDate.toISOString(),
        end_date: new Date().toISOString()
      });

    if (retentionError) throw retentionError;

    const retentionRate = retentionData || 0;

    // Get performance score from performance monitoring
    const { data: performanceData, error: performanceError } = await supabase
      .from('analytics_events')
      .select('event_data')
      .eq('event_type', 'performance_score')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (performanceError) throw performanceError;

    const performanceScore = performanceData && performanceData.length > 0
      ? performanceData[0].event_data?.score || 0
      : 85; // Default score

    const metrics: DashboardMetrics = {
      totalUsers: totalUsersData?.length || 0,
      activeUsers: activeUsersData?.length || 0,
      newUsers: currentNewUsers,
      userGrowth,
      totalLessons: lessonsData?.length || 0,
      completedLessons: completedLessonsData?.length || 0,
      averageProgress,
      engagementRate,
      retentionRate,
      performanceScore
    };

    res.status(200).json(metrics);
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
}
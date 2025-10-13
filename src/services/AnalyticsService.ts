import { supabase } from './supabase';

export interface AnalyticsEvent {
  eventType: string;
  eventName: string;
  eventData?: Record<string, any>;
  pageUrl?: string;
  userId?: string;
  sessionId?: string;
}

export interface UserSession {
  id?: string;
  userId?: string;
  sessionStart: Date;
  sessionEnd?: Date;
  durationSeconds?: number;
  pageViews: number;
  eventsCount: number;
  deviceInfo: Record<string, any>;
  locationInfo: Record<string, any>;
  isActive: boolean;
  lastActivity: Date;
}

export interface LearningAnalytics {
  userId: string;
  lessonId?: string;
  exerciseId?: string;
  activityType: string;
  result?: Record<string, any>;
  difficultyLevel?: string;
  timeSpentSeconds?: number;
  successRate?: number;
  mistakesCount?: number;
  hintsUsed?: number;
  completedAt?: Date;
}

export interface PerformanceMetric {
  metricType: string;
  metricName: string;
  metricValue: number;
  metricUnit?: string;
  dimensions?: Record<string, any>;
  dateRecorded: Date;
  hourRecorded?: number;
}

export interface UserBehaviorPattern {
  userId: string;
  patternType: string;
  patternData: Record<string, any>;
  confidenceScore?: number;
}

export interface EngagementScore {
  userId: string;
  engagementScore: number;
  factors: Record<string, any>;
  periodStart: Date;
  periodEnd: Date;
}

export interface AnalyticsQuery {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  eventType?: string;
  metricType?: string;
  limit?: number;
  offset?: number;
}

export interface AnalyticsDashboardData {
  totalUsers: number;
  activeUsers: number;
  totalSessions: number;
  avgSessionDuration: number;
  totalLessonsCompleted: number;
  avgEngagementScore: number;
  topContent: Array<{
    contentId: string;
    contentType: string;
    views: number;
    completions: number;
  }>;
  userGrowth: Array<{
    date: string;
    newUsers: number;
    activeUsers: number;
  }>;
  learningProgress: Array<{
    date: string;
    lessonsCompleted: number;
    avgScore: number;
  }>;
}

class AnalyticsService {
  private currentSessionId: string | null = null;
  private eventQueue: AnalyticsEvent[] = [];
  private isOnline = navigator.onLine;
  private flushInterval: NodeJS.Timeout | null = null;
  private sessionCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeSession();
    this.setupEventListeners();
    this.startPeriodicFlush();
    this.startSessionMonitoring();
  }

  // Initialize user session
  private async initializeSession(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const sessionData: Partial<UserSession> = {
          userId: user.id,
          sessionStart: new Date(),
          pageViews: 0,
          eventsCount: 0,
          deviceInfo: this.getDeviceInfo(),
          locationInfo: await this.getLocationInfo(),
          isActive: true,
          lastActivity: new Date()
        };

        const { data, error } = await supabase
          .from('user_sessions')
          .insert(sessionData)
          .select()
          .single();

        if (error) {
          console.error('Failed to create session:', error);
        } else {
          this.currentSessionId = data.id;
          console.log('Analytics session initialized:', data.id);
        }
      }
    } catch (error) {
      console.error('Failed to initialize analytics session:', error);
    }
  }

  // Setup event listeners
  private setupEventListeners(): void {
    // Online/offline detection
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushEventQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Page visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackEvent('page', 'page_hidden');
        this.endSession();
      } else {
        this.trackEvent('page', 'page_visible');
        this.initializeSession();
      }
    });

    // Before unload
    window.addEventListener('beforeunload', () => {
      this.endSession();
      this.flushEventQueue();
    });

    // Page load
    window.addEventListener('load', () => {
      this.trackEvent('page', 'page_load', {
        loadTime: performance.now(),
        referrer: document.referrer
      });
    });
  }

  // Start periodic event queue flush
  private startPeriodicFlush(): void {
    this.flushInterval = setInterval(() => {
      if (this.isOnline && this.eventQueue.length > 0) {
        this.flushEventQueue();
      }
    }, 30000); // Flush every 30 seconds
  }

  // Start session monitoring
  private startSessionMonitoring(): void {
    this.sessionCheckInterval = setInterval(() => {
      this.updateSessionActivity();
    }, 60000); // Update every minute
  }

  // Track analytics event
  async trackEvent(
    eventType: string,
    eventName: string,
    eventData?: Record<string, any>,
    pageUrl?: string
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const event: AnalyticsEvent = {
        eventType,
        eventName,
        eventData: eventData || {},
        pageUrl: pageUrl || window.location.href,
        userId: user?.id,
        sessionId: this.currentSessionId || undefined
      };

      // Add to queue
      this.eventQueue.push(event);

      // Flush immediately for critical events
      const criticalEvents = ['error', 'conversion', 'purchase'];
      if (criticalEvents.includes(eventType) && this.isOnline) {
        await this.flushEventQueue();
      }

      console.log('Event tracked:', event);
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  // Track learning analytics
  async trackLearningEvent(data: LearningAnalytics): Promise<void> {
    try {
      const { error } = await supabase
        .from('learning_analytics')
        .insert({
          user_id: data.userId,
          lesson_id: data.lessonId,
          exercise_id: data.exerciseId,
          activity_type: data.activityType,
          result: data.result || {},
          difficulty_level: data.difficultyLevel,
          time_spent_seconds: data.timeSpentSeconds,
          success_rate: data.successRate,
          mistakes_count: data.mistakesCount || 0,
          hints_used: data.hintsUsed || 0,
          completed_at: data.completedAt
        });

      if (error) {
        console.error('Failed to track learning event:', error);
      } else {
        console.log('Learning event tracked:', data);
      }
    } catch (error) {
      console.error('Failed to track learning event:', error);
    }
  }

  // Track page view
  async trackPageView(pageUrl?: string, pageTitle?: string): Promise<void> {
    await this.trackEvent('page', 'page_view', {
      pageTitle: pageTitle || document.title,
      timestamp: new Date().toISOString()
    }, pageUrl);

    // Update session page views
    if (this.currentSessionId) {
      await supabase
        .from('user_sessions')
        .update({ 
          page_views: supabase.sql`page_views + 1`,
          last_activity: new Date().toISOString()
        })
        .eq('id', this.currentSessionId);
    }
  }

  // Track user action
  async trackUserAction(
    action: string,
    category: string,
    label?: string,
    value?: number
  ): Promise<void> {
    await this.trackEvent('user_action', action, {
      category,
      label,
      value,
      timestamp: new Date().toISOString()
    });
  }

  // Track conversion event
  async trackConversion(
    conversionType: string,
    value?: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.trackEvent('conversion', conversionType, {
      value,
      metadata,
      timestamp: new Date().toISOString()
    });
  }

  // Track error
  async trackError(
    error: Error,
    context?: Record<string, any>
  ): Promise<void> {
    await this.trackEvent('error', 'javascript_error', {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });
  }

  // Flush event queue to server
  private async flushEventQueue(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    try {
      const events = this.eventQueue.splice(0); // Remove all events from queue
      
      const eventsToInsert = events.map(event => ({
        user_id: event.userId,
        session_id: event.sessionId,
        event_type: event.eventType,
        event_name: event.eventName,
        event_data: event.eventData || {},
        page_url: event.pageUrl,
        user_agent: navigator.userAgent,
        ip_address: null, // Will be set by server
        device_type: this.getDeviceType(),
        browser: this.getBrowser(),
        os: this.getOS(),
        referrer: document.referrer || null
      }));

      const { error } = await supabase
        .from('analytics_events')
        .insert(eventsToInsert);

      if (error) {
        console.error('Failed to flush events:', error);
        // Re-add events to queue for retry
        this.eventQueue.unshift(...events);
      } else {
        console.log(`Flushed ${events.length} events to server`);
      }
    } catch (error) {
      console.error('Failed to flush event queue:', error);
    }
  }

  // Update session activity
  private async updateSessionActivity(): Promise<void> {
    if (!this.currentSessionId) return;

    try {
      await supabase
        .from('user_sessions')
        .update({ 
          last_activity: new Date().toISOString(),
          is_active: !document.hidden
        })
        .eq('id', this.currentSessionId);
    } catch (error) {
      console.error('Failed to update session activity:', error);
    }
  }

  // End current session
  private async endSession(): Promise<void> {
    if (!this.currentSessionId) return;

    try {
      await supabase
        .from('user_sessions')
        .update({ 
          session_end: new Date().toISOString(),
          is_active: false
        })
        .eq('id', this.currentSessionId);

      this.currentSessionId = null;
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }

  // Get device information
  private getDeviceInfo(): Record<string, any> {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screenWidth: screen.width,
      screenHeight: screen.height,
      colorDepth: screen.colorDepth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  // Get location information (basic)
  private async getLocationInfo(): Promise<Record<string, any>> {
    try {
      // This would typically use a geolocation service
      // For now, return basic timezone info
      return {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language
      };
    } catch (error) {
      return {};
    }
  }

  // Get device type
  private getDeviceType(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/mobile|android|iphone|ipad|phone/i.test(userAgent)) {
      return 'mobile';
    } else if (/tablet|ipad/i.test(userAgent)) {
      return 'tablet';
    }
    return 'desktop';
  }

  // Get browser name
  private getBrowser(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  // Get operating system
  private getOS(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  // Analytics query methods

  // Get dashboard data
  async getDashboardData(query: AnalyticsQuery = {}): Promise<AnalyticsDashboardData> {
    try {
      const startDate = query.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const endDate = query.endDate || new Date();

      // Get cached data first
      const cacheKey = `dashboard_${startDate.toISOString()}_${endDate.toISOString()}`;
      const { data: cachedData } = await supabase.rpc('get_analytics_cache', {
        p_cache_key: cacheKey
      });

      if (cachedData) {
        return cachedData;
      }

      // Calculate dashboard metrics
      const [
        totalUsersResult,
        activeUsersResult,
        totalSessionsResult,
        avgSessionDurationResult,
        totalLessonsResult,
        avgEngagementResult
      ] = await Promise.all([
        this.getTotalUsers(startDate, endDate),
        this.getActiveUsers(startDate, endDate),
        this.getTotalSessions(startDate, endDate),
        this.getAverageSessionDuration(startDate, endDate),
        this.getTotalLessonsCompleted(startDate, endDate),
        this.getAverageEngagementScore(startDate, endDate)
      ]);

      const dashboardData: AnalyticsDashboardData = {
        totalUsers: totalUsersResult,
        activeUsers: activeUsersResult,
        totalSessions: totalSessionsResult,
        avgSessionDuration: avgSessionDurationResult,
        totalLessonsCompleted: totalLessonsResult,
        avgEngagementScore: avgEngagementResult,
        topContent: await this.getTopContent(startDate, endDate),
        userGrowth: await this.getUserGrowth(startDate, endDate),
        learningProgress: await this.getLearningProgress(startDate, endDate)
      };

      // Cache the result for 1 hour
      await supabase.rpc('update_analytics_cache', {
        p_cache_key: cacheKey,
        p_cache_data: dashboardData,
        p_ttl_seconds: 3600
      });

      return dashboardData;
    } catch (error) {
      console.error('Failed to get dashboard data:', error);
      throw error;
    }
  }

  // Get total users
  private async getTotalUsers(startDate: Date, endDate: Date): Promise<number> {
    const { count, error } = await supabase
      .from('analytics_events')
      .select('user_id', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .not('user_id', 'is', null);

    if (error) throw error;
    return count || 0;
  }

  // Get active users
  private async getActiveUsers(startDate: Date, endDate: Date): Promise<number> {
    const { count, error } = await supabase
      .from('user_sessions')
      .select('user_id', { count: 'exact', head: true })
      .gte('session_start', startDate.toISOString())
      .lte('session_start', endDate.toISOString())
      .not('user_id', 'is', null);

    if (error) throw error;
    return count || 0;
  }

  // Get total sessions
  private async getTotalSessions(startDate: Date, endDate: Date): Promise<number> {
    const { count, error } = await supabase
      .from('user_sessions')
      .select('*', { count: 'exact', head: true })
      .gte('session_start', startDate.toISOString())
      .lte('session_start', endDate.toISOString());

    if (error) throw error;
    return count || 0;
  }

  // Get average session duration
  private async getAverageSessionDuration(startDate: Date, endDate: Date): Promise<number> {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('duration_seconds')
      .gte('session_start', startDate.toISOString())
      .lte('session_start', endDate.toISOString())
      .not('duration_seconds', 'is', null);

    if (error) throw error;
    
    if (!data || data.length === 0) return 0;
    
    const total = data.reduce((sum, session) => sum + (session.duration_seconds || 0), 0);
    return Math.round(total / data.length);
  }

  // Get total lessons completed
  private async getTotalLessonsCompleted(startDate: Date, endDate: Date): Promise<number> {
    const { count, error } = await supabase
      .from('learning_analytics')
      .select('*', { count: 'exact', head: true })
      .eq('activity_type', 'lesson_complete')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) throw error;
    return count || 0;
  }

  // Get average engagement score
  private async getAverageEngagementScore(startDate: Date, endDate: Date): Promise<number> {
    const { data, error } = await supabase
      .from('user_engagement_scores')
      .select('engagement_score')
      .gte('calculated_at', startDate.toISOString())
      .lte('calculated_at', endDate.toISOString());

    if (error) throw error;
    
    if (!data || data.length === 0) return 0;
    
    const total = data.reduce((sum, score) => sum + score.engagement_score, 0);
    return Math.round((total / data.length) * 100) / 100;
  }

  // Get top content
  private async getTopContent(startDate: Date, endDate: Date): Promise<Array<{
    contentId: string;
    contentType: string;
    views: number;
    completions: number;
  }>> {
    const { data, error } = await supabase
      .from('content_analytics')
      .select('content_id, content_type, metric_type, metric_value')
      .gte('date_recorded', startDate.toISOString().split('T')[0])
      .lte('date_recorded', endDate.toISOString().split('T')[0])
      .in('metric_type', ['views', 'completions'])
      .order('metric_value', { ascending: false })
      .limit(10);

    if (error) throw error;

    // Group by content and aggregate metrics
    const contentMap = new Map();
    
    data?.forEach(item => {
      const key = `${item.content_id}_${item.content_type}`;
      if (!contentMap.has(key)) {
        contentMap.set(key, {
          contentId: item.content_id,
          contentType: item.content_type,
          views: 0,
          completions: 0
        });
      }
      
      const content = contentMap.get(key);
      if (item.metric_type === 'views') {
        content.views += item.metric_value;
      } else if (item.metric_type === 'completions') {
        content.completions += item.metric_value;
      }
    });

    return Array.from(contentMap.values()).slice(0, 5);
  }

  // Get user growth data
  private async getUserGrowth(startDate: Date, endDate: Date): Promise<Array<{
    date: string;
    newUsers: number;
    activeUsers: number;
  }>> {
    // This would typically be a more complex query
    // For now, return mock data structure
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const growth = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      growth.push({
        date: date.toISOString().split('T')[0],
        newUsers: Math.floor(Math.random() * 50) + 10,
        activeUsers: Math.floor(Math.random() * 200) + 50
      });
    }
    
    return growth;
  }

  // Get learning progress data
  private async getLearningProgress(startDate: Date, endDate: Date): Promise<Array<{
    date: string;
    lessonsCompleted: number;
    avgScore: number;
  }>> {
    // This would typically be a more complex query
    // For now, return mock data structure
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const progress = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      progress.push({
        date: date.toISOString().split('T')[0],
        lessonsCompleted: Math.floor(Math.random() * 100) + 20,
        avgScore: Math.round((Math.random() * 30 + 70) * 100) / 100
      });
    }
    
    return progress;
  }

  // Calculate user engagement score
  async calculateEngagementScore(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('calculate_user_engagement_score', {
        p_user_id: userId,
        p_start_date: startDate.toISOString(),
        p_end_date: endDate.toISOString()
      });

      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('Failed to calculate engagement score:', error);
      return 0;
    }
  }

  // Store performance metric
  async storePerformanceMetric(metric: PerformanceMetric): Promise<void> {
    try {
      const { error } = await supabase
        .from('performance_metrics')
        .insert({
          metric_type: metric.metricType,
          metric_name: metric.metricName,
          metric_value: metric.metricValue,
          metric_unit: metric.metricUnit,
          dimensions: metric.dimensions || {},
          date_recorded: metric.dateRecorded.toISOString().split('T')[0],
          hour_recorded: metric.hourRecorded
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to store performance metric:', error);
    }
  }

  // Cleanup method
  cleanup(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
    }
    this.endSession();
    this.flushEventQueue();
  }
}

// Create and export singleton instance
export const analyticsService = new AnalyticsService();

export default analyticsService;
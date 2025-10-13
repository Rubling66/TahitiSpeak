import { useState, useEffect, useCallback, useRef } from 'react';
import { analyticsService, AnalyticsDashboardData, AnalyticsQuery, LearningAnalytics } from '../services/AnalyticsService';

export interface UseAnalyticsOptions {
  autoTrack?: boolean;
  trackPageViews?: boolean;
  trackUserActions?: boolean;
  trackErrors?: boolean;
}

export interface AnalyticsState {
  isInitialized: boolean;
  isTracking: boolean;
  sessionId: string | null;
  dashboardData: AnalyticsDashboardData | null;
  isLoading: boolean;
  error: string | null;
}

export function useAnalytics(options: UseAnalyticsOptions = {}) {
  const {
    autoTrack = true,
    trackPageViews = true,
    trackUserActions = true,
    trackErrors = true
  } = options;

  const [state, setState] = useState<AnalyticsState>({
    isInitialized: false,
    isTracking: false,
    sessionId: null,
    dashboardData: null,
    isLoading: false,
    error: null
  });

  const lastPageRef = useRef<string>('');
  const errorHandlerRef = useRef<((event: ErrorEvent) => void) | null>(null);

  // Initialize analytics
  useEffect(() => {
    if (autoTrack) {
      initializeAnalytics();
    }

    return () => {
      cleanup();
    };
  }, [autoTrack]);

  // Track page views
  useEffect(() => {
    if (trackPageViews && state.isInitialized) {
      const currentPage = window.location.pathname + window.location.search;
      if (currentPage !== lastPageRef.current) {
        trackPageView();
        lastPageRef.current = currentPage;
      }
    }
  }, [trackPageViews, state.isInitialized]);

  // Setup error tracking
  useEffect(() => {
    if (trackErrors && state.isInitialized) {
      setupErrorTracking();
    }

    return () => {
      if (errorHandlerRef.current) {
        window.removeEventListener('error', errorHandlerRef.current);
        errorHandlerRef.current = null;
      }
    };
  }, [trackErrors, state.isInitialized]);

  const initializeAnalytics = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Analytics service is already initialized in constructor
      setState(prev => ({
        ...prev,
        isInitialized: true,
        isTracking: true,
        isLoading: false
      }));

      console.log('Analytics initialized successfully');
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to initialize analytics',
        isLoading: false
      }));
    }
  }, []);

  const setupErrorTracking = useCallback(() => {
    if (errorHandlerRef.current) {
      window.removeEventListener('error', errorHandlerRef.current);
    }

    errorHandlerRef.current = (event: ErrorEvent) => {
      analyticsService.trackError(new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        url: window.location.href
      });
    };

    window.addEventListener('error', errorHandlerRef.current);

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      analyticsService.trackError(new Error(event.reason), {
        type: 'unhandledrejection',
        url: window.location.href
      });
    });
  }, []);

  // Track page view
  const trackPageView = useCallback(async (pageUrl?: string, pageTitle?: string) => {
    if (!state.isInitialized) return;

    try {
      await analyticsService.trackPageView(pageUrl, pageTitle);
    } catch (error) {
      console.error('Failed to track page view:', error);
    }
  }, [state.isInitialized]);

  // Track event
  const trackEvent = useCallback(async (
    eventType: string,
    eventName: string,
    eventData?: Record<string, any>,
    pageUrl?: string
  ) => {
    if (!state.isInitialized) return;

    try {
      await analyticsService.trackEvent(eventType, eventName, eventData, pageUrl);
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }, [state.isInitialized]);

  // Track user action
  const trackUserAction = useCallback(async (
    action: string,
    category: string,
    label?: string,
    value?: number
  ) => {
    if (!state.isInitialized || !trackUserActions) return;

    try {
      await analyticsService.trackUserAction(action, category, label, value);
    } catch (error) {
      console.error('Failed to track user action:', error);
    }
  }, [state.isInitialized, trackUserActions]);

  // Track learning event
  const trackLearningEvent = useCallback(async (data: LearningAnalytics) => {
    if (!state.isInitialized) return;

    try {
      await analyticsService.trackLearningEvent(data);
    } catch (error) {
      console.error('Failed to track learning event:', error);
    }
  }, [state.isInitialized]);

  // Track conversion
  const trackConversion = useCallback(async (
    conversionType: string,
    value?: number,
    metadata?: Record<string, any>
  ) => {
    if (!state.isInitialized) return;

    try {
      await analyticsService.trackConversion(conversionType, value, metadata);
    } catch (error) {
      console.error('Failed to track conversion:', error);
    }
  }, [state.isInitialized]);

  // Get dashboard data
  const getDashboardData = useCallback(async (query?: AnalyticsQuery) => {
    if (!state.isInitialized) return null;

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const dashboardData = await analyticsService.getDashboardData(query);
      
      setState(prev => ({
        ...prev,
        dashboardData,
        isLoading: false
      }));

      return dashboardData;
    } catch (error) {
      console.error('Failed to get dashboard data:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to get dashboard data',
        isLoading: false
      }));
      return null;
    }
  }, [state.isInitialized]);

  // Calculate engagement score
  const calculateEngagementScore = useCallback(async (
    userId: string,
    startDate: Date,
    endDate: Date
  ) => {
    if (!state.isInitialized) return 0;

    try {
      return await analyticsService.calculateEngagementScore(userId, startDate, endDate);
    } catch (error) {
      console.error('Failed to calculate engagement score:', error);
      return 0;
    }
  }, [state.isInitialized]);

  // Cleanup
  const cleanup = useCallback(() => {
    if (state.isInitialized) {
      analyticsService.cleanup();
      setState(prev => ({
        ...prev,
        isInitialized: false,
        isTracking: false
      }));
    }
  }, [state.isInitialized]);

  return {
    ...state,
    // Actions
    initializeAnalytics,
    trackPageView,
    trackEvent,
    trackUserAction,
    trackLearningEvent,
    trackConversion,
    getDashboardData,
    calculateEngagementScore,
    cleanup
  };
}

// Hook for tracking specific learning activities
export function useLearningAnalytics() {
  const { trackLearningEvent, trackEvent, trackUserAction } = useAnalytics();

  const trackLessonStart = useCallback(async (lessonId: string, difficultyLevel?: string) => {
    await trackLearningEvent({
      userId: '', // Will be set by service
      lessonId,
      activityType: 'lesson_start',
      difficultyLevel,
      result: { startTime: new Date().toISOString() }
    });

    await trackEvent('learning', 'lesson_start', { lessonId, difficultyLevel });
  }, [trackLearningEvent, trackEvent]);

  const trackLessonComplete = useCallback(async (
    lessonId: string,
    timeSpentSeconds: number,
    successRate: number,
    mistakesCount?: number
  ) => {
    await trackLearningEvent({
      userId: '', // Will be set by service
      lessonId,
      activityType: 'lesson_complete',
      timeSpentSeconds,
      successRate,
      mistakesCount,
      completedAt: new Date(),
      result: {
        completedAt: new Date().toISOString(),
        timeSpent: timeSpentSeconds,
        score: successRate
      }
    });

    await trackEvent('learning', 'lesson_complete', {
      lessonId,
      timeSpent: timeSpentSeconds,
      score: successRate,
      mistakes: mistakesCount
    });
  }, [trackLearningEvent, trackEvent]);

  const trackExerciseAttempt = useCallback(async (
    exerciseId: string,
    lessonId: string,
    isCorrect: boolean,
    timeSpentSeconds: number,
    hintsUsed?: number
  ) => {
    await trackLearningEvent({
      userId: '', // Will be set by service
      lessonId,
      exerciseId,
      activityType: 'exercise_attempt',
      timeSpentSeconds,
      successRate: isCorrect ? 100 : 0,
      hintsUsed,
      result: {
        correct: isCorrect,
        timeSpent: timeSpentSeconds,
        hints: hintsUsed
      }
    });

    await trackUserAction('exercise_attempt', 'learning', exerciseId, isCorrect ? 1 : 0);
  }, [trackLearningEvent, trackUserAction]);

  const trackStudySession = useCallback(async (
    sessionDuration: number,
    lessonsCompleted: number,
    exercisesCompleted: number,
    averageScore: number
  ) => {
    await trackEvent('learning', 'study_session_complete', {
      duration: sessionDuration,
      lessonsCompleted,
      exercisesCompleted,
      averageScore
    });
  }, [trackEvent]);

  const trackProgressMilestone = useCallback(async (
    milestoneType: string,
    milestoneValue: number,
    metadata?: Record<string, any>
  ) => {
    await trackEvent('learning', 'progress_milestone', {
      milestoneType,
      milestoneValue,
      ...metadata
    });
  }, [trackEvent]);

  return {
    trackLessonStart,
    trackLessonComplete,
    trackExerciseAttempt,
    trackStudySession,
    trackProgressMilestone
  };
}

// Hook for tracking user engagement
export function useEngagementTracking() {
  const { trackEvent, trackUserAction } = useAnalytics();

  const trackFeatureUsage = useCallback(async (
    featureName: string,
    usageType: 'click' | 'view' | 'interaction',
    metadata?: Record<string, any>
  ) => {
    await trackUserAction(`feature_${usageType}`, 'engagement', featureName);
    await trackEvent('engagement', `feature_${usageType}`, {
      feature: featureName,
      ...metadata
    });
  }, [trackEvent, trackUserAction]);

  const trackTimeSpent = useCallback(async (
    section: string,
    timeSpentSeconds: number
  ) => {
    await trackEvent('engagement', 'time_spent', {
      section,
      timeSpent: timeSpentSeconds
    });
  }, [trackEvent]);

  const trackScrollDepth = useCallback(async (
    page: string,
    maxScrollPercentage: number
  ) => {
    await trackEvent('engagement', 'scroll_depth', {
      page,
      scrollDepth: maxScrollPercentage
    });
  }, [trackEvent]);

  const trackSearchQuery = useCallback(async (
    query: string,
    resultsCount: number,
    selectedResult?: string
  ) => {
    await trackEvent('engagement', 'search', {
      query,
      resultsCount,
      selectedResult
    });
  }, [trackEvent]);

  const trackSocialShare = useCallback(async (
    platform: string,
    contentType: string,
    contentId: string
  ) => {
    await trackEvent('engagement', 'social_share', {
      platform,
      contentType,
      contentId
    });
  }, [trackEvent]);

  return {
    trackFeatureUsage,
    trackTimeSpent,
    trackScrollDepth,
    trackSearchQuery,
    trackSocialShare
  };
}

export default useAnalytics;
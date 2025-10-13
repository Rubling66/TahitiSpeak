import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AnalyticsService } from '../services/AnalyticsService';

interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  sessionsToday: number;
  averageSessionDuration: number;
  pageViews: number;
  bounceRate: number;
  conversionRate: number;
  topPages: Array<{ path: string; views: number; }>;
  userGrowth: Array<{ date: string; users: number; }>;
  engagementMetrics: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
    averageTimeOnSite: number;
  };
}

interface PerformanceMetrics {
  systemLoad: number;
  memoryUsage: number;
  storageUsage: number;
  responseTime: number;
  errorRate: number;
  uptime: number;
}

interface AnalyticsContextType {
  analyticsData: AnalyticsData | null;
  performanceMetrics: PerformanceMetrics | null;
  isLoading: boolean;
  error: string | null;
  refreshAnalytics: () => Promise<void>;
  trackEvent: (eventName: string, properties?: Record<string, any>) => Promise<void>;
  trackPageView: (path: string) => Promise<void>;
  getAnalyticsReport: (startDate: Date, endDate: Date) => Promise<any>;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

interface AnalyticsProviderProps {
  children: ReactNode;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsService] = useState(() => new AnalyticsService());

  // Initialize analytics data
  useEffect(() => {
    const initializeAnalytics = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Initialize analytics service
        await analyticsService.initialize();

        // Simulate fetching analytics data
        await new Promise(resolve => setTimeout(resolve, 1500));

        const mockAnalyticsData: AnalyticsData = {
          totalUsers: 12847,
          activeUsers: 3421,
          sessionsToday: 1876,
          averageSessionDuration: 342, // seconds
          pageViews: 8934,
          bounceRate: 0.34,
          conversionRate: 0.12,
          topPages: [
            { path: '/dashboard', views: 2341 },
            { path: '/learning', views: 1876 },
            { path: '/profile', views: 1234 },
            { path: '/lessons/french-basics', views: 987 },
            { path: '/lessons/tahitian-culture', views: 654 }
          ],
          userGrowth: [
            { date: '2024-12-04', users: 11200 },
            { date: '2024-12-05', users: 11456 },
            { date: '2024-12-06', users: 11789 },
            { date: '2024-12-07', users: 12123 },
            { date: '2024-12-08', users: 12456 },
            { date: '2024-12-09', users: 12678 },
            { date: '2024-12-10', users: 12847 }
          ],
          engagementMetrics: {
            dailyActiveUsers: 3421,
            weeklyActiveUsers: 8934,
            monthlyActiveUsers: 12847,
            averageTimeOnSite: 342
          }
        };

        const mockPerformanceMetrics: PerformanceMetrics = {
          systemLoad: 0.67,
          memoryUsage: 0.78,
          storageUsage: 0.45,
          responseTime: 234, // milliseconds
          errorRate: 0.02,
          uptime: 0.9987
        };

        setAnalyticsData(mockAnalyticsData);
        setPerformanceMetrics(mockPerformanceMetrics);
      } catch (err) {
        console.error('Failed to initialize analytics:', err);
        setError('Failed to load analytics data');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAnalytics();
  }, [analyticsService]);

  // Auto-refresh analytics data every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      refreshAnalytics();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  const refreshAnalytics = async (): Promise<void> => {
    try {
      setError(null);
      
      // Simulate API call to refresh data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, this would fetch fresh data from the analytics service
      // For now, we'll simulate slight changes in the data
      if (analyticsData && performanceMetrics) {
        setAnalyticsData(prev => prev ? {
          ...prev,
          activeUsers: prev.activeUsers + Math.floor(Math.random() * 20 - 10),
          sessionsToday: prev.sessionsToday + Math.floor(Math.random() * 10),
          pageViews: prev.pageViews + Math.floor(Math.random() * 50)
        } : null);

        setPerformanceMetrics(prev => prev ? {
          ...prev,
          systemLoad: Math.max(0, Math.min(1, prev.systemLoad + (Math.random() * 0.1 - 0.05))),
          memoryUsage: Math.max(0, Math.min(1, prev.memoryUsage + (Math.random() * 0.05 - 0.025))),
          responseTime: Math.max(50, prev.responseTime + Math.floor(Math.random() * 20 - 10))
        } : null);
      }
    } catch (err) {
      console.error('Failed to refresh analytics:', err);
      setError('Failed to refresh analytics data');
    }
  };

  const trackEvent = async (eventName: string, properties?: Record<string, any>): Promise<void> => {
    try {
      await analyticsService.trackEvent(eventName, properties);
    } catch (err) {
      console.error('Failed to track event:', err);
    }
  };

  const trackPageView = async (path: string): Promise<void> => {
    try {
      await analyticsService.trackPageView(path);
    } catch (err) {
      console.error('Failed to track page view:', err);
    }
  };

  const getAnalyticsReport = async (startDate: Date, endDate: Date): Promise<any> => {
    try {
      // Simulate API call to generate report
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return {
        period: { startDate, endDate },
        summary: {
          totalUsers: analyticsData?.totalUsers || 0,
          totalSessions: analyticsData?.sessionsToday || 0,
          totalPageViews: analyticsData?.pageViews || 0,
          averageSessionDuration: analyticsData?.averageSessionDuration || 0
        },
        trends: analyticsData?.userGrowth || [],
        topPages: analyticsData?.topPages || []
      };
    } catch (err) {
      console.error('Failed to generate analytics report:', err);
      throw new Error('Failed to generate analytics report');
    }
  };

  const value: AnalyticsContextType = {
    analyticsData,
    performanceMetrics,
    isLoading,
    error,
    refreshAnalytics,
    trackEvent,
    trackPageView,
    getAnalyticsReport
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = (): AnalyticsContextType => {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};
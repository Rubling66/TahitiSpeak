import { PerformanceService } from '../PerformanceService';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase
jest.mock('@supabase/supabase-js');

const mockSupabase = {
  from: jest.fn(),
  rpc: jest.fn(),
  auth: {
    getSession: jest.fn(),
  },
};

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
mockCreateClient.mockReturnValue(mockSupabase as any);

const mockQuery = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  single: jest.fn(),
};

const mockRpcQuery = {
  select: jest.fn().mockReturnThis(),
  single: jest.fn(),
};

describe('PerformanceService', () => {
  let performanceService: PerformanceService;

  beforeEach(() => {
    jest.clearAllMocks();
    performanceService = new PerformanceService();
    
    mockSupabase.from.mockReturnValue(mockQuery);
    mockSupabase.rpc.mockReturnValue(mockRpcQuery);
  });

  describe('getDashboardMetrics', () => {
    const mockMetricsData = {
      totalUsers: 1250,
      totalCourses: 45,
      totalLessons: 320,
      activeUsers: 890,
      completionRate: 78.5,
      averageProgress: 65.2,
      recentActivity: [
        {
          id: '1',
          type: 'user_registration',
          user: 'John Doe',
          timestamp: new Date('2024-01-15T10:30:00Z'),
          details: 'New user registered',
        },
      ],
      performanceMetrics: {
        responseTime: 245,
        uptime: 99.8,
        errorRate: 0.2,
        throughput: 1250,
      },
      userGrowth: [
        { month: 'Jan', users: 1000 },
        { month: 'Feb', users: 1100 },
        { month: 'Mar', users: 1250 },
      ],
      coursePopularity: [
        { name: 'Basic Tahitian', students: 450 },
        { name: 'Intermediate Tahitian', students: 320 },
      ],
    };

    it('fetches dashboard metrics successfully', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: mockMetricsData, error: null });

      const result = await performanceService.getDashboardMetrics();

      expect(result).toEqual(mockMetricsData);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_dashboard_metrics');
    });

    it('throws error when dashboard metrics fetch fails', async () => {
      const error = new Error('Database connection failed');
      mockSupabase.rpc.mockResolvedValue({ data: null, error });

      await expect(performanceService.getDashboardMetrics()).rejects.toThrow(
        'Failed to fetch dashboard metrics: Database connection failed'
      );
    });

    it('handles null data response', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

      await expect(performanceService.getDashboardMetrics()).rejects.toThrow(
        'No dashboard metrics data available'
      );
    });
  });

  describe('getSystemHealth', () => {
    const mockHealthData = {
      status: 'healthy',
      uptime: 99.8,
      responseTime: 245,
      errorRate: 0.2,
      lastChecked: new Date(),
    };

    it('fetches system health successfully', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: mockHealthData, error: null });

      const result = await performanceService.getSystemHealth();

      expect(result).toEqual(mockHealthData);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_system_health');
    });

    it('throws error when system health fetch fails', async () => {
      const error = new Error('Health check failed');
      mockSupabase.rpc.mockResolvedValue({ data: null, error });

      await expect(performanceService.getSystemHealth()).rejects.toThrow(
        'Failed to fetch system health: Health check failed'
      );
    });

    it('returns degraded status when metrics are poor', async () => {
      const degradedHealthData = {
        status: 'degraded',
        uptime: 95.2,
        responseTime: 850,
        errorRate: 2.5,
        lastChecked: new Date(),
      };

      mockSupabase.rpc.mockResolvedValue({ data: degradedHealthData, error: null });

      const result = await performanceService.getSystemHealth();

      expect(result.status).toBe('degraded');
      expect(result.responseTime).toBe(850);
      expect(result.errorRate).toBe(2.5);
    });
  });

  describe('getUserAnalytics', () => {
    const mockUserAnalytics = {
      totalUsers: 1250,
      activeUsers: 890,
      newUsersToday: 15,
      newUsersThisWeek: 85,
      newUsersThisMonth: 320,
      userRetentionRate: 75.5,
      averageSessionDuration: 45.2,
      topCountries: [
        { country: 'France', users: 450 },
        { country: 'Tahiti', users: 380 },
        { country: 'USA', users: 220 },
      ],
      userGrowthTrend: [
        { date: '2024-01-01', users: 1000 },
        { date: '2024-01-15', users: 1125 },
        { date: '2024-01-30', users: 1250 },
      ],
    };

    it('fetches user analytics successfully', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: mockUserAnalytics, error: null });

      const result = await performanceService.getUserAnalytics();

      expect(result).toEqual(mockUserAnalytics);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_user_analytics');
    });

    it('fetches user analytics with date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      mockSupabase.rpc.mockResolvedValue({ data: mockUserAnalytics, error: null });

      const result = await performanceService.getUserAnalytics(startDate, endDate);

      expect(result).toEqual(mockUserAnalytics);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_user_analytics', {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      });
    });

    it('throws error when user analytics fetch fails', async () => {
      const error = new Error('Analytics service unavailable');
      mockSupabase.rpc.mockResolvedValue({ data: null, error });

      await expect(performanceService.getUserAnalytics()).rejects.toThrow(
        'Failed to fetch user analytics: Analytics service unavailable'
      );
    });
  });

  describe('getCourseAnalytics', () => {
    const mockCourseAnalytics = {
      totalCourses: 45,
      totalLessons: 320,
      averageCompletionRate: 78.5,
      averageRating: 4.6,
      mostPopularCourses: [
        { id: '1', name: 'Basic Tahitian', enrollments: 450, rating: 4.8 },
        { id: '2', name: 'Intermediate Tahitian', enrollments: 320, rating: 4.5 },
      ],
      completionRatesByMonth: [
        { month: 'Jan', rate: 75.2 },
        { month: 'Feb', rate: 78.1 },
        { month: 'Mar', rate: 78.5 },
      ],
      difficultyDistribution: [
        { level: 'Beginner', courses: 20 },
        { level: 'Intermediate', courses: 15 },
        { level: 'Advanced', courses: 10 },
      ],
    };

    it('fetches course analytics successfully', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: mockCourseAnalytics, error: null });

      const result = await performanceService.getCourseAnalytics();

      expect(result).toEqual(mockCourseAnalytics);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_course_analytics');
    });

    it('throws error when course analytics fetch fails', async () => {
      const error = new Error('Course data unavailable');
      mockSupabase.rpc.mockResolvedValue({ data: null, error });

      await expect(performanceService.getCourseAnalytics()).rejects.toThrow(
        'Failed to fetch course analytics: Course data unavailable'
      );
    });
  });

  describe('getPerformanceMetrics', () => {
    const mockPerformanceMetrics = {
      responseTime: 245,
      throughput: 1250,
      errorRate: 0.2,
      uptime: 99.8,
      memoryUsage: 65.5,
      cpuUsage: 45.2,
      diskUsage: 78.9,
      activeConnections: 150,
      queueLength: 5,
      cacheHitRate: 95.5,
    };

    it('fetches performance metrics successfully', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: mockPerformanceMetrics, error: null });

      const result = await performanceService.getPerformanceMetrics();

      expect(result).toEqual(mockPerformanceMetrics);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_performance_metrics');
    });

    it('throws error when performance metrics fetch fails', async () => {
      const error = new Error('Metrics collection failed');
      mockSupabase.rpc.mockResolvedValue({ data: null, error });

      await expect(performanceService.getPerformanceMetrics()).rejects.toThrow(
        'Failed to fetch performance metrics: Metrics collection failed'
      );
    });
  });

  describe('recordMetric', () => {
    it('records a metric successfully', async () => {
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({ data: { id: '123' }, error: null }),
      });

      await performanceService.recordMetric('response_time', 245, {
        endpoint: '/api/courses',
        method: 'GET',
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('performance_metrics');
    });

    it('throws error when metric recording fails', async () => {
      const error = new Error('Insert failed');
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({ data: null, error }),
      });

      await expect(
        performanceService.recordMetric('response_time', 245)
      ).rejects.toThrow('Failed to record metric: Insert failed');
    });
  });

  describe('getRecentActivity', () => {
    const mockRecentActivity = [
      {
        id: '1',
        type: 'user_registration',
        user: 'John Doe',
        timestamp: new Date('2024-01-15T10:30:00Z'),
        details: 'New user registered',
      },
      {
        id: '2',
        type: 'course_completion',
        user: 'Jane Smith',
        timestamp: new Date('2024-01-15T09:15:00Z'),
        details: 'Completed "Basic Tahitian"',
      },
    ];

    it('fetches recent activity successfully', async () => {
      mockQuery.select.mockResolvedValue({ data: mockRecentActivity, error: null });

      const result = await performanceService.getRecentActivity(10);

      expect(result).toEqual(mockRecentActivity);
      expect(mockSupabase.from).toHaveBeenCalledWith('activity_log');
      expect(mockQuery.order).toHaveBeenCalledWith('timestamp', { ascending: false });
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
    });

    it('uses default limit when not specified', async () => {
      mockQuery.select.mockResolvedValue({ data: mockRecentActivity, error: null });

      await performanceService.getRecentActivity();

      expect(mockQuery.limit).toHaveBeenCalledWith(50);
    });

    it('throws error when recent activity fetch fails', async () => {
      const error = new Error('Activity log unavailable');
      mockQuery.select.mockResolvedValue({ data: null, error });

      await expect(performanceService.getRecentActivity()).rejects.toThrow(
        'Failed to fetch recent activity: Activity log unavailable'
      );
    });
  });

  describe('clearCache', () => {
    it('clears performance cache successfully', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: { success: true }, error: null });

      const result = await performanceService.clearCache();

      expect(result).toBe(true);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('clear_performance_cache');
    });

    it('throws error when cache clearing fails', async () => {
      const error = new Error('Cache clear failed');
      mockSupabase.rpc.mockResolvedValue({ data: null, error });

      await expect(performanceService.clearCache()).rejects.toThrow(
        'Failed to clear cache: Cache clear failed'
      );
    });
  });

  describe('exportMetrics', () => {
    it('exports metrics successfully', async () => {
      const mockExportData = {
        filename: 'metrics_2024-01-15.csv',
        url: 'https://example.com/exports/metrics_2024-01-15.csv',
        size: 1024,
      };

      mockSupabase.rpc.mockResolvedValue({ data: mockExportData, error: null });

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const result = await performanceService.exportMetrics(startDate, endDate, 'csv');

      expect(result).toEqual(mockExportData);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('export_performance_metrics', {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        format: 'csv',
      });
    });

    it('throws error when export fails', async () => {
      const error = new Error('Export failed');
      mockSupabase.rpc.mockResolvedValue({ data: null, error });

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      await expect(
        performanceService.exportMetrics(startDate, endDate, 'csv')
      ).rejects.toThrow('Failed to export metrics: Export failed');
    });
  });
});
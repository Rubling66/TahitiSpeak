import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../../api/admin/metrics';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase
vi.mock('@supabase/supabase-js');

const mockSupabase = {
  from: vi.fn(),
  auth: {
    getUser: vi.fn(),
  },
};

const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockGte = vi.fn();
const mockLte = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockSingle = vi.fn();

beforeEach(() => {
  vi.mocked(createClient).mockReturnValue(mockSupabase as any);
  
  // Setup method chaining
  mockSupabase.from.mockReturnValue({
    select: mockSelect,
  });
  
  mockSelect.mockReturnValue({
    eq: mockEq,
    gte: mockGte,
    lte: mockLte,
    order: mockOrder,
    limit: mockLimit,
    single: mockSingle,
  });
  
  mockEq.mockReturnValue({
    eq: mockEq,
    gte: mockGte,
    lte: mockLte,
    order: mockOrder,
    limit: mockLimit,
    single: mockSingle,
  });
  
  mockGte.mockReturnValue({
    eq: mockEq,
    gte: mockGte,
    lte: mockLte,
    order: mockOrder,
    limit: mockLimit,
    single: mockSingle,
  });
  
  mockLte.mockReturnValue({
    eq: mockEq,
    gte: mockGte,
    lte: mockLte,
    order: mockOrder,
    limit: mockLimit,
    single: mockSingle,
  });
  
  mockOrder.mockReturnValue({
    eq: mockEq,
    gte: mockGte,
    lte: mockLte,
    order: mockOrder,
    limit: mockLimit,
    single: mockSingle,
  });
  
  mockLimit.mockReturnValue({
    eq: mockEq,
    gte: mockGte,
    lte: mockLte,
    order: mockOrder,
    limit: mockLimit,
    single: mockSingle,
  });
  
  mockSingle.mockReturnValue({
    eq: mockEq,
    gte: mockGte,
    lte: mockLte,
    order: mockOrder,
    limit: mockLimit,
    single: mockSingle,
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('/api/admin/metrics', () => {
  describe('GET', () => {
    it('should return dashboard metrics successfully', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { timeRange: '7d' },
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      // Mock authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-user-id', role: 'admin' } },
        error: null,
      });

      // Mock database responses
      const mockProfiles = [
        { id: '1', created_at: '2024-01-01T00:00:00Z' },
        { id: '2', created_at: '2024-01-02T00:00:00Z' },
        { id: '3', created_at: '2024-01-03T00:00:00Z' },
      ];

      const mockAnalyticsEvents = [
        { user_id: '1', event_type: 'session_start', created_at: '2024-01-08T00:00:00Z' },
        { user_id: '2', event_type: 'session_start', created_at: '2024-01-08T01:00:00Z' },
        { user_id: '1', event_type: 'lesson_complete', created_at: '2024-01-08T02:00:00Z' },
      ];

      const mockContent = [
        { id: 'lesson-1', type: 'lesson', title: 'Basic Greetings' },
        { id: 'lesson-2', type: 'lesson', title: 'Numbers' },
      ];

      const mockLearningAnalytics = [
        { lesson_id: 'lesson-1', completed: true, score: 85, time_spent: 300 },
        { lesson_id: 'lesson-2', completed: true, score: 92, time_spent: 450 },
        { lesson_id: 'lesson-1', completed: false, score: 0, time_spent: 120 },
      ];

      // Setup mock responses
      mockSelect
        .mockResolvedValueOnce({ data: mockProfiles, error: null }) // Total users
        .mockResolvedValueOnce({ data: mockProfiles.slice(0, 2), error: null }) // Active users
        .mockResolvedValueOnce({ data: [mockProfiles[2]], error: null }) // New users
        .mockResolvedValueOnce({ data: mockProfiles.slice(0, 1), error: null }) // Previous period users
        .mockResolvedValueOnce({ data: mockContent, error: null }) // Total lessons
        .mockResolvedValueOnce({ data: mockLearningAnalytics.filter(l => l.completed), error: null }) // Completed lessons
        .mockResolvedValueOnce({ data: mockLearningAnalytics, error: null }) // All learning analytics
        .mockResolvedValueOnce({ data: mockAnalyticsEvents, error: null }) // Analytics events
        .mockResolvedValueOnce({ data: mockAnalyticsEvents.slice(0, 2), error: null }) // Unique sessions
        .mockResolvedValueOnce({ data: mockProfiles.slice(0, 2), error: null }); // Retention calculation

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      
      expect(responseData).toHaveProperty('totalUsers', 3);
      expect(responseData).toHaveProperty('activeUsers', 2);
      expect(responseData).toHaveProperty('newUsers', 1);
      expect(responseData).toHaveProperty('userGrowth');
      expect(responseData).toHaveProperty('totalLessons', 2);
      expect(responseData).toHaveProperty('completedLessons', 2);
      expect(responseData).toHaveProperty('averageProgress');
      expect(responseData).toHaveProperty('engagementRate');
      expect(responseData).toHaveProperty('retentionRate');
      expect(responseData).toHaveProperty('performanceScore');
      
      expect(responseData.userGrowth).toBeGreaterThan(0);
      expect(responseData.averageProgress).toBeGreaterThanOrEqual(0);
      expect(responseData.averageProgress).toBeLessThanOrEqual(100);
    });

    it('should handle different time ranges', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { timeRange: '30d' },
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-user-id', role: 'admin' } },
        error: null,
      });

      // Mock empty responses for simplicity
      mockSelect.mockResolvedValue({ data: [], error: null });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      
      // Verify that the time range was used in queries
      expect(mockGte).toHaveBeenCalledWith(
        'created_at',
        expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      );
    });

    it('should default to 7d time range when not specified', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {},
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-user-id', role: 'admin' } },
        error: null,
      });

      mockSelect.mockResolvedValue({ data: [], error: null });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });

    it('should require authentication', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { timeRange: '7d' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(401);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Unauthorized',
      });
    });

    it('should handle invalid authentication token', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { timeRange: '7d' },
        headers: {
          authorization: 'Bearer invalid-token',
        },
      });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(401);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Unauthorized',
      });
    });

    it('should handle database errors gracefully', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { timeRange: '7d' },
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-user-id', role: 'admin' } },
        error: null,
      });

      // Mock database error
      mockSelect.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Internal server error',
      });
    });

    it('should calculate user growth correctly', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { timeRange: '7d' },
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-user-id', role: 'admin' } },
        error: null,
      });

      // Mock responses for growth calculation
      mockSelect
        .mockResolvedValueOnce({ data: new Array(100).fill({}), error: null }) // Current period: 100 users
        .mockResolvedValueOnce({ data: new Array(80).fill({}), error: null }) // Active users
        .mockResolvedValueOnce({ data: new Array(20).fill({}), error: null }) // New users
        .mockResolvedValueOnce({ data: new Array(80).fill({}), error: null }) // Previous period: 80 users
        .mockResolvedValue({ data: [], error: null }); // Other queries

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.userGrowth).toBe(25); // (100-80)/80 * 100 = 25%
    });

    it('should handle zero previous users for growth calculation', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { timeRange: '7d' },
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-user-id', role: 'admin' } },
        error: null,
      });

      // Mock responses with zero previous users
      mockSelect
        .mockResolvedValueOnce({ data: new Array(50).fill({}), error: null }) // Current period: 50 users
        .mockResolvedValueOnce({ data: new Array(40).fill({}), error: null }) // Active users
        .mockResolvedValueOnce({ data: new Array(10).fill({}), error: null }) // New users
        .mockResolvedValueOnce({ data: [], error: null }) // Previous period: 0 users
        .mockResolvedValue({ data: [], error: null }); // Other queries

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.userGrowth).toBe(100); // Should be 100% when growing from 0
    });

    it('should calculate average progress correctly', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { timeRange: '7d' },
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-user-id', role: 'admin' } },
        error: null,
      });

      const mockLearningData = [
        { score: 80 },
        { score: 90 },
        { score: 70 },
        { score: 85 },
      ];

      // Setup specific mock for learning analytics
      mockSelect
        .mockResolvedValueOnce({ data: [], error: null }) // Total users
        .mockResolvedValueOnce({ data: [], error: null }) // Active users
        .mockResolvedValueOnce({ data: [], error: null }) // New users
        .mockResolvedValueOnce({ data: [], error: null }) // Previous period users
        .mockResolvedValueOnce({ data: [], error: null }) // Total lessons
        .mockResolvedValueOnce({ data: [], error: null }) // Completed lessons
        .mockResolvedValueOnce({ data: mockLearningData, error: null }) // Learning analytics with scores
        .mockResolvedValue({ data: [], error: null }); // Other queries

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.averageProgress).toBe(81.25); // (80+90+70+85)/4 = 81.25
    });

    it('should calculate engagement rate correctly', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { timeRange: '7d' },
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-user-id', role: 'admin' } },
        error: null,
      });

      // Mock 100 total users and 75 active users
      mockSelect
        .mockResolvedValueOnce({ data: new Array(100).fill({}), error: null }) // Total users
        .mockResolvedValueOnce({ data: new Array(75).fill({}), error: null }) // Active users
        .mockResolvedValue({ data: [], error: null }); // Other queries

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.engagementRate).toBe(75); // 75/100 * 100 = 75%
    });

    it('should handle performance score calculation', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { timeRange: '7d' },
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-user-id', role: 'admin' } },
        error: null,
      });

      // Mock data for performance calculation
      mockSelect
        .mockResolvedValueOnce({ data: new Array(100).fill({}), error: null }) // Total users
        .mockResolvedValueOnce({ data: new Array(80).fill({}), error: null }) // Active users (80% engagement)
        .mockResolvedValueOnce({ data: [], error: null }) // New users
        .mockResolvedValueOnce({ data: [], error: null }) // Previous period users
        .mockResolvedValueOnce({ data: [], error: null }) // Total lessons
        .mockResolvedValueOnce({ data: [], error: null }) // Completed lessons
        .mockResolvedValueOnce({ data: [{ score: 85 }], error: null }) // Average score 85%
        .mockResolvedValueOnce({ data: [], error: null }) // Analytics events
        .mockResolvedValueOnce({ data: [], error: null }) // Unique sessions
        .mockResolvedValueOnce({ data: new Array(70).fill({}), error: null }); // Retention (70%)

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.performanceScore).toBeGreaterThan(0);
      expect(responseData.performanceScore).toBeLessThanOrEqual(100);
    });
  });

  describe('POST', () => {
    it('should return method not allowed for POST requests', async () => {
      const { req, res } = createMocks({
        method: 'POST',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Method not allowed',
      });
    });
  });

  describe('PUT', () => {
    it('should return method not allowed for PUT requests', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Method not allowed',
      });
    });
  });

  describe('DELETE', () => {
    it('should return method not allowed for DELETE requests', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Method not allowed',
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing authorization header', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { timeRange: '7d' },
        headers: {},
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(401);
    });

    it('should handle malformed authorization header', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { timeRange: '7d' },
        headers: {
          authorization: 'InvalidFormat',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(401);
    });

    it('should handle invalid time range values', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { timeRange: 'invalid' },
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-user-id', role: 'admin' } },
        error: null,
      });

      mockSelect.mockResolvedValue({ data: [], error: null });

      await handler(req, res);

      // Should default to 7d and still work
      expect(res._getStatusCode()).toBe(200);
    });

    it('should handle concurrent requests', async () => {
      const createRequest = () => createMocks({
        method: 'GET',
        query: { timeRange: '7d' },
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-user-id', role: 'admin' } },
        error: null,
      });

      mockSelect.mockResolvedValue({ data: [], error: null });

      const requests = Array.from({ length: 5 }, createRequest);
      const promises = requests.map(({ req, res }) => handler(req, res));

      await Promise.all(promises);

      // All requests should succeed
      requests.forEach(({ res }) => {
        expect(res._getStatusCode()).toBe(200);
      });
    });
  });
});
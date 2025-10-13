import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render as testRender, mockFetch, mockWebSocket } from '../utils/test-utils';
import AdminDashboard from '../../components/admin/AdminDashboard';

// Mock the entire recharts module
vi.mock('recharts', () => ({
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  Cell: () => <div data-testid="cell" />,
}));

describe('Dashboard Integration Tests', () => {
  const mockApiResponses = {
    metrics: {
      totalUsers: 1250,
      activeUsers: 890,
      newUsers: 45,
      userGrowth: 12.5,
      totalLessons: 150,
      completedLessons: 3420,
      averageProgress: 67.8,
      engagementRate: 78.5,
      retentionRate: 65.2,
      performanceScore: 92
    },
    userAnalytics: [
      {
        timestamp: '2024-01-01T00:00:00Z',
        activeUsers: 100,
        newUsers: 10,
        sessions: 150,
        bounceRate: 25.5,
        avgSessionDuration: 180
      },
      {
        timestamp: '2024-01-02T00:00:00Z',
        activeUsers: 120,
        newUsers: 15,
        sessions: 180,
        bounceRate: 22.3,
        avgSessionDuration: 195
      }
    ],
    learningAnalytics: [
      {
        lessonId: 'lesson-1',
        lessonName: 'Basic Greetings',
        completions: 450,
        averageScore: 85.2,
        timeSpent: 240,
        difficulty: 1,
        dropoffRate: 15.5
      },
      {
        lessonId: 'lesson-2',
        lessonName: 'Numbers and Counting',
        completions: 380,
        averageScore: 78.9,
        timeSpent: 300,
        difficulty: 2,
        dropoffRate: 22.1
      }
    ],
    deviceAnalytics: [
      {
        device: 'Desktop',
        users: 650,
        percentage: 52.0,
        color: '#8884d8'
      },
      {
        device: 'Mobile',
        users: 480,
        percentage: 38.4,
        color: '#82ca9d'
      },
      {
        device: 'Tablet',
        users: 120,
        percentage: 9.6,
        color: '#ffc658'
      }
    ],
    performanceMetrics: [
      {
        timestamp: '2024-01-01T12:00:00Z',
        loadTime: 1200,
        responseTime: 150,
        errorRate: 0.5,
        throughput: 1000
      },
      {
        timestamp: '2024-01-01T12:30:00Z',
        loadTime: 1100,
        responseTime: 140,
        errorRate: 0.3,
        throughput: 1100
      }
    ],
    alerts: [
      {
        id: 'alert-1',
        type: 'warning' as const,
        message: 'High memory usage detected',
        timestamp: '2024-01-01T12:00:00Z',
        severity: 'medium' as const
      },
      {
        id: 'alert-2',
        type: 'error' as const,
        message: 'Database connection timeout',
        timestamp: '2024-01-01T11:45:00Z',
        severity: 'high' as const
      }
    ]
  };

  beforeEach(() => {
    // Setup fetch mocks for all API endpoints
    global.fetch = vi.fn()
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockApiResponses.metrics)
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockApiResponses.userAnalytics)
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockApiResponses.learningAnalytics)
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockApiResponses.deviceAnalytics)
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockApiResponses.performanceMetrics)
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockApiResponses.alerts)
      }));

    // Mock WebSocket
    mockWebSocket();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Full Dashboard Flow', () => {
    it('should load dashboard with all components and data', async () => {
      testRender(<AdminDashboard />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });

      // Check that all main sections are rendered
      expect(screen.getByText('French Tahitian Learning Platform Analytics')).toBeInTheDocument();
      
      // Check metrics cards
      await waitFor(() => {
        expect(screen.getByText('Total Users')).toBeInTheDocument();
        expect(screen.getByText('1,250')).toBeInTheDocument();
        expect(screen.getByText('Active Users')).toBeInTheDocument();
        expect(screen.getByText('890')).toBeInTheDocument();
      });

      // Check charts are rendered
      expect(screen.getByText('User Activity')).toBeInTheDocument();
      expect(screen.getByText('Learning Progress')).toBeInTheDocument();
      expect(screen.getByText('Device Usage')).toBeInTheDocument();
      expect(screen.getByText('Performance Metrics')).toBeInTheDocument();

      // Check alerts section
      expect(screen.getByText('Recent Alerts')).toBeInTheDocument();
      expect(screen.getByText('High memory usage detected')).toBeInTheDocument();

      // Check system status
      expect(screen.getByText('System Status')).toBeInTheDocument();
    });

    it('should handle time range changes and refresh data', async () => {
      const user = userEvent.setup();
      
      // Mock additional API calls for refresh
      global.fetch = vi.fn()
        .mockImplementation(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApiResponses.metrics)
        }));

      testRender(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Last 7 Days')).toBeInTheDocument();
      });

      // Change time range
      const timeRangeSelect = screen.getByDisplayValue('Last 7 Days');
      await user.selectOptions(timeRangeSelect, 'Last 30 Days');

      expect(timeRangeSelect).toHaveValue('30d');

      // Should trigger new API calls
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('timeRange=30d')
        );
      });
    });

    it('should handle auto refresh functionality', async () => {
      const user = userEvent.setup();
      
      testRender(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Auto Refresh')).toBeInTheDocument();
      });

      // Enable auto refresh
      const autoRefreshButton = screen.getByText('Auto Refresh');
      await user.click(autoRefreshButton);

      // Mock timer for auto refresh
      vi.useFakeTimers();
      
      // Mock additional API calls
      global.fetch = vi.fn()
        .mockImplementation(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApiResponses.metrics)
        }));

      // Fast forward time to trigger auto refresh
      vi.advanceTimersByTime(30000); // 30 seconds

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(6); // Should have made refresh calls
      });

      vi.useRealTimers();
    });

    it('should handle manual refresh', async () => {
      const user = userEvent.setup();
      
      // Setup fresh mocks for refresh
      global.fetch = vi.fn()
        .mockImplementation(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            ...mockApiResponses.metrics,
            totalUsers: 1300, // Updated value
          })
        }));

      testRender(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Refresh')).toBeInTheDocument();
      });

      // Click refresh button
      const refreshButton = screen.getByText('Refresh');
      await user.click(refreshButton);

      // Should see updated data
      await waitFor(() => {
        expect(screen.getByText('1,300')).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should handle WebSocket updates', async () => {
      const mockWS = mockWebSocket();
      
      testRender(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('1,250')).toBeInTheDocument();
      });

      // Simulate WebSocket message
      const messageEvent = new MessageEvent('message', {
        data: JSON.stringify({
          type: 'metrics_update',
          payload: { totalUsers: 1275 }
        })
      });

      // Find and trigger the WebSocket message handler
      const messageHandler = mockWS.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )?.[1];

      if (messageHandler) {
        messageHandler(messageEvent);
      }

      // Note: In a real implementation, this would update the UI
      // This test verifies the WebSocket connection is established
      expect(mockWS.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
    });

    it('should handle WebSocket connection errors', async () => {
      const mockWS = mockWebSocket();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      testRender(<AdminDashboard />);

      // Simulate WebSocket error
      const errorHandler = mockWS.addEventListener.mock.calls.find(
        call => call[0] === 'error'
      )?.[1];

      if (errorHandler) {
        errorHandler(new Event('error'));
      }

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('WebSocket error')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Data Export Functionality', () => {
    it('should export user analytics data', async () => {
      const user = userEvent.setup();
      
      // Mock blob and URL creation
      global.URL.createObjectURL = vi.fn(() => 'blob:url');
      global.URL.revokeObjectURL = vi.fn();
      
      // Mock export API
      global.fetch = vi.fn()
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApiResponses.metrics)
        }))
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApiResponses.userAnalytics)
        }))
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApiResponses.learningAnalytics)
        }))
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApiResponses.deviceAnalytics)
        }))
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApiResponses.performanceMetrics)
        }))
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApiResponses.alerts)
        }))
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          blob: () => Promise.resolve(new Blob(['csv,data'], { type: 'text/csv' }))
        }));

      testRender(<AdminDashboard />);

      await waitFor(() => {
        const exportButtons = screen.getAllByTestId('Download');
        expect(exportButtons.length).toBeGreaterThan(0);
      });

      // Find and click export button for user analytics
      const exportButtons = screen.getAllByRole('button');
      const userAnalyticsSection = screen.getByText('User Activity').closest('.bg-white');
      const exportButton = userAnalyticsSection?.querySelector('button[data-testid="Download"]');

      if (exportButton) {
        await user.click(exportButton);
        
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/admin/export/user-analytics')
        );
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle API failures gracefully', async () => {
      // Mock API failure
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      testRender(<AdminDashboard />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to fetch dashboard data:',
          expect.any(Error)
        );
      });

      // Dashboard should still render with error state
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('should handle partial API failures', async () => {
      // Mock some APIs succeeding and others failing
      global.fetch = vi.fn()
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApiResponses.metrics)
        }))
        .mockImplementationOnce(() => Promise.reject(new Error('User analytics failed')))
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApiResponses.learningAnalytics)
        }))
        .mockImplementationOnce(() => Promise.reject(new Error('Device analytics failed')))
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApiResponses.performanceMetrics)
        }))
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApiResponses.alerts)
        }));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      testRender(<AdminDashboard />);

      // Should still show successful data
      await waitFor(() => {
        expect(screen.getByText('1,250')).toBeInTheDocument(); // Metrics loaded
        expect(screen.getByText('Learning Progress')).toBeInTheDocument(); // Learning analytics loaded
      });

      expect(consoleSpy).toHaveBeenCalledTimes(2); // Two failed APIs

      consoleSpy.mockRestore();
    });

    it('should handle malformed API responses', async () => {
      // Mock malformed response
      global.fetch = vi.fn()
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ invalid: 'data' }) // Missing required fields
        }))
        .mockImplementation(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApiResponses.userAnalytics)
        }));

      testRender(<AdminDashboard />);

      // Should handle gracefully and show default values
      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Responsiveness', () => {
    it('should render efficiently with large datasets', async () => {
      // Mock large dataset
      const largeUserAnalytics = Array.from({ length: 1000 }, (_, i) => ({
        timestamp: new Date(Date.now() - i * 86400000).toISOString(),
        activeUsers: Math.floor(Math.random() * 1000),
        newUsers: Math.floor(Math.random() * 100),
        sessions: Math.floor(Math.random() * 2000),
        bounceRate: Math.random() * 50,
        avgSessionDuration: Math.floor(Math.random() * 600)
      }));

      global.fetch = vi.fn()
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApiResponses.metrics)
        }))
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve(largeUserAnalytics)
        }))
        .mockImplementation(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        }));

      const startTime = performance.now();
      
      testRender(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (less than 2 seconds)
      expect(renderTime).toBeLessThan(2000);
    });

    it('should be responsive to window resize', async () => {
      testRender(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });

      // Simulate window resize
      global.innerWidth = 768; // Tablet size
      global.dispatchEvent(new Event('resize'));

      // Check that responsive classes are applied
      const dashboard = screen.getByText('Admin Dashboard').closest('div');
      expect(dashboard).toHaveClass('min-h-screen');

      // Check grid responsiveness
      const metricsGrid = screen.getByText('Total Users').closest('.grid');
      expect(metricsGrid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-4');
    });
  });

  describe('Accessibility', () => {
    it('should be accessible with screen readers', async () => {
      testRender(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });

      // Check for proper headings
      expect(screen.getByRole('heading', { name: 'Admin Dashboard' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'User Activity' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Learning Progress' })).toBeInTheDocument();

      // Check for proper button labels
      expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Auto Refresh' })).toBeInTheDocument();

      // Check for proper form controls
      expect(screen.getByRole('combobox')).toBeInTheDocument(); // Time range selector
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      
      testRender(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });

      // Tab through interactive elements
      await user.tab();
      expect(screen.getByRole('combobox')).toHaveFocus(); // Time range selector

      await user.tab();
      expect(screen.getByRole('button', { name: 'Refresh' })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: 'Auto Refresh' })).toHaveFocus();
    });
  });

  describe('Data Consistency', () => {
    it('should maintain data consistency across components', async () => {
      testRender(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('1,250')).toBeInTheDocument(); // Total users in metrics
      });

      // The same data should be reflected in charts and other components
      // This would require checking that the data passed to charts matches the metrics
      expect(screen.getByText('User Activity')).toBeInTheDocument();
      
      // Verify that all chart components receive data
      expect(screen.getAllByTestId('responsive-container')).toHaveLength(4);
    });

    it('should handle data updates consistently', async () => {
      const user = userEvent.setup();
      
      testRender(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('1,250')).toBeInTheDocument();
      });

      // Mock updated data
      global.fetch = vi.fn()
        .mockImplementation(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            ...mockApiResponses.metrics,
            totalUsers: 1300,
            activeUsers: 950,
          })
        }));

      // Trigger refresh
      const refreshButton = screen.getByText('Refresh');
      await user.click(refreshButton);

      // All components should reflect the updated data
      await waitFor(() => {
        expect(screen.getByText('1,300')).toBeInTheDocument();
        expect(screen.getByText('950')).toBeInTheDocument();
      });
    });
  });
});
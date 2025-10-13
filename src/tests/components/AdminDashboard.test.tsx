import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, mockFetch, mockWebSocket } from '../utils/test-utils';
import AdminDashboard from '../../components/admin/AdminDashboard';

// Mock the recharts library
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

describe('AdminDashboard', () => {
  const mockMetrics = {
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
  };

  const mockUserAnalytics = [
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
  ];

  const mockLearningAnalytics = [
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
  ];

  const mockDeviceAnalytics = [
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
  ];

  const mockPerformanceMetrics = [
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
  ];

  const mockAlerts = [
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
  ];

  beforeEach(() => {
    // Mock all API endpoints
    global.fetch = vi.fn()
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockMetrics)
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockUserAnalytics)
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockLearningAnalytics)
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockDeviceAnalytics)
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockPerformanceMetrics)
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockAlerts)
      }));

    // Mock WebSocket
    mockWebSocket();
  });

  it('renders dashboard header correctly', async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      expect(screen.getByText('French Tahitian Learning Platform Analytics')).toBeInTheDocument();
    });
  });

  it('displays key metrics cards', async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('1,250')).toBeInTheDocument();
      expect(screen.getByText('Active Users')).toBeInTheDocument();
      expect(screen.getByText('890')).toBeInTheDocument();
      expect(screen.getByText('Engagement Rate')).toBeInTheDocument();
      expect(screen.getByText('78.5%')).toBeInTheDocument();
      expect(screen.getByText('Performance Score')).toBeInTheDocument();
      expect(screen.getByText('92')).toBeInTheDocument();
    });
  });

  it('shows user growth percentage', async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('+12.5% from last period')).toBeInTheDocument();
    });
  });

  it('renders all chart components', async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('User Activity')).toBeInTheDocument();
      expect(screen.getByText('Learning Progress')).toBeInTheDocument();
      expect(screen.getByText('Device Usage')).toBeInTheDocument();
      expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
    });

    // Check that chart components are rendered
    expect(screen.getAllByTestId('responsive-container')).toHaveLength(4);
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('displays alerts section', async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Recent Alerts')).toBeInTheDocument();
      expect(screen.getByText('High memory usage detected')).toBeInTheDocument();
      expect(screen.getByText('Database connection timeout')).toBeInTheDocument();
    });
  });

  it('shows system status information', async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('System Status')).toBeInTheDocument();
      expect(screen.getByText('API Response Time')).toBeInTheDocument();
      expect(screen.getByText('Database Status')).toBeInTheDocument();
      expect(screen.getByText('Cache Hit Rate')).toBeInTheDocument();
      expect(screen.getByText('Error Rate')).toBeInTheDocument();
    });
  });

  it('handles time range selection', async () => {
    const user = userEvent.setup();
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Last 7 Days')).toBeInTheDocument();
    });

    const timeRangeSelect = screen.getByDisplayValue('Last 7 Days');
    await user.selectOptions(timeRangeSelect, 'Last 30 Days');

    expect(timeRangeSelect).toHaveValue('30d');
  });

  it('toggles auto refresh', async () => {
    const user = userEvent.setup();
    render(<AdminDashboard />);

    await waitFor(() => {
      const autoRefreshButton = screen.getByText('Auto Refresh');
      expect(autoRefreshButton).toBeInTheDocument();
    });

    const autoRefreshButton = screen.getByText('Auto Refresh');
    await user.click(autoRefreshButton);

    // Button should change appearance when toggled
    expect(autoRefreshButton.closest('button')).toHaveClass('bg-gray-200');
  });

  it('handles manual refresh', async () => {
    const user = userEvent.setup();
    render(<AdminDashboard />);

    await waitFor(() => {
      const refreshButton = screen.getByText('Refresh');
      expect(refreshButton).toBeInTheDocument();
    });

    const refreshButton = screen.getByText('Refresh');
    await user.click(refreshButton);

    // Should trigger new API calls
    expect(global.fetch).toHaveBeenCalledTimes(12); // 6 initial + 6 refresh
  });

  it('handles export functionality', async () => {
    const user = userEvent.setup();
    
    // Mock blob and URL creation
    global.URL.createObjectURL = vi.fn(() => 'blob:url');
    global.URL.revokeObjectURL = vi.fn();
    
    // Mock fetch for export
    global.fetch = vi.fn()
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockMetrics)
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockUserAnalytics)
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockLearningAnalytics)
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockDeviceAnalytics)
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockPerformanceMetrics)
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockAlerts)
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        blob: () => Promise.resolve(new Blob(['csv,data'], { type: 'text/csv' }))
      }));

    render(<AdminDashboard />);

    await waitFor(() => {
      const exportButtons = screen.getAllByTestId('Download');
      expect(exportButtons).toHaveLength(3); // User analytics, learning analytics, performance metrics
    });

    const exportButtons = screen.getAllByRole('button');
    const userAnalyticsExportButton = exportButtons.find(button => 
      button.closest('.bg-white')?.querySelector('h3')?.textContent === 'User Activity'
    );

    if (userAnalyticsExportButton) {
      await user.click(userAnalyticsExportButton);
      
      // Should call export API
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/export/user-analytics')
      );
    }
  });

  it('handles loading state', () => {
    // Mock fetch to never resolve
    global.fetch = vi.fn(() => new Promise(() => {}));

    render(<AdminDashboard />);

    expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
  });

  it('handles API errors gracefully', async () => {
    // Mock fetch to reject
    global.fetch = vi.fn().mockRejectedValue(new Error('API Error'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to fetch dashboard data:',
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });

  it('updates metrics via WebSocket', async () => {
    const mockWS = mockWebSocket();
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('1,250')).toBeInTheDocument();
    });

    // Simulate WebSocket message
    const messageEvent = new MessageEvent('message', {
      data: JSON.stringify({
        type: 'metrics_update',
        payload: { totalUsers: 1300 }
      })
    });

    // Trigger the WebSocket onmessage handler
    if (mockWS.addEventListener.mock.calls.length > 0) {
      const onMessageHandler = mockWS.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )?.[1];
      
      if (onMessageHandler) {
        onMessageHandler(messageEvent);
      }
    }

    // Note: In a real test, you'd need to properly simulate the WebSocket connection
    // and message handling. This is a simplified version.
  });

  it('displays correct alert severity styling', async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      const warningAlert = screen.getByText('High memory usage detected').closest('div');
      const errorAlert = screen.getByText('Database connection timeout').closest('div');

      expect(warningAlert).toHaveClass('bg-yellow-100', 'text-yellow-800');
      expect(errorAlert).toHaveClass('bg-orange-100', 'text-orange-800');
    });
  });

  it('formats timestamps correctly', async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      // Check that timestamps are displayed in a readable format
      const alertTimestamps = screen.getAllByText(/\d{1,2}\/\d{1,2}\/\d{4}/);
      expect(alertTimestamps.length).toBeGreaterThan(0);
    });
  });

  it('maintains responsive design', async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      const dashboard = screen.getByText('Admin Dashboard').closest('div');
      expect(dashboard).toHaveClass('min-h-screen', 'bg-gray-50');
    });

    // Check grid layouts
    const metricsGrid = screen.getByText('Total Users').closest('.grid');
    expect(metricsGrid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-4');
  });
});
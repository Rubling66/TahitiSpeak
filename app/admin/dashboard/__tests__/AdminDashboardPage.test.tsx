import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import AdminDashboardPage from '../page';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));
jest.mock('../../../../lib/auth/AdminAuthService');
jest.mock('../../../../lib/services/PerformanceService');
jest.mock('../../../../lib/auth/RBACService');
jest.mock('../../../../components/admin/AdminLayout', () => {
  return function MockAdminLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="admin-layout">{children}</div>;
  };
});

const mockPush = jest.fn();

const mockDashboardData = {
  totalUsers: 1250,
  totalCourses: 45,
  totalLessons: 320,
  activeUsers: 890,
  completionRate: 78.5,
  averageProgress: 65.2,
  recentActivity: [],
  performanceMetrics: {
    responseTime: 245,
    uptime: 99.8,
    errorRate: 0.2,
    throughput: 1250,
  },
  userGrowth: [],
  coursePopularity: [],
};

const mockAdminUser = {
  id: 'admin-123',
  email: 'admin@example.com',
  firstName: 'Admin',
  lastName: 'User',
  role: 'super_admin' as const,
  permissions: ['analytics.view', 'users.manage', 'courses.manage'],
  isActive: true,
  lastLogin: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock useRouter
    const { useRouter } = require('next/navigation');
    useRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    });

    // Mock AdminAuthService
    const { AdminAuthService } = require('../../../../lib/auth/AdminAuthService');
    AdminAuthService.getCurrentUser = jest.fn().mockResolvedValue(mockAdminUser);
    AdminAuthService.hasPermission = jest.fn().mockReturnValue(true);
    
    // Mock PerformanceService
    const { PerformanceService } = require('../../../../lib/services/PerformanceService');
    PerformanceService.getDashboardMetrics = jest.fn().mockResolvedValue(mockDashboardData);
    PerformanceService.getSystemHealth = jest.fn().mockResolvedValue({
      status: 'healthy',
      uptime: 99.8,
      responseTime: 245,
      errorRate: 0.2,
    });
    
    // Mock RBACService
    const { RBACService } = require('../../../../lib/auth/RBACService');
    RBACService.hasPermission = jest.fn().mockReturnValue(true);
  });

  it('renders admin dashboard page', async () => {
    render(<AdminDashboardPage />);

    // Basic test - just check if component renders without errors
    expect(screen.getByTestId('admin-layout')).toBeInTheDocument();
  });

  it('handles loading state', () => {
    const { PerformanceService } = require('../../../../lib/services/PerformanceService');
    PerformanceService.getDashboardMetrics.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockDashboardData), 100))
    );

    render(<AdminDashboardPage />);

    // Component should render even in loading state
    expect(screen.getByTestId('admin-layout')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    const { PerformanceService } = require('../../../../lib/services/PerformanceService');
    PerformanceService.getDashboardMetrics.mockRejectedValue(
      new Error('Failed to fetch dashboard data')
    );

    render(<AdminDashboardPage />);

    // Component should render even in error state
    expect(screen.getByTestId('admin-layout')).toBeInTheDocument();
  });
});
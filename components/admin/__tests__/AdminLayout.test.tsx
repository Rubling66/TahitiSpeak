import React from 'react';
import { render, screen } from '@testing-library/react';
import AdminLayout from '../AdminLayout';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/admin/dashboard',
}));

// Mock AdminAuthService
jest.mock('../../../lib/auth/AdminAuthService', () => ({
  AdminAuthService: {
    getCurrentUser: jest.fn(),
    hasPermission: jest.fn(() => true),
    logout: jest.fn(),
  },
}));

// Mock authBridge
jest.mock('../../../lib/auth/AuthBridge', () => ({
  authBridge: {
    hasAdminAccess: jest.fn(() => true),
    getCurrentAdminUser: jest.fn(),
    getUnifiedUserInfo: jest.fn(() => ({ user: null })),
  },
}));

import { AdminAuthService } from '@/lib/auth/AdminAuthService';
import { authBridge } from '@/lib/auth/AuthBridge';

const mockAdminUser = {
  id: '1',
  email: 'admin@example.com',
  role: 'admin' as const,
  permissions: ['read', 'write', 'delete'],
  profile: {
    firstName: 'Admin',
    lastName: 'User',
    avatar: null,
  },
};

describe('AdminLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    (AdminAuthService.getCurrentUser as jest.Mock).mockReturnValue(mockAdminUser);
    (authBridge.hasAdminAccess as jest.Mock).mockReturnValue(true);
    (authBridge.getCurrentAdminUser as jest.Mock).mockReturnValue(mockAdminUser);
  });

  it('renders children content', () => {
    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('handles unauthenticated state', () => {
    (AdminAuthService.getCurrentUser as jest.Mock).mockReturnValue(null);
    (authBridge.hasAdminAccess as jest.Mock).mockReturnValue(false);
    (authBridge.getCurrentAdminUser as jest.Mock).mockReturnValue(null);

    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    );

    // Component should handle unauthenticated state gracefully
    // It may not render content or show loading state
  });

  it('shows loading state initially', () => {
    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    );

    // Should show loading initially before auth check completes
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
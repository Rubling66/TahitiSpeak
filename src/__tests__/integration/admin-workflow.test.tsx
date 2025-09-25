import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminDashboard from '../../pages/admin/AdminDashboard';
import UserManagement from '../../pages/admin/UserManagement';
import CourseManagement from '../../pages/admin/CourseManagement';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/admin',
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  },
}));

// Mock admin auth services
const mockAdminAuthService = {
  getCurrentUser: jest.fn(),
  hasPermission: jest.fn(),
  logout: jest.fn(),
};

const mockAuthBridge = {
  hasAdminAccess: jest.fn(),
  getCurrentAdminUser: jest.fn(),
  getUnifiedUserInfo: jest.fn(),
};

jest.mock('../../../lib/auth/AdminAuthService', () => ({
  AdminAuthService: mockAdminAuthService,
}));

jest.mock('../../../lib/auth/AuthBridge', () => ({
  authBridge: mockAuthBridge,
}));

// Mock data services
const mockDataService = {
  getUsers: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
  getCourses: jest.fn(),
  createCourse: jest.fn(),
  updateCourse: jest.fn(),
  deleteCourse: jest.fn(),
  getAnalytics: jest.fn(),
};

jest.mock('../../lib/data/DataService', () => ({
  DataService: mockDataService,
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

const mockAdminUser = {
  id: 'admin-1',
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'admin' as const,
  permissions: ['users.manage', 'courses.manage', 'analytics.view'],
};

describe('Admin Workflow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default admin authentication
    mockAdminAuthService.getCurrentUser.mockReturnValue(mockAdminUser);
    mockAuthBridge.hasAdminAccess.mockReturnValue(true);
    mockAuthBridge.getCurrentAdminUser.mockReturnValue(mockAdminUser);
    mockAdminAuthService.hasPermission.mockReturnValue(true);
  });

  describe('Admin Dashboard Access', () => {
    it('should render admin dashboard for authenticated admin', async () => {
      mockDataService.getAnalytics.mockResolvedValue({
        totalUsers: 150,
        totalCourses: 25,
        activeUsers: 120,
        completionRate: 78,
      });

      render(
        <TestWrapper>
          <AdminLayout>
            <AdminDashboard />
          </AdminLayout>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/admin dashboard/i)).toBeInTheDocument();
      });

      expect(mockDataService.getAnalytics).toHaveBeenCalled();
    });

    it('should deny access for non-admin users', () => {
      mockAuthBridge.hasAdminAccess.mockReturnValue(false);
      mockAdminAuthService.getCurrentUser.mockReturnValue(null);

      render(
        <TestWrapper>
          <AdminLayout>
            <AdminDashboard />
          </AdminLayout>
        </TestWrapper>
      );

      expect(screen.getByText(/access denied/i)).toBeInTheDocument();
    });
  });

  describe('User Management Workflow', () => {
    const mockUsers = [
      {
        id: '1',
        email: 'student1@example.com',
        name: 'Student One',
        role: 'student',
        status: 'active',
        createdAt: '2024-01-01',
      },
      {
        id: '2',
        email: 'instructor1@example.com',
        name: 'Instructor One',
        role: 'instructor',
        status: 'active',
        createdAt: '2024-01-02',
      },
    ];

    it('should display user list and allow management', async () => {
      mockDataService.getUsers.mockResolvedValue(mockUsers);

      render(
        <TestWrapper>
          <AdminLayout>
            <UserManagement />
          </AdminLayout>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Student One')).toBeInTheDocument();
        expect(screen.getByText('Instructor One')).toBeInTheDocument();
      });

      expect(mockDataService.getUsers).toHaveBeenCalled();
    });

    it('should handle user role updates', async () => {
      const user = userEvent.setup();
      mockDataService.getUsers.mockResolvedValue(mockUsers);
      mockDataService.updateUser.mockResolvedValue({ success: true });

      render(
        <TestWrapper>
          <AdminLayout>
            <UserManagement />
          </AdminLayout>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Student One')).toBeInTheDocument();
      });

      // Find and click edit button for first user
      const editButtons = screen.getAllByText(/edit/i);
      await user.click(editButtons[0]);

      // Change role
      const roleSelect = screen.getByDisplayValue('student');
      await user.selectOptions(roleSelect, 'instructor');

      // Save changes
      const saveButton = screen.getByText(/save/i);
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockDataService.updateUser).toHaveBeenCalledWith('1', {
          role: 'instructor',
        });
      });
    });

    it('should handle user deletion with confirmation', async () => {
      const user = userEvent.setup();
      mockDataService.getUsers.mockResolvedValue(mockUsers);
      mockDataService.deleteUser.mockResolvedValue({ success: true });
      
      // Mock window.confirm
      window.confirm = jest.fn(() => true);

      render(
        <TestWrapper>
          <AdminLayout>
            <UserManagement />
          </AdminLayout>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Student One')).toBeInTheDocument();
      });

      // Find and click delete button
      const deleteButtons = screen.getAllByText(/delete/i);
      await user.click(deleteButtons[0]);

      expect(window.confirm).toHaveBeenCalledWith(
        'Are you sure you want to delete this user?'
      );

      await waitFor(() => {
        expect(mockDataService.deleteUser).toHaveBeenCalledWith('1');
      });
    });
  });

  describe('Course Management Workflow', () => {
    const mockCourses = [
      {
        id: '1',
        title: 'Basic Tahitian',
        description: 'Introduction to Tahitian language',
        level: 'beginner',
        status: 'published',
        lessons: 10,
        enrollments: 45,
      },
      {
        id: '2',
        title: 'Advanced Tahitian',
        description: 'Advanced Tahitian conversation',
        level: 'advanced',
        status: 'draft',
        lessons: 15,
        enrollments: 12,
      },
    ];

    it('should display course list and management options', async () => {
      mockDataService.getCourses.mockResolvedValue(mockCourses);

      render(
        <TestWrapper>
          <AdminLayout>
            <CourseManagement />
          </AdminLayout>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Basic Tahitian')).toBeInTheDocument();
        expect(screen.getByText('Advanced Tahitian')).toBeInTheDocument();
      });

      expect(mockDataService.getCourses).toHaveBeenCalled();
    });

    it('should handle course creation', async () => {
      const user = userEvent.setup();
      mockDataService.getCourses.mockResolvedValue(mockCourses);
      mockDataService.createCourse.mockResolvedValue({
        success: true,
        course: { id: '3', title: 'New Course' },
      });

      render(
        <TestWrapper>
          <AdminLayout>
            <CourseManagement />
          </AdminLayout>
        </TestWrapper>
      );

      // Click create course button
      const createButton = screen.getByText(/create course/i);
      await user.click(createButton);

      // Fill course form
      const titleInput = screen.getByLabelText(/title/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const levelSelect = screen.getByLabelText(/level/i);

      await user.type(titleInput, 'New Tahitian Course');
      await user.type(descriptionInput, 'A new course for learning Tahitian');
      await user.selectOptions(levelSelect, 'intermediate');

      // Submit form
      const submitButton = screen.getByText(/create/i);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockDataService.createCourse).toHaveBeenCalledWith({
          title: 'New Tahitian Course',
          description: 'A new course for learning Tahitian',
          level: 'intermediate',
        });
      });
    });

    it('should handle course status updates', async () => {
      const user = userEvent.setup();
      mockDataService.getCourses.mockResolvedValue(mockCourses);
      mockDataService.updateCourse.mockResolvedValue({ success: true });

      render(
        <TestWrapper>
          <AdminLayout>
            <CourseManagement />
          </AdminLayout>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Advanced Tahitian')).toBeInTheDocument();
      });

      // Find publish button for draft course
      const publishButton = screen.getByText(/publish/i);
      await user.click(publishButton);

      await waitFor(() => {
        expect(mockDataService.updateCourse).toHaveBeenCalledWith('2', {
          status: 'published',
        });
      });
    });
  });

  describe('Permission-based Access Control', () => {
    it('should hide management features for users without permissions', () => {
      mockAdminAuthService.hasPermission.mockImplementation((permission) => {
        return permission !== 'users.manage';
      });

      render(
        <TestWrapper>
          <AdminLayout>
            <UserManagement />
          </AdminLayout>
        </TestWrapper>
      );

      expect(screen.queryByText(/delete/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/create user/i)).not.toBeInTheDocument();
    });

    it('should show all features for super admin', () => {
      mockAdminAuthService.hasPermission.mockReturnValue(true);
      mockDataService.getUsers.mockResolvedValue([]);

      render(
        <TestWrapper>
          <AdminLayout>
            <UserManagement />
          </AdminLayout>
        </TestWrapper>
      );

      expect(screen.getByText(/create user/i)).toBeInTheDocument();
    });
  });
});
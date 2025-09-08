import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider } from '@/contexts/AuthContext'

// Mock components
const AdminDashboard: React.FC = () => (
  <div data-testid="admin-dashboard">
    <h1>Admin Dashboard</h1>
    <div data-testid="stats-overview">
      <div>Total Users: 1250</div>
      <div>Active Users: 890</div>
      <div>Total Courses: 25</div>
    </div>
  </div>
)

const UserManagement: React.FC = () => (
  <div data-testid="user-management">
    <h2>User Management</h2>
    <button>Create User</button>
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>John Doe</td>
          <td>john@example.com</td>
          <td>student</td>
          <td>active</td>
          <td>
            <button>Edit User</button>
            <button>Delete User</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
)

const CourseManagement: React.FC = () => (
  <div data-testid="course-management">
    <h2>Course Management</h2>
    <button>Create Course</button>
    <div>
      <h3>Basic Tahitian</h3>
      <button>Edit Course</button>
      <button>Publish</button>
    </div>
  </div>
)

const AnalyticsDashboard: React.FC = () => (
  <div data-testid="analytics-dashboard">
    <h2>Analytics</h2>
    <div data-testid="line-chart">User Engagement Chart</div>
    <div data-testid="bar-chart">Completion Rates Chart</div>
  </div>
)

// Mock next/navigation
const mockPush = jest.fn()
const mockReplace = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  usePathname: () => '/admin',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock fetch for API calls
global.fetch = jest.fn()

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'admin.dashboard': 'Admin Dashboard',
      'admin.users': 'User Management',
      'admin.courses': 'Course Management',
      'admin.analytics': 'Analytics',
      'admin.reports': 'Reports',
      'users.total': 'Total Users',
      'users.active': 'Active Users',
      'users.new': 'New Users',
      'users.create': 'Create User',
      'users.edit': 'Edit User',
      'users.delete': 'Delete User',
      'users.role': 'Role',
      'users.status': 'Status',
      'courses.total': 'Total Courses',
      'courses.published': 'Published',
      'courses.draft': 'Draft',
      'courses.create': 'Create Course',
      'courses.edit': 'Edit Course',
      'courses.publish': 'Publish',
      'courses.unpublish': 'Unpublish',
      'analytics.overview': 'Overview',
      'analytics.engagement': 'User Engagement',
      'analytics.completion': 'Completion Rates',
      'common.save': 'Save',
      'common.cancel': 'Cancel',
      'common.confirm': 'Confirm',
      'common.success': 'Success',
      'common.error': 'Error',
    }
    return translations[key] || key
  },
  useLocale: () => 'en',
}))

// Mock Chart.js components (not using react-chartjs-2)
// Charts will be mocked directly in components

// Mock AuthProvider for testing
const MockAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const mockAuthValue = {
    user: { id: '1', email: 'admin@test.com', role: 'admin', name: 'Admin User' },
    isAuthenticated: true,
    isLoading: false,
    error: null,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    resetPassword: jest.fn(),
    changePassword: jest.fn(),
    refreshToken: jest.fn(),
    clearError: jest.fn(),
    getAuthHeader: jest.fn(),
    hasRole: jest.fn(() => true),
    hasAnyRole: jest.fn(() => true),
    isTokenExpiringSoon: jest.fn(() => false),
  };
  
  return (
    <div data-testid="mock-auth-provider">
      {children}
    </div>
  );
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <MockAuthProvider>{children}</MockAuthProvider>
}

// Mock data
const mockAdminUser = {
  id: '1',
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'admin',
}

const mockUsers = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'student',
    status: 'active',
    createdAt: '2024-01-01',
    lastLogin: '2024-01-15',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'instructor',
    status: 'active',
    createdAt: '2024-01-02',
    lastLogin: '2024-01-14',
  },
  {
    id: '3',
    name: 'Bob Wilson',
    email: 'bob@example.com',
    role: 'student',
    status: 'inactive',
    createdAt: '2024-01-03',
    lastLogin: '2024-01-10',
  },
]

const mockCourses = [
  {
    id: '1',
    title: 'Basic Tahitian',
    description: 'Learn basic Tahitian phrases',
    status: 'published',
    difficulty: 'beginner',
    enrollments: 150,
    completionRate: 75,
    createdAt: '2024-01-01',
  },
  {
    id: '2',
    title: 'Advanced Tahitian',
    description: 'Advanced Tahitian grammar',
    status: 'draft',
    difficulty: 'advanced',
    enrollments: 0,
    completionRate: 0,
    createdAt: '2024-01-05',
  },
]

const mockAnalytics = {
  overview: {
    totalUsers: 1250,
    activeUsers: 890,
    totalCourses: 25,
    totalLessons: 150,
  },
  engagement: {
    dailyActiveUsers: [45, 52, 48, 61, 55, 67, 72],
    weeklyActiveUsers: [320, 345, 298, 412, 387, 445, 467],
    averageSessionDuration: 25.5,
  },
  completion: {
    courseCompletionRate: 68,
    lessonCompletionRate: 82,
    quizPassRate: 91,
  },
}

describe('Admin Workflow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue('admin-token')
    ;(global.fetch as jest.Mock).mockClear()
  })

  describe('Admin Dashboard Overview', () => {
    it('should display admin dashboard with key metrics', async () => {
      // Mock dashboard API response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          stats: {
            totalUsers: 1250,
            activeUsers: 890,
            totalCourses: 25,
            newUsersToday: 12,
            completedLessonsToday: 145,
          },
          recentActivity: [
            {
              id: '1',
              type: 'user_registered',
              user: 'John Doe',
              timestamp: '2024-01-15T10:30:00Z',
            },
            {
              id: '2',
              type: 'course_completed',
              user: 'Jane Smith',
              course: 'Basic Tahitian',
              timestamp: '2024-01-15T09:15:00Z',
            },
          ],
        }),
      })

      render(
        <TestWrapper>
          <AdminDashboard />
        </TestWrapper>
      )

      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
      })

      // Check key metrics
      expect(screen.getByText('1,250')).toBeInTheDocument() // Total users
      expect(screen.getByText('890')).toBeInTheDocument() // Active users
      expect(screen.getByText('25')).toBeInTheDocument() // Total courses
      expect(screen.getByText('12')).toBeInTheDocument() // New users today

      // Check recent activity
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    })

    it('should navigate to different admin sections', async () => {
      const user = userEvent.setup()
      
      // Mock dashboard API response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ stats: {}, recentActivity: [] }),
      })

      render(
        <TestWrapper>
          <AdminDashboard />
        </TestWrapper>
      )

      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
      })

      // Navigate to user management
      const userManagementLink = screen.getByRole('link', { name: /user management/i })
      await user.click(userManagementLink)
      expect(mockPush).toHaveBeenCalledWith('/admin/users')

      // Navigate to course management
      const courseManagementLink = screen.getByRole('link', { name: /course management/i })
      await user.click(courseManagementLink)
      expect(mockPush).toHaveBeenCalledWith('/admin/courses')

      // Navigate to analytics
      const analyticsLink = screen.getByRole('link', { name: /analytics/i })
      await user.click(analyticsLink)
      expect(mockPush).toHaveBeenCalledWith('/admin/analytics')
    })
  })

  describe('User Management Workflow', () => {
    it('should display and manage users', async () => {
      const user = userEvent.setup()
      
      // Mock users API response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ users: mockUsers, total: 3 }),
      })

      render(
        <TestWrapper>
          <UserManagement />
        </TestWrapper>
      )

      // Wait for users to load
      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument()
      })

      // Check user list
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('jane@example.com')).toBeInTheDocument()
      expect(screen.getByText('instructor')).toBeInTheDocument()

      // Check filters
      const roleFilter = screen.getByRole('combobox', { name: /role/i })
      expect(roleFilter).toBeInTheDocument()

      const statusFilter = screen.getByRole('combobox', { name: /status/i })
      expect(statusFilter).toBeInTheDocument()
    })

    it('should create a new user', async () => {
      const user = userEvent.setup()
      
      // Mock users API response
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ users: mockUsers, total: 3 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            user: {
              id: '4',
              name: 'New User',
              email: 'newuser@example.com',
              role: 'student',
              status: 'active',
            },
          }),
        })

      render(
        <TestWrapper>
          <UserManagement />
        </TestWrapper>
      )

      // Wait for users to load
      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument()
      })

      // Click create user button
      const createButton = screen.getByRole('button', { name: /create user/i })
      await user.click(createButton)

      // Fill user form
      await user.type(screen.getByLabelText(/name/i), 'New User')
      await user.type(screen.getByLabelText(/email/i), 'newuser@example.com')
      await user.selectOptions(screen.getByLabelText(/role/i), 'student')

      // Submit form
      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      // Wait for API call
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/admin/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer admin-token',
          },
          body: JSON.stringify({
            name: 'New User',
            email: 'newuser@example.com',
            role: 'student',
          }),
        })
      })

      // Check success message
      expect(screen.getByText(/user created successfully/i)).toBeInTheDocument()
    })

    it('should edit an existing user', async () => {
      const user = userEvent.setup()
      
      // Mock users API response
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ users: mockUsers, total: 3 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })

      render(
        <TestWrapper>
          <UserManagement />
        </TestWrapper>
      )

      // Wait for users to load
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      // Click edit button for first user
      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      await user.click(editButtons[0])

      // Modify user role
      const roleSelect = screen.getByLabelText(/role/i)
      await user.selectOptions(roleSelect, 'instructor')

      // Save changes
      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      // Wait for API call
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/admin/users/1', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer admin-token',
          },
          body: JSON.stringify({
            name: 'John Doe',
            email: 'john@example.com',
            role: 'instructor',
            status: 'active',
          }),
        })
      })
    })

    it('should delete a user with confirmation', async () => {
      const user = userEvent.setup()
      
      // Mock users API response
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ users: mockUsers, total: 3 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })

      render(
        <TestWrapper>
          <UserManagement />
        </TestWrapper>
      )

      // Wait for users to load
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      // Click delete button
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
      await user.click(deleteButtons[0])

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      await user.click(confirmButton)

      // Wait for API call
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/admin/users/1', {
          method: 'DELETE',
          headers: {
            Authorization: 'Bearer admin-token',
          },
        })
      })
    })
  })

  describe('Course Management Workflow', () => {
    it('should display and manage courses', async () => {
      const user = userEvent.setup()
      
      // Mock courses API response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ courses: mockCourses, total: 2 }),
      })

      render(
        <TestWrapper>
          <CourseManagement />
        </TestWrapper>
      )

      // Wait for courses to load
      await waitFor(() => {
        expect(screen.getByText('Course Management')).toBeInTheDocument()
      })

      // Check course list
      expect(screen.getByText('Basic Tahitian')).toBeInTheDocument()
      expect(screen.getByText('Advanced Tahitian')).toBeInTheDocument()
      expect(screen.getByText('published')).toBeInTheDocument()
      expect(screen.getByText('draft')).toBeInTheDocument()

      // Check enrollment numbers
      expect(screen.getByText('150')).toBeInTheDocument() // enrollments
      expect(screen.getByText('75%')).toBeInTheDocument() // completion rate
    })

    it('should publish/unpublish courses', async () => {
      const user = userEvent.setup()
      
      // Mock courses API response
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ courses: mockCourses, total: 2 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })

      render(
        <TestWrapper>
          <CourseManagement />
        </TestWrapper>
      )

      // Wait for courses to load
      await waitFor(() => {
        expect(screen.getByText('Basic Tahitian')).toBeInTheDocument()
      })

      // Unpublish a published course
      const unpublishButton = screen.getByRole('button', { name: /unpublish/i })
      await user.click(unpublishButton)

      // Wait for API call
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/admin/courses/1/unpublish', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer admin-token',
          },
        })
      })
    })
  })

  describe('Analytics Dashboard Workflow', () => {
    it('should display analytics with charts', async () => {
      // Mock analytics API response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalytics,
      })

      render(
        <TestWrapper>
          <AnalyticsDashboard />
        </TestWrapper>
      )

      // Wait for analytics to load
      await waitFor(() => {
        expect(screen.getByText('Analytics')).toBeInTheDocument()
      })

      // Check overview metrics
      expect(screen.getByText('1,250')).toBeInTheDocument() // total users
      expect(screen.getByText('890')).toBeInTheDocument() // active users
      expect(screen.getByText('25')).toBeInTheDocument() // total courses

      // Check charts are rendered
      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
      expect(screen.getByTestId('doughnut-chart')).toBeInTheDocument()

      // Check completion rates
      expect(screen.getByText('68%')).toBeInTheDocument() // course completion
      expect(screen.getByText('82%')).toBeInTheDocument() // lesson completion
      expect(screen.getByText('91%')).toBeInTheDocument() // quiz pass rate
    })

    it('should filter analytics by date range', async () => {
      const user = userEvent.setup()
      
      // Mock analytics API responses
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockAnalytics,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ...mockAnalytics,
            engagement: {
              ...mockAnalytics.engagement,
              dailyActiveUsers: [30, 35, 32, 40, 38, 45, 50],
            },
          }),
        })

      render(
        <TestWrapper>
          <AnalyticsDashboard />
        </TestWrapper>
      )

      // Wait for analytics to load
      await waitFor(() => {
        expect(screen.getByText('Analytics')).toBeInTheDocument()
      })

      // Change date range
      const dateRangeSelect = screen.getByRole('combobox', { name: /date range/i })
      await user.selectOptions(dateRangeSelect, 'last-30-days')

      // Wait for updated data
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/admin/analytics?range=last-30-days', {
          headers: {
            Authorization: 'Bearer admin-token',
          },
        })
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      // Mock API error
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'))

      render(
        <TestWrapper>
          <UserManagement />
        </TestWrapper>
      )

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText(/error loading users/i)).toBeInTheDocument()
      })

      // Check retry button
      const retryButton = screen.getByRole('button', { name: /retry/i })
      expect(retryButton).toBeInTheDocument()
    })

    it('should handle unauthorized access', async () => {
      // Mock unauthorized response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      })

      render(
        <TestWrapper>
          <AdminDashboard />
        </TestWrapper>
      )

      // Wait for redirect to login
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/login')
      })
    })
  })
})
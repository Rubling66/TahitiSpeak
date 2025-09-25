import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { LoginForm } from '../../components/auth/LoginForm';
import { RegisterForm } from '../../components/auth/RegisterForm';
import { UserProfile } from '../../components/auth/UserProfile';
import { toast } from 'sonner';

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
  usePathname: () => '/login',
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

// Mock auth services
const mockAuthService = {
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  getState: jest.fn(() => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  })),
  subscribe: jest.fn(() => jest.fn()),
};

jest.mock('../../services/AuthService', () => ({
  __esModule: true,
  default: mockAuthService,
}));

jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    login: mockAuthService.login,
    register: mockAuthService.register,
    logout: mockAuthService.logout,
    resetPassword: jest.fn(),
    changePassword: jest.fn(),
    updateProfile: jest.fn(),
    refreshToken: jest.fn(),
    getAuthHeader: jest.fn(),
    isTokenExpiringSoon: jest.fn(),
  }),
}));

jest.mock('../../hooks/useAuthorization', () => ({
  useAuthorization: () => ({
    hasPermission: jest.fn(() => true),
    hasRole: jest.fn(() => true),
    hasAnyRole: jest.fn(() => true),
    canAccessResource: jest.fn(() => true),
    requireAuth: jest.fn(() => true),
    getUserPermissions: jest.fn(() => []),
    getAccessibleResources: jest.fn(() => []),
  }),
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Authentication Workflow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User Registration Flow', () => {
    it('should complete full registration workflow', async () => {
      const user = userEvent.setup();
      mockAuthService.register.mockResolvedValue({
        success: true,
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'student',
        },
      });

      render(
        <TestWrapper>
          <RegisterForm />
        </TestWrapper>
      );

      // Fill registration form
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /register/i });

      await user.type(nameInput, 'Test User');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');

      // Submit form
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAuthService.register).toHaveBeenCalledWith({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          confirmPassword: 'password123',
        });
      });

      expect(toast.success).toHaveBeenCalledWith('Registration successful!');
    });

    it('should handle registration validation errors', async () => {
      const user = userEvent.setup();
      mockAuthService.register.mockRejectedValue(new Error('Email already exists'));

      render(
        <TestWrapper>
          <RegisterForm />
        </TestWrapper>
      );

      // Fill form with existing email
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /register/i });

      await user.type(nameInput, 'Test User');
      await user.type(emailInput, 'existing@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Email already exists');
      });
    });
  });

  describe('User Login Flow', () => {
    it('should complete successful login workflow', async () => {
      const user = userEvent.setup();
      mockAuthService.login.mockResolvedValue({
        success: true,
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'student',
        },
      });

      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      );

      // Fill login form
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAuthService.login).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      expect(toast.success).toHaveBeenCalledWith('Login successful!');
    });

    it('should handle login authentication errors', async () => {
      const user = userEvent.setup();
      mockAuthService.login.mockRejectedValue(new Error('Invalid credentials'));

      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'wrong@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
      });
    });
  });

  describe('User Profile Management', () => {
    it('should display user profile information', () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'student',
      };

      // Mock authenticated state
      const useAuth = require('../../hooks/useAuth').useAuth;
      useAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        resetPassword: jest.fn(),
        changePassword: jest.fn(),
        updateProfile: jest.fn(),
        refreshToken: jest.fn(),
        getAuthHeader: jest.fn(),
        isTokenExpiringSoon: jest.fn(),
      });

      render(
        <TestWrapper>
          <UserProfile />
        </TestWrapper>
      );

      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    });
  });
});
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider } from '@/contexts/AuthContext'

// Mock components
const LoginForm: React.FC = () => (
  <form>
    <label htmlFor="email">Email</label>
    <input id="email" type="email" />
    <label htmlFor="password">Password</label>
    <input id="password" type="password" />
    <button type="submit">Login</button>
  </form>
)

const RegistrationForm: React.FC = () => (
  <form>
    <label htmlFor="name">Name</label>
    <input id="name" type="text" />
    <label htmlFor="email">Email</label>
    <input id="email" type="email" />
    <label htmlFor="password">Password</label>
    <input id="password" type="password" />
    <label htmlFor="confirmPassword">Confirm Password</label>
    <input id="confirmPassword" type="password" />
    <button type="submit">Register</button>
  </form>
)

// Mock next/navigation
const mockPush = jest.fn()
const mockReplace = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  usePathname: () => '/auth/login',
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
      'auth.login': 'Login',
      'auth.register': 'Register',
      'auth.email': 'Email',
      'auth.password': 'Password',
      'auth.confirmPassword': 'Confirm Password',
      'auth.name': 'Name',
      'auth.loginSuccess': 'Login successful',
      'auth.registerSuccess': 'Registration successful',
      'auth.invalidCredentials': 'Invalid credentials',
      'validation.emailRequired': 'Email is required',
      'validation.passwordRequired': 'Password is required',
      'validation.nameRequired': 'Name is required',
    }
    return translations[key] || key
  },
  useLocale: () => 'en',
}))

// Mock AuthProvider for testing
const MockAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const mockAuthValue = {
    user: null,
    isAuthenticated: false,
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
    hasRole: jest.fn(),
    hasAnyRole: jest.fn(),
    isTokenExpiringSoon: jest.fn(),
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

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
    ;(global.fetch as jest.Mock).mockClear()
  })

  describe('Login Flow', () => {
    it('should handle successful login', async () => {
      const user = userEvent.setup()
      
      // Mock successful login response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
            role: 'student',
          },
          token: 'mock-jwt-token',
        }),
      })

      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      )

      // Fill login form
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      
      // Submit form
      await user.click(screen.getByRole('button', { name: /login/i }))

      // Wait for API call
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
          }),
        })
      })

      // Check if token is stored
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('auth-token', 'mock-jwt-token')
      
      // Check if redirected
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })

    it('should handle login failure', async () => {
      const user = userEvent.setup()
      
      // Mock failed login response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'Invalid credentials',
        }),
      })

      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      )

      // Fill login form
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword')
      
      // Submit form
      await user.click(screen.getByRole('button', { name: /login/i }))

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
      })

      // Check that no token is stored
      expect(mockLocalStorage.setItem).not.toHaveBeenCalledWith('auth-token', expect.any(String))
    })

    it('should validate required fields', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      )

      // Submit empty form
      await user.click(screen.getByRole('button', { name: /login/i }))

      // Check for validation errors
      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument()
        expect(screen.getByText('Password is required')).toBeInTheDocument()
      })

      // Check that no API call is made
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  describe('Registration Flow', () => {
    it('should handle successful registration', async () => {
      const user = userEvent.setup()
      
      // Mock successful registration response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: {
            id: '1',
            email: 'newuser@example.com',
            name: 'New User',
            role: 'student',
          },
          token: 'mock-jwt-token',
        }),
      })

      render(
        <TestWrapper>
          <RegistrationForm />
        </TestWrapper>
      )

      // Fill registration form
      await user.type(screen.getByLabelText(/name/i), 'New User')
      await user.type(screen.getByLabelText(/email/i), 'newuser@example.com')
      await user.type(screen.getByLabelText(/^password/i), 'password123')
      await user.type(screen.getByLabelText(/confirm password/i), 'password123')
      
      // Submit form
      await user.click(screen.getByRole('button', { name: /register/i }))

      // Wait for API call
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'New User',
            email: 'newuser@example.com',
            password: 'password123',
          }),
        })
      })

      // Check if token is stored
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('auth-token', 'mock-jwt-token')
      
      // Check if redirected
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })

    it('should validate password confirmation', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <RegistrationForm />
        </TestWrapper>
      )

      // Fill form with mismatched passwords
      await user.type(screen.getByLabelText(/name/i), 'New User')
      await user.type(screen.getByLabelText(/email/i), 'newuser@example.com')
      await user.type(screen.getByLabelText(/^password/i), 'password123')
      await user.type(screen.getByLabelText(/confirm password/i), 'differentpassword')
      
      // Submit form
      await user.click(screen.getByRole('button', { name: /register/i }))

      // Check for validation error
      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
      })

      // Check that no API call is made
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should handle registration failure', async () => {
      const user = userEvent.setup()
      
      // Mock failed registration response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'Email already exists',
        }),
      })

      render(
        <TestWrapper>
          <RegistrationForm />
        </TestWrapper>
      )

      // Fill registration form
      await user.type(screen.getByLabelText(/name/i), 'New User')
      await user.type(screen.getByLabelText(/email/i), 'existing@example.com')
      await user.type(screen.getByLabelText(/^password/i), 'password123')
      await user.type(screen.getByLabelText(/confirm password/i), 'password123')
      
      // Submit form
      await user.click(screen.getByRole('button', { name: /register/i }))

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText('Email already exists')).toBeInTheDocument()
      })

      // Check that no token is stored
      expect(mockLocalStorage.setItem).not.toHaveBeenCalledWith('auth-token', expect.any(String))
    })
  })

  describe('Authentication State Management', () => {
    it('should persist authentication state', async () => {
      // Mock existing token in localStorage
      mockLocalStorage.getItem.mockReturnValue('existing-token')
      
      // Mock token validation response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
            role: 'student',
          },
        }),
      })

      render(
        <TestWrapper>
          <div data-testid="auth-state">Authenticated Content</div>
        </TestWrapper>
      )

      // Wait for token validation
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/validate', {
          headers: {
            Authorization: 'Bearer existing-token',
          },
        })
      })
    })

    it('should handle logout', async () => {
      const user = userEvent.setup()
      
      // Mock logout response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      })

      render(
        <TestWrapper>
          <button onClick={() => {/* logout function */}}>Logout</button>
        </TestWrapper>
      )

      await user.click(screen.getByRole('button', { name: /logout/i }))

      // Check that token is removed
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth-token')
      
      // Check if redirected to home
      expect(mockPush).toHaveBeenCalledWith('/')
    })
  })
})
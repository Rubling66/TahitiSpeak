'use client';

import { jwtDecode } from 'jwt-decode';
import { createClient } from '@supabase/supabase-js';

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'instructor' | 'student';
  avatar?: string;
  preferences?: UserPreferences;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  isEmailVerified: boolean;
  isActive: boolean;
}

export interface UserPreferences {
  language: string;
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    lessons: boolean;
    progress: boolean;
  };
  learningGoals: {
    dailyMinutes: number;
    weeklyLessons: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role?: 'student' | 'instructor';
}

export interface ResetPasswordData {
  email: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface JWTPayload {
  sub: string; // user id
  email: string;
  role: string;
  name: string;
  iat: number;
  exp: number;
  jti: string; // token id
}

// Constants
const TOKEN_STORAGE_KEY = 'tahitian_tutor_tokens';
const USER_STORAGE_KEY = 'tahitian_tutor_user';
const REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry

class AuthService {
  private supabase: any;
  private listeners: Set<(state: AuthState) => void> = new Set();
  private refreshTimer: NodeJS.Timeout | null = null;
  private state: AuthState = {
    user: null,
    tokens: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeSupabase();
      this.initializeAuth();
    }
  }

  private initializeSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  private async initializeAuth() {
    try {
      // Load stored tokens and user
      const storedTokens = this.getStoredTokens();
      const storedUser = this.getStoredUser();

      if (storedTokens && storedUser) {
        // Validate tokens
        if (this.isTokenValid(storedTokens.accessToken)) {
          this.setState({
            user: storedUser,
            tokens: storedTokens,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });

          // Set up token refresh
          this.scheduleTokenRefresh(storedTokens.expiresAt);
          
          // Verify user session with backend
          await this.verifySession();
        } else if (storedTokens.refreshToken) {
          // Try to refresh tokens
          await this.refreshTokens();
        } else {
          // Invalid tokens, clear storage
          this.clearAuth();
        }
      } else {
        this.setState({
          ...this.state,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('[Auth] Initialization failed:', error);
      this.setState({
        ...this.state,
        isLoading: false,
        error: 'Failed to initialize authentication'
      });
    }
  }

  // Public API

  async login(credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> {
    try {
      this.setState({ ...this.state, isLoading: true, error: null });

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      const { user, tokens } = data;

      // Store tokens and user
      this.storeTokens(tokens);
      this.storeUser(user);

      this.setState({
        user,
        tokens,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });

      // Set up token refresh
      this.scheduleTokenRefresh(tokens.expiresAt);

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      this.setState({
        ...this.state,
        isLoading: false,
        error: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  }

  async register(data: RegisterData): Promise<{ success: boolean; error?: string }> {
    try {
      this.setState({ ...this.state, isLoading: true, error: null });

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }

      this.setState({
        ...this.state,
        isLoading: false,
        error: null
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      this.setState({
        ...this.state,
        isLoading: false,
        error: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  }

  async logout(): Promise<void> {
    try {
      // Call logout endpoint to invalidate tokens
      if (this.state.tokens) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.state.tokens.accessToken}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      console.error('[Auth] Logout API call failed:', error);
    } finally {
      this.clearAuth();
    }
  }

  async resetPassword(data: ResetPasswordData): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Password reset failed');
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
      return { success: false, error: errorMessage };
    }
  }

  async changePassword(data: ChangePasswordData): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.state.tokens) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.state.tokens.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Password change failed');
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password change failed';
      return { success: false, error: errorMessage };
    }
  }

  async updateProfile(updates: Partial<User>): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.state.tokens || !this.state.user) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.state.tokens.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Profile update failed');
      }

      const updatedUser = { ...this.state.user, ...result.user };
      this.storeUser(updatedUser);

      this.setState({
        ...this.state,
        user: updatedUser
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
      return { success: false, error: errorMessage };
    }
  }

  async refreshTokens(): Promise<boolean> {
    try {
      const storedTokens = this.getStoredTokens();
      if (!storedTokens?.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          refreshToken: storedTokens.refreshToken
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Token refresh failed');
      }

      const { tokens, user } = data;

      // Store new tokens
      this.storeTokens(tokens);
      if (user) {
        this.storeUser(user);
      }

      this.setState({
        ...this.state,
        tokens,
        user: user || this.state.user,
        isAuthenticated: true,
        error: null
      });

      // Schedule next refresh
      this.scheduleTokenRefresh(tokens.expiresAt);

      return true;
    } catch (error) {
      console.error('[Auth] Token refresh failed:', error);
      this.clearAuth();
      return false;
    }
  }

  // Utility methods

  getAuthHeader(): string | null {
    return this.state.tokens ? `Bearer ${this.state.tokens.accessToken}` : null;
  }

  hasRole(role: string): boolean {
    return this.state.user?.role === role;
  }

  hasAnyRole(roles: string[]): boolean {
    return this.state.user ? roles.includes(this.state.user.role) : false;
  }

  isTokenExpiringSoon(): boolean {
    if (!this.state.tokens) return false;
    return (this.state.tokens.expiresAt - Date.now()) < REFRESH_THRESHOLD;
  }

  getState(): AuthState {
    return { ...this.state };
  }

  // Event system
  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Private methods

  private setState(newState: AuthState): void {
    this.state = newState;
    this.listeners.forEach(listener => {
      try {
        listener(newState);
      } catch (error) {
        console.error('[Auth] Listener error:', error);
      }
    });
  }

  private clearAuth(): void {
    this.clearStorage();
    this.clearRefreshTimer();
    this.setState({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    });
  }

  private storeTokens(tokens: AuthTokens): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
    }
  }

  private storeUser(user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    }
  }

  private getStoredTokens(): AuthTokens | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private getStoredUser(): User | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private clearStorage(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }

  private isTokenValid(token: string): boolean {
    try {
      const decoded = jwtDecode<JWTPayload>(token);
      return decoded.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  private scheduleTokenRefresh(expiresAt: number): void {
    this.clearRefreshTimer();
    
    const refreshTime = expiresAt - Date.now() - REFRESH_THRESHOLD;
    if (refreshTime > 0) {
      this.refreshTimer = setTimeout(() => {
        this.refreshTokens();
      }, refreshTime);
    }
  }

  private clearRefreshTimer(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  private async verifySession(): Promise<void> {
    try {
      if (!this.state.tokens) return;

      const response = await fetch('/api/auth/verify', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.state.tokens.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Session verification failed');
      }

      const { user } = await response.json();
      if (user) {
        this.storeUser(user);
        this.setState({
          ...this.state,
          user
        });
      }
    } catch (error) {
      console.error('[Auth] Session verification failed:', error);
      // Don't clear auth here, let the user continue with cached data
    }
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService;
export { AuthService };
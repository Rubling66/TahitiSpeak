'use client';

import { useState, useEffect, useCallback } from 'react';
import authService, { AuthState, LoginCredentials, RegisterData, ResetPasswordData, ChangePasswordData, User } from '../services/AuthService';
import { logger } from '../services/LoggingService';
import { performanceMonitoring } from '../services/PerformanceMonitoringService';

export interface UseAuthReturn {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (data: ResetPasswordData) => Promise<{ success: boolean; error?: string }>;
  changePassword: (data: ChangePasswordData) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  refreshTokens: () => Promise<boolean>;
  clearError: () => void;
  
  // Utilities
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  getAuthHeader: () => string | null;
  isTokenExpiringSoon: () => boolean;
}

export function useAuth(): UseAuthReturn {
  const [authState, setAuthState] = useState<AuthState>(authService.getState());

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = authService.subscribe((newState: AuthState) => {
      setAuthState(newState);
      
      // Log authentication events
      if (newState.isAuthenticated && !authState.isAuthenticated) {
        logger.info('User logged in', {
          userId: newState.user?.id,
          userRole: newState.user?.role,
          timestamp: new Date().toISOString()
        });
        
        performanceMonitoring.recordMetric({
          name: 'auth_login_success',
          value: 1,
          unit: 'count',
          category: 'custom',
          metadata: {
            userRole: newState.user?.role || 'unknown'
          }
        });
      } else if (!newState.isAuthenticated && authState.isAuthenticated) {
        logger.info('User logged out', {
          timestamp: new Date().toISOString()
        });
        
        performanceMonitoring.recordMetric({
          name: 'auth_logout',
          value: 1,
          unit: 'count',
          category: 'custom'
        });
      }
      
      if (newState.error && newState.error !== authState.error) {
        logger.error('Authentication error', {
          error: newState.error,
          timestamp: new Date().toISOString()
        });
        
        performanceMonitoring.logError({
          message: newState.error,
          stack: '',
          level: 'error',
          metadata: {
            component: 'useAuth',
            action: 'state_change'
          }
        });
      }
    });

    return unsubscribe;
  }, [authState.isAuthenticated, authState.error]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const startTime = Date.now();
    
    try {
      logger.info('Login attempt started', {
        email: credentials.email,
        rememberMe: credentials.rememberMe,
        timestamp: new Date().toISOString()
      });
      
      const result = await authService.login(credentials);
      
      const duration = Date.now() - startTime;
      
      if (result.success) {
        performanceMonitoring.recordMetric({
          name: 'auth_login_duration',
          value: duration,
          unit: 'milliseconds',
          category: 'custom',
          metadata: {
            success: 'true'
          }
        });
        
        logger.info('Login successful', {
          email: credentials.email,
          duration,
          timestamp: new Date().toISOString()
        });
      } else {
        performanceMonitoring.recordMetric({
          name: 'auth_login_duration',
          value: duration,
          unit: 'milliseconds',
          category: 'custom',
          metadata: {
            success: 'false',
            error: result.error || 'unknown'
          }
        });
        
        logger.warn('Login failed', {
          email: credentials.email,
          error: result.error,
          duration,
          timestamp: new Date().toISOString()
        });
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      
      performanceMonitoring.logError({
          message: errorMessage,
        stack: error instanceof Error ? error.stack || '' : '',
        level: 'error',
        metadata: {
          component: 'useAuth',
          action: 'login',
          email: credentials.email,
          duration
        }
      });
      
      logger.error('Login error', {
        email: credentials.email,
        error: errorMessage,
        duration,
        timestamp: new Date().toISOString()
      });
      
      return { success: false, error: errorMessage };
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const startTime = Date.now();
    
    try {
      logger.info('Registration attempt started', {
        email: data.email,
        name: data.name,
        role: data.role,
        timestamp: new Date().toISOString()
      });
      
      const result = await authService.register(data);
      
      const duration = Date.now() - startTime;
      
      if (result.success) {
        performanceMonitoring.recordMetric({
          name: 'auth_register_duration',
          value: duration,
          unit: 'milliseconds',
          category: 'custom',
          metadata: {
            success: 'true',
            role: data.role || 'student'
          }
        });
        
        logger.info('Registration successful', {
          email: data.email,
          name: data.name,
          role: data.role,
          duration,
          timestamp: new Date().toISOString()
        });
      } else {
        performanceMonitoring.recordMetric({
          name: 'auth_register_duration',
          value: duration,
          unit: 'milliseconds',
          category: 'custom',
          metadata: {
            success: 'false',
            error: result.error || 'unknown'
          }
        });
        
        logger.warn('Registration failed', {
          email: data.email,
          error: result.error,
          duration,
          timestamp: new Date().toISOString()
        });
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      
      performanceMonitoring.logError({
          message: errorMessage,
        stack: error instanceof Error ? error.stack || '' : '',
        level: 'error',
        metadata: {
          component: 'useAuth',
          action: 'register',
          email: data.email,
          duration
        }
      });
      
      logger.error('Registration error', {
        email: data.email,
        error: errorMessage,
        duration,
        timestamp: new Date().toISOString()
      });
      
      return { success: false, error: errorMessage };
    }
  }, []);

  const logout = useCallback(async () => {
    const startTime = Date.now();
    
    try {
      logger.info('Logout started', {
        userId: authState.user?.id,
        timestamp: new Date().toISOString()
      });
      
      await authService.logout();
      
      const duration = Date.now() - startTime;
      
      performanceMonitoring.recordMetric({
        name: 'auth_logout_duration',
        value: duration,
        unit: 'ms',
        category: 'custom'
      });
      
      logger.info('Logout completed', {
        duration,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      
      performanceMonitoring.logError({
          message: errorMessage,
        stack: error instanceof Error ? error.stack || '' : '',
        level: 'error',
        metadata: {
          component: 'useAuth',
          action: 'logout',
          duration
        }
      });
      
      logger.error('Logout error', {
        error: errorMessage,
        duration,
        timestamp: new Date().toISOString()
      });
    }
  }, [authState.user?.id]);

  const resetPassword = useCallback(async (data: ResetPasswordData) => {
    const startTime = Date.now();
    
    try {
      logger.info('Password reset attempt started', {
        email: data.email,
        timestamp: new Date().toISOString()
      });
      
      const result = await authService.resetPassword(data);
      
      const duration = Date.now() - startTime;
      
      performanceMonitoring.recordMetric({
        name: 'auth_reset_password_duration',
        value: duration,
        unit: 'ms',
        category: 'custom',
        metadata: {
            success: result.success.toString()
          }
      });
      
      if (result.success) {
        logger.info('Password reset successful', {
          email: data.email,
          duration,
          timestamp: new Date().toISOString()
        });
      } else {
        logger.warn('Password reset failed', {
          email: data.email,
          error: result.error,
          duration,
          timestamp: new Date().toISOString()
        });
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
      
      performanceMonitoring.logError({
          message: errorMessage,
        stack: error instanceof Error ? error.stack || '' : '',
        level: 'error',
        metadata: {
          component: 'useAuth',
          action: 'resetPassword',
          email: data.email,
          duration
        }
      });
      
      return { success: false, error: errorMessage };
    }
  }, []);

  const changePassword = useCallback(async (data: ChangePasswordData) => {
    const startTime = Date.now();
    
    try {
      logger.info('Password change attempt started', {
        userId: authState.user?.id,
        timestamp: new Date().toISOString()
      });
      
      const result = await authService.changePassword(data);
      
      const duration = Date.now() - startTime;
      
      performanceMonitoring.recordMetric({
        name: 'auth_change_password_duration',
        value: duration,
        unit: 'milliseconds',
        category: 'custom',
        metadata: {
          success: result.success.toString()
        }
      });
      
      if (result.success) {
        logger.info('Password change successful', {
          userId: authState.user?.id,
          duration,
          timestamp: new Date().toISOString()
        });
      } else {
        logger.warn('Password change failed', {
          userId: authState.user?.id,
          error: result.error,
          duration,
          timestamp: new Date().toISOString()
        });
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Password change failed';
      
      performanceMonitoring.logError({
          message: errorMessage,
        stack: error instanceof Error ? error.stack || '' : '',
        level: 'error',
        metadata: {
          component: 'useAuth',
          action: 'changePassword',
          userId: authState.user?.id,
          duration
        }
      });
      
      return { success: false, error: errorMessage };
    }
  }, [authState.user?.id]);

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    const startTime = Date.now();
    
    try {
      logger.info('Profile update attempt started', {
        userId: authState.user?.id,
        updates: Object.keys(updates),
        timestamp: new Date().toISOString()
      });
      
      const result = await authService.updateProfile(updates);
      
      const duration = Date.now() - startTime;
      
      performanceMonitoring.recordMetric({
        name: 'auth_update_profile_duration',
        value: duration,
        unit: 'milliseconds',
        category: 'custom',
        metadata: {
          success: result.success.toString()
        }
      });
      
      if (result.success) {
        logger.info('Profile update successful', {
          userId: authState.user?.id,
          updates: Object.keys(updates),
          duration,
          timestamp: new Date().toISOString()
        });
      } else {
        logger.warn('Profile update failed', {
          userId: authState.user?.id,
          error: result.error,
          duration,
          timestamp: new Date().toISOString()
        });
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
      
      performanceMonitoring.logError({
          message: errorMessage,
        stack: error instanceof Error ? error.stack || '' : '',
        level: 'error',
        metadata: {
          component: 'useAuth',
          action: 'updateProfile',
          userId: authState.user?.id,
          duration
        }
      });
      
      return { success: false, error: errorMessage };
    }
  }, [authState.user?.id]);

  const refreshTokens = useCallback(async () => {
    const startTime = Date.now();
    
    try {
      logger.info('Token refresh attempt started', {
        userId: authState.user?.id,
        timestamp: new Date().toISOString()
      });
      
      const success = await authService.refreshTokens();
      
      const duration = Date.now() - startTime;
      
      performanceMonitoring.recordMetric({
        name: 'auth_refresh_tokens_duration',
        value: duration,
        unit: 'milliseconds',
        category: 'custom',
        metadata: {
          success: success.toString()
        }
      });
      
      if (success) {
        logger.info('Token refresh successful', {
          userId: authState.user?.id,
          duration,
          timestamp: new Date().toISOString()
        });
      } else {
        logger.warn('Token refresh failed', {
          userId: authState.user?.id,
          duration,
          timestamp: new Date().toISOString()
        });
      }
      
      return success;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Token refresh failed';
      
      performanceMonitoring.logError({
          message: errorMessage,
        stack: error instanceof Error ? error.stack || '' : '',
        level: 'error',
        metadata: {
          component: 'useAuth',
          action: 'refreshTokens',
          userId: authState.user?.id,
          duration
        }
      });
      
      return false;
    }
  }, [authState.user?.id]);

  const clearError = useCallback(() => {
    // This would need to be implemented in AuthService
    // For now, we'll just log it
    logger.info('Auth error cleared', {
      timestamp: new Date().toISOString()
    });
  }, []);

  const hasRole = useCallback((role: string) => {
    return authService.hasRole(role);
  }, []);

  const hasAnyRole = useCallback((roles: string[]) => {
    return authService.hasAnyRole(roles);
  }, []);

  const getAuthHeader = useCallback(() => {
    return authService.getAuthHeader();
  }, []);

  const isTokenExpiringSoon = useCallback(() => {
    return authService.isTokenExpiringSoon();
  }, []);

  return {
    // State
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    error: authState.error,
    
    // Actions
    login,
    register,
    logout,
    resetPassword,
    changePassword,
    updateProfile,
    refreshTokens,
    clearError,
    
    // Utilities
    hasRole,
    hasAnyRole,
    getAuthHeader,
    isTokenExpiringSoon
  };
}

export default useAuth;
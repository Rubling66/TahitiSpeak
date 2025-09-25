import React from 'react';
import { renderHook } from '@testing-library/react';
import { useAuth } from '../useAuth';

// Mock dependencies
jest.mock('../../services/LoggingService', () => ({
  LoggingService: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    log: jest.fn(),
  },
}));

jest.mock('../../services/PerformanceMonitoringService', () => ({
  PerformanceMonitoringService: {
    recordMetric: jest.fn(),
    recordError: jest.fn(),
    startTimer: jest.fn(() => ({ stop: jest.fn() })),
  },
}));

// Mock AuthService with factory function
jest.mock('../../services/AuthService', () => {
  const mockAuthService = {
    getState: jest.fn(() => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    })),
    subscribe: jest.fn(() => jest.fn()), // Returns unsubscribe function
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    refreshToken: jest.fn(),
    resetPassword: jest.fn(),
    changePassword: jest.fn(),
    getAuthHeader: jest.fn(),
    isTokenExpiringSoon: jest.fn(),
  };

  return {
    __esModule: true,
    default: mockAuthService,
  };
});

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const AuthService = require('../../services/AuthService').default;
    AuthService.getState.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  it('should render without errors', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current).toBeDefined();
  });

  it('should have initial state', () => {
    const { result } = renderHook(() => useAuth());
    
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should call AuthService.getState on initialization', () => {
    const AuthService = require('../../services/AuthService').default;
    renderHook(() => useAuth());
    expect(AuthService.getState).toHaveBeenCalled();
  });

  it('should call AuthService.subscribe on initialization', () => {
    const AuthService = require('../../services/AuthService').default;
    renderHook(() => useAuth());
    expect(AuthService.subscribe).toHaveBeenCalled();
  });

  it('should provide login function', () => {
    const { result } = renderHook(() => useAuth());
    expect(typeof result.current.login).toBe('function');
  });

  it('should provide register function', () => {
    const { result } = renderHook(() => useAuth());
    expect(typeof result.current.register).toBe('function');
  });

  it('should provide logout function', () => {
    const { result } = renderHook(() => useAuth());
    expect(typeof result.current.logout).toBe('function');
  });
});
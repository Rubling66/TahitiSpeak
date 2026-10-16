import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../useAuth';

// Real behavior suite for src/hooks/useAuth.ts (rewritten 2026-10-16).
// The previous suite mocked non-existent exports (LoggingService / PerformanceMonitoringService objects);
// the hook actually imports `logger` and `performanceMonitoring`, so those are mocked here.

jest.mock('../../services/LoggingService', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

jest.mock('../../services/PerformanceMonitoringService', () => ({
  performanceMonitoring: { recordMetric: jest.fn(), recordError: jest.fn() },
}));

jest.mock('../../services/AuthService', () => {
  const svc = {
    getState: jest.fn(),
    subscribe: jest.fn(),
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    resetPassword: jest.fn(),
    changePassword: jest.fn(),
    updateProfile: jest.fn(),
    refreshTokens: jest.fn(),
    hasRole: jest.fn(),
    hasAnyRole: jest.fn(),
    getAuthHeader: jest.fn(),
    isTokenExpiringSoon: jest.fn(),
  };
  return { __esModule: true, default: svc };
});

const authService = require('../../services/AuthService').default;
const { logger } = require('../../services/LoggingService');
const { performanceMonitoring } = require('../../services/PerformanceMonitoringService');

const loggedOut = { user: null, isAuthenticated: false, isLoading: false, error: null, tokens: null };
const user = { id: 'u1', email: 'a@b.co', name: 'A', role: 'student' };
const loggedIn = { ...loggedOut, user, isAuthenticated: true };

let listener: ((s: any) => void) | null = null;
const unsubscribe = jest.fn();

beforeEach(() => {
  listener = null;
  authService.getState.mockReturnValue(loggedOut);
  authService.subscribe.mockImplementation((cb: any) => {
    listener = cb;
    return unsubscribe;
  });
});

const metricNames = () => performanceMonitoring.recordMetric.mock.calls.map((c: any[]) => c[0].name);
const errorNames = () => performanceMonitoring.recordError.mock.calls.map((c: any[]) => c[0].name);

describe('useAuth state + subscription', () => {
  it('exposes the initial service state', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(authService.subscribe).toHaveBeenCalled();
  });

  it('logs login, logout and error transitions pushed by the service', () => {
    const { result } = renderHook(() => useAuth());
    act(() => listener!(loggedIn));
    expect(result.current.user).toEqual(user);
    expect(result.current.isAuthenticated).toBe(true);
    expect(logger.info).toHaveBeenCalledWith('User logged in', expect.objectContaining({ userId: 'u1', userRole: 'student' }));
    expect(metricNames()).toContain('auth_login_success');

    act(() => listener!(loggedOut));
    expect(result.current.isAuthenticated).toBe(false);
    expect(logger.info).toHaveBeenCalledWith('User logged out', expect.any(Object));
    expect(metricNames()).toContain('auth_logout');

    act(() => listener!({ ...loggedOut, error: 'bad token' }));
    expect(result.current.error).toBe('bad token');
    expect(logger.error).toHaveBeenCalledWith('Authentication error', expect.objectContaining({ error: 'bad token' }));
    expect(errorNames()).toContain('AuthenticationError');
  });

  it('tags an unknown role when the logged-in user has none', () => {
    renderHook(() => useAuth());
    act(() => listener!({ ...loggedIn, user: { ...user, role: undefined } }));
    const call = performanceMonitoring.recordMetric.mock.calls.find((c: any[]) => c[0].name === 'auth_login_success');
    expect(call[0].tags.userRole).toBe('unknown');
  });

  it('unsubscribes on unmount', () => {
    const { unmount } = renderHook(() => useAuth());
    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });
});

type Case = {
  name: string;
  call: (r: any) => Promise<any>;
  svc: string;
  okMetric: string;
  errName: string;
  fallback: string;
};

const creds = { email: 'a@b.co', password: 'pw', rememberMe: true };
const reg = { email: 'a@b.co', password: 'pw', name: 'A', role: 'teacher' };

const cases: Case[] = [
  { name: 'login', call: r => r.login(creds), svc: 'login', okMetric: 'auth_login_duration', errName: 'LoginError', fallback: 'Login failed' },
  { name: 'register', call: r => r.register(reg), svc: 'register', okMetric: 'auth_register_duration', errName: 'RegistrationError', fallback: 'Registration failed' },
  { name: 'resetPassword', call: r => r.resetPassword({ email: 'a@b.co' }), svc: 'resetPassword', okMetric: 'auth_reset_password_duration', errName: 'PasswordResetError', fallback: 'Password reset failed' },
  { name: 'changePassword', call: r => r.changePassword({ currentPassword: 'a', newPassword: 'b' }), svc: 'changePassword', okMetric: 'auth_change_password_duration', errName: 'PasswordChangeError', fallback: 'Password change failed' },
  { name: 'updateProfile', call: r => r.updateProfile({ name: 'B' }), svc: 'updateProfile', okMetric: 'auth_update_profile_duration', errName: 'ProfileUpdateError', fallback: 'Profile update failed' },
];

describe.each(cases)('useAuth.$name', ({ call, svc, okMetric, errName, fallback }) => {
  it('returns the service result and records a success metric', async () => {
    authService[svc].mockResolvedValue({ success: true });
    const { result } = renderHook(() => useAuth());
    let out: any;
    await act(async () => { out = await call(result.current); });
    expect(out).toEqual({ success: true });
    const m = performanceMonitoring.recordMetric.mock.calls.find((c: any[]) => c[0].name === okMetric);
    expect(m[0].tags.success).toBe('true');
  });

  it('passes through a failed result and records a failure metric', async () => {
    authService[svc].mockResolvedValue({ success: false, error: 'nope' });
    const { result } = renderHook(() => useAuth());
    let out: any;
    await act(async () => { out = await call(result.current); });
    expect(out).toEqual({ success: false, error: 'nope' });
    expect(logger.warn).toHaveBeenCalled();
    const m = performanceMonitoring.recordMetric.mock.calls.find((c: any[]) => c[0].name === okMetric);
    expect(m[0].tags.success).toBe('false');
  });

  it('catches a thrown Error and reports it', async () => {
    authService[svc].mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useAuth());
    let out: any;
    await act(async () => { out = await call(result.current); });
    expect(out).toEqual({ success: false, error: 'boom' });
    expect(errorNames()).toContain(errName);
  });

  it('uses the fallback message for a non-Error throw', async () => {
    authService[svc].mockRejectedValue('weird');
    const { result } = renderHook(() => useAuth());
    let out: any;
    await act(async () => { out = await call(result.current); });
    expect(out).toEqual({ success: false, error: fallback });
  });
});

describe('useAuth.login / register failure without an error string', () => {
  it('tags error as unknown', async () => {
    authService.login.mockResolvedValue({ success: false });
    authService.register.mockResolvedValue({ success: false });
    const { result } = renderHook(() => useAuth());
    await act(async () => { await result.current.login(creds); await result.current.register({ ...reg, role: undefined }); });
    const tags = performanceMonitoring.recordMetric.mock.calls.map((c: any[]) => c[0].tags?.error);
    expect(tags.filter((t: any) => t === 'unknown')).toHaveLength(2);
  });

  it('tags a registration with no role as student', async () => {
    authService.register.mockResolvedValue({ success: true });
    const { result } = renderHook(() => useAuth());
    await act(async () => { await result.current.register({ ...reg, role: undefined }); });
    const m = performanceMonitoring.recordMetric.mock.calls.find((c: any[]) => c[0].name === 'auth_register_duration');
    expect(m[0].tags.role).toBe('student');
  });
});

describe('useAuth.logout', () => {
  it('logs out and records a duration metric', async () => {
    authService.logout.mockResolvedValue(undefined);
    const { result } = renderHook(() => useAuth());
    await act(async () => { await result.current.logout(); });
    expect(authService.logout).toHaveBeenCalled();
    expect(metricNames()).toContain('auth_logout_duration');
    expect(logger.info).toHaveBeenCalledWith('Logout completed', expect.any(Object));
  });

  it('swallows and reports a logout error', async () => {
    authService.logout.mockRejectedValue(new Error('net'));
    const { result } = renderHook(() => useAuth());
    await act(async () => { await expect(result.current.logout()).resolves.toBeUndefined(); });
    expect(errorNames()).toContain('LogoutError');
    expect(logger.error).toHaveBeenCalledWith('Logout error', expect.objectContaining({ error: 'net' }));
  });

  it('uses the fallback message for a non-Error logout throw', async () => {
    authService.logout.mockRejectedValue(42);
    const { result } = renderHook(() => useAuth());
    await act(async () => { await result.current.logout(); });
    expect(logger.error).toHaveBeenCalledWith('Logout error', expect.objectContaining({ error: 'Logout failed' }));
  });
});

describe('useAuth.refreshTokens', () => {
  it('returns true and logs success', async () => {
    authService.refreshTokens.mockResolvedValue(true);
    const { result } = renderHook(() => useAuth());
    let ok: any;
    await act(async () => { ok = await result.current.refreshTokens(); });
    expect(ok).toBe(true);
    expect(logger.info).toHaveBeenCalledWith('Token refresh successful', expect.any(Object));
  });

  it('returns false and warns on failure', async () => {
    authService.refreshTokens.mockResolvedValue(false);
    const { result } = renderHook(() => useAuth());
    let ok: any;
    await act(async () => { ok = await result.current.refreshTokens(); });
    expect(ok).toBe(false);
    expect(logger.warn).toHaveBeenCalledWith('Token refresh failed', expect.any(Object));
  });

  it('returns false and reports when the service throws', async () => {
    authService.refreshTokens.mockRejectedValue(new Error('expired'));
    const { result } = renderHook(() => useAuth());
    let ok: any;
    await act(async () => { ok = await result.current.refreshTokens(); });
    expect(ok).toBe(false);
    expect(errorNames()).toContain('TokenRefreshError');
  });

  it('handles a non-Error throw', async () => {
    authService.refreshTokens.mockRejectedValue(null);
    const { result } = renderHook(() => useAuth());
    let ok: any;
    await act(async () => { ok = await result.current.refreshTokens(); });
    expect(ok).toBe(false);
    const e = performanceMonitoring.recordError.mock.calls.find((c: any[]) => c[0].name === 'TokenRefreshError');
    expect(e[0].message).toBe('Token refresh failed');
  });
});

describe('useAuth utilities delegate to the service', () => {
  it('hasRole / hasAnyRole / getAuthHeader / isTokenExpiringSoon / clearError', () => {
    authService.hasRole.mockReturnValue(true);
    authService.hasAnyRole.mockReturnValue(false);
    authService.getAuthHeader.mockReturnValue('Bearer t');
    authService.isTokenExpiringSoon.mockReturnValue(true);
    const { result } = renderHook(() => useAuth());
    expect(result.current.hasRole('admin')).toBe(true);
    expect(authService.hasRole).toHaveBeenCalledWith('admin');
    expect(result.current.hasAnyRole(['a', 'b'])).toBe(false);
    expect(authService.hasAnyRole).toHaveBeenCalledWith(['a', 'b']);
    expect(result.current.getAuthHeader()).toBe('Bearer t');
    expect(result.current.isTokenExpiringSoon()).toBe(true);
    result.current.clearError();
    expect(logger.info).toHaveBeenCalledWith('Auth error cleared', expect.any(Object));
  });
});

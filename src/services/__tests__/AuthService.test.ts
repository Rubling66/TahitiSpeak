/**
 * Real AuthService suite (2026-10-16). Exercises the class directly with fresh
 * instances per test. Only the network (fetch), jwt-decode and the Supabase
 * client factory are mocked; localStorage is the real jsdom store.
 */
import defaultAuthService, { AuthService } from '../AuthService';
import { jwtDecode } from 'jwt-decode';
import { createClient } from '@supabase/supabase-js';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({ auth: {} })),
}));

jest.mock('jwt-decode', () => ({
  jwtDecode: jest.fn(),
}));

const TOKEN_KEY = 'tahitian_tutor_tokens';
const USER_KEY = 'tahitian_tutor_user';

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;
const mockJwtDecode = jwtDecode as jest.Mock;
const mockCreateClient = createClient as jest.Mock;

const user = {
  id: 'u1',
  email: 'student@example.com',
  name: 'Student One',
  role: 'student',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  isEmailVerified: true,
  isActive: true,
};

const makeTokens = (msFromNow: number) => ({
  accessToken: 'access-1',
  refreshToken: 'refresh-1',
  expiresAt: Date.now() + msFromNow,
});

const respond = (ok: boolean, body: unknown) =>
  Promise.resolve({ ok, json: () => Promise.resolve(body) });

const flush = async () => {
  for (let i = 0; i < 10; i++) {
    await Promise.resolve();
  }
};

const fresh = async () => {
  const svc = new AuthService();
  await flush();
  return svc;
};

const loggedIn = async (msFromNow = 60 * 60 * 1000) => {
  const svc = await fresh();
  const tokens = makeTokens(msFromNow);
  mockFetch.mockImplementationOnce(() => respond(true, { user, tokens }));
  await svc.login({ email: user.email, password: 'pw' });
  return { svc, tokens };
};

let errorSpy: jest.SpyInstance;

beforeEach(() => {
  jest.useFakeTimers();
  mockFetch.mockReset();
  mockJwtDecode.mockReset();
  mockCreateClient.mockClear();
  // jest.setup.js replaces localStorage with bare jest.fn() stubs; back them with
  // a real in-memory store for this suite so persistence is actually exercised.
  const store = new Map<string, string>();
  (localStorage.getItem as jest.Mock).mockImplementation((k: string) => (store.has(k) ? store.get(k) : null));
  (localStorage.setItem as jest.Mock).mockImplementation((k: string, v: string) => {
    store.set(k, String(v));
  });
  (localStorage.removeItem as jest.Mock).mockImplementation((k: string) => {
    store.delete(k);
  });
  (localStorage.clear as jest.Mock).mockImplementation(() => store.clear());
  errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
  errorSpy.mockRestore();
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
});

describe('AuthService singleton', () => {
  it('exports a default instance with the public API', () => {
    expect(defaultAuthService).toBeInstanceOf(AuthService);
    const state = defaultAuthService.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(defaultAuthService.getAuthHeader()).toBeNull();
    expect(defaultAuthService.isTokenExpiringSoon()).toBe(false);
  });
});

describe('initialization', () => {
  it('finishes loading unauthenticated when nothing is stored', async () => {
    const svc = await fresh();
    expect(svc.getState()).toEqual({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('creates a Supabase client only when both env vars are set', async () => {
    await fresh();
    expect(mockCreateClient).not.toHaveBeenCalled();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon';
    await fresh();
    expect(mockCreateClient).toHaveBeenCalledWith('https://example.supabase.co', 'anon');
  });

  it('restores a valid stored session and refreshes the user from /verify', async () => {
    const tokens = makeTokens(60 * 60 * 1000);
    localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    mockJwtDecode.mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 });
    const verified = { ...user, name: 'Verified Name' };
    mockFetch.mockImplementationOnce(() => respond(true, { user: verified }));

    const svc = await fresh();

    expect(mockFetch).toHaveBeenCalledWith('/api/auth/verify', {
      method: 'GET',
      headers: { Authorization: 'Bearer access-1' },
    });
    const state = svc.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.isLoading).toBe(false);
    expect(state.user?.name).toBe('Verified Name');
    expect(JSON.parse(localStorage.getItem(USER_KEY) as string).name).toBe('Verified Name');
  });

  it('keeps cached user when /verify returns no user', async () => {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(makeTokens(60 * 60 * 1000)));
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    mockJwtDecode.mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 });
    mockFetch.mockImplementationOnce(() => respond(true, {}));

    const svc = await fresh();
    expect(svc.getState().user?.name).toBe('Student One');
  });

  it('stays signed in with cached data when /verify fails', async () => {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(makeTokens(60 * 60 * 1000)));
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    mockJwtDecode.mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 });
    mockFetch.mockImplementationOnce(() => respond(false, {}));

    const svc = await fresh();
    expect(svc.getState().isAuthenticated).toBe(true);
    expect(svc.getState().user?.name).toBe('Student One');
    expect(errorSpy).toHaveBeenCalledWith('[Auth] Session verification failed:', expect.any(Error));
  });

  it('refreshes an expired stored token using the refresh token', async () => {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(makeTokens(-1000)));
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    mockJwtDecode.mockReturnValue({ exp: Math.floor(Date.now() / 1000) - 10 });
    const newTokens = { ...makeTokens(60 * 60 * 1000), accessToken: 'access-2' };
    mockFetch.mockImplementationOnce(() => respond(true, { tokens: newTokens }));

    const svc = await fresh();

    expect(mockFetch).toHaveBeenCalledWith('/api/auth/refresh', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ refreshToken: 'refresh-1' }),
    }));
    expect(svc.getState().isAuthenticated).toBe(true);
    expect(svc.getAuthHeader()).toBe('Bearer access-2');
    expect(JSON.parse(localStorage.getItem(TOKEN_KEY) as string).accessToken).toBe('access-2');
  });

  it('clears storage when the stored token is undecodable and has no refresh token', async () => {
    localStorage.setItem(TOKEN_KEY, JSON.stringify({ accessToken: 'garbage', expiresAt: 0 }));
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    mockJwtDecode.mockImplementation(() => {
      throw new Error('bad token');
    });

    const svc = await fresh();

    expect(mockFetch).not.toHaveBeenCalled();
    expect(svc.getState().isAuthenticated).toBe(false);
    expect(svc.getState().isLoading).toBe(false);
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(USER_KEY)).toBeNull();
  });

  it('treats corrupt stored JSON as signed out', async () => {
    localStorage.setItem(TOKEN_KEY, '{not json');
    localStorage.setItem(USER_KEY, '{not json');
    const svc = await fresh();
    expect(svc.getState().isAuthenticated).toBe(false);
    expect(svc.getState().isLoading).toBe(false);
  });
});

describe('login', () => {
  it('stores tokens and user, authenticates, and schedules a refresh', async () => {
    const { svc, tokens } = await loggedIn(10 * 60 * 1000);

    expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, password: 'pw' }),
    });
    expect(svc.getState()).toMatchObject({ user, tokens, isAuthenticated: true, isLoading: false, error: null });
    expect(JSON.parse(localStorage.getItem(TOKEN_KEY) as string)).toEqual(tokens);
    expect(JSON.parse(localStorage.getItem(USER_KEY) as string)).toEqual(user);

    const refreshed = { ...makeTokens(60 * 60 * 1000), accessToken: 'access-3' };
    mockFetch.mockImplementationOnce(() => respond(true, { tokens: refreshed, user }));
    jest.advanceTimersByTime(5 * 60 * 1000 + 10);
    await flush();
    expect(mockFetch).toHaveBeenLastCalledWith('/api/auth/refresh', expect.anything());
    expect(svc.getAuthHeader()).toBe('Bearer access-3');
  });

  it('returns the server error message on failure', async () => {
    const svc = await fresh();
    mockFetch.mockImplementationOnce(() => respond(false, { error: 'Invalid credentials' }));
    await expect(svc.login({ email: 'x', password: 'y' })).resolves.toEqual({
      success: false,
      error: 'Invalid credentials',
    });
    expect(svc.getState()).toMatchObject({ isAuthenticated: false, isLoading: false, error: 'Invalid credentials' });
  });

  it('falls back to a default message when the server gives none', async () => {
    const svc = await fresh();
    mockFetch.mockImplementationOnce(() => respond(false, {}));
    await expect(svc.login({ email: 'x', password: 'y' })).resolves.toEqual({ success: false, error: 'Login failed' });
  });

  it('handles a non-Error rejection', async () => {
    const svc = await fresh();
    mockFetch.mockImplementationOnce(() => Promise.reject('offline'));
    await expect(svc.login({ email: 'x', password: 'y' })).resolves.toEqual({ success: false, error: 'Login failed' });
  });
});

describe('register', () => {
  it('succeeds without authenticating', async () => {
    const svc = await fresh();
    mockFetch.mockImplementationOnce(() => respond(true, { ok: true }));
    await expect(svc.register({ email: 'n@example.com', password: 'pw', name: 'New' })).resolves.toEqual({ success: true });
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/register', expect.objectContaining({ method: 'POST' }));
    expect(svc.getState()).toMatchObject({ isAuthenticated: false, isLoading: false, error: null });
  });

  it('reports server, default and non-Error failures', async () => {
    const svc = await fresh();
    mockFetch.mockImplementationOnce(() => respond(false, { error: 'Email taken' }));
    await expect(svc.register({ email: 'a', password: 'b', name: 'c' })).resolves.toEqual({ success: false, error: 'Email taken' });
    expect(svc.getState().error).toBe('Email taken');

    mockFetch.mockImplementationOnce(() => respond(false, {}));
    await expect(svc.register({ email: 'a', password: 'b', name: 'c' })).resolves.toEqual({ success: false, error: 'Registration failed' });

    mockFetch.mockImplementationOnce(() => Promise.reject(42));
    await expect(svc.register({ email: 'a', password: 'b', name: 'c' })).resolves.toEqual({ success: false, error: 'Registration failed' });
  });
});

describe('logout', () => {
  it('calls the logout endpoint with the bearer token and clears everything', async () => {
    const { svc } = await loggedIn();
    mockFetch.mockImplementationOnce(() => respond(true, {}));
    await svc.logout();
    expect(mockFetch).toHaveBeenLastCalledWith('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: 'Bearer access-1', 'Content-Type': 'application/json' },
    });
    expect(svc.getState()).toEqual({ user: null, tokens: null, isAuthenticated: false, isLoading: false, error: null });
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(jest.getTimerCount()).toBe(0);
  });

  it('still clears local auth when the endpoint call fails', async () => {
    const { svc } = await loggedIn();
    mockFetch.mockImplementationOnce(() => Promise.reject(new Error('network')));
    await svc.logout();
    expect(errorSpy).toHaveBeenCalledWith('[Auth] Logout API call failed:', expect.any(Error));
    expect(svc.getState().isAuthenticated).toBe(false);
  });

  it('skips the network when not signed in', async () => {
    const svc = await fresh();
    await svc.logout();
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe('resetPassword', () => {
  it('succeeds and reports server, default and non-Error failures', async () => {
    const svc = await fresh();
    mockFetch.mockImplementationOnce(() => respond(true, {}));
    await expect(svc.resetPassword({ email: 'a@example.com' })).resolves.toEqual({ success: true });
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/reset-password', expect.objectContaining({
      body: JSON.stringify({ email: 'a@example.com' }),
    }));

    mockFetch.mockImplementationOnce(() => respond(false, { error: 'Unknown email' }));
    await expect(svc.resetPassword({ email: 'z' })).resolves.toEqual({ success: false, error: 'Unknown email' });

    mockFetch.mockImplementationOnce(() => respond(false, {}));
    await expect(svc.resetPassword({ email: 'z' })).resolves.toEqual({ success: false, error: 'Password reset failed' });

    mockFetch.mockImplementationOnce(() => Promise.reject(null));
    await expect(svc.resetPassword({ email: 'z' })).resolves.toEqual({ success: false, error: 'Password reset failed' });
  });
});

describe('changePassword', () => {
  const data = { currentPassword: 'old', newPassword: 'new' };

  it('requires authentication', async () => {
    const svc = await fresh();
    await expect(svc.changePassword(data)).resolves.toEqual({ success: false, error: 'Not authenticated' });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('sends the bearer token and handles success and failures', async () => {
    const { svc } = await loggedIn();
    mockFetch.mockImplementationOnce(() => respond(true, {}));
    await expect(svc.changePassword(data)).resolves.toEqual({ success: true });
    expect(mockFetch).toHaveBeenLastCalledWith('/api/auth/change-password', expect.objectContaining({
      headers: { Authorization: 'Bearer access-1', 'Content-Type': 'application/json' },
    }));

    mockFetch.mockImplementationOnce(() => respond(false, { error: 'Wrong password' }));
    await expect(svc.changePassword(data)).resolves.toEqual({ success: false, error: 'Wrong password' });

    mockFetch.mockImplementationOnce(() => respond(false, {}));
    await expect(svc.changePassword(data)).resolves.toEqual({ success: false, error: 'Password change failed' });

    mockFetch.mockImplementationOnce(() => Promise.reject('x'));
    await expect(svc.changePassword(data)).resolves.toEqual({ success: false, error: 'Password change failed' });
  });
});

describe('updateProfile', () => {
  it('requires authentication', async () => {
    const svc = await fresh();
    await expect(svc.updateProfile({ name: 'X' })).resolves.toEqual({ success: false, error: 'Not authenticated' });
  });

  it('merges the returned user into state and storage', async () => {
    const { svc } = await loggedIn();
    mockFetch.mockImplementationOnce(() => respond(true, { user: { name: 'Renamed', bio: 'Hi' } }));
    await expect(svc.updateProfile({ name: 'Renamed' })).resolves.toEqual({ success: true });
    expect(mockFetch).toHaveBeenLastCalledWith('/api/auth/profile', expect.objectContaining({ method: 'PATCH' }));
    expect(svc.getState().user).toMatchObject({ id: 'u1', name: 'Renamed', bio: 'Hi' });
    expect(JSON.parse(localStorage.getItem(USER_KEY) as string).name).toBe('Renamed');
  });

  it('reports server, default and non-Error failures', async () => {
    const { svc } = await loggedIn();
    mockFetch.mockImplementationOnce(() => respond(false, { error: 'Too long' }));
    await expect(svc.updateProfile({ name: 'X' })).resolves.toEqual({ success: false, error: 'Too long' });

    mockFetch.mockImplementationOnce(() => respond(false, {}));
    await expect(svc.updateProfile({ name: 'X' })).resolves.toEqual({ success: false, error: 'Profile update failed' });

    mockFetch.mockImplementationOnce(() => Promise.reject(undefined));
    await expect(svc.updateProfile({ name: 'X' })).resolves.toEqual({ success: false, error: 'Profile update failed' });
    expect(svc.getState().user?.name).toBe('Student One');
  });
});

describe('refreshTokens', () => {
  it('returns false when no refresh token is stored', async () => {
    const svc = await fresh();
    await expect(svc.refreshTokens()).resolves.toBe(false);
    expect(errorSpy).toHaveBeenCalledWith('[Auth] Token refresh failed:', expect.any(Error));
  });

  it('keeps the existing user when the response has none', async () => {
    const { svc } = await loggedIn();
    const next = { ...makeTokens(60 * 60 * 1000), accessToken: 'access-9' };
    mockFetch.mockImplementationOnce(() => respond(true, { tokens: next }));
    await expect(svc.refreshTokens()).resolves.toBe(true);
    expect(svc.getState().user).toEqual(user);
    expect(svc.getAuthHeader()).toBe('Bearer access-9');
  });

  it('clears auth when the server rejects the refresh', async () => {
    const { svc } = await loggedIn();
    mockFetch.mockImplementationOnce(() => respond(false, { error: 'expired' }));
    await expect(svc.refreshTokens()).resolves.toBe(false);
    expect(svc.getState().isAuthenticated).toBe(false);
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it('clears auth on a refresh failure with no server message', async () => {
    const { svc } = await loggedIn();
    mockFetch.mockImplementationOnce(() => respond(false, {}));
    await expect(svc.refreshTokens()).resolves.toBe(false);
    expect(errorSpy).toHaveBeenCalledWith('[Auth] Token refresh failed:', new Error('Token refresh failed'));
  });
});

describe('utilities and subscriptions', () => {
  it('answers role, header and expiry questions for a signed-in user', async () => {
    const { svc } = await loggedIn(60 * 60 * 1000);
    expect(svc.getAuthHeader()).toBe('Bearer access-1');
    expect(svc.hasRole('student')).toBe(true);
    expect(svc.hasRole('admin')).toBe(false);
    expect(svc.hasAnyRole(['admin', 'student'])).toBe(true);
    expect(svc.hasAnyRole(['admin'])).toBe(false);
    expect(svc.isTokenExpiringSoon()).toBe(false);
  });

  it('flags tokens inside the 5-minute refresh window', async () => {
    const { svc } = await loggedIn(2 * 60 * 1000);
    expect(svc.isTokenExpiringSoon()).toBe(true);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('returns false for role checks with no user', async () => {
    const svc = await fresh();
    expect(svc.hasRole('student')).toBe(false);
    expect(svc.hasAnyRole(['student'])).toBe(false);
  });

  it('returns a copy of state', async () => {
    const svc = await fresh();
    const a = svc.getState();
    a.isAuthenticated = true;
    expect(svc.getState().isAuthenticated).toBe(false);
  });

  it('notifies subscribers, isolates throwing listeners, and unsubscribes', async () => {
    const svc = await fresh();
    const listener = jest.fn();
    const bad = jest.fn(() => {
      throw new Error('listener boom');
    });
    const unsubscribe = svc.subscribe(listener);
    svc.subscribe(bad);

    mockFetch.mockImplementationOnce(() => respond(false, { error: 'nope' }));
    await svc.login({ email: 'x', password: 'y' });

    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ isLoading: true }));
    expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ isLoading: false, error: 'nope' }));
    expect(errorSpy).toHaveBeenCalledWith('[Auth] Listener error:', expect.any(Error));

    const calls = listener.mock.calls.length;
    unsubscribe();
    mockFetch.mockImplementationOnce(() => respond(false, {}));
    await svc.login({ email: 'x', password: 'y' });
    expect(listener.mock.calls.length).toBe(calls);
  });
});
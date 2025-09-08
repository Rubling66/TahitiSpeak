import AuthService from '../AuthService';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
      getSession: jest.fn(),
      refreshSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
    })),
  })),
}));

// Mock fetch for API calls
global.fetch = jest.fn();

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
    }
  });

  it('should have initial state', () => {
    const state = AuthService.getState();
    
    expect(state).toBeDefined();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.tokens).toBeNull();
  });

  it('should allow subscription to state changes', () => {
    const mockListener = jest.fn();
    const unsubscribe = AuthService.subscribe(mockListener);
    
    expect(typeof unsubscribe).toBe('function');
    
    // Clean up
    unsubscribe();
  });

  it('should have auth utility methods', () => {
    expect(typeof AuthService.getAuthHeader).toBe('function');
    expect(typeof AuthService.hasRole).toBe('function');
    expect(typeof AuthService.hasAnyRole).toBe('function');
    expect(typeof AuthService.isTokenExpiringSoon).toBe('function');
  });

  it('should return null auth header when no tokens', () => {
    const header = AuthService.getAuthHeader();
    expect(header).toBeNull();
  });

  it('should return false for role checks when no user', () => {
    expect(AuthService.hasRole('admin')).toBe(false);
    expect(AuthService.hasAnyRole(['admin', 'user'])).toBe(false);
  });

  it('should return false for token expiry check when no tokens', () => {
    expect(AuthService.isTokenExpiringSoon()).toBe(false);
  });
});
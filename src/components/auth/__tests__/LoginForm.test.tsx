/**
 * Real render tests for LoginForm (was shallow: render-only, ~50% stmts / 28% branches).
 * Mocks only framework edges (next/navigation, useAuth, sonner); form submit,
 * password toggle, remember-me, error clear, and redirect/onSuccess paths run for real.
 * Loop 2026-10-16 ~11:40 AM ET.
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../LoginForm';
import { toast } from 'sonner';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

const mockLogin = jest.fn();
jest.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    login: mockLogin,
    register: jest.fn(),
    logout: jest.fn(),
    resetPassword: jest.fn(),
    changePassword: jest.fn(),
    updateProfile: jest.fn(),
    refreshTokens: jest.fn(),
    clearError: jest.fn(),
    hasRole: jest.fn(),
    hasAnyRole: jest.fn(),
    getAuthHeader: jest.fn(),
    isTokenExpiringSoon: jest.fn(),
  }),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

async function fillAndSubmit(
  user: ReturnType<typeof userEvent.setup>,
  email = 'user@example.com',
  password = 'secret123'
) {
  await user.type(screen.getByLabelText(/^email$/i), email);
  await user.type(screen.getByLabelText(/^password$/i), password);
  await user.click(screen.getByRole('button', { name: /^sign in$/i }));
}

describe('LoginForm (real render)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders heading, fields, links, and a disabled submit until filled', () => {
    render(<LoginForm />);
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /forgot password/i })).toHaveAttribute(
      'href',
      '/auth/forgot-password'
    );
    expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute(
      'href',
      '/auth/register'
    );
    expect(screen.getByRole('button', { name: /^sign in$/i })).toBeDisabled();
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    const password = screen.getByLabelText(/^password$/i);
    expect(password).toHaveAttribute('type', 'password');
    const toggle = password.parentElement!.querySelector('button')!;
    await user.click(toggle);
    expect(password).toHaveAttribute('type', 'text');
    await user.click(toggle);
    expect(password).toHaveAttribute('type', 'password');
  });

  it('enables submit after email and password are entered', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    const submit = screen.getByRole('button', { name: /^sign in$/i });
    expect(submit).toBeDisabled();
    await user.type(screen.getByLabelText(/^email$/i), 'a@b.com');
    expect(submit).toBeDisabled();
    await user.type(screen.getByLabelText(/^password$/i), 'pw');
    expect(submit).toBeEnabled();
  });

  it('on success without onSuccess: toasts and router.push(redirectTo)', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({ success: true });
    render(<LoginForm redirectTo="/lessons" />);
    await fillAndSubmit(user);
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'secret123',
        rememberMe: false,
      });
    });
    expect(toast.success).toHaveBeenCalledWith('Login successful!');
    expect(mockPush).toHaveBeenCalledWith('/lessons');
  });

  it('on success with onSuccess: calls callback and does not push', async () => {
    const user = userEvent.setup();
    const onSuccess = jest.fn();
    mockLogin.mockResolvedValue({ success: true });
    render(<LoginForm onSuccess={onSuccess} />);
    await fillAndSubmit(user);
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(mockPush).not.toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Login successful!');
  });

  it('on login failure: shows alert, toasts error, uses fallback message', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({ success: false, error: 'Bad credentials' });
    render(<LoginForm />);
    await fillAndSubmit(user);
    expect(await screen.findByText('Bad credentials')).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith('Bad credentials');
  });

  it('on login failure without error string: uses Login failed', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({ success: false });
    render(<LoginForm />);
    await fillAndSubmit(user);
    expect(await screen.findByText('Login failed')).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith('Login failed');
  });

  it('on thrown Error: shows message and toasts', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValue(new Error('Network down'));
    render(<LoginForm />);
    await fillAndSubmit(user);
    expect(await screen.findByText('Network down')).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith('Network down');
  });

  it('on thrown non-Error: uses unexpected-error fallback', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValue('boom');
    render(<LoginForm />);
    await fillAndSubmit(user);
    expect(await screen.findByText('An unexpected error occurred')).toBeInTheDocument();
  });

  it('clears the error alert when the user edits a field', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({ success: false, error: 'Nope' });
    render(<LoginForm />);
    await fillAndSubmit(user);
    expect(await screen.findByText('Nope')).toBeInTheDocument();
    await user.type(screen.getByLabelText(/^email$/i), 'x');
    await waitFor(() => {
      expect(screen.queryByText('Nope')).not.toBeInTheDocument();
    });
  });

  it('passes rememberMe true when the checkbox is checked', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({ success: true });
    render(<LoginForm />);
    await user.click(screen.getByLabelText(/remember me/i));
    await fillAndSubmit(user);
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        expect.objectContaining({ rememberMe: true })
      );
    });
  });

  it('shows Signing in... while login is in flight', async () => {
    const user = userEvent.setup();
    let resolveLogin: (v: { success: boolean }) => void = () => {};
    mockLogin.mockImplementation(
      () =>
        new Promise<{ success: boolean }>((resolve) => {
          resolveLogin = resolve;
        })
    );
    render(<LoginForm />);
    await user.type(screen.getByLabelText(/^email$/i), 'a@b.com');
    await user.type(screen.getByLabelText(/^password$/i), 'pw');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));
    expect(await screen.findByText(/signing in/i)).toBeInTheDocument();
    resolveLogin({ success: true });
    await waitFor(() => {
      expect(screen.queryByText(/signing in/i)).not.toBeInTheDocument();
    });
  });
});
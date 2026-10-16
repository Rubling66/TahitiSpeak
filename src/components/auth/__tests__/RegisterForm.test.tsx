/**
 * Real render tests for RegisterForm (was shallow: 3 render-only cases, ~31% stmts / 17% branches).
 * Mocks only framework edges (next/navigation, useAuth, sonner); password strength meter,
 * show/hide toggles, match hints, terms checkbox, submit validation, success/redirect/onSuccess,
 * failure and thrown-error paths all run for real against the in-repo component.
 * Loop 2026-10-16 ~12:40 PM ET.
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterForm } from '../RegisterForm';
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

const mockRegister = jest.fn();
jest.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    register: mockRegister,
    login: jest.fn(),
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

const STRONG = 'Str0ng!Pass';

const submitButton = () => screen.getByRole('button', { name: /^create account$/i });
const passwordInput = () => screen.getByLabelText(/^password$/i);
const confirmInput = () => screen.getByLabelText(/^confirm password$/i);

async function fillValid(
  user: ReturnType<typeof userEvent.setup>,
  { password = STRONG, confirm = STRONG, terms = true } = {}
) {
  await user.type(screen.getByLabelText(/^full name$/i), 'Tea Faatau');
  await user.type(screen.getByLabelText(/^email$/i), 'tea@example.com');
  await user.type(passwordInput(), password);
  await user.type(confirmInput(), confirm);
  if (terms) await user.click(screen.getByRole('checkbox'));
}

describe('RegisterForm (real render)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders fields, links, and a disabled submit until the form is valid', () => {
    render(<RegisterForm className="extra" />);
    expect(screen.getByText('Join us to start your Tahitian learning journey')).toBeInTheDocument();
    expect(screen.getByLabelText(/^full name$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(passwordInput()).toHaveAttribute('type', 'password');
    expect(confirmInput()).toHaveAttribute('type', 'password');
    expect(screen.getByRole('link', { name: /terms of service/i })).toHaveAttribute('href', '/terms');
    expect(screen.getByRole('link', { name: /privacy policy/i })).toHaveAttribute('href', '/privacy');
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/auth/login');
    expect(submitButton()).toBeDisabled();
  });

  it('shows a Weak meter with every missing rule for a short lowercase password', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);
    await user.type(passwordInput(), 'abc');
    expect(screen.getByText('Weak')).toBeInTheDocument();
    expect(screen.getByText('Password must include:')).toBeInTheDocument();
    ['At least 8 characters', 'One uppercase letter', 'One number', 'One special character'].forEach(rule =>
      expect(screen.getByText(rule)).toBeInTheDocument()
    );
    expect(screen.queryByText('One lowercase letter')).not.toBeInTheDocument();
  });

  it('shows Medium for three rules and Strong with no feedback list when all five pass', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);
    await user.type(passwordInput(), 'abcdefgH');
    expect(screen.getByText('Medium')).toBeInTheDocument();
    await user.clear(passwordInput());
    await user.type(passwordInput(), STRONG);
    expect(screen.getByText('Strong')).toBeInTheDocument();
    expect(screen.queryByText('Password must include:')).not.toBeInTheDocument();
  });

  it('flags only-uppercase passwords as missing a lowercase letter', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);
    await user.type(passwordInput(), 'ABC');
    expect(screen.getByText('One lowercase letter')).toBeInTheDocument();
  });

  it('toggles both password fields between hidden and visible', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);
    const toggles = screen
      .getAllByRole('button')
      .filter(b => b.getAttribute('type') === 'button' && !b.getAttribute('role'));
    // First two plain type=button buttons are the eye toggles (password, confirm).
    await user.click(toggles[0]);
    expect(passwordInput()).toHaveAttribute('type', 'text');
    await user.click(toggles[1]);
    expect(confirmInput()).toHaveAttribute('type', 'text');
    await user.click(toggles[0]);
    await user.click(toggles[1]);
    expect(passwordInput()).toHaveAttribute('type', 'password');
    expect(confirmInput()).toHaveAttribute('type', 'password');
  });

  it('shows match / mismatch hints under confirm password', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);
    await user.type(passwordInput(), STRONG);
    await user.type(confirmInput(), 'nope');
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    await user.clear(confirmInput());
    await user.type(confirmInput(), STRONG);
    expect(screen.getByText('Passwords match')).toBeInTheDocument();
  });

  it('enables submit only once every field, terms, and strength rule pass', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);
    await fillValid(user, { terms: false });
    expect(submitButton()).toBeDisabled();
    await user.click(screen.getByRole('checkbox'));
    expect(submitButton()).toBeEnabled();
  });

  it('blocks a weak password at submit with a security error', async () => {
    const { container } = render(<RegisterForm />);
    fireEvent.submit(container.querySelector('form')!);
    expect(await screen.findByText('Password does not meet security requirements')).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('blocks mismatched passwords at submit, then clears the error on the next edit', async () => {
    const user = userEvent.setup();
    const { container } = render(<RegisterForm />);
    await fillValid(user, { confirm: 'Different1!' });
    fireEvent.submit(container.querySelector('form')!);
    const alert = await screen.findAllByText('Passwords do not match');
    expect(alert.length).toBeGreaterThanOrEqual(2); // inline hint + alert
    await user.type(screen.getByLabelText(/^full name$/i), 'x');
    expect(screen.getAllByText('Passwords do not match')).toHaveLength(1);
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('blocks submit without terms, then clears the error when terms are accepted', async () => {
    const user = userEvent.setup();
    const { container } = render(<RegisterForm />);
    await fillValid(user, { terms: false });
    fireEvent.submit(container.querySelector('form')!);
    expect(await screen.findByText('You must accept the terms and conditions')).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox'));
    expect(screen.queryByText('You must accept the terms and conditions')).not.toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('registers as student by default and routes to verify-email on success', async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValue({ success: true });
    render(<RegisterForm />);
    await fillValid(user);
    await user.click(submitButton());
    await waitFor(() =>
      expect(mockRegister).toHaveBeenCalledWith({
        name: 'Tea Faatau',
        email: 'tea@example.com',
        password: STRONG,
        role: 'student',
      })
    );
    expect(toast.success).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/auth/verify-email');
  });

  it('calls onSuccess instead of routing when provided', async () => {
    const user = userEvent.setup();
    const onSuccess = jest.fn();
    mockRegister.mockResolvedValue({ success: true });
    render(<RegisterForm onSuccess={onSuccess} />);
    await fillValid(user);
    await user.click(submitButton());
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('shows the service error when registration fails', async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValue({ success: false, error: 'Email already registered' });
    render(<RegisterForm />);
    await fillValid(user);
    await user.click(submitButton());
    expect(await screen.findByText('Email already registered')).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith('Email already registered');
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('falls back to a generic message when failure has no error text', async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValue({ success: false });
    render(<RegisterForm />);
    await fillValid(user);
    await user.click(submitButton());
    expect(await screen.findByText('Registration failed')).toBeInTheDocument();
  });

  it('surfaces a thrown Error message and a generic message for non-Error throws', async () => {
    const user = userEvent.setup();
    mockRegister.mockRejectedValueOnce(new Error('Network down'));
    const { unmount } = render(<RegisterForm />);
    await fillValid(user);
    await user.click(submitButton());
    expect(await screen.findByText('Network down')).toBeInTheDocument();
    unmount();

    mockRegister.mockRejectedValueOnce('boom');
    render(<RegisterForm />);
    await fillValid(user);
    await user.click(submitButton());
    expect(await screen.findByText('An unexpected error occurred')).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith('An unexpected error occurred');
  });

  it('shows the loading label and disables inputs while registering', async () => {
    const user = userEvent.setup();
    let resolve!: (v: { success: boolean }) => void;
    mockRegister.mockReturnValue(new Promise(r => (resolve = r)));
    render(<RegisterForm />);
    await fillValid(user);
    await user.click(submitButton());
    expect(await screen.findByText('Creating account...')).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeDisabled();
    resolve({ success: true });
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/auth/verify-email'));
  });

  it('passes the instructor role through when the role select changes', async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValue({ success: true });
    const { container } = render(<RegisterForm />);
    // Radix Select renders a hidden native <select> inside forms; driving it calls onValueChange.
    const nativeSelect = container.querySelector('select');
    expect(nativeSelect).not.toBeNull();
    fireEvent.change(nativeSelect!, { target: { value: 'instructor' } });
    await fillValid(user);
    await user.click(submitButton());
    await waitFor(() =>
      expect(mockRegister).toHaveBeenCalledWith(expect.objectContaining({ role: 'instructor' }))
    );
  });
});

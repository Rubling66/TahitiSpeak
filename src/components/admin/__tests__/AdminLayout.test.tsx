import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Framework edges only: router/pathname, next/link, and the two auth services.
const mockPush = jest.fn();
let mockPathname: string | null = '/admin/dashboard';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockPathname,
}));

jest.mock('next/link', () => {
  const MockLink = ({ href, children, ...rest }: any) => (
    <a
      href={typeof href === 'string' ? href : String(href)}
      {...rest}
      onClick={(e: React.MouseEvent) => {
        e.preventDefault();
        rest.onClick?.(e);
      }}
    >
      {children}
    </a>
  );
  MockLink.displayName = 'MockLink';
  return { __esModule: true, default: MockLink };
});

jest.mock('@/lib/auth/AdminAuthService', () => ({
  AdminAuthService: {
    getCurrentUser: jest.fn(),
    hasPermission: jest.fn(),
    logout: jest.fn(),
  },
}));

jest.mock('@/lib/auth/AuthBridge', () => ({
  authBridge: {
    hasAdminAccess: jest.fn(),
    getCurrentAdminUser: jest.fn(),
    getUnifiedUserInfo: jest.fn(),
  },
}));

import AdminLayout, { AdminLayout as NamedAdminLayout } from '../AdminLayout';
import { AdminAuthService } from '@/lib/auth/AdminAuthService';
import { authBridge } from '@/lib/auth/AuthBridge';

const auth = AdminAuthService as unknown as Record<'getCurrentUser' | 'hasPermission' | 'logout', jest.Mock>;
const bridge = authBridge as unknown as Record<'hasAdminAccess' | 'getCurrentAdminUser' | 'getUnifiedUserInfo', jest.Mock>;

const bridgeUser = {
  id: 'b1',
  nickname: 'Bridge Admin',
  email: 'bridge@example.com',
  role: 'super_admin',
  permissions: [],
};

const directUser = {
  id: 'd1',
  nickname: 'Direct Admin',
  email: 'direct@example.com',
  role: 'admin',
  permissions: [],
};

const ALL_LABELS = [
  'Dashboard', 'Courses', 'Bulk Import', 'AI Content Tools', 'Collaboration', 'Accessibility',
  'Content Management', 'Integrations', 'Performance', 'Localization', 'Users', 'Analytics', 'Settings',
];

const renderLayout = () =>
  render(
    <AdminLayout>
      <div>Page Body</div>
    </AdminLayout>
  );

const sidebar = (container: HTMLElement) =>
  container.querySelector('div.fixed.inset-y-0') as HTMLElement;
const overlay = (container: HTMLElement) =>
  container.querySelector('div.fixed.inset-0.z-40') as HTMLElement | null;
const menuButton = (container: HTMLElement) =>
  container.querySelector('.sticky button') as HTMLElement;
const closeButton = (container: HTMLElement) =>
  container.querySelector('.border-b.border-gray-200.px-6 button') as HTMLElement;

describe('AdminLayout', () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = '/admin/dashboard';
    bridge.hasAdminAccess.mockReturnValue(true);
    bridge.getCurrentAdminUser.mockReturnValue(bridgeUser);
    bridge.getUnifiedUserInfo.mockReturnValue({ user: null });
    auth.getCurrentUser.mockReturnValue(directUser);
    auth.hasPermission.mockReturnValue(true);
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('exports the same component as default and named export', () => {
    expect(NamedAdminLayout).toBe(AdminLayout);
  });

  it('renders the loading frame before the access check effect runs (server render, no effects)', () => {
    // react-dom/server's browser build expects MessageChannel, which jsdom lacks. Provide a minimal
    // shim for this one synchronous render, then load the server renderer lazily.
    const g = globalThis as any;
    const hadMessageChannel = 'MessageChannel' in g;
    if (!hadMessageChannel) {
      g.MessageChannel = class {
        port1: { onmessage: ((ev: unknown) => void) | null } = { onmessage: null };
        port2 = {
          postMessage: (data: unknown) => {
            setTimeout(() => this.port1.onmessage?.({ data }), 0);
          },
        };
      };
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { renderToStaticMarkup } = require('react-dom/server');
    const html: string = renderToStaticMarkup(
      <AdminLayout>
        <div>Page Body</div>
      </AdminLayout>
    );
    expect(html).toContain('Loading...');
    expect(html).not.toContain('Page Body');
    if (!hadMessageChannel) delete g.MessageChannel;
  });

  describe('access check', () => {
    it('uses the bridge admin user and skips the direct admin check', () => {
      renderLayout();
      expect(screen.getByText('Page Body')).toBeInTheDocument();
      expect(screen.getByText('Bridge Admin')).toBeInTheDocument();
      expect(screen.getByText('bridge@example.com')).toBeInTheDocument();
      // role underscore is replaced with a space
      expect(screen.getByText('super admin')).toBeInTheDocument();
      expect(auth.getCurrentUser).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('falls back to AdminAuthService when the bridge grants access but has no admin user', () => {
      bridge.getCurrentAdminUser.mockReturnValue(null);
      renderLayout();
      expect(auth.getCurrentUser).toHaveBeenCalled();
      expect(screen.getByText('Direct Admin')).toBeInTheDocument();
      expect(screen.getByText('admin')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('falls back to AdminAuthService when the bridge denies access', () => {
      bridge.hasAdminAccess.mockReturnValue(false);
      renderLayout();
      expect(bridge.getCurrentAdminUser).not.toHaveBeenCalled();
      expect(screen.getByText('Direct Admin')).toBeInTheDocument();
    });

    it('redirects to /admin/login and renders nothing when no admin user exists', () => {
      bridge.hasAdminAccess.mockReturnValue(false);
      auth.getCurrentUser.mockReturnValue(null);
      const { container } = renderLayout();
      expect(mockPush).toHaveBeenCalledWith('/admin/login');
      expect(container).toBeEmptyDOMElement();
    });

    it('does not redirect when already on the admin login page', () => {
      mockPathname = '/admin/login';
      bridge.hasAdminAccess.mockReturnValue(false);
      auth.getCurrentUser.mockReturnValue(null);
      const { container } = renderLayout();
      expect(mockPush).not.toHaveBeenCalled();
      expect(container).toBeEmptyDOMElement();
    });

    it('redirects when the pathname is null and no admin user exists', () => {
      mockPathname = null;
      bridge.hasAdminAccess.mockReturnValue(false);
      auth.getCurrentUser.mockReturnValue(null);
      renderLayout();
      expect(mockPush).toHaveBeenCalledWith('/admin/login');
    });

    it('logs and redirects to /admin/login when the access check throws', () => {
      const boom = new Error('bridge down');
      bridge.hasAdminAccess.mockImplementation(() => {
        throw boom;
      });
      const { container } = renderLayout();
      expect(errorSpy).toHaveBeenCalledWith('Admin access check failed:', boom);
      expect(mockPush).toHaveBeenCalledWith('/admin/login');
      expect(container).toBeEmptyDOMElement();
    });

    it('does not redirect on the login page when the access check throws', () => {
      mockPathname = '/admin/login';
      bridge.hasAdminAccess.mockImplementation(() => {
        throw new Error('bridge down');
      });
      renderLayout();
      expect(errorSpy).toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('redirects when the access check throws and the pathname is null', () => {
      mockPathname = null;
      bridge.hasAdminAccess.mockImplementation(() => {
        throw new Error('bridge down');
      });
      renderLayout();
      expect(mockPush).toHaveBeenCalledWith('/admin/login');
    });
  });

  describe('navigation', () => {
    it('shows every nav item when all permissions are granted', () => {
      renderLayout();
      for (const label of ALL_LABELS) {
        expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
      }
      expect(screen.getAllByRole('link')).toHaveLength(ALL_LABELS.length);
    });

    it('filters permissioned items and always keeps Dashboard', () => {
      auth.hasPermission.mockImplementation((p: string) => p === 'users.view');
      renderLayout();
      const links = screen.getAllByRole('link').map((a) => a.textContent);
      expect(links).toEqual(['Dashboard', 'Users']);
      expect(auth.hasPermission).toHaveBeenCalledWith('courses.edit');
      expect(auth.hasPermission).toHaveBeenCalledWith('settings.edit');
      expect(auth.hasPermission).not.toHaveBeenCalledWith(undefined);
    });

    it('marks only the current route as active and titles the top bar with its label', () => {
      mockPathname = '/admin/users';
      renderLayout();
      const users = screen.getByRole('link', { name: 'Users' });
      const dashboard = screen.getByRole('link', { name: 'Dashboard' });
      expect(users).toHaveAttribute('href', '/admin/users');
      expect(users.className).toContain('bg-blue-100');
      expect(users.querySelector('svg')?.getAttribute('class')).toContain('text-blue-500');
      expect(dashboard.className).not.toContain('bg-blue-100');
      expect(dashboard.querySelector('svg')?.getAttribute('class')).toContain('text-gray-400');
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Users');
    });

    it('falls back to "Admin" in the top bar for an unknown route', () => {
      mockPathname = '/admin/something-else';
      renderLayout();
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Admin');
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Admin Panel');
    });
  });

  describe('mobile sidebar', () => {
    it('starts closed with no overlay', () => {
      const { container } = renderLayout();
      expect(overlay(container)).toBeNull();
      expect(sidebar(container).className).toContain('-translate-x-full');
    });

    it('opens from the menu button and closes from the overlay', () => {
      const { container } = renderLayout();
      fireEvent.click(menuButton(container));
      expect(overlay(container)).not.toBeNull();
      expect(sidebar(container).className).toMatch(/(^|\s)translate-x-0(\s|$)/);
      fireEvent.click(overlay(container)!);
      expect(overlay(container)).toBeNull();
      expect(sidebar(container).className).toContain('-translate-x-full');
    });

    it('closes from the sidebar X button', () => {
      const { container } = renderLayout();
      fireEvent.click(menuButton(container));
      expect(overlay(container)).not.toBeNull();
      fireEvent.click(closeButton(container));
      expect(overlay(container)).toBeNull();
    });

    it('closes when a nav link is clicked', () => {
      const { container } = renderLayout();
      fireEvent.click(menuButton(container));
      expect(overlay(container)).not.toBeNull();
      fireEvent.click(screen.getByRole('link', { name: 'Courses' }));
      expect(overlay(container)).toBeNull();
    });
  });

  describe('sign out', () => {
    it('logs out of admin and returns to /admin/login when there is no main-app user', () => {
      renderLayout();
      fireEvent.click(screen.getByRole('button', { name: /sign out/i }));
      expect(auth.logout).toHaveBeenCalledTimes(1);
      expect(bridge.getUnifiedUserInfo).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/admin/login');
    });

    it('sends a signed-in main-app user to /dashboard', () => {
      bridge.getUnifiedUserInfo.mockReturnValue({ user: { id: 'u1' } });
      renderLayout();
      fireEvent.click(screen.getByRole('button', { name: /sign out/i }));
      expect(auth.logout).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
      expect(mockPush).not.toHaveBeenCalledWith('/admin/login');
    });
  });
});

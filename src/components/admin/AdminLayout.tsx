'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { AdminAuthService } from '@/lib/auth/AdminAuthService';
import { authBridge } from '@/lib/auth/AuthBridge';
import type { AdminUser } from '@/types';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  BookOpen,
  Upload,
  Settings,
  Users,
  BarChart3,
  LogOut,
  Menu,
  X,
  Brain,
  GitBranch,
  Shield,
  FolderTree,
  Zap,
  Activity,
  Globe
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
}

const navItems: NavItem[] = [
  {
    href: '/admin/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard
  },
  {
    href: '/admin/courses',
    label: 'Courses',
    icon: BookOpen,
    permission: 'courses.edit'
  },
  {
    href: '/admin/import',
    label: 'Bulk Import',
    icon: Upload,
    permission: 'import.bulk'
  },
  {
    href: '/admin/ai-content',
    label: 'AI Content Tools',
    icon: Brain,
    permission: 'ai.content'
  },
  {
    href: '/admin/collaboration',
    label: 'Collaboration',
    icon: GitBranch,
    permission: 'collaboration.manage'
  },
  {
    href: '/admin/accessibility',
    label: 'Accessibility',
    icon: Shield,
    permission: 'accessibility.manage'
  },
  {
    href: '/admin/content-management',
    label: 'Content Management',
    icon: FolderTree,
    permission: 'content.manage'
  },
  {
    href: '/admin/integrations',
    label: 'Integrations',
    icon: Zap,
    permission: 'integrations.manage'
  },
  {
    href: '/admin/performance',
    label: 'Performance',
    icon: Activity,
    permission: 'performance.monitor'
  },
  {
    href: '/admin/localization',
    label: 'Localization',
    icon: Globe,
    permission: 'localization.manage'
  },
  {
    href: '/admin/users',
    label: 'Users',
    icon: Users,
    permission: 'users.view'
  },
  {
    href: '/admin/analytics',
    label: 'Analytics',
    icon: BarChart3,
    permission: 'analytics.view'
  },
  {
    href: '/admin/settings',
    label: 'Settings',
    icon: Settings,
    permission: 'settings.edit'
  }
];

function AdminLayout({ children }: AdminLayoutProps) {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        // Check if user has admin access through the bridge
        if (authBridge.hasAdminAccess()) {
          const adminUser = authBridge.getCurrentAdminUser();
          if (adminUser) {
            setCurrentUser(adminUser);
            setIsLoading(false);
            return;
          }
        }

        // Fallback to direct admin auth check
        const user = AdminAuthService.getCurrentUser();
        if (!user && !pathname?.includes('/admin/login')) {
          router.push('/admin/login');
        } else {
          setCurrentUser(user);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Admin access check failed:', error);
        if (!pathname?.includes('/admin/login')) {
          router.push('/admin/login');
        }
        setIsLoading(false);
      }
    };

    checkAdminAccess();
  }, [router, pathname]);

  const handleLogout = () => {
    AdminAuthService.logout();
    // Also logout from main auth if user is logged in there
    const unifiedInfo = authBridge.getUnifiedUserInfo();
    if (unifiedInfo.user) {
      // Redirect to main app instead of admin login
      router.push('/dashboard');
    } else {
      router.push('/admin/login');
    }
  };

  const filteredNavItems = navItems.filter(item => {
    if (!item.permission) return true;
    return AdminAuthService.hasPermission(item.permission);
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75"></div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">
            Admin Panel
          </h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                    ${isActive 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className={`
                    mr-3 h-5 w-5 flex-shrink-0
                    ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                  `} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User info and logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center mb-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {currentUser.nickname}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {currentUser.email}
              </p>
              <p className="text-xs text-blue-600 capitalize">
                {currentUser.role.replace('_', ' ')}
              </p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="w-full justify-start text-gray-700 hover:text-gray-900"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            <div className="flex-1 lg:flex lg:items-center lg:justify-between">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-medium text-gray-900 truncate">
                  {navItems.find(item => item.href === pathname)?.label || 'Admin'}
                </h2>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export { AdminLayout };
export default AdminLayout;
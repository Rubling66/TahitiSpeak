// Admin authentication and authorization service

import type { AdminUser, UserRole } from '@/types';

/**
 * Simple admin authentication service for demo purposes
 * In production, this would integrate with a proper auth provider
 */
export class AdminAuthService {
  private static readonly ADMIN_STORAGE_KEY = 'tahitian-tutor-admin-user';
  private static readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  // Demo admin users - in production, this would come from a database
  private static readonly DEMO_ADMINS: AdminUser[] = [
    {
      id: 1,
      nickname: 'Admin User',
      email: 'admin@tahitian-tutor.com',
      role: 'super_admin',
      permissions: ['*'], // All permissions
      createdAt: Date.now(),
      lastSeenAt: Date.now()
    },
    {
      id: 2,
      nickname: 'Course Manager',
      email: 'manager@tahitian-tutor.com',
      role: 'admin',
      permissions: [
        'courses.create',
        'courses.edit',
        'courses.publish',
        'lessons.create',
        'lessons.edit',
        'media.upload',
        'import.bulk'
      ],
      createdAt: Date.now(),
      lastSeenAt: Date.now()
    }
  ];

  /**
   * Authenticate admin user with email and password
   * In production, this would validate against a secure backend
   */
  static async login(email: string, password: string): Promise<AdminUser | null> {
    // Demo authentication - in production, use proper password hashing
    const demoPasswords: Record<string, string> = {
      'admin@tahitian-tutor.com': 'admin123',
      'manager@tahitian-tutor.com': 'manager123'
    };

    if (demoPasswords[email] === password) {
      const user = this.DEMO_ADMINS.find(u => u.email === email);
      if (user) {
        const sessionUser = {
          ...user,
          lastLoginAt: Date.now()
        };
        
        // Store session
        this.setCurrentUser(sessionUser);
        return sessionUser;
      }
    }

    return null;
  }

  /**
   * Get current authenticated admin user
   */
  static getCurrentUser(): AdminUser | null {
    try {
      const stored = localStorage.getItem(this.ADMIN_STORAGE_KEY);
      if (!stored) return null;

      const session = JSON.parse(stored);
      
      // Check if session is expired
      if (Date.now() - session.timestamp > this.SESSION_DURATION) {
        this.logout();
        return null;
      }

      return session.user;
    } catch (error) {
      console.error('Error reading admin session:', error);
      return null;
    }
  }

  /**
   * Set current user session
   */
  private static setCurrentUser(user: AdminUser): void {
    try {
      const session = {
        user,
        timestamp: Date.now()
      };
      localStorage.setItem(this.ADMIN_STORAGE_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('Error storing admin session:', error);
    }
  }

  /**
   * Logout current user
   */
  static logout(): void {
    localStorage.removeItem(this.ADMIN_STORAGE_KEY);
  }

  /**
   * Check if current user has specific permission
   */
  static hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    // Super admin has all permissions
    if (user.role === 'super_admin' || user.permissions.includes('*')) {
      return true;
    }

    return user.permissions.includes(permission);
  }

  /**
   * Check if current user has any of the specified roles
   */
  static hasRole(...roles: UserRole[]): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    return roles.includes(user.role);
  }

  /**
   * Require authentication - throws error if not authenticated
   */
  static requireAuth(): AdminUser {
    const user = this.getCurrentUser();
    if (!user) {
      throw new Error('Authentication required');
    }
    return user;
  }

  /**
   * Require specific permission - throws error if not authorized
   */
  static requirePermission(permission: string): AdminUser {
    const user = this.requireAuth();
    if (!this.hasPermission(permission)) {
      throw new Error(`Permission required: ${permission}`);
    }
    return user;
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  /**
   * Get all available permissions for reference
   */
  static getAvailablePermissions(): string[] {
    return [
      'courses.create',
      'courses.edit',
      'courses.delete',
      'courses.publish',
      'courses.archive',
      'lessons.create',
      'lessons.edit',
      'lessons.delete',
      'media.upload',
      'media.delete',
      'import.bulk',
      'users.view',
      'users.edit',
      'analytics.view',
      'settings.edit'
    ];
  }
}

/**
 * Hook for using admin authentication in React components
 */
export function useAdminAuth() {
  const [currentUser, setCurrentUser] = React.useState<AdminUser | null>(
    AdminAuthService.getCurrentUser()
  );

  const login = async (email: string, password: string): Promise<boolean> => {
    const user = await AdminAuthService.login(email, password);
    setCurrentUser(user);
    return user !== null;
  };

  const logout = () => {
    AdminAuthService.logout();
    setCurrentUser(null);
  };

  const hasPermission = (permission: string): boolean => {
    return AdminAuthService.hasPermission(permission);
  };

  const hasRole = (...roles: UserRole[]): boolean => {
    return AdminAuthService.hasRole(...roles);
  };

  return {
    currentUser,
    isAuthenticated: currentUser !== null,
    login,
    logout,
    hasPermission,
    hasRole
  };
}

// Add React import at the top
import React from 'react';
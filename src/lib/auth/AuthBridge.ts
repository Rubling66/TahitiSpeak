'use client';

import { AdminAuthService } from './AdminAuthService';
import authService from '../../services/AuthService';
import { rbacService } from '../../services/RBACService';
import type { AdminUser, UserRole } from '@/types';
import type { User } from '../../services/AuthService';
import { LoggingService } from '../../services/LoggingService';
import { PerformanceMonitoringService } from '../../services/PerformanceMonitoringService';

/**
 * Authentication Bridge Service
 * Connects the main user authentication system with the admin authentication system
 * Provides unified access control across the application
 */
export class AuthBridge {
  private static instance: AuthBridge;
  private initialized = false;

  private constructor() {}

  public static getInstance(): AuthBridge {
    if (!AuthBridge.instance) {
      AuthBridge.instance = new AuthBridge();
    }
    return AuthBridge.instance;
  }

  /**
   * Initialize the auth bridge
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Subscribe to main auth state changes
      authService.subscribe((authState) => {
        this.handleAuthStateChange(authState);
      });

      this.initialized = true;
      LoggingService.info('AuthBridge initialized successfully');
    } catch (error) {
      LoggingService.error('Failed to initialize AuthBridge', { error });
      throw error;
    }
  }

  /**
   * Handle authentication state changes from the main auth service
   */
  private handleAuthStateChange(authState: any): void {
    const { user, isAuthenticated } = authState;

    if (isAuthenticated && user) {
      // Check if user has admin privileges
      if (this.isAdminUser(user)) {
        // Convert user to admin user format
        const adminUser = this.convertToAdminUser(user);
        
        // Set admin session
        this.setAdminSession(adminUser);
        
        LoggingService.info('Admin session established', {
          userId: user.id,
          userRole: user.role,
          adminPermissions: adminUser.permissions
        });
      }
    } else {
      // Clear admin session when user logs out
      AdminAuthService.logout();
      LoggingService.info('Admin session cleared');
    }
  }

  /**
   * Check if a user has admin privileges
   */
  private isAdminUser(user: User): boolean {
    return user.role === 'admin' || user.role === 'instructor';
  }

  /**
   * Convert a regular user to admin user format
   */
  private convertToAdminUser(user: User): AdminUser {
    const permissions = this.getUserAdminPermissions(user);
    
    return {
      id: parseInt(user.id) || 0,
      nickname: user.name,
      email: user.email,
      role: this.mapUserRoleToAdminRole(user.role),
      permissions,
      createdAt: new Date(user.createdAt).getTime(),
      lastSeenAt: Date.now(),
      lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt).getTime() : Date.now()
    };
  }

  /**
   * Map user role to admin role
   */
  private mapUserRoleToAdminRole(userRole: string): UserRole {
    switch (userRole) {
      case 'admin':
        return 'super_admin';
      case 'instructor':
        return 'admin';
      default:
        return 'admin'; // Default fallback
    }
  }

  /**
   * Get admin permissions for a user based on their role and RBAC permissions
   */
  private getUserAdminPermissions(user: User): string[] {
    const userPermissions = rbacService.getUserPermissions(user);
    const adminPermissions: string[] = [];

    // Map RBAC permissions to admin permissions
    userPermissions.forEach(permission => {
      const adminPerm = this.mapRBACToAdminPermission(permission.resource, permission.action);
      if (adminPerm && !adminPermissions.includes(adminPerm)) {
        adminPermissions.push(adminPerm);
      }
    });

    // Add role-based permissions
    if (user.role === 'admin') {
      adminPermissions.push('*'); // Super admin gets all permissions
    } else if (user.role === 'instructor') {
      adminPermissions.push(
        'courses.create',
        'courses.edit',
        'courses.publish',
        'lessons.create',
        'lessons.edit',
        'media.upload',
        'content.manage',
        'analytics.view'
      );
    }

    return adminPermissions;
  }

  /**
   * Map RBAC permission to admin permission
   */
  private mapRBACToAdminPermission(resource: string, action: string): string | null {
    const permissionMap: Record<string, Record<string, string>> = {
      'lesson': {
        'create': 'lessons.create',
        'update': 'lessons.edit',
        'delete': 'lessons.delete',
        'manage': 'lessons.edit'
      },
      'content': {
        'create': 'courses.create',
        'update': 'courses.edit',
        'delete': 'courses.delete',
        'manage': 'content.manage'
      },
      'user': {
        'read': 'users.view',
        'update': 'users.edit',
        'manage': 'users.edit'
      },
      'analytics': {
        'read': 'analytics.view'
      },
      'settings': {
        'manage': 'settings.edit'
      },
      'api_key': {
        'manage': 'api.manage'
      }
    };

    return permissionMap[resource]?.[action] || null;
  }

  /**
   * Set admin session using the admin auth service
   */
  private setAdminSession(adminUser: AdminUser): void {
    try {
      // Store admin user in localStorage using AdminAuthService format
      const session = {
        user: adminUser,
        timestamp: Date.now()
      };
      
      localStorage.setItem('tahitian-tutor-admin-user', JSON.stringify(session));
      
      PerformanceMonitoringService.recordMetric({
        name: 'admin_session_created',
        value: 1,
        timestamp: Date.now(),
        tags: {
          userRole: adminUser.role,
          permissionCount: adminUser.permissions.length.toString()
        }
      });
    } catch (error) {
      LoggingService.error('Failed to set admin session', { error, adminUser });
    }
  }

  /**
   * Check if current user has admin access
   */
  public hasAdminAccess(): boolean {
    const authState = authService.getState();
    return authState.isAuthenticated && 
           authState.user && 
           this.isAdminUser(authState.user);
  }

  /**
   * Get current admin user
   */
  public getCurrentAdminUser(): AdminUser | null {
    if (!this.hasAdminAccess()) {
      return null;
    }

    return AdminAuthService.getCurrentUser();
  }

  /**
   * Check if current user has specific admin permission
   */
  public hasAdminPermission(permission: string): boolean {
    if (!this.hasAdminAccess()) {
      return false;
    }

    return AdminAuthService.hasPermission(permission);
  }

  /**
   * Require admin access - throws error if not authorized
   */
  public requireAdminAccess(): AdminUser {
    const adminUser = this.getCurrentAdminUser();
    if (!adminUser) {
      throw new Error('Admin access required');
    }
    return adminUser;
  }

  /**
   * Sync user changes to admin session
   */
  public async syncUserToAdmin(): Promise<void> {
    const authState = authService.getState();
    
    if (authState.isAuthenticated && authState.user && this.isAdminUser(authState.user)) {
      const adminUser = this.convertToAdminUser(authState.user);
      this.setAdminSession(adminUser);
      
      LoggingService.info('Admin session synced with user changes', {
        userId: authState.user.id
      });
    }
  }

  /**
   * Get unified user info (combines regular user and admin data)
   */
  public getUnifiedUserInfo(): {
    user: User | null;
    adminUser: AdminUser | null;
    hasAdminAccess: boolean;
    permissions: string[];
  } {
    const authState = authService.getState();
    const adminUser = this.getCurrentAdminUser();
    const hasAdminAccess = this.hasAdminAccess();
    
    let permissions: string[] = [];
    
    if (authState.user) {
      const rbacPermissions = rbacService.getUserPermissions(authState.user);
      permissions = rbacPermissions.map(p => `${p.action}:${p.resource}`);
    }
    
    if (adminUser) {
      permissions.push(...adminUser.permissions);
    }
    
    // Remove duplicates
    permissions = [...new Set(permissions)];
    
    return {
      user: authState.user,
      adminUser,
      hasAdminAccess,
      permissions
    };
  }
}

// Export singleton instance
export const authBridge = AuthBridge.getInstance();

// Initialize on module load
if (typeof window !== 'undefined') {
  authBridge.initialize().catch(error => {
    console.error('Failed to initialize AuthBridge:', error);
  });
}
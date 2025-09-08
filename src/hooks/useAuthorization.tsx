import React, { useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { rbacService, AccessContext, AccessResult, ACTIONS, RESOURCES } from '../services/RBACService';
import { LoggingService } from '../services/LoggingService';
import { PerformanceMonitoringService } from '../services/PerformanceMonitoringService';

// Types
export interface AuthorizationHook {
  // Permission checks
  hasPermission: (resource: string, action: string, data?: any) => boolean;
  checkAccess: (resource: string, action: string, data?: any) => AccessResult;
  
  // Role checks
  hasRole: (roleId: string) => boolean;
  hasAnyRole: (roleIds: string[]) => boolean;
  hasRoleLevel: (minLevel: number) => boolean;
  
  // Resource access
  canAccessResource: (resource: string) => boolean;
  canManageResource: (resource: string, data?: any) => boolean;
  
  // Specific permission helpers
  canCreateContent: () => boolean;
  canEditContent: (contentData?: any) => boolean;
  canDeleteContent: (contentData?: any) => boolean;
  canViewAnalytics: () => boolean;
  canManageUsers: () => boolean;
  canManageSettings: () => boolean;
  canManageApiKeys: () => boolean;
  
  // User-specific checks
  canEditProfile: (userId?: string) => boolean;
  canViewProfile: (userId?: string) => boolean;
  canViewProgress: (userId?: string) => boolean;
  
  // Admin checks
  isAdmin: () => boolean;
  isInstructor: () => boolean;
  isStudent: () => boolean;
  
  // Utility
  getUserPermissions: () => string[];
  getAccessibleResources: () => string[];
  requireAuth: () => boolean;
}

export function useAuthorization(): AuthorizationHook {
  const { user, isAuthenticated } = useAuth();

  // Core permission checking
  const hasPermission = useCallback((resource: string, action: string, data?: any): boolean => {
    if (!isAuthenticated || !user) {
      LoggingService.log('debug', 'Permission denied - not authenticated', { resource, action });
      return false;
    }

    const startTime = performance.now();
    const result = rbacService.hasPermission(user, resource, action, data);
    const duration = performance.now() - startTime;

    PerformanceMonitoringService.recordMetric({
      name: 'authorization_check_duration',
      value: duration,
      unit: 'milliseconds',
      tags: {
        resource,
        action,
        userRole: user.role,
        granted: result.toString()
      }
    });

    return result;
  }, [isAuthenticated, user]);

  const checkAccess = useCallback((resource: string, action: string, data?: any): AccessResult => {
    if (!isAuthenticated || !user) {
      return {
        granted: false,
        reason: 'User not authenticated',
        requiredPermissions: [`${action}:${resource}`]
      };
    }

    const context: AccessContext = {
      user,
      resource,
      action,
      data
    };

    return rbacService.checkAccess(context);
  }, [isAuthenticated, user]);

  // Role checking
  const hasRole = useCallback((roleId: string): boolean => {
    if (!isAuthenticated || !user) return false;
    return rbacService.hasRole(user, roleId);
  }, [isAuthenticated, user]);

  const hasAnyRole = useCallback((roleIds: string[]): boolean => {
    if (!isAuthenticated || !user) return false;
    return roleIds.some(roleId => rbacService.hasRole(user, roleId));
  }, [isAuthenticated, user]);

  const hasRoleLevel = useCallback((minLevel: number): boolean => {
    if (!isAuthenticated || !user) return false;
    return rbacService.hasRoleLevel(user, minLevel);
  }, [isAuthenticated, user]);

  // Resource access
  const canAccessResource = useCallback((resource: string): boolean => {
    if (!isAuthenticated || !user) return false;
    return rbacService.canAccessResource(user, resource);
  }, [isAuthenticated, user]);

  const canManageResource = useCallback((resource: string, data?: any): boolean => {
    return hasPermission(resource, ACTIONS.MANAGE, data);
  }, [hasPermission]);

  // Specific permission helpers
  const canCreateContent = useCallback((): boolean => {
    return hasPermission(RESOURCES.CONTENT, ACTIONS.CREATE) ||
           hasPermission(RESOURCES.LESSON, ACTIONS.CREATE) ||
           hasPermission(RESOURCES.VOCABULARY, ACTIONS.CREATE);
  }, [hasPermission]);

  const canEditContent = useCallback((contentData?: any): boolean => {
    return hasPermission(RESOURCES.CONTENT, ACTIONS.UPDATE, contentData) ||
           hasPermission(RESOURCES.LESSON, ACTIONS.UPDATE, contentData) ||
           hasPermission(RESOURCES.VOCABULARY, ACTIONS.UPDATE, contentData);
  }, [hasPermission]);

  const canDeleteContent = useCallback((contentData?: any): boolean => {
    return hasPermission(RESOURCES.CONTENT, ACTIONS.DELETE, contentData) ||
           hasPermission(RESOURCES.LESSON, ACTIONS.DELETE, contentData) ||
           hasPermission(RESOURCES.VOCABULARY, ACTIONS.DELETE, contentData);
  }, [hasPermission]);

  const canViewAnalytics = useCallback((): boolean => {
    return hasPermission(RESOURCES.ANALYTICS, ACTIONS.READ);
  }, [hasPermission]);

  const canManageUsers = useCallback((): boolean => {
    return hasPermission(RESOURCES.USER, ACTIONS.MANAGE);
  }, [hasPermission]);

  const canManageSettings = useCallback((): boolean => {
    return hasPermission(RESOURCES.SETTINGS, ACTIONS.MANAGE);
  }, [hasPermission]);

  const canManageApiKeys = useCallback((): boolean => {
    return hasPermission(RESOURCES.API_KEY, ACTIONS.MANAGE);
  }, [hasPermission]);

  // User-specific checks
  const canEditProfile = useCallback((userId?: string): boolean => {
    if (!isAuthenticated || !user) return false;
    
    // Users can always edit their own profile
    if (!userId || userId === user.id) {
      return hasPermission(RESOURCES.USER, ACTIONS.UPDATE, { userId: user.id });
    }
    
    // Admins can edit any profile
    return hasPermission(RESOURCES.USER, ACTIONS.MANAGE);
  }, [isAuthenticated, user, hasPermission]);

  const canViewProfile = useCallback((userId?: string): boolean => {
    if (!isAuthenticated || !user) return false;
    
    // Users can always view their own profile
    if (!userId || userId === user.id) {
      return hasPermission(RESOURCES.USER, ACTIONS.READ, { userId: user.id });
    }
    
    // Instructors and admins can view other profiles
    return hasRoleLevel(2) || hasPermission(RESOURCES.USER, ACTIONS.READ);
  }, [isAuthenticated, user, hasPermission, hasRoleLevel]);

  const canViewProgress = useCallback((userId?: string): boolean => {
    if (!isAuthenticated || !user) return false;
    
    // Users can always view their own progress
    if (!userId || userId === user.id) {
      return hasPermission(RESOURCES.PROGRESS, ACTIONS.READ, { userId: user.id });
    }
    
    // Instructors and admins can view student progress
    return hasRoleLevel(2) || hasPermission(RESOURCES.PROGRESS, ACTIONS.READ);
  }, [isAuthenticated, user, hasPermission, hasRoleLevel]);

  // Role shortcuts
  const isAdmin = useCallback((): boolean => {
    return hasRole('admin');
  }, [hasRole]);

  const isInstructor = useCallback((): boolean => {
    return hasRole('instructor') || hasRole('admin');
  }, [hasRole]);

  const isStudent = useCallback((): boolean => {
    return hasRole('student');
  }, [hasRole]);

  // Utility functions
  const getUserPermissions = useCallback((): string[] => {
    if (!isAuthenticated || !user) return [];
    
    const permissions = rbacService.getUserPermissions(user);
    return permissions.map(p => `${p.action}:${p.resource}`);
  }, [isAuthenticated, user]);

  const getAccessibleResources = useCallback((): string[] => {
    if (!isAuthenticated || !user) return [];
    
    const permissions = rbacService.getUserPermissions(user);
    const resources = new Set(permissions.map(p => p.resource));
    return Array.from(resources);
  }, [isAuthenticated, user]);

  const requireAuth = useCallback((): boolean => {
    return isAuthenticated;
  }, [isAuthenticated]);

  // Memoized return object
  return useMemo(() => ({
    // Core functions
    hasPermission,
    checkAccess,
    
    // Role checks
    hasRole,
    hasAnyRole,
    hasRoleLevel,
    
    // Resource access
    canAccessResource,
    canManageResource,
    
    // Specific permissions
    canCreateContent,
    canEditContent,
    canDeleteContent,
    canViewAnalytics,
    canManageUsers,
    canManageSettings,
    canManageApiKeys,
    
    // User-specific
    canEditProfile,
    canViewProfile,
    canViewProgress,
    
    // Role shortcuts
    isAdmin,
    isInstructor,
    isStudent,
    
    // Utility
    getUserPermissions,
    getAccessibleResources,
    requireAuth
  }), [
    hasPermission,
    checkAccess,
    hasRole,
    hasAnyRole,
    hasRoleLevel,
    canAccessResource,
    canManageResource,
    canCreateContent,
    canEditContent,
    canDeleteContent,
    canViewAnalytics,
    canManageUsers,
    canManageSettings,
    canManageApiKeys,
    canEditProfile,
    canViewProfile,
    canViewProgress,
    isAdmin,
    isInstructor,
    isStudent,
    getUserPermissions,
    getAccessibleResources,
    requireAuth
  ]);
}

// Higher-order component for protecting components
export function withAuthorization<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  requirements: {
    roles?: string[];
    permissions?: Array<{ resource: string; action: string }>;
    requireAuth?: boolean;
    fallback?: React.ComponentType;
  }
) {
  return function AuthorizedComponent(props: T) {
    const auth = useAuthorization();
    const { isAuthenticated } = useAuth();

    // Check authentication requirement
    if (requirements.requireAuth !== false && !isAuthenticated) {
      if (requirements.fallback) {
        const FallbackComponent = requirements.fallback;
        return <FallbackComponent />;
      }
      return null;
    }

    // Check role requirements
    if (requirements.roles && !auth.hasAnyRole(requirements.roles)) {
      if (requirements.fallback) {
        const FallbackComponent = requirements.fallback;
        return <FallbackComponent />;
      }
      return null;
    }

    // Check permission requirements
    if (requirements.permissions) {
      const hasAllPermissions = requirements.permissions.every(({ resource, action }) =>
        auth.hasPermission(resource, action)
      );
      
      if (!hasAllPermissions) {
        if (requirements.fallback) {
          const FallbackComponent = requirements.fallback;
          return <FallbackComponent />;
        }
        return null;
      }
    }

    return <Component {...props} />;
  };
}

// Hook for conditional rendering based on permissions
export function useConditionalRender() {
  const auth = useAuthorization();

  return {
    renderIf: (condition: boolean, component: React.ReactNode) => 
      condition ? component : null,
    
    renderIfRole: (roles: string | string[], component: React.ReactNode) => 
      auth.hasAnyRole(Array.isArray(roles) ? roles : [roles]) ? component : null,
    
    renderIfPermission: (resource: string, action: string, component: React.ReactNode, data?: any) => 
      auth.hasPermission(resource, action, data) ? component : null,
    
    renderIfAuth: (component: React.ReactNode) => 
      auth.requireAuth() ? component : null,
    
    renderIfAdmin: (component: React.ReactNode) => 
      auth.isAdmin() ? component : null,
    
    renderIfInstructor: (component: React.ReactNode) => 
      auth.isInstructor() ? component : null
  };
}

export default useAuthorization;
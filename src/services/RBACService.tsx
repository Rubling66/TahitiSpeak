import React from 'react';
import { LoggingService } from './LoggingService';
import { PerformanceMonitoringService } from './PerformanceMonitoringService';

// Types and Interfaces
export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  level: number;
  permissions: Permission[];
  inherits?: string[]; // Role IDs this role inherits from
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions?: Permission[];
  metadata?: Record<string, any>;
}

export interface AccessContext {
  user: User;
  resource: string;
  action: string;
  data?: any;
  conditions?: Record<string, any>;
}

export interface AccessResult {
  granted: boolean;
  reason?: string;
  requiredPermissions?: string[];
  missingPermissions?: string[];
}

// Permission Actions
export const ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  MANAGE: 'manage',
  EXECUTE: 'execute',
  APPROVE: 'approve',
  PUBLISH: 'publish'
} as const;

// Resources
export const RESOURCES = {
  USER: 'user',
  LESSON: 'lesson',
  VOCABULARY: 'vocabulary',
  PROGRESS: 'progress',
  ADMIN: 'admin',
  CONTENT: 'content',
  ANALYTICS: 'analytics',
  SETTINGS: 'settings',
  API_KEY: 'api_key',
  SYSTEM: 'system'
} as const;

// Default Permissions
const DEFAULT_PERMISSIONS: Record<string, Permission[]> = {
  student: [
    {
      id: 'student-read-own-profile',
      name: 'Read Own Profile',
      description: 'Can read own user profile',
      resource: RESOURCES.USER,
      action: ACTIONS.READ,
      conditions: { owner: true }
    },
    {
      id: 'student-update-own-profile',
      name: 'Update Own Profile',
      description: 'Can update own user profile',
      resource: RESOURCES.USER,
      action: ACTIONS.UPDATE,
      conditions: { owner: true }
    },
    {
      id: 'student-read-lessons',
      name: 'Read Lessons',
      description: 'Can read published lessons',
      resource: RESOURCES.LESSON,
      action: ACTIONS.READ,
      conditions: { published: true }
    },
    {
      id: 'student-read-vocabulary',
      name: 'Read Vocabulary',
      description: 'Can read vocabulary items',
      resource: RESOURCES.VOCABULARY,
      action: ACTIONS.READ
    },
    {
      id: 'student-manage-own-progress',
      name: 'Manage Own Progress',
      description: 'Can manage own learning progress',
      resource: RESOURCES.PROGRESS,
      action: ACTIONS.MANAGE,
      conditions: { owner: true }
    }
  ],
  instructor: [
    {
      id: 'instructor-manage-lessons',
      name: 'Manage Lessons',
      description: 'Can create, read, update lessons',
      resource: RESOURCES.LESSON,
      action: ACTIONS.MANAGE
    },
    {
      id: 'instructor-manage-vocabulary',
      name: 'Manage Vocabulary',
      description: 'Can manage vocabulary items',
      resource: RESOURCES.VOCABULARY,
      action: ACTIONS.MANAGE
    },
    {
      id: 'instructor-read-student-progress',
      name: 'Read Student Progress',
      description: 'Can read student progress data',
      resource: RESOURCES.PROGRESS,
      action: ACTIONS.READ
    },
    {
      id: 'instructor-manage-content',
      name: 'Manage Content',
      description: 'Can manage educational content',
      resource: RESOURCES.CONTENT,
      action: ACTIONS.MANAGE
    }
  ],
  admin: [
    {
      id: 'admin-manage-users',
      name: 'Manage Users',
      description: 'Can manage all users',
      resource: RESOURCES.USER,
      action: ACTIONS.MANAGE
    },
    {
      id: 'admin-manage-system',
      name: 'Manage System',
      description: 'Can manage system settings',
      resource: RESOURCES.SYSTEM,
      action: ACTIONS.MANAGE
    },
    {
      id: 'admin-read-analytics',
      name: 'Read Analytics',
      description: 'Can read system analytics',
      resource: RESOURCES.ANALYTICS,
      action: ACTIONS.READ
    },
    {
      id: 'admin-manage-api-keys',
      name: 'Manage API Keys',
      description: 'Can manage API keys',
      resource: RESOURCES.API_KEY,
      action: ACTIONS.MANAGE
    },
    {
      id: 'admin-manage-settings',
      name: 'Manage Settings',
      description: 'Can manage application settings',
      resource: RESOURCES.SETTINGS,
      action: ACTIONS.MANAGE
    }
  ]
};

// Default Roles
const DEFAULT_ROLES: Record<string, Role> = {
  student: {
    id: 'student',
    name: 'Student',
    description: 'Regular student user with basic learning permissions',
    level: 1,
    permissions: DEFAULT_PERMISSIONS.student
  },
  instructor: {
    id: 'instructor',
    name: 'Instructor',
    description: 'Instructor with content management permissions',
    level: 2,
    permissions: [...DEFAULT_PERMISSIONS.student, ...DEFAULT_PERMISSIONS.instructor],
    inherits: ['student']
  },
  admin: {
    id: 'admin',
    name: 'Administrator',
    description: 'Administrator with full system access',
    level: 3,
    permissions: [
      ...DEFAULT_PERMISSIONS.student,
      ...DEFAULT_PERMISSIONS.instructor,
      ...DEFAULT_PERMISSIONS.admin
    ],
    inherits: ['student', 'instructor']
  }
};

class RBACService {
  private roles: Map<string, Role> = new Map();
  private permissions: Map<string, Permission> = new Map();
  private userPermissionCache: Map<string, Permission[]> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.initializeDefaultRoles();
    this.initializeDefaultPermissions();
  }

  private initializeDefaultRoles(): void {
    Object.values(DEFAULT_ROLES).forEach(role => {
      this.roles.set(role.id, role);
    });
  }

  private initializeDefaultPermissions(): void {
    Object.values(DEFAULT_PERMISSIONS).flat().forEach(permission => {
      this.permissions.set(permission.id, permission);
    });
  }

  // Role Management
  public getRole(roleId: string): Role | undefined {
    return this.roles.get(roleId);
  }

  public getAllRoles(): Role[] {
    return Array.from(this.roles.values());
  }

  public createRole(role: Role): void {
    this.roles.set(role.id, role);
    LoggingService.log('info', 'Role created', { roleId: role.id, roleName: role.name });
  }

  public updateRole(roleId: string, updates: Partial<Role>): boolean {
    const role = this.roles.get(roleId);
    if (!role) return false;

    const updatedRole = { ...role, ...updates };
    this.roles.set(roleId, updatedRole);
    this.clearUserCaches(); // Clear caches when roles change
    
    LoggingService.log('info', 'Role updated', { roleId, updates });
    return true;
  }

  public deleteRole(roleId: string): boolean {
    const deleted = this.roles.delete(roleId);
    if (deleted) {
      this.clearUserCaches();
      LoggingService.log('info', 'Role deleted', { roleId });
    }
    return deleted;
  }

  // Permission Management
  public getPermission(permissionId: string): Permission | undefined {
    return this.permissions.get(permissionId);
  }

  public getAllPermissions(): Permission[] {
    return Array.from(this.permissions.values());
  }

  public createPermission(permission: Permission): void {
    this.permissions.set(permission.id, permission);
    LoggingService.log('info', 'Permission created', { permissionId: permission.id });
  }

  // User Permission Resolution
  public getUserPermissions(user: User): Permission[] {
    const cacheKey = `${user.id}-${user.role}`;
    const cached = this.userPermissionCache.get(cacheKey);
    const expiry = this.cacheExpiry.get(cacheKey);

    if (cached && expiry && Date.now() < expiry) {
      return cached;
    }

    const permissions = this.resolveUserPermissions(user);
    this.userPermissionCache.set(cacheKey, permissions);
    this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_TTL);

    return permissions;
  }

  private resolveUserPermissions(user: User): Permission[] {
    const role = this.getRole(user.role);
    if (!role) {
      LoggingService.log('warn', 'User has invalid role', { userId: user.id, role: user.role });
      return [];
    }

    const permissions = new Map<string, Permission>();

    // Add role permissions
    role.permissions.forEach(permission => {
      permissions.set(permission.id, permission);
    });

    // Add inherited permissions
    if (role.inherits) {
      role.inherits.forEach(inheritedRoleId => {
        const inheritedRole = this.getRole(inheritedRoleId);
        if (inheritedRole) {
          inheritedRole.permissions.forEach(permission => {
            permissions.set(permission.id, permission);
          });
        }
      });
    }

    // Add user-specific permissions
    if (user.permissions) {
      user.permissions.forEach(permission => {
        permissions.set(permission.id, permission);
      });
    }

    return Array.from(permissions.values());
  }

  // Access Control
  public checkAccess(context: AccessContext): AccessResult {
    const startTime = performance.now();
    
    try {
      const userPermissions = this.getUserPermissions(context.user);
      const result = this.evaluateAccess(context, userPermissions);
      
      // Log access check
      LoggingService.log('debug', 'Access check performed', {
        userId: context.user.id,
        resource: context.resource,
        action: context.action,
        granted: result.granted,
        reason: result.reason
      });

      return result;
    } finally {
      const duration = performance.now() - startTime;
      PerformanceMonitoringService.recordMetric({
        name: 'rbac_access_check_duration',
        value: duration,
        unit: 'milliseconds',
        tags: {
          resource: context.resource,
          action: context.action,
          userRole: context.user.role
        }
      });
    }
  }

  private evaluateAccess(context: AccessContext, permissions: Permission[]): AccessResult {
    const { resource, action, user, data, conditions } = context;

    // Find matching permissions
    const matchingPermissions = permissions.filter(permission => {
      return this.permissionMatches(permission, resource, action);
    });

    if (matchingPermissions.length === 0) {
      return {
        granted: false,
        reason: 'No matching permissions found',
        requiredPermissions: [`${action}:${resource}`]
      };
    }

    // Check conditions for each matching permission
    for (const permission of matchingPermissions) {
      if (this.evaluateConditions(permission, user, data, conditions)) {
        return { granted: true };
      }
    }

    return {
      granted: false,
      reason: 'Permission conditions not met',
      requiredPermissions: matchingPermissions.map(p => p.id)
    };
  }

  private permissionMatches(permission: Permission, resource: string, action: string): boolean {
    // Exact match
    if (permission.resource === resource && permission.action === action) {
      return true;
    }

    // Wildcard resource
    if (permission.resource === '*' && permission.action === action) {
      return true;
    }

    // Wildcard action
    if (permission.resource === resource && permission.action === '*') {
      return true;
    }

    // Manage action includes all CRUD operations
    if (permission.resource === resource && permission.action === ACTIONS.MANAGE) {
      return [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.DELETE].includes(action as any);
    }

    return false;
  }

  private evaluateConditions(
    permission: Permission,
    user: User,
    data?: any,
    contextConditions?: Record<string, any>
  ): boolean {
    if (!permission.conditions) {
      return true; // No conditions means permission is granted
    }

    // Check owner condition
    if (permission.conditions.owner === true) {
      if (!data || !data.userId || data.userId !== user.id) {
        return false;
      }
    }

    // Check published condition
    if (permission.conditions.published === true) {
      if (!data || !data.published) {
        return false;
      }
    }

    // Check custom conditions
    if (contextConditions) {
      for (const [key, value] of Object.entries(permission.conditions)) {
        if (key !== 'owner' && key !== 'published') {
          if (contextConditions[key] !== value) {
            return false;
          }
        }
      }
    }

    return true;
  }

  // Utility Methods
  public hasPermission(user: User, resource: string, action: string, data?: any): boolean {
    const context: AccessContext = { user, resource, action, data };
    return this.checkAccess(context).granted;
  }

  public hasRole(user: User, roleId: string): boolean {
    return user.role === roleId;
  }

  public hasRoleLevel(user: User, minLevel: number): boolean {
    const role = this.getRole(user.role);
    return role ? role.level >= minLevel : false;
  }

  public canAccessResource(user: User, resource: string): boolean {
    const permissions = this.getUserPermissions(user);
    return permissions.some(permission => 
      permission.resource === resource || permission.resource === '*'
    );
  }

  // Cache Management
  public clearUserCache(userId: string): void {
    const keysToDelete = Array.from(this.userPermissionCache.keys())
      .filter(key => key.startsWith(userId));
    
    keysToDelete.forEach(key => {
      this.userPermissionCache.delete(key);
      this.cacheExpiry.delete(key);
    });
  }

  public clearUserCaches(): void {
    this.userPermissionCache.clear();
    this.cacheExpiry.clear();
  }

  // Role Hierarchy
  public getRoleHierarchy(): Record<string, number> {
    const hierarchy: Record<string, number> = {};
    this.roles.forEach(role => {
      hierarchy[role.id] = role.level;
    });
    return hierarchy;
  }

  public isHigherRole(userRole: string, targetRole: string): boolean {
    const userRoleObj = this.getRole(userRole);
    const targetRoleObj = this.getRole(targetRole);
    
    if (!userRoleObj || !targetRoleObj) return false;
    
    return userRoleObj.level > targetRoleObj.level;
  }
}

// Singleton instance
export const rbacService = new RBACService();

// React Hook
export function useRBAC() {
  return {
    checkAccess: (context: AccessContext) => rbacService.checkAccess(context),
    hasPermission: (user: User, resource: string, action: string, data?: any) => 
      rbacService.hasPermission(user, resource, action, data),
    hasRole: (user: User, roleId: string) => rbacService.hasRole(user, roleId),
    hasRoleLevel: (user: User, minLevel: number) => rbacService.hasRoleLevel(user, minLevel),
    canAccessResource: (user: User, resource: string) => rbacService.canAccessResource(user, resource),
    getUserPermissions: (user: User) => rbacService.getUserPermissions(user),
    getAllRoles: () => rbacService.getAllRoles(),
    getRoleHierarchy: () => rbacService.getRoleHierarchy()
  };
}

// Higher-order component for route protection
export function withRoleProtection<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  requiredRole: string | string[],
  fallbackComponent?: React.ComponentType
) {
  return function ProtectedComponent(props: T) {
    // This would be implemented with actual auth context
    // For now, it's a placeholder structure
    return <Component {...props} />;
  };
}

export default rbacService;
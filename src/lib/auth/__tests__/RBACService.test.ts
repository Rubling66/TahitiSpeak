import { rbacService } from '../../../services/RBACService';

// Create a mock RBACService class for testing
class RBACService {
  async hasPermission(userId: string, permission: string): Promise<boolean> {
    return false;
  }
  
  async hasAnyPermission(userId: string, permissions: string[]): Promise<boolean> {
    return false;
  }
  
  async hasAllPermissions(userId: string, permissions: string[]): Promise<boolean> {
    return false;
  }
  
  async getUserPermissions(userId: string): Promise<any[]> {
    return [];
  }
  
  async getCurrentUserPermissions(): Promise<any[]> {
    return [];
  }
  
  async isCurrentUserAdmin(): Promise<boolean> {
    return false;
  }
}
import { createClient } from '@supabase/supabase-js';

// Mock Supabase
jest.mock('@supabase/supabase-js');

const mockSupabase = {
  from: jest.fn(),
  rpc: jest.fn(),
  auth: {
    getSession: jest.fn(),
    getUser: jest.fn(),
  },
};

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
mockCreateClient.mockReturnValue(mockSupabase as any);

const mockQuery = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  single: jest.fn(),
};

const mockUser = {
  id: 'user-123',
  email: 'user@example.com',
  role: 'student',
  permissions: ['courses.view', 'lessons.view'],
  isActive: true,
};

const mockAdminUser = {
  id: 'admin-123',
  email: 'admin@example.com',
  role: 'super_admin',
  permissions: ['*'],
  isActive: true,
};

const mockRole = {
  id: 'role-1',
  name: 'student',
  description: 'Student role with basic permissions',
  permissions: ['courses.view', 'lessons.view', 'progress.update'],
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPermission = {
  id: 'perm-1',
  name: 'courses.view',
  description: 'View courses',
  resource: 'courses',
  action: 'view',
  isActive: true,
};

describe('RBACService', () => {
  let rbacService: RBACService;

  beforeEach(() => {
    jest.clearAllMocks();
    rbacService = new RBACService();
    
    mockSupabase.from.mockReturnValue(mockQuery);
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-123' } } },
      error: null,
    });
  });

  describe('hasPermission', () => {
    it('returns true for super admin with wildcard permission', async () => {
      mockQuery.single.mockResolvedValue({ data: mockAdminUser, error: null });

      const result = await rbacService.hasPermission('user-123', 'courses.delete');

      expect(result).toBe(true);
    });

    it('returns true when user has specific permission', async () => {
      mockQuery.single.mockResolvedValue({ data: mockUser, error: null });

      const result = await rbacService.hasPermission('user-123', 'courses.view');

      expect(result).toBe(true);
    });

    it('returns false when user lacks permission', async () => {
      mockQuery.single.mockResolvedValue({ data: mockUser, error: null });

      const result = await rbacService.hasPermission('user-123', 'courses.delete');

      expect(result).toBe(false);
    });

    it('returns false when user is not found', async () => {
      mockQuery.single.mockResolvedValue({ data: null, error: null });

      const result = await rbacService.hasPermission('user-123', 'courses.view');

      expect(result).toBe(false);
    });

    it('returns false when user is inactive', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      mockQuery.single.mockResolvedValue({ data: inactiveUser, error: null });

      const result = await rbacService.hasPermission('user-123', 'courses.view');

      expect(result).toBe(false);
    });

    it('throws error when database query fails', async () => {
      const error = new Error('Database error');
      mockQuery.single.mockResolvedValue({ data: null, error });

      await expect(
        rbacService.hasPermission('user-123', 'courses.view')
      ).rejects.toThrow('Failed to check permission: Database error');
    });
  });

  describe('hasAnyPermission', () => {
    it('returns true when user has at least one permission', async () => {
      mockQuery.single.mockResolvedValue({ data: mockUser, error: null });

      const result = await rbacService.hasAnyPermission('user-123', [
        'courses.delete',
        'courses.view',
        'admin.access',
      ]);

      expect(result).toBe(true);
    });

    it('returns false when user has none of the permissions', async () => {
      mockQuery.single.mockResolvedValue({ data: mockUser, error: null });

      const result = await rbacService.hasAnyPermission('user-123', [
        'courses.delete',
        'admin.access',
        'users.manage',
      ]);

      expect(result).toBe(false);
    });

    it('returns false for empty permissions array', async () => {
      mockQuery.single.mockResolvedValue({ data: mockUser, error: null });

      const result = await rbacService.hasAnyPermission('user-123', []);

      expect(result).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('returns true when user has all permissions', async () => {
      mockQuery.single.mockResolvedValue({ data: mockUser, error: null });

      const result = await rbacService.hasAllPermissions('user-123', [
        'courses.view',
        'lessons.view',
      ]);

      expect(result).toBe(true);
    });

    it('returns false when user lacks some permissions', async () => {
      mockQuery.single.mockResolvedValue({ data: mockUser, error: null });

      const result = await rbacService.hasAllPermissions('user-123', [
        'courses.view',
        'courses.delete',
        'lessons.view',
      ]);

      expect(result).toBe(false);
    });

    it('returns true for empty permissions array', async () => {
      mockQuery.single.mockResolvedValue({ data: mockUser, error: null });

      const result = await rbacService.hasAllPermissions('user-123', []);

      expect(result).toBe(true);
    });
  });

  describe('getUserPermissions', () => {
    it('returns user permissions successfully', async () => {
      mockQuery.single.mockResolvedValue({ data: mockUser, error: null });

      const result = await rbacService.getUserPermissions('user-123');

      expect(result).toEqual(['courses.view', 'lessons.view']);
    });

    it('returns empty array when user not found', async () => {
      mockQuery.single.mockResolvedValue({ data: null, error: null });

      const result = await rbacService.getUserPermissions('user-123');

      expect(result).toEqual([]);
    });

    it('throws error when database query fails', async () => {
      const error = new Error('Database error');
      mockQuery.single.mockResolvedValue({ data: null, error });

      await expect(
        rbacService.getUserPermissions('user-123')
      ).rejects.toThrow('Failed to get user permissions: Database error');
    });
  });

  describe('getUserRole', () => {
    it('returns user role successfully', async () => {
      mockQuery.single.mockResolvedValue({ data: mockUser, error: null });

      const result = await rbacService.getUserRole('user-123');

      expect(result).toBe('student');
    });

    it('returns null when user not found', async () => {
      mockQuery.single.mockResolvedValue({ data: null, error: null });

      const result = await rbacService.getUserRole('user-123');

      expect(result).toBeNull();
    });
  });

  describe('assignRole', () => {
    it('assigns role to user successfully', async () => {
      mockQuery.update.mockResolvedValue({ data: { ...mockUser, role: 'instructor' }, error: null });

      await rbacService.assignRole('user-123', 'instructor');

      expect(mockSupabase.from).toHaveBeenCalledWith('users');
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'user-123');
      expect(mockQuery.update).toHaveBeenCalledWith({ role: 'instructor' });
    });

    it('throws error when role assignment fails', async () => {
      const error = new Error('Update failed');
      mockQuery.update.mockResolvedValue({ data: null, error });

      await expect(
        rbacService.assignRole('user-123', 'instructor')
      ).rejects.toThrow('Failed to assign role: Update failed');
    });
  });

  describe('revokeRole', () => {
    it('revokes role from user successfully', async () => {
      mockQuery.update.mockResolvedValue({ data: { ...mockUser, role: null }, error: null });

      await rbacService.revokeRole('user-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('users');
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'user-123');
      expect(mockQuery.update).toHaveBeenCalledWith({ role: null });
    });

    it('throws error when role revocation fails', async () => {
      const error = new Error('Update failed');
      mockQuery.update.mockResolvedValue({ data: null, error });

      await expect(
        rbacService.revokeRole('user-123')
      ).rejects.toThrow('Failed to revoke role: Update failed');
    });
  });

  describe('createRole', () => {
    const newRole = {
      name: 'instructor',
      description: 'Instructor role',
      permissions: ['courses.create', 'courses.edit', 'lessons.create'],
    };

    it('creates role successfully', async () => {
      const createdRole = { id: 'role-2', ...newRole, isActive: true };
      mockQuery.insert.mockResolvedValue({ data: createdRole, error: null });

      const result = await rbacService.createRole(newRole);

      expect(result).toEqual(createdRole);
      expect(mockSupabase.from).toHaveBeenCalledWith('roles');
      expect(mockQuery.insert).toHaveBeenCalledWith(newRole);
    });

    it('throws error when role creation fails', async () => {
      const error = new Error('Insert failed');
      mockQuery.insert.mockResolvedValue({ data: null, error });

      await expect(
        rbacService.createRole(newRole)
      ).rejects.toThrow('Failed to create role: Insert failed');
    });
  });

  describe('updateRole', () => {
    const updates = {
      description: 'Updated instructor role',
      permissions: ['courses.create', 'courses.edit', 'lessons.create', 'lessons.edit'],
    };

    it('updates role successfully', async () => {
      const updatedRole = { ...mockRole, ...updates };
      mockQuery.update.mockResolvedValue({ data: updatedRole, error: null });

      const result = await rbacService.updateRole('role-1', updates);

      expect(result).toEqual(updatedRole);
      expect(mockSupabase.from).toHaveBeenCalledWith('roles');
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'role-1');
      expect(mockQuery.update).toHaveBeenCalledWith(updates);
    });

    it('throws error when role update fails', async () => {
      const error = new Error('Update failed');
      mockQuery.update.mockResolvedValue({ data: null, error });

      await expect(
        rbacService.updateRole('role-1', updates)
      ).rejects.toThrow('Failed to update role: Update failed');
    });
  });

  describe('deleteRole', () => {
    it('deletes role successfully', async () => {
      mockQuery.delete.mockResolvedValue({ data: {}, error: null });

      await rbacService.deleteRole('role-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('roles');
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'role-1');
      expect(mockQuery.delete).toHaveBeenCalled();
    });

    it('throws error when role deletion fails', async () => {
      const error = new Error('Delete failed');
      mockQuery.delete.mockResolvedValue({ data: null, error });

      await expect(
        rbacService.deleteRole('role-1')
      ).rejects.toThrow('Failed to delete role: Delete failed');
    });
  });

  describe('getAllRoles', () => {
    const mockRoles = [
      mockRole,
      {
        id: 'role-2',
        name: 'instructor',
        description: 'Instructor role',
        permissions: ['courses.create', 'courses.edit'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('returns all roles successfully', async () => {
      mockQuery.select.mockResolvedValue({ data: mockRoles, error: null });

      const result = await rbacService.getAllRoles();

      expect(result).toEqual(mockRoles);
      expect(mockSupabase.from).toHaveBeenCalledWith('roles');
    });

    it('returns only active roles when specified', async () => {
      const activeRoles = mockRoles.filter(role => role.isActive);
      mockQuery.select.mockResolvedValue({ data: activeRoles, error: null });

      const result = await rbacService.getAllRoles(true);

      expect(result).toEqual(activeRoles);
      expect(mockQuery.eq).toHaveBeenCalledWith('isActive', true);
    });

    it('throws error when roles fetch fails', async () => {
      const error = new Error('Fetch failed');
      mockQuery.select.mockResolvedValue({ data: null, error });

      await expect(
        rbacService.getAllRoles()
      ).rejects.toThrow('Failed to get roles: Fetch failed');
    });
  });

  describe('getAllPermissions', () => {
    const mockPermissions = [
      mockPermission,
      {
        id: 'perm-2',
        name: 'courses.create',
        description: 'Create courses',
        resource: 'courses',
        action: 'create',
        isActive: true,
      },
    ];

    it('returns all permissions successfully', async () => {
      mockQuery.select.mockResolvedValue({ data: mockPermissions, error: null });

      const result = await rbacService.getAllPermissions();

      expect(result).toEqual(mockPermissions);
      expect(mockSupabase.from).toHaveBeenCalledWith('permissions');
    });

    it('throws error when permissions fetch fails', async () => {
      const error = new Error('Fetch failed');
      mockQuery.select.mockResolvedValue({ data: null, error });

      await expect(
        rbacService.getAllPermissions()
      ).rejects.toThrow('Failed to get permissions: Fetch failed');
    });
  });

  describe('checkResourceAccess', () => {
    it('returns true when user has access to resource', async () => {
      mockQuery.single.mockResolvedValue({ data: mockUser, error: null });

      const result = await rbacService.checkResourceAccess('user-123', 'courses', 'view');

      expect(result).toBe(true);
    });

    it('returns false when user lacks access to resource', async () => {
      mockQuery.single.mockResolvedValue({ data: mockUser, error: null });

      const result = await rbacService.checkResourceAccess('user-123', 'courses', 'delete');

      expect(result).toBe(false);
    });

    it('handles wildcard permissions correctly', async () => {
      mockQuery.single.mockResolvedValue({ data: mockAdminUser, error: null });

      const result = await rbacService.checkResourceAccess('admin-123', 'anything', 'delete');

      expect(result).toBe(true);
    });
  });

  describe('getCurrentUserPermissions', () => {
    it('returns current user permissions successfully', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
        error: null,
      });
      mockQuery.single.mockResolvedValue({ data: mockUser, error: null });

      const result = await rbacService.getCurrentUserPermissions();

      expect(result).toEqual(['courses.view', 'lessons.view']);
    });

    it('returns empty array when no session', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const result = await rbacService.getCurrentUserPermissions();

      expect(result).toEqual([]);
    });

    it('throws error when session fetch fails', async () => {
      const error = new Error('Session error');
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error,
      });

      await expect(
        rbacService.getCurrentUserPermissions()
      ).rejects.toThrow('Failed to get current user permissions: Session error');
    });
  });

  describe('isCurrentUserAdmin', () => {
    it('returns true for admin user', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'admin-123' } } },
        error: null,
      });
      mockQuery.single.mockResolvedValue({ data: mockAdminUser, error: null });

      const result = await rbacService.isCurrentUserAdmin();

      expect(result).toBe(true);
    });

    it('returns false for non-admin user', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
        error: null,
      });
      mockQuery.single.mockResolvedValue({ data: mockUser, error: null });

      const result = await rbacService.isCurrentUserAdmin();

      expect(result).toBe(false);
    });

    it('returns false when no session', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const result = await rbacService.isCurrentUserAdmin();

      expect(result).toBe(false);
    });
  });
});
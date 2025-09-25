// Security service for API key management and audit logging

import CryptoJS from 'crypto-js';

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  action: 'view' | 'edit' | 'test' | 'create' | 'delete';
  resource: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface UserRole {
  id: string;
  name: string;
  permissions: Permission[];
}

export interface Permission {
  resource: string;
  actions: string[];
}

export interface EncryptedApiKey {
  encrypted: string;
  iv: string;
  keyName: string;
  lastModified: Date;
}

class SecurityService {
  private static instance: SecurityService;
  private auditLogs: AuditLogEntry[] = [];
  private encryptionKey: string;
  
  // Default roles and permissions
  private roles: UserRole[] = [
    {
      id: 'super-admin',
      name: 'Super Administrator',
      permissions: [
        { resource: 'api-keys', actions: ['view', 'edit', 'test', 'create', 'delete'] },
        { resource: 'audit-logs', actions: ['view'] },
        { resource: 'user-management', actions: ['view', 'edit', 'create', 'delete'] }
      ]
    },
    {
      id: 'admin',
      name: 'Administrator',
      permissions: [
        { resource: 'api-keys', actions: ['view', 'edit', 'test'] },
        { resource: 'audit-logs', actions: ['view'] }
      ]
    },
    {
      id: 'viewer',
      name: 'Viewer',
      permissions: [
        { resource: 'api-keys', actions: ['view'] }
      ]
    }
  ];

  private constructor() {
    // Generate or retrieve encryption key
    this.encryptionKey = this.getOrCreateEncryptionKey();
    this.loadAuditLogs();
  }

  public static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  // Encryption methods
  private getOrCreateEncryptionKey(): string {
    let key = localStorage.getItem('tahitian-tutor-encryption-key');
    if (!key) {
      key = CryptoJS.lib.WordArray.random(256/8).toString();
      localStorage.setItem('tahitian-tutor-encryption-key', key);
    }
    return key;
  }

  public encryptApiKey(apiKey: string, keyName: string): EncryptedApiKey {
    const iv = CryptoJS.lib.WordArray.random(128/8);
    const encrypted = CryptoJS.AES.encrypt(apiKey, this.encryptionKey, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    const result: EncryptedApiKey = {
      encrypted: encrypted.toString(),
      iv: iv.toString(),
      keyName,
      lastModified: new Date()
    };

    this.logAuditEvent('create', `api-key:${keyName}`, 'API key encrypted and stored');
    return result;
  }

  public decryptApiKey(encryptedKey: EncryptedApiKey): string {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedKey.encrypted, this.encryptionKey, {
        iv: CryptoJS.enc.Hex.parse(encryptedKey.iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
      this.logAuditEvent('view', `api-key:${encryptedKey.keyName}`, 'API key decrypted for use');
      return decryptedString;
    } catch (error) {
      this.logAuditEvent('view', `api-key:${encryptedKey.keyName}`, 'Failed to decrypt API key', error instanceof Error ? error.message : 'Unknown error');
      throw new Error('Failed to decrypt API key');
    }
  }

  // Audit logging methods
  public logAuditEvent(
    action: AuditLogEntry['action'],
    resource: string,
    details?: string,
    error?: string
  ): void {
    const entry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      userId: this.getCurrentUserId(),
      action,
      resource,
      details: error ? `${details} - Error: ${error}` : details,
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent
    };

    this.auditLogs.push(entry);
    this.saveAuditLogs();

    // In production, also send to secure logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToSecureLogging(entry);
    }
  }

  public getAuditLogs(filters?: {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
  }): AuditLogEntry[] {
    let filteredLogs = [...this.auditLogs];

    if (filters) {
      if (filters.userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
      }
      if (filters.action) {
        filteredLogs = filteredLogs.filter(log => log.action === filters.action);
      }
      if (filters.resource) {
        filteredLogs = filteredLogs.filter(log => log.resource.includes(filters.resource));
      }
      if (filters.startDate) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.endDate!);
      }
    }

    return filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Role-based access control
  public hasPermission(userId: string, resource: string, action: string): boolean {
    const userRole = this.getUserRole(userId);
    if (!userRole) return false;

    const permission = userRole.permissions.find(p => p.resource === resource);
    return permission ? permission.actions.includes(action) : false;
  }

  public getUserRole(userId: string): UserRole | null {
    // In a real implementation, this would fetch from a database
    // For now, return admin role for demo purposes
    return this.roles.find(role => role.id === 'admin') || null;
  }

  public getAllRoles(): UserRole[] {
    return [...this.roles];
  }

  public createRole(role: Omit<UserRole, 'id'>): UserRole {
    const newRole: UserRole = {
      ...role,
      id: `role-${Date.now()}`
    };
    this.roles.push(newRole);
    this.logAuditEvent('create', `role:${newRole.id}`, `Created role: ${newRole.name}`);
    return newRole;
  }

  public updateRole(roleId: string, updates: Partial<UserRole>): UserRole {
    const roleIndex = this.roles.findIndex(r => r.id === roleId);
    if (roleIndex === -1) {
      throw new Error('Role not found');
    }

    this.roles[roleIndex] = { ...this.roles[roleIndex], ...updates };
    this.logAuditEvent('edit', `role:${roleId}`, `Updated role: ${this.roles[roleIndex].name}`);
    return this.roles[roleIndex];
  }

  public deleteRole(roleId: string): void {
    const roleIndex = this.roles.findIndex(r => r.id === roleId);
    if (roleIndex === -1) {
      throw new Error('Role not found');
    }

    const roleName = this.roles[roleIndex].name;
    this.roles.splice(roleIndex, 1);
    this.logAuditEvent('delete', `role:${roleId}`, `Deleted role: ${roleName}`);
  }

  // Secure transmission methods
  public async secureApiCall(url: string, options: RequestInit = {}): Promise<Response> {
    const secureOptions: RequestInit = {
      ...options,
      headers: {
        ...options.headers,
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-Token': this.getCSRFToken(),
        'Content-Type': 'application/json'
      }
    };

    // Add request signature for additional security
    const signature = this.generateRequestSignature(url, secureOptions);
    secureOptions.headers = {
      ...secureOptions.headers,
      'X-Request-Signature': signature
    };

    try {
      const response = await fetch(url, secureOptions);
      this.logAuditEvent('view', `api-call:${url}`, `API call completed with status: ${response.status}`);
      return response;
    } catch (error) {
      this.logAuditEvent('view', `api-call:${url}`, 'API call failed', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  // Private helper methods
  private getCurrentUserId(): string {
    // In a real implementation, get from authentication context
    if (typeof window === 'undefined') return 'anonymous';
    return localStorage.getItem('current-user-id') || 'anonymous';
  }

  private getClientIP(): string {
    // In a real implementation, this would be handled server-side
    return 'client-ip-not-available';
  }

  private getCSRFToken(): string {
    // Generate or retrieve CSRF token
    if (typeof window === 'undefined') {
      return CryptoJS.lib.WordArray.random(128/8).toString();
    }
    
    let token = sessionStorage.getItem('csrf-token');
    if (!token) {
      token = CryptoJS.lib.WordArray.random(128/8).toString();
      sessionStorage.setItem('csrf-token', token);
    }
    return token;
  }

  private generateRequestSignature(url: string, options: RequestInit): string {
    const payload = JSON.stringify({
      url,
      method: options.method || 'GET',
      timestamp: Date.now()
    });
    return CryptoJS.HmacSHA256(payload, this.encryptionKey).toString();
  }

  private loadAuditLogs(): void {
    if (typeof window === 'undefined') {
      this.auditLogs = [];
      return;
    }
    
    try {
      const stored = localStorage.getItem('tahitian-tutor-audit-logs');
      if (stored) {
        this.auditLogs = JSON.parse(stored).map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }));
      }
    } catch (error) {
      console.warn('Failed to load audit logs:', error);
      this.auditLogs = [];
    }
  }

  private saveAuditLogs(): void {
    if (typeof window === 'undefined') return;
    
    try {
      // Keep only last 1000 entries to prevent storage bloat
      const logsToSave = this.auditLogs.slice(-1000);
      localStorage.setItem('tahitian-tutor-audit-logs', JSON.stringify(logsToSave));
    } catch (error) {
      console.warn('Failed to save audit logs:', error);
    }
  }

  private async sendToSecureLogging(entry: AuditLogEntry): Promise<void> {
    try {
      // In production, send to secure logging service
      await this.secureApiCall('/api/audit-logs', {
        method: 'POST',
        body: JSON.stringify(entry)
      });
    } catch (error) {
      console.warn('Failed to send audit log to secure service:', error);
    }
  }

  // Key rotation methods
  public rotateEncryptionKey(): void {
    const oldKey = this.encryptionKey;
    this.encryptionKey = CryptoJS.lib.WordArray.random(256/8).toString();
    localStorage.setItem('tahitian-tutor-encryption-key', this.encryptionKey);
    
    this.logAuditEvent('edit', 'encryption-key', 'Encryption key rotated');
    
    // In a real implementation, re-encrypt all stored keys with new key
    console.warn('Key rotation completed. All encrypted data should be re-encrypted with the new key.');
  }

  public getSecurityMetrics(): {
    totalAuditLogs: number;
    recentActivity: number;
    failedAttempts: number;
    lastKeyRotation: Date | null;
  } {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    return {
      totalAuditLogs: this.auditLogs.length,
      recentActivity: this.auditLogs.filter(log => log.timestamp >= last24Hours).length,
      failedAttempts: this.auditLogs.filter(log => 
        log.details?.includes('Failed') || log.details?.includes('Error')
      ).length,
      lastKeyRotation: null // Would track actual rotation dates in production
    };
  }
}

export const securityService = SecurityService.getInstance();
export default SecurityService;
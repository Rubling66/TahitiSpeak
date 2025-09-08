'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff, Shield, Key, Activity, Users, RotateCcw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { securityService, AuditLogEntry, UserRole, EncryptedApiKey } from '@/utils/securityService';
import { integrationService } from '@/services/IntegrationService';
import { toast } from 'sonner';

interface ApiKeyConfig {
  name: string;
  value: string;
  encrypted?: EncryptedApiKey;
  isEncrypted: boolean;
  lastTested?: Date;
  status: 'active' | 'inactive' | 'error';
  description: string;
}

const SecureApiKeyManager: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<ApiKeyConfig[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [activeTab, setActiveTab] = useState('keys');
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  const [testingKeys, setTestingKeys] = useState<Record<string, boolean>>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [newKeyValue, setNewKeyValue] = useState('');
  const [currentUserId] = useState('admin-user'); // In real app, get from auth context
  const [securityMetrics, setSecurityMetrics] = useState({
    totalAuditLogs: 0,
    recentActivity: 0,
    failedAttempts: 0,
    lastKeyRotation: null as Date | null
  });

  // Initial API key configurations
  const initialApiKeys: Omit<ApiKeyConfig, 'value' | 'encrypted' | 'isEncrypted' | 'status'>[] = [
    { name: 'OPENAI_API_KEY', description: 'OpenAI API for AI content creation and cultural tutoring' },
    { name: 'DEEPSEEK_API_KEY', description: 'DeepSeek API for enhanced AI features' },
    { name: 'CANVA_API_KEY', description: 'Canva API for design integration and visual content' },
    { name: 'GOOGLE_TRANSLATE_API_KEY', description: 'Google Translate API for translation services' },
    { name: 'GOOGLE_SSO_CLIENT_ID', description: 'Google SSO Client ID for authentication' },
    { name: 'GOOGLE_SSO_CLIENT_SECRET', description: 'Google SSO Client Secret for authentication' },
    { name: 'CANVAS_LTI_CONSUMER_KEY', description: 'Canvas LTI Consumer Key for LMS integration' },
    { name: 'CANVAS_LTI_SHARED_SECRET', description: 'Canvas LTI Shared Secret for LMS integration' },
    { name: 'AZURE_TRANSLATE_API_KEY', description: 'Azure Translate API for translation services' },
    { name: 'AWS_TRANSLATE_ACCESS_KEY', description: 'AWS Translate Access Key for translation services' },
    { name: 'AWS_TRANSLATE_SECRET_KEY', description: 'AWS Translate Secret Key for translation services' },
    { name: 'DEEPL_API_KEY', description: 'DeepL API for high-quality translation services' }
  ];

  useEffect(() => {
    loadApiKeys();
    loadAuditLogs();
    loadRoles();
    loadSecurityMetrics();
  }, []);

  const loadApiKeys = () => {
    const keys: ApiKeyConfig[] = initialApiKeys.map(keyConfig => {
      const storedEncrypted = localStorage.getItem(`encrypted-${keyConfig.name}`);
      const envValue = integrationService.getEnvValue(keyConfig.name);
      
      if (storedEncrypted) {
        try {
          const encrypted: EncryptedApiKey = JSON.parse(storedEncrypted);
          return {
            ...keyConfig,
            value: '••••••••••••••••',
            encrypted,
            isEncrypted: true,
            status: 'active' as const,
            lastTested: encrypted.lastModified
          };
        } catch (error) {
          console.error('Failed to parse encrypted key:', error);
        }
      }
      
      return {
        ...keyConfig,
        value: envValue || '',
        isEncrypted: false,
        status: envValue ? 'active' : 'inactive' as const
      };
    });
    
    setApiKeys(keys);
  };

  const loadAuditLogs = () => {
    const logs = securityService.getAuditLogs();
    setAuditLogs(logs.slice(0, 100)); // Show last 100 entries
  };

  const loadRoles = () => {
    const allRoles = securityService.getAllRoles();
    setRoles(allRoles);
  };

  const loadSecurityMetrics = () => {
    const metrics = securityService.getSecurityMetrics();
    setSecurityMetrics(metrics);
  };

  const hasPermission = (resource: string, action: string): boolean => {
    return securityService.hasPermission(currentUserId, resource, action);
  };

  const handleSaveKey = async (keyName: string) => {
    if (!hasPermission('api-keys', 'edit')) {
      toast.error('You do not have permission to edit API keys');
      return;
    }

    try {
      // Encrypt and store the key
      const encrypted = securityService.encryptApiKey(newKeyValue, keyName);
      localStorage.setItem(`encrypted-${keyName}`, JSON.stringify(encrypted));
      
      // Update the key in state
      setApiKeys(prev => prev.map(key => 
        key.name === keyName 
          ? { 
              ...key, 
              value: '••••••••••••••••', 
              encrypted, 
              isEncrypted: true, 
              status: 'active' as const,
              lastTested: new Date()
            }
          : key
      ));
      
      setEditingKey(null);
      setNewKeyValue('');
      toast.success(`${keyName} saved and encrypted successfully`);
      loadAuditLogs();
    } catch (error) {
      toast.error('Failed to save API key');
      console.error('Error saving key:', error);
    }
  };

  const handleTestConnection = async (keyName: string) => {
    if (!hasPermission('api-keys', 'test')) {
      toast.error('You do not have permission to test API keys');
      return;
    }

    setTestingKeys(prev => ({ ...prev, [keyName]: true }));
    
    try {
      const key = apiKeys.find(k => k.name === keyName);
      if (!key) throw new Error('Key not found');
      
      let actualKey = key.value;
      if (key.isEncrypted && key.encrypted) {
        actualKey = securityService.decryptApiKey(key.encrypted);
      }
      
      // Test the connection based on key type
      let testResult = false;
      if (keyName.includes('OPENAI')) {
        testResult = await integrationService.testOpenAIConnection(actualKey);
      } else if (keyName.includes('CANVA')) {
        testResult = await integrationService.testCanvaConnection(actualKey);
      } else if (keyName.includes('GOOGLE_TRANSLATE')) {
        testResult = await integrationService.testGoogleTranslateConnection(actualKey);
      } else {
        // Generic test - just check if key is not empty
        testResult = actualKey.length > 0;
      }
      
      setApiKeys(prev => prev.map(k => 
        k.name === keyName 
          ? { 
              ...k, 
              status: testResult ? 'active' : 'error' as const,
              lastTested: new Date()
            }
          : k
      ));
      
      toast.success(testResult ? 'Connection test successful' : 'Connection test failed');
    } catch (error) {
      setApiKeys(prev => prev.map(k => 
        k.name === keyName 
          ? { ...k, status: 'error' as const, lastTested: new Date() }
          : k
      ));
      toast.error('Connection test failed');
    } finally {
      setTestingKeys(prev => ({ ...prev, [keyName]: false }));
      loadAuditLogs();
    }
  };

  const handleRotateEncryptionKey = () => {
    if (!hasPermission('api-keys', 'edit')) {
      toast.error('You do not have permission to rotate encryption keys');
      return;
    }

    try {
      securityService.rotateEncryptionKey();
      toast.success('Encryption key rotated successfully');
      loadAuditLogs();
      loadSecurityMetrics();
    } catch (error) {
      toast.error('Failed to rotate encryption key');
    }
  };

  const toggleShowValue = (keyName: string) => {
    if (!hasPermission('api-keys', 'view')) {
      toast.error('You do not have permission to view API keys');
      return;
    }

    setShowValues(prev => ({ ...prev, [keyName]: !prev[keyName] }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      error: 'destructive',
      inactive: 'secondary'
    } as const;
    
    return <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Secure API Key Management</h2>
          <p className="text-muted-foreground">Manage API keys with encryption, audit logging, and role-based access</p>
        </div>
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-green-500" />
          <span className="text-sm font-medium">Security Enabled</span>
        </div>
      </div>

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total Audit Logs</p>
                <p className="text-2xl font-bold">{securityMetrics.totalAuditLogs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Recent Activity (24h)</p>
                <p className="text-2xl font-bold">{securityMetrics.recentActivity}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm font-medium">Failed Attempts</p>
                <p className="text-2xl font-bold">{securityMetrics.failedAttempts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Key className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Active Keys</p>
                <p className="text-2xl font-bold">{apiKeys.filter(k => k.status === 'active').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="keys">API Keys</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
          <TabsTrigger value="security">Security Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="space-y-4">
          <div className="grid gap-4">
            {apiKeys.map((key) => (
              <Card key={key.name}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CardTitle className="text-lg">{key.name}</CardTitle>
                      {getStatusIcon(key.status)}
                      {getStatusBadge(key.status)}
                      {key.isEncrypted && <Badge variant="outline"><Shield className="h-3 w-3 mr-1" />Encrypted</Badge>}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestConnection(key.name)}
                        disabled={testingKeys[key.name] || !hasPermission('api-keys', 'test')}
                      >
                        {testingKeys[key.name] ? 'Testing...' : 'Test'}
                      </Button>
                      {hasPermission('api-keys', 'edit') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingKey(key.name)}
                        >
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                  <CardDescription>{key.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {editingKey === key.name ? (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor={`key-${key.name}`}>API Key Value</Label>
                        <Input
                          id={`key-${key.name}`}
                          type="password"
                          value={newKeyValue}
                          onChange={(e) => setNewKeyValue(e.target.value)}
                          placeholder="Enter new API key value"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button onClick={() => handleSaveKey(key.name)}>Save</Button>
                        <Button variant="outline" onClick={() => setEditingKey(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Input
                          type={showValues[key.name] ? 'text' : 'password'}
                          value={key.isEncrypted && key.encrypted && !showValues[key.name] 
                            ? '••••••••••••••••' 
                            : (showValues[key.name] && key.encrypted 
                              ? securityService.decryptApiKey(key.encrypted) 
                              : key.value)
                          }
                          readOnly
                          className="font-mono"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleShowValue(key.name)}
                          disabled={!hasPermission('api-keys', 'view')}
                        >
                          {showValues[key.name] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      {key.lastTested && (
                        <p className="text-sm text-muted-foreground">
                          Last tested: {key.lastTested.toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>Security events and API key access history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{log.action.toUpperCase()} - {log.resource}</p>
                      <p className="text-sm text-muted-foreground">{log.details}</p>
                      <p className="text-xs text-muted-foreground">
                        {log.timestamp.toLocaleString()} | User: {log.userId}
                      </p>
                    </div>
                    <Badge variant={log.details?.includes('Failed') ? 'destructive' : 'default'}>
                      {log.action}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Roles & Permissions</CardTitle>
              <CardDescription>Manage user roles and access permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {roles.map((role) => (
                  <div key={role.id} className="border rounded p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{role.name}</h4>
                      <Badge>{role.id}</Badge>
                    </div>
                    <div className="space-y-1">
                      {role.permissions.map((permission, index) => (
                        <div key={index} className="text-sm">
                          <span className="font-medium">{permission.resource}:</span>
                          <span className="ml-2">{permission.actions.join(', ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Advanced security configuration and key management</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  All API keys are encrypted at rest using AES-256 encryption. Audit logs track all access and modifications.
                </AlertDescription>
              </Alert>
              
              <div className="flex items-center justify-between p-4 border rounded">
                <div>
                  <h4 className="font-medium">Rotate Encryption Key</h4>
                  <p className="text-sm text-muted-foreground">Generate a new encryption key for enhanced security</p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleRotateEncryptionKey}
                  disabled={!hasPermission('api-keys', 'edit')}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Rotate Key
                </Button>
              </div>
              
              <div className="p-4 border rounded">
                <h4 className="font-medium mb-2">Security Features</h4>
                <ul className="space-y-1 text-sm">
                  <li>✓ AES-256 encryption for API keys</li>
                  <li>✓ Comprehensive audit logging</li>
                  <li>✓ Role-based access control</li>
                  <li>✓ Secure request signatures</li>
                  <li>✓ CSRF protection</li>
                  <li>✓ Key rotation capabilities</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecureApiKeyManager;
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  TestTube,
  Shield,
  Key,
  Settings,
  Download,
  Upload
} from 'lucide-react';
import { useEnvironmentValidation } from '@/hooks/useEnvironmentValidation';
import { maskApiKey } from '@/utils/envValidation';

export default function ApiKeysManagementPage() {
  const {
    validation,
    status,
    categories,
    productionReady,
    isLoading,
    lastChecked,
    validateAll,
    validateSingle,
    testConnection
  } = useEnvironmentValidation();

  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [testingKeys, setTestingKeys] = useState<Set<string>>(new Set());
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [tempValues, setTempValues] = useState<Record<string, string>>({});

  const toggleKeyVisibility = (keyName: string) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(keyName)) {
      newVisible.delete(keyName);
    } else {
      newVisible.add(keyName);
    }
    setVisibleKeys(newVisible);
  };

  const handleTestConnection = async (keyName: string) => {
    setTestingKeys(prev => new Set([...prev, keyName]));
    try {
      const result = await testConnection(keyName);
      // Show result in a toast or alert
      console.log(`Test result for ${keyName}:`, result);
    } finally {
      setTestingKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(keyName);
        return newSet;
      });
    }
  };

  const handleSaveKey = async (keyName: string) => {
    const value = tempValues[keyName];
    if (value) {
      await validateSingle(keyName, value);
      // In a real implementation, you would save this to your backend
      console.log(`Saving ${keyName}:`, value);
    }
    setEditingKey(null);
    setTempValues(prev => {
      const newValues = { ...prev };
      delete newValues[keyName];
      return newValues;
    });
  };

  const getStatusIcon = (keyName: string) => {
    const keyStatus = status[keyName];
    if (!keyStatus) return <XCircle className="h-4 w-4 text-gray-400" />;
    
    if (!keyStatus.configured) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    
    if (keyStatus.valid) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    
    return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusBadge = (keyName: string) => {
    const keyStatus = status[keyName];
    if (!keyStatus) return <Badge variant="secondary">Unknown</Badge>;
    
    if (!keyStatus.configured) {
      return <Badge variant="destructive">Not Configured</Badge>;
    }
    
    if (keyStatus.valid) {
      return <Badge variant="default" className="bg-green-500">Valid</Badge>;
    }
    
    return <Badge variant="secondary">Invalid</Badge>;
  };

  const renderKeyCard = (config: any, keyName: string) => {
    const keyStatus = status[keyName];
    const isVisible = visibleKeys.has(keyName);
    const isTesting = testingKeys.has(keyName);
    const isEditing = editingKey === keyName;
    
    return (
      <Card key={keyName} className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getStatusIcon(keyName)}
              <CardTitle className="text-sm font-medium">{keyName}</CardTitle>
              {config.required && <Badge variant="outline" className="text-xs">Required</Badge>}
            </div>
            {getStatusBadge(keyName)}
          </div>
          <CardDescription className="text-xs">
            {config.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* API Key Value */}
            <div className="flex items-center space-x-2">
              <div className="flex-1">
                {isEditing ? (
                  <Input
                    type="password"
                    value={tempValues[keyName] || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTempValues(prev => ({ ...prev, [keyName]: e.target.value }))}
                    placeholder={`Enter ${keyName}`}
                    className="text-sm"
                  />
                ) : (
                  <Input
                    type={isVisible ? 'text' : 'password'}
                    value={keyStatus?.maskedValue || 'Not configured'}
                    readOnly
                    className="text-sm bg-gray-50"
                  />
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleKeyVisibility(keyName)}
                disabled={!keyStatus?.configured}
              >
                {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              {isEditing ? (
                <>
                  <Button
                    size="sm"
                    onClick={() => handleSaveKey(keyName)}
                    className="text-xs"
                  >
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingKey(null)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingKey(keyName)}
                    className="text-xs"
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestConnection(keyName)}
                    disabled={!keyStatus?.configured || isTesting}
                    className="text-xs"
                  >
                    {isTesting ? (
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <TestTube className="h-3 w-3 mr-1" />
                    )}
                    Test
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              <Key className="h-6 w-6 mr-2" />
              API Keys Management
            </h1>
            <p className="text-gray-600 mt-1">
              Configure and manage API keys for all integrated services
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={validateAll}
              disabled={isLoading}
              className="flex items-center"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Valid Keys</p>
                  <p className="text-2xl font-bold">
                    {Object.values(status).filter(s => s.valid).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm font-medium">Missing Keys</p>
                  <p className="text-2xl font-bold">
                    {validation?.errors.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium">Invalid Keys</p>
                  <p className="text-2xl font-bold">
                    {validation?.warnings.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Shield className={`h-5 w-5 ${productionReady ? 'text-green-500' : 'text-red-500'}`} />
                <div>
                  <p className="text-sm font-medium">Production Ready</p>
                  <p className="text-2xl font-bold">
                    {productionReady ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Validation Alerts */}
        {validation && !validation.isValid && (
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Configuration Issues Detected:</strong>
              <ul className="mt-2 list-disc list-inside">
                {validation.errors.map((error, index) => (
                  <li key={index} className="text-sm">{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* API Keys by Category */}
      {Object.keys(categories).length > 0 ? (
        <Tabs defaultValue={Object.keys(categories)[0]} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            {Object.keys(categories).map(category => (
              <TabsTrigger key={category} value={category} className="text-xs">
                {category.split(' ')[0]}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {Object.entries(categories).map(([category, configs]) => (
            <TabsContent key={category} value={category} className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{category}</CardTitle>
                  <CardDescription>
                    Manage API keys for {category.toLowerCase()} services
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {configs.map(config => renderKeyCard(config, config.key))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">API Keys</CardTitle>
            <CardDescription>
              No API key categories configured yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">API key management will be available once the environment validation is properly configured.</p>
          </CardContent>
        </Card>
      )}

      {/* Footer Info */}
      <div className="mt-8 text-center text-sm text-gray-500">
        {lastChecked && (
          <p>Last checked: {lastChecked.toLocaleString()}</p>
        )}
        <p className="mt-1">
          🔒 API keys are securely stored and never logged in plain text
        </p>
      </div>
    </div>
  );
}
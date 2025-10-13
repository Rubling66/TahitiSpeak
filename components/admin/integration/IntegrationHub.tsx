import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Globe, 
  Webhook as WebhookIcon, 
  Key, 
  Puzzle, 
  Plus, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  Download, 
  Upload, 
  Search, 
  Filter, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  ExternalLink,
  Code,
  Shield,
  Zap
} from 'lucide-react';
import { integrationService } from '../../../services/IntegrationService';
import { 
  APIEndpoint, 
  Webhook, 
  SSOProvider, 
  LTIProvider, 
  Plugin, 
  PluginRegistry 
} from '../../../types/integration';

const IntegrationHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState('api');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  
  // Data states
  const [endpoints, setEndpoints] = useState<APIEndpoint[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [ssoProviders, setSSOProviders] = useState<SSOProvider[]>([]);
  const [ltiProviders, setLTIProviders] = useState<LTIProvider[]>([]);
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [pluginRegistry, setPluginRegistry] = useState<PluginRegistry | null>(null);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'api':
          const endpointsData = await integrationService.getEndpoints();
          setEndpoints(endpointsData);
          break;
        case 'webhooks':
          const webhooksData = await integrationService.getWebhooks();
          setWebhooks(webhooksData);
          break;
        case 'sso':
          const ssoData = await integrationService.getSSOProviders();
          setSSOProviders(ssoData);
          break;
        case 'lti':
          const ltiData = await integrationService.getLTIProviders();
          setLTIProviders(ltiData);
          break;
        case 'plugins':
          const pluginsData = await integrationService.getPlugins();
          const registryData = await integrationService.getPluginRegistry();
          setPlugins(pluginsData);
          setPluginRegistry(registryData);
          break;
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (activeTab === 'plugins' && searchQuery) {
      const results = await integrationService.searchPlugins(searchQuery, filterType);
      setPlugins(results);
    }
  };

  const handleTestEndpoint = async (endpointId: string) => {
    try {
      const result = await integrationService.testEndpoint(endpointId, {});
      alert(`Test Result: ${result.description}`);
    } catch (error) {
      alert('Test failed: ' + error);
    }
  };

  const handleTriggerWebhook = async (webhookId: string) => {
    try {
      const event = {
        type: 'test.event',
        description: 'Manual test trigger',
        payload: { test: true, timestamp: new Date().toISOString() }
      };
      await integrationService.triggerWebhook(webhookId, event);
      alert('Webhook triggered successfully');
    } catch (error) {
      alert('Webhook trigger failed: ' + error);
    }
  };

  const handleTestSSO = async (providerId: string) => {
    try {
      const result = await integrationService.testSSOConnection(providerId);
      alert(result ? 'SSO connection successful' : 'SSO connection failed');
    } catch (error) {
      alert('SSO test failed: ' + error);
    }
  };

  const handlePluginAction = async (pluginId: string, action: 'activate' | 'deactivate' | 'update' | 'uninstall') => {
    try {
      switch (action) {
        case 'activate':
          await integrationService.activatePlugin(pluginId);
          break;
        case 'deactivate':
          await integrationService.deactivatePlugin(pluginId);
          break;
        case 'update':
          await integrationService.updatePlugin(pluginId);
          break;
        case 'uninstall':
          await integrationService.uninstallPlugin(pluginId);
          break;
      }
      loadData();
    } catch (error) {
      alert(`Plugin ${action} failed: ` + error);
    }
  };

  const renderAPIEndpoints = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">API Endpoints</h3>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Endpoint
        </button>
      </div>
      
      <div className="grid gap-4">
        {endpoints.map(endpoint => (
          <div key={endpoint.id} className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    endpoint.method === 'GET' ? 'bg-green-100 text-green-800' :
                    endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                    endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                    endpoint.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {endpoint.method}
                  </span>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">{endpoint.path}</code>
                  <span className="text-xs text-gray-500">v{endpoint.version}</span>
                </div>
                <p className="text-gray-600 text-sm mb-2">{endpoint.description}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>Auth: {endpoint.authentication}</span>
                  <span>Parameters: {endpoint.parameters.length}</span>
                  <span>Tags: {endpoint.tags.join(', ')}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleTestEndpoint(endpoint.id)}
                  className="p-2 text-green-600 hover:bg-green-50 rounded"
                  title="Test Endpoint"
                >
                  <Play className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setEditingItem(endpoint)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button className="p-2 text-red-600 hover:bg-red-50 rounded" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderWebhooks = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Webhooks</h3>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Webhook
        </button>
      </div>
      
      <div className="grid gap-4">
        {webhooks.map(webhook => (
          <div key={webhook.id} className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium">{webhook.name}</h4>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    webhook.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {webhook.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{webhook.url}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>Events: {webhook.events.length}</span>
                  <span>Failures: {webhook.failureCount}</span>
                  <span>Timeout: {webhook.timeout}ms</span>
                  {webhook.lastTriggered && (
                    <span>Last: {webhook.lastTriggered.toLocaleDateString()}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleTriggerWebhook(webhook.id)}
                  className="p-2 text-green-600 hover:bg-green-50 rounded"
                  title="Test Webhook"
                >
                  <Zap className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setEditingItem(webhook)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button className="p-2 text-red-600 hover:bg-red-50 rounded" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSSOProviders = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">SSO Providers</h3>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Provider
        </button>
      </div>
      
      <div className="grid gap-4">
        {ssoProviders.map(provider => (
          <div key={provider.id} className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium">{provider.name}</h4>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    provider.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {provider.active ? 'Active' : 'Inactive'}
                  </span>
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                    {provider.type.toUpperCase()}
                  </span>
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Callback: {provider.configuration.callbackUrl}</div>
                  {provider.configuration.scopes && (
                    <div>Scopes: {provider.configuration.scopes.join(', ')}</div>
                  )}
                  <div>Created: {provider.createdAt.toLocaleDateString()}</div>
                  {provider.lastSync && (
                    <div>Last Sync: {provider.lastSync.toLocaleDateString()}</div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleTestSSO(provider.id)}
                  className="p-2 text-green-600 hover:bg-green-50 rounded"
                  title="Test Connection"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setEditingItem(provider)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button className="p-2 text-red-600 hover:bg-red-50 rounded" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderLTIProviders = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">LTI Providers</h3>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Provider
        </button>
      </div>
      
      <div className="grid gap-4">
        {ltiProviders.map(provider => (
          <div key={provider.id} className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium">{provider.name}</h4>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    provider.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {provider.active ? 'Active' : 'Inactive'}
                  </span>
                  <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                    LTI {provider.version}
                  </span>
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Launch URL: {provider.launchUrl}</div>
                  <div>Consumer Key: {provider.consumerKey}</div>
                  <div>Privacy: {provider.configuration.privacy}</div>
                  <div className="flex gap-2">
                    {provider.configuration.outcomes && <span className="bg-green-100 text-green-800 px-1 rounded">Outcomes</span>}
                    {provider.configuration.membership && <span className="bg-blue-100 text-blue-800 px-1 rounded">Membership</span>}
                    {provider.configuration.contentItemSelection && <span className="bg-yellow-100 text-yellow-800 px-1 rounded">Content Selection</span>}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setEditingItem(provider)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button className="p-2 text-red-600 hover:bg-red-50 rounded" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPlugins = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Plugins</h3>
        <div className="flex gap-2">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search plugins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Types</option>
              <option value="content">Content</option>
              <option value="assessment">Assessment</option>
              <option value="analytics">Analytics</option>
              <option value="integration">Integration</option>
              <option value="ui">UI</option>
            </select>
            <button 
              onClick={handleSearch}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Install Plugin
          </button>
        </div>
      </div>
      
      <div className="grid gap-4">
        {plugins.map(plugin => (
          <div key={plugin.id} className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium">{plugin.name}</h4>
                  <span className="text-xs text-gray-500">v{plugin.version}</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    plugin.status === 'active' ? 'bg-green-100 text-green-800' :
                    plugin.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {plugin.status}
                  </span>
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                    {plugin.type}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{plugin.description}</p>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Author: {plugin.author}</div>
                  <div>Permissions: {plugin.permissions.length} resources</div>
                  <div>Hooks: {plugin.hooks.length} events</div>
                  <div>Installed: {plugin.installedAt.toLocaleDateString()}</div>
                </div>
              </div>
              <div className="flex gap-2">
                {plugin.status === 'active' ? (
                  <button 
                    onClick={() => handlePluginAction(plugin.id, 'deactivate')}
                    className="p-2 text-orange-600 hover:bg-orange-50 rounded"
                    title="Deactivate"
                  >
                    <Pause className="w-4 h-4" />
                  </button>
                ) : (
                  <button 
                    onClick={() => handlePluginAction(plugin.id, 'activate')}
                    className="p-2 text-green-600 hover:bg-green-50 rounded"
                    title="Activate"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                )}
                <button 
                  onClick={() => handlePluginAction(plugin.id, 'update')}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  title="Update"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setEditingItem(plugin)}
                  className="p-2 text-gray-600 hover:bg-gray-50 rounded"
                  title="Configure"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handlePluginAction(plugin.id, 'uninstall')}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                  title="Uninstall"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const tabs = [
    { id: 'api', label: 'API Gateway', icon: Code },
    { id: 'webhooks', label: 'Webhooks', icon: WebhookIcon },
    { id: 'sso', label: 'SSO', icon: Shield },
    { id: 'lti', label: 'LTI', icon: ExternalLink },
    { id: 'plugins', label: 'Plugins', icon: Puzzle }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Integration Hub</h1>
        <p className="text-gray-600">Manage API endpoints, webhooks, SSO providers, LTI integrations, and plugins</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading...</span>
        </div>
      ) : (
        <div>
          {activeTab === 'api' && renderAPIEndpoints()}
          {activeTab === 'webhooks' && renderWebhooks()}
          {activeTab === 'sso' && renderSSOProviders()}
          {activeTab === 'lti' && renderLTIProviders()}
          {activeTab === 'plugins' && renderPlugins()}
        </div>
      )}
    </div>
  );
};

export default IntegrationHub;
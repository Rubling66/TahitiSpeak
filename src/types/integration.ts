export interface APIEndpoint {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
  parameters: APIParameter[];
  responses: APIResponse[];
  authentication: AuthenticationType;
  rateLimit?: RateLimit;
  version: string;
  deprecated?: boolean;
  tags: string[];
}

export interface APIParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description: string;
  example?: any;
  validation?: ValidationRule[];
}

export interface APIResponse {
  statusCode: number;
  description: string;
  schema?: any;
  examples?: any[];
}

export interface ValidationRule {
  type: 'min' | 'max' | 'pattern' | 'enum' | 'custom';
  value: any;
  message: string;
}

export interface RateLimit {
  requests: number;
  window: number; // in seconds
  burst?: number;
}

export type AuthenticationType = 'none' | 'api-key' | 'oauth2' | 'jwt' | 'basic';

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: WebhookEvent[];
  secret?: string;
  active: boolean;
  retryPolicy: RetryPolicy;
  headers?: Record<string, string>;
  timeout: number;
  createdAt: Date;
  lastTriggered?: Date;
  failureCount: number;
}

export interface WebhookEvent {
  type: string;
  description: string;
  payload: any;
  filters?: WebhookFilter[];
}

export interface WebhookFilter {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'regex';
  value: any;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
  initialDelay: number;
  maxDelay: number;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  attempts: number;
  lastAttempt?: Date;
  nextAttempt?: Date;
  response?: WebhookResponse;
  error?: string;
}

export interface WebhookResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
  duration: number;
}

export interface SSOProvider {
  id: string;
  name: string;
  type: 'saml' | 'oauth2' | 'oidc' | 'ldap';
  configuration: SSOConfiguration;
  active: boolean;
  userMapping: UserMapping;
  groupMapping?: GroupMapping[];
  createdAt: Date;
  lastSync?: Date;
}

export interface SSOConfiguration {
  clientId?: string;
  clientSecret?: string;
  issuer?: string;
  authorizationUrl?: string;
  tokenUrl?: string;
  userInfoUrl?: string;
  logoutUrl?: string;
  certificate?: string;
  privateKey?: string;
  entryPoint?: string;
  callbackUrl: string;
  scopes?: string[];
  claims?: Record<string, string>;
}

export interface UserMapping {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatar?: string;
  roles?: string;
  groups?: string;
}

export interface GroupMapping {
  externalGroup: string;
  internalRole: string;
  permissions: string[];
}

export interface SSOSession {
  id: string;
  userId: string;
  providerId: string;
  externalId: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  createdAt: Date;
  lastActivity: Date;
  metadata?: Record<string, any>;
}

export interface LTIProvider {
  id: string;
  name: string;
  version: '1.1' | '1.3';
  consumerKey: string;
  sharedSecret: string;
  launchUrl: string;
  configuration: LTIConfiguration;
  active: boolean;
  createdAt: Date;
}

export interface LTIConfiguration {
  privacy: 'anonymous' | 'name_only' | 'public';
  customParameters?: Record<string, string>;
  extensions?: LTIExtension[];
  outcomes?: boolean;
  membership?: boolean;
  contentItemSelection?: boolean;
}

export interface LTIExtension {
  platform: string;
  settings: Record<string, any>;
}

export interface LTILaunch {
  id: string;
  providerId: string;
  userId: string;
  courseId?: string;
  resourceId?: string;
  parameters: Record<string, string>;
  outcomeUrl?: string;
  sourcedId?: string;
  timestamp: Date;
  signature: string;
}

export interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  type: 'content' | 'assessment' | 'analytics' | 'integration' | 'ui';
  status: 'active' | 'inactive' | 'error';
  configuration: PluginConfiguration;
  permissions: PluginPermission[];
  dependencies: PluginDependency[];
  hooks: PluginHook[];
  assets: PluginAsset[];
  installedAt: Date;
  updatedAt?: Date;
}

export interface PluginConfiguration {
  settings: Record<string, any>;
  schema: any; // JSON Schema for validation
  defaults: Record<string, any>;
}

export interface PluginPermission {
  resource: string;
  actions: string[];
  conditions?: Record<string, any>;
}

export interface PluginDependency {
  name: string;
  version: string;
  optional: boolean;
}

export interface PluginHook {
  event: string;
  handler: string;
  priority: number;
  async: boolean;
}

export interface PluginAsset {
  type: 'script' | 'style' | 'template' | 'image';
  path: string;
  dependencies?: string[];
}

export interface PluginRegistry {
  plugins: Plugin[];
  repositories: PluginRepository[];
  updates: PluginUpdate[];
}

export interface PluginRepository {
  id: string;
  name: string;
  url: string;
  type: 'official' | 'community' | 'private';
  trusted: boolean;
}

export interface PluginUpdate {
  pluginId: string;
  currentVersion: string;
  availableVersion: string;
  changelog: string;
  critical: boolean;
  releaseDate: Date;
}

export interface IntegrationAPI {
  // API Gateway
  getEndpoints(): Promise<APIEndpoint[]>;
  createEndpoint(endpoint: Omit<APIEndpoint, 'id'>): Promise<APIEndpoint>;
  updateEndpoint(id: string, endpoint: Partial<APIEndpoint>): Promise<APIEndpoint>;
  deleteEndpoint(id: string): Promise<void>;
  testEndpoint(id: string, parameters: Record<string, any>): Promise<APIResponse>;
  
  // Webhooks
  getWebhooks(): Promise<Webhook[]>;
  createWebhook(webhook: Omit<Webhook, 'id' | 'createdAt' | 'failureCount'>): Promise<Webhook>;
  updateWebhook(id: string, webhook: Partial<Webhook>): Promise<Webhook>;
  deleteWebhook(id: string): Promise<void>;
  triggerWebhook(id: string, event: WebhookEvent): Promise<WebhookDelivery>;
  getWebhookDeliveries(webhookId: string): Promise<WebhookDelivery[]>;
  retryWebhookDelivery(deliveryId: string): Promise<WebhookDelivery>;
  
  // SSO
  getSSOProviders(): Promise<SSOProvider[]>;
  createSSOProvider(provider: Omit<SSOProvider, 'id' | 'createdAt'>): Promise<SSOProvider>;
  updateSSOProvider(id: string, provider: Partial<SSOProvider>): Promise<SSOProvider>;
  deleteSSOProvider(id: string): Promise<void>;
  testSSOConnection(id: string): Promise<boolean>;
  syncSSOUsers(id: string): Promise<number>;
  getSSOSessions(userId?: string): Promise<SSOSession[]>;
  
  // LTI
  getLTIProviders(): Promise<LTIProvider[]>;
  createLTIProvider(provider: Omit<LTIProvider, 'id' | 'createdAt'>): Promise<LTIProvider>;
  updateLTIProvider(id: string, provider: Partial<LTIProvider>): Promise<LTIProvider>;
  deleteLTIProvider(id: string): Promise<void>;
  handleLTILaunch(launch: Omit<LTILaunch, 'id' | 'timestamp'>): Promise<LTILaunch>;
  getLTILaunches(providerId?: string): Promise<LTILaunch[]>;
  
  // Plugins
  getPlugins(): Promise<Plugin[]>;
  installPlugin(pluginId: string, repository?: string): Promise<Plugin>;
  uninstallPlugin(id: string): Promise<void>;
  activatePlugin(id: string): Promise<Plugin>;
  deactivatePlugin(id: string): Promise<Plugin>;
  updatePlugin(id: string): Promise<Plugin>;
  configurePlugin(id: string, configuration: PluginConfiguration): Promise<Plugin>;
  getPluginRegistry(): Promise<PluginRegistry>;
  searchPlugins(query: string, type?: string): Promise<Plugin[]>;
}
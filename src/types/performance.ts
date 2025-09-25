export interface SystemMetrics {
  id: string;
  timestamp: Date;
  cpu: CPUMetrics;
  memory: MemoryMetrics;
  disk: DiskMetrics;
  network: NetworkMetrics;
  database: DatabaseMetrics;
  application: ApplicationMetrics;
}

export interface CPUMetrics {
  usage: number; // percentage
  cores: number;
  loadAverage: number[];
  processes: number;
}

export interface MemoryMetrics {
  total: number; // bytes
  used: number; // bytes
  free: number; // bytes
  cached: number; // bytes
  usage: number; // percentage
}

export interface DiskMetrics {
  total: number; // bytes
  used: number; // bytes
  free: number; // bytes
  usage: number; // percentage
  readOps: number;
  writeOps: number;
  readBytes: number;
  writeBytes: number;
}

export interface NetworkMetrics {
  bytesIn: number;
  bytesOut: number;
  packetsIn: number;
  packetsOut: number;
  connections: number;
  bandwidth: number;
}

export interface DatabaseMetrics {
  connections: number;
  activeQueries: number;
  slowQueries: number;
  queryTime: number; // average ms
  cacheHitRatio: number; // percentage
  tableSize: number; // bytes
  indexSize: number; // bytes
}

export interface ApplicationMetrics {
  activeUsers: number;
  requests: number;
  responseTime: number; // average ms
  errorRate: number; // percentage
  throughput: number; // requests per second
  uptime: number; // seconds
  version: string;
}

export interface PerformanceAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  metric: string;
  threshold: number;
  currentValue: number;
  message: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  actions: AlertAction[];
}

export type AlertType = 'cpu' | 'memory' | 'disk' | 'network' | 'database' | 'application' | 'custom';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AlertAction {
  type: 'email' | 'sms' | 'webhook' | 'auto-scale' | 'restart';
  target: string;
  parameters?: Record<string, any>;
}

export interface PerformanceThreshold {
  id: string;
  name: string;
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  value: number;
  duration: number; // seconds
  severity: AlertSeverity;
  enabled: boolean;
  actions: AlertAction[];
  createdAt: Date;
  updatedAt?: Date;
}

export interface ContentPerformance {
  contentId: string;
  contentType: 'course' | 'lesson' | 'quiz' | 'video' | 'document';
  title: string;
  metrics: ContentMetrics;
  trends: ContentTrend[];
  recommendations: PerformanceRecommendation[];
  lastUpdated: Date;
}

export interface ContentMetrics {
  views: number;
  completions: number;
  completionRate: number; // percentage
  averageTime: number; // seconds
  bounceRate: number; // percentage
  engagement: number; // percentage
  rating: number; // 1-5
  comments: number;
  shares: number;
  downloads: number;
}

export interface ContentTrend {
  date: Date;
  views: number;
  completions: number;
  engagement: number;
  rating: number;
}

export interface PerformanceRecommendation {
  id: string;
  type: RecommendationType;
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  category: string;
  actions: RecommendationAction[];
  createdAt: Date;
}

export type RecommendationType = 
  | 'content-optimization'
  | 'performance-improvement'
  | 'user-experience'
  | 'accessibility'
  | 'seo'
  | 'engagement';

export interface RecommendationAction {
  type: string;
  description: string;
  automated: boolean;
  estimatedTime?: number; // minutes
}

export interface PerformanceReport {
  id: string;
  name: string;
  type: ReportType;
  period: ReportPeriod;
  startDate: Date;
  endDate: Date;
  metrics: ReportMetrics;
  charts: ChartData[];
  insights: ReportInsight[];
  recommendations: PerformanceRecommendation[];
  generatedAt: Date;
  format: 'pdf' | 'excel' | 'json' | 'csv';
}

export type ReportType = 'system' | 'content' | 'user' | 'performance' | 'security' | 'custom';
export type ReportPeriod = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';

export interface ReportMetrics {
  summary: Record<string, number>;
  comparisons: Record<string, number>;
  trends: Record<string, number[]>;
  distributions: Record<string, Record<string, number>>;
}

export interface ChartData {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'heatmap';
  title: string;
  data: any[];
  config: ChartConfig;
}

export interface ChartConfig {
  xAxis?: string;
  yAxis?: string;
  colors?: string[];
  legend?: boolean;
  grid?: boolean;
  responsive?: boolean;
  animation?: boolean;
}

export interface ReportInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'correlation' | 'prediction';
  title: string;
  description: string;
  confidence: number; // percentage
  impact: 'positive' | 'negative' | 'neutral';
  data: any;
}

export interface MonitoringDashboard {
  id: string;
  name: string;
  description: string;
  widgets: DashboardWidget[];
  layout: DashboardLayout;
  refreshInterval: number; // seconds
  permissions: string[];
  createdAt: Date;
  updatedAt?: Date;
}

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  description?: string;
  dataSource: string;
  query: string;
  visualization: VisualizationConfig;
  position: WidgetPosition;
  size: WidgetSize;
  refreshInterval?: number;
  filters?: WidgetFilter[];
}

export type WidgetType = 
  | 'metric'
  | 'chart'
  | 'table'
  | 'gauge'
  | 'counter'
  | 'status'
  | 'alert'
  | 'log';

export interface VisualizationConfig {
  chartType?: string;
  colors?: string[];
  thresholds?: number[];
  format?: string;
  unit?: string;
  decimals?: number;
}

export interface WidgetPosition {
  x: number;
  y: number;
}

export interface WidgetSize {
  width: number;
  height: number;
}

export interface WidgetFilter {
  field: string;
  operator: string;
  value: any;
}

export interface DashboardLayout {
  columns: number;
  rows: number;
  gap: number;
  responsive: boolean;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  source: string;
  message: string;
  metadata?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  tags?: string[];
}

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogQuery {
  startDate?: Date;
  endDate?: Date;
  levels?: LogLevel[];
  sources?: string[];
  search?: string;
  userId?: string;
  sessionId?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface PerformanceAPI {
  // System Monitoring
  getSystemMetrics(timeRange?: { start: Date; end: Date }): Promise<SystemMetrics[]>;
  getCurrentSystemStatus(): Promise<SystemMetrics>;
  
  // Alerts
  getAlerts(resolved?: boolean): Promise<PerformanceAlert[]>;
  createAlert(alert: Omit<PerformanceAlert, 'id' | 'timestamp' | 'resolved'>): Promise<PerformanceAlert>;
  resolveAlert(alertId: string): Promise<PerformanceAlert>;
  
  // Thresholds
  getThresholds(): Promise<PerformanceThreshold[]>;
  createThreshold(threshold: Omit<PerformanceThreshold, 'id' | 'createdAt'>): Promise<PerformanceThreshold>;
  updateThreshold(id: string, threshold: Partial<PerformanceThreshold>): Promise<PerformanceThreshold>;
  deleteThreshold(id: string): Promise<void>;
  
  // Content Performance
  getContentPerformance(contentId?: string): Promise<ContentPerformance[]>;
  getContentTrends(contentId: string, period: ReportPeriod): Promise<ContentTrend[]>;
  getContentRecommendations(contentId?: string): Promise<PerformanceRecommendation[]>;
  
  // Reports
  getReports(): Promise<PerformanceReport[]>;
  generateReport(config: Omit<PerformanceReport, 'id' | 'generatedAt' | 'metrics' | 'charts' | 'insights'>): Promise<PerformanceReport>;
  downloadReport(reportId: string, format: 'pdf' | 'excel' | 'json' | 'csv'): Promise<Blob>;
  
  // Dashboards
  getDashboards(): Promise<MonitoringDashboard[]>;
  createDashboard(dashboard: Omit<MonitoringDashboard, 'id' | 'createdAt'>): Promise<MonitoringDashboard>;
  updateDashboard(id: string, dashboard: Partial<MonitoringDashboard>): Promise<MonitoringDashboard>;
  deleteDashboard(id: string): Promise<void>;
  
  // Logs
  getLogs(query: LogQuery): Promise<LogEntry[]>;
  searchLogs(query: string, filters?: Partial<LogQuery>): Promise<LogEntry[]>;
  exportLogs(query: LogQuery, format: 'json' | 'csv' | 'txt'): Promise<Blob>;
  
  // Real-time
  subscribeToMetrics(callback: (metrics: SystemMetrics) => void): () => void;
  subscribeToAlerts(callback: (alert: PerformanceAlert) => void): () => void;
  subscribeToLogs(callback: (log: LogEntry) => void, filters?: Partial<LogQuery>): () => void;
}
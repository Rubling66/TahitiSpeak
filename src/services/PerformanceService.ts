import { DataService } from './DataService';
import {
  SystemMetrics,
  PerformanceAlert,
  PerformanceThreshold,
  ContentPerformance,
  ContentTrend,
  PerformanceRecommendation,
  PerformanceReport,
  MonitoringDashboard,
  LogEntry,
  LogQuery,
  PerformanceAPI,
  AlertSeverity,
  ReportPeriod,
  LogLevel
} from '../types/performance';

class PerformanceService implements PerformanceAPI {
  private dataService: DataService;
  private metricsSubscribers: ((metrics: SystemMetrics) => void)[] = [];
  private alertSubscribers: ((alert: PerformanceAlert) => void)[] = [];
  private logSubscribers: ((log: LogEntry) => void)[] = [];
  private metricsInterval?: NodeJS.Timeout;

  constructor() {
    this.dataService = new DataService();
    this.initializeSampleData();
    this.startMetricsCollection();
  }

  private initializeSampleData(): void {
    // Initialize sample thresholds
    const sampleThresholds: PerformanceThreshold[] = [
      {
        id: 'cpu-high',
        name: 'High CPU Usage',
        metric: 'cpu.usage',
        operator: 'gt',
        value: 80,
        duration: 300,
        severity: 'high',
        enabled: true,
        actions: [{ type: 'email', target: 'admin@example.com' }],
        createdAt: new Date()
      },
      {
        id: 'memory-critical',
        name: 'Critical Memory Usage',
        metric: 'memory.usage',
        operator: 'gt',
        value: 90,
        duration: 60,
        severity: 'critical',
        enabled: true,
        actions: [{ type: 'email', target: 'admin@example.com' }, { type: 'auto-scale', target: 'memory' }],
        createdAt: new Date()
      }
    ];

    // Initialize sample dashboards
    const sampleDashboards: MonitoringDashboard[] = [
      {
        id: 'system-overview',
        name: 'System Overview',
        description: 'Main system monitoring dashboard',
        widgets: [
          {
            id: 'cpu-widget',
            type: 'gauge',
            title: 'CPU Usage',
            dataSource: 'system',
            query: 'cpu.usage',
            visualization: { chartType: 'gauge', thresholds: [70, 85], colors: ['green', 'yellow', 'red'] },
            position: { x: 0, y: 0 },
            size: { width: 2, height: 2 }
          },
          {
            id: 'memory-widget',
            type: 'gauge',
            title: 'Memory Usage',
            dataSource: 'system',
            query: 'memory.usage',
            visualization: { chartType: 'gauge', thresholds: [70, 85], colors: ['green', 'yellow', 'red'] },
            position: { x: 2, y: 0 },
            size: { width: 2, height: 2 }
          }
        ],
        layout: { columns: 12, rows: 8, gap: 16, responsive: true },
        refreshInterval: 30,
        permissions: ['admin', 'monitor'],
        createdAt: new Date()
      }
    ];

    localStorage.setItem('performance_thresholds', JSON.stringify(sampleThresholds));
    localStorage.setItem('performance_dashboards', JSON.stringify(sampleDashboards));
  }

  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      const metrics = this.generateCurrentMetrics();
      this.metricsSubscribers.forEach(callback => callback(metrics));
      this.checkThresholds(metrics);
    }, 5000); // Collect metrics every 5 seconds
  }

  private generateCurrentMetrics(): SystemMetrics {
    const now = new Date();
    return {
      id: `metrics-${now.getTime()}`,
      timestamp: now,
      cpu: {
        usage: Math.random() * 100,
        cores: 8,
        loadAverage: [Math.random() * 2, Math.random() * 2, Math.random() * 2],
        processes: Math.floor(Math.random() * 200) + 100
      },
      memory: {
        total: 16 * 1024 * 1024 * 1024, // 16GB
        used: Math.floor(Math.random() * 12 * 1024 * 1024 * 1024), // Random used memory
        free: 0, // Will be calculated
        cached: Math.floor(Math.random() * 2 * 1024 * 1024 * 1024),
        usage: 0 // Will be calculated
      },
      disk: {
        total: 1024 * 1024 * 1024 * 1024, // 1TB
        used: Math.floor(Math.random() * 500 * 1024 * 1024 * 1024),
        free: 0, // Will be calculated
        usage: 0, // Will be calculated
        readOps: Math.floor(Math.random() * 1000),
        writeOps: Math.floor(Math.random() * 500),
        readBytes: Math.floor(Math.random() * 1024 * 1024),
        writeBytes: Math.floor(Math.random() * 512 * 1024)
      },
      network: {
        bytesIn: Math.floor(Math.random() * 1024 * 1024),
        bytesOut: Math.floor(Math.random() * 1024 * 1024),
        packetsIn: Math.floor(Math.random() * 10000),
        packetsOut: Math.floor(Math.random() * 10000),
        connections: Math.floor(Math.random() * 100),
        bandwidth: 1000 * 1024 * 1024 // 1Gbps
      },
      database: {
        connections: Math.floor(Math.random() * 50),
        activeQueries: Math.floor(Math.random() * 20),
        slowQueries: Math.floor(Math.random() * 5),
        queryTime: Math.random() * 100,
        cacheHitRatio: Math.random() * 100,
        tableSize: Math.floor(Math.random() * 1024 * 1024 * 1024),
        indexSize: Math.floor(Math.random() * 100 * 1024 * 1024)
      },
      application: {
        activeUsers: Math.floor(Math.random() * 1000),
        requests: Math.floor(Math.random() * 10000),
        responseTime: Math.random() * 500,
        errorRate: Math.random() * 5,
        throughput: Math.random() * 1000,
        uptime: Math.floor(Math.random() * 86400 * 30), // Up to 30 days
        version: '1.0.0'
      }
    };
  }

  private checkThresholds(metrics: SystemMetrics): void {
    const thresholds = this.getThresholdsSync();
    
    thresholds.forEach(threshold => {
      if (!threshold.enabled) return;
      
      let currentValue: number = 0;
      const metricPath = threshold.metric.split('.');
      
      // Extract metric value based on path
      if (metricPath[0] === 'cpu' && metricPath[1] === 'usage') {
        currentValue = metrics.cpu.usage;
      } else if (metricPath[0] === 'memory' && metricPath[1] === 'usage') {
        currentValue = (metrics.memory.used / metrics.memory.total) * 100;
      }
      // Add more metric extractions as needed
      
      const thresholdMet = this.evaluateThreshold(currentValue, threshold.operator, threshold.value);
      
      if (thresholdMet) {
        const alert: PerformanceAlert = {
          id: `alert-${Date.now()}`,
          type: metricPath[0] as any,
          severity: threshold.severity,
          metric: threshold.metric,
          threshold: threshold.value,
          currentValue,
          message: `${threshold.name}: ${threshold.metric} is ${currentValue.toFixed(2)} (threshold: ${threshold.value})`,
          timestamp: new Date(),
          resolved: false,
          actions: threshold.actions
        };
        
        this.alertSubscribers.forEach(callback => callback(alert));
        this.saveAlert(alert);
      }
    });
  }

  private evaluateThreshold(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case 'gt': return value > threshold;
      case 'lt': return value < threshold;
      case 'gte': return value >= threshold;
      case 'lte': return value <= threshold;
      case 'eq': return value === threshold;
      default: return false;
    }
  }

  private saveAlert(alert: PerformanceAlert): void {
    const alerts = this.getAlertsSync();
    alerts.unshift(alert);
    localStorage.setItem('performance_alerts', JSON.stringify(alerts.slice(0, 1000))); // Keep last 1000 alerts
  }

  private getThresholdsSync(): PerformanceThreshold[] {
    const stored = localStorage.getItem('performance_thresholds');
    return stored ? JSON.parse(stored) : [];
  }

  private getAlertsSync(): PerformanceAlert[] {
    const stored = localStorage.getItem('performance_alerts');
    return stored ? JSON.parse(stored) : [];
  }

  // System Monitoring
  async getSystemMetrics(timeRange?: { start: Date; end: Date }): Promise<SystemMetrics[]> {
    // In a real implementation, this would query a time-series database
    const metrics: SystemMetrics[] = [];
    const now = new Date();
    const start = timeRange?.start || new Date(now.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours
    const end = timeRange?.end || now;
    
    // Generate sample historical data
    for (let time = start.getTime(); time <= end.getTime(); time += 5 * 60 * 1000) { // Every 5 minutes
      metrics.push({
        ...this.generateCurrentMetrics(),
        id: `metrics-${time}`,
        timestamp: new Date(time)
      });
    }
    
    return metrics;
  }

  async getCurrentSystemStatus(): Promise<SystemMetrics> {
    return this.generateCurrentMetrics();
  }

  // Alerts
  async getAlerts(resolved?: boolean): Promise<PerformanceAlert[]> {
    const alerts = this.getAlertsSync();
    if (resolved !== undefined) {
      return alerts.filter(alert => alert.resolved === resolved);
    }
    return alerts;
  }

  async createAlert(alert: Omit<PerformanceAlert, 'id' | 'timestamp' | 'resolved'>): Promise<PerformanceAlert> {
    const newAlert: PerformanceAlert = {
      ...alert,
      id: `alert-${Date.now()}`,
      timestamp: new Date(),
      resolved: false
    };
    
    this.saveAlert(newAlert);
    return newAlert;
  }

  async resolveAlert(alertId: string): Promise<PerformanceAlert> {
    const alerts = this.getAlertsSync();
    const alertIndex = alerts.findIndex(a => a.id === alertId);
    
    if (alertIndex === -1) {
      throw new Error('Alert not found');
    }
    
    alerts[alertIndex].resolved = true;
    alerts[alertIndex].resolvedAt = new Date();
    
    localStorage.setItem('performance_alerts', JSON.stringify(alerts));
    return alerts[alertIndex];
  }

  // Thresholds
  async getThresholds(): Promise<PerformanceThreshold[]> {
    return this.getThresholdsSync();
  }

  async createThreshold(threshold: Omit<PerformanceThreshold, 'id' | 'createdAt'>): Promise<PerformanceThreshold> {
    const thresholds = this.getThresholdsSync();
    const newThreshold: PerformanceThreshold = {
      ...threshold,
      id: `threshold-${Date.now()}`,
      createdAt: new Date()
    };
    
    thresholds.push(newThreshold);
    localStorage.setItem('performance_thresholds', JSON.stringify(thresholds));
    return newThreshold;
  }

  async updateThreshold(id: string, threshold: Partial<PerformanceThreshold>): Promise<PerformanceThreshold> {
    const thresholds = this.getThresholdsSync();
    const index = thresholds.findIndex(t => t.id === id);
    
    if (index === -1) {
      throw new Error('Threshold not found');
    }
    
    thresholds[index] = { ...thresholds[index], ...threshold, updatedAt: new Date() };
    localStorage.setItem('performance_thresholds', JSON.stringify(thresholds));
    return thresholds[index];
  }

  async deleteThreshold(id: string): Promise<void> {
    const thresholds = this.getThresholdsSync();
    const filtered = thresholds.filter(t => t.id !== id);
    localStorage.setItem('performance_thresholds', JSON.stringify(filtered));
  }

  // Content Performance
  async getContentPerformance(contentId?: string): Promise<ContentPerformance[]> {
    // Generate sample content performance data
    const sampleContent: ContentPerformance[] = [
      {
        contentId: 'course-1',
        contentType: 'course',
        title: 'Tahitian Basics',
        metrics: {
          views: 1250,
          completions: 890,
          completionRate: 71.2,
          averageTime: 3600,
          bounceRate: 15.3,
          engagement: 82.5,
          rating: 4.6,
          comments: 45,
          shares: 23,
          downloads: 156
        },
        trends: this.generateContentTrends(),
        recommendations: [
          {
            id: 'rec-1',
            type: 'content-optimization',
            priority: 'medium',
            title: 'Improve lesson 3 engagement',
            description: 'Lesson 3 has lower engagement than others',
            impact: 'Could increase completion rate by 5-10%',
            effort: 'medium',
            category: 'Content',
            actions: [{ type: 'review', description: 'Review lesson content and add interactive elements', automated: false }],
            createdAt: new Date()
          }
        ],
        lastUpdated: new Date()
      }
    ];
    
    return contentId ? sampleContent.filter(c => c.contentId === contentId) : sampleContent;
  }

  private generateContentTrends(): ContentTrend[] {
    const trends: ContentTrend[] = [];
    const now = new Date();
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      trends.push({
        date,
        views: Math.floor(Math.random() * 100) + 50,
        completions: Math.floor(Math.random() * 50) + 20,
        engagement: Math.random() * 100,
        rating: Math.random() * 2 + 3 // 3-5 range
      });
    }
    
    return trends;
  }

  async getContentTrends(contentId: string, period: ReportPeriod): Promise<ContentTrend[]> {
    return this.generateContentTrends();
  }

  async getContentRecommendations(contentId?: string): Promise<PerformanceRecommendation[]> {
    // Return sample recommendations
    return [
      {
        id: 'rec-1',
        type: 'content-optimization',
        priority: 'high',
        title: 'Optimize video loading times',
        description: 'Video content is loading slowly, affecting user experience',
        impact: 'Could reduce bounce rate by 20%',
        effort: 'low',
        category: 'Performance',
        actions: [
          { type: 'compress', description: 'Compress video files', automated: true, estimatedTime: 30 },
          { type: 'cdn', description: 'Enable CDN for video delivery', automated: false, estimatedTime: 60 }
        ],
        createdAt: new Date()
      }
    ];
  }

  // Reports
  async getReports(): Promise<PerformanceReport[]> {
    const stored = localStorage.getItem('performance_reports');
    return stored ? JSON.parse(stored) : [];
  }

  async generateReport(config: Omit<PerformanceReport, 'id' | 'generatedAt' | 'metrics' | 'charts' | 'insights'>): Promise<PerformanceReport> {
    const report: PerformanceReport = {
      ...config,
      id: `report-${Date.now()}`,
      generatedAt: new Date(),
      metrics: {
        summary: { totalUsers: 1250, totalCourses: 45, avgCompletionRate: 72.5 },
        comparisons: { userGrowth: 15.3, courseGrowth: 8.7 },
        trends: { users: [100, 120, 135, 150, 165], courses: [40, 42, 43, 44, 45] },
        distributions: { deviceTypes: { mobile: 60, desktop: 35, tablet: 5 } }
      },
      charts: [
        {
          id: 'chart-1',
          type: 'line',
          title: 'User Growth',
          data: [{ date: '2024-01', users: 100 }, { date: '2024-02', users: 120 }],
          config: { xAxis: 'date', yAxis: 'users', colors: ['#3b82f6'] }
        }
      ],
      insights: [
        {
          id: 'insight-1',
          type: 'trend',
          title: 'Positive User Growth',
          description: 'User base has grown consistently over the past 6 months',
          confidence: 95,
          impact: 'positive',
          data: { growthRate: 15.3 }
        }
      ]
    };
    
    const reports = await this.getReports();
    reports.push(report);
    localStorage.setItem('performance_reports', JSON.stringify(reports));
    
    return report;
  }

  async downloadReport(reportId: string, format: 'pdf' | 'excel' | 'json' | 'csv'): Promise<Blob> {
    const reports = await this.getReports();
    const report = reports.find(r => r.id === reportId);
    
    if (!report) {
      throw new Error('Report not found');
    }
    
    // In a real implementation, this would generate the actual file
    const content = JSON.stringify(report, null, 2);
    return new Blob([content], { type: 'application/json' });
  }

  // Dashboards
  async getDashboards(): Promise<MonitoringDashboard[]> {
    const stored = localStorage.getItem('performance_dashboards');
    return stored ? JSON.parse(stored) : [];
  }

  async createDashboard(dashboard: Omit<MonitoringDashboard, 'id' | 'createdAt'>): Promise<MonitoringDashboard> {
    const dashboards = await this.getDashboards();
    const newDashboard: MonitoringDashboard = {
      ...dashboard,
      id: `dashboard-${Date.now()}`,
      createdAt: new Date()
    };
    
    dashboards.push(newDashboard);
    localStorage.setItem('performance_dashboards', JSON.stringify(dashboards));
    return newDashboard;
  }

  async updateDashboard(id: string, dashboard: Partial<MonitoringDashboard>): Promise<MonitoringDashboard> {
    const dashboards = await this.getDashboards();
    const index = dashboards.findIndex(d => d.id === id);
    
    if (index === -1) {
      throw new Error('Dashboard not found');
    }
    
    dashboards[index] = { ...dashboards[index], ...dashboard, updatedAt: new Date() };
    localStorage.setItem('performance_dashboards', JSON.stringify(dashboards));
    return dashboards[index];
  }

  async deleteDashboard(id: string): Promise<void> {
    const dashboards = await this.getDashboards();
    const filtered = dashboards.filter(d => d.id !== id);
    localStorage.setItem('performance_dashboards', JSON.stringify(filtered));
  }

  // Logs
  async getLogs(query: LogQuery): Promise<LogEntry[]> {
    // Generate sample log entries
    const logs: LogEntry[] = [];
    const now = new Date();
    
    for (let i = 0; i < (query.limit || 100); i++) {
      const timestamp = new Date(now.getTime() - i * 60000); // Every minute
      logs.push({
        id: `log-${timestamp.getTime()}`,
        timestamp,
        level: ['info', 'warn', 'error'][Math.floor(Math.random() * 3)] as LogLevel,
        source: ['api', 'frontend', 'database'][Math.floor(Math.random() * 3)],
        message: `Sample log message ${i}`,
        metadata: { requestId: `req-${i}`, userId: `user-${Math.floor(Math.random() * 100)}` },
        tags: ['performance', 'monitoring']
      });
    }
    
    return logs;
  }

  async searchLogs(query: string, filters?: Partial<LogQuery>): Promise<LogEntry[]> {
    const logs = await this.getLogs(filters || {});
    return logs.filter(log => log.message.toLowerCase().includes(query.toLowerCase()));
  }

  async exportLogs(query: LogQuery, format: 'json' | 'csv' | 'txt'): Promise<Blob> {
    const logs = await this.getLogs(query);
    
    let content: string;
    let mimeType: string;
    
    switch (format) {
      case 'json':
        content = JSON.stringify(logs, null, 2);
        mimeType = 'application/json';
        break;
      case 'csv':
        const headers = 'timestamp,level,source,message\n';
        const rows = logs.map(log => `${log.timestamp.toISOString()},${log.level},${log.source},"${log.message}"`).join('\n');
        content = headers + rows;
        mimeType = 'text/csv';
        break;
      case 'txt':
        content = logs.map(log => `[${log.timestamp.toISOString()}] ${log.level.toUpperCase()} ${log.source}: ${log.message}`).join('\n');
        mimeType = 'text/plain';
        break;
    }
    
    return new Blob([content], { type: mimeType });
  }

  // Real-time subscriptions
  subscribeToMetrics(callback: (metrics: SystemMetrics) => void): () => void {
    this.metricsSubscribers.push(callback);
    return () => {
      const index = this.metricsSubscribers.indexOf(callback);
      if (index > -1) {
        this.metricsSubscribers.splice(index, 1);
      }
    };
  }

  subscribeToAlerts(callback: (alert: PerformanceAlert) => void): () => void {
    this.alertSubscribers.push(callback);
    return () => {
      const index = this.alertSubscribers.indexOf(callback);
      if (index > -1) {
        this.alertSubscribers.splice(index, 1);
      }
    };
  }

  subscribeToLogs(callback: (log: LogEntry) => void, filters?: Partial<LogQuery>): () => void {
    this.logSubscribers.push(callback);
    
    // Simulate log generation
    const interval = setInterval(() => {
      const log: LogEntry = {
        id: `log-${Date.now()}`,
        timestamp: new Date(),
        level: ['info', 'warn', 'error'][Math.floor(Math.random() * 3)] as LogLevel,
        source: ['api', 'frontend', 'database'][Math.floor(Math.random() * 3)],
        message: `Real-time log message at ${new Date().toISOString()}`,
        metadata: { requestId: `req-${Date.now()}` },
        tags: ['real-time']
      };
      callback(log);
    }, 10000); // Every 10 seconds
    
    return () => {
      const index = this.logSubscribers.indexOf(callback);
      if (index > -1) {
        this.logSubscribers.splice(index, 1);
      }
      clearInterval(interval);
    };
  }

  // Cleanup method
  destroy(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    this.metricsSubscribers.length = 0;
    this.alertSubscribers.length = 0;
    this.logSubscribers.length = 0;
  }
}

export const performanceService = new PerformanceService();
export { PerformanceService };
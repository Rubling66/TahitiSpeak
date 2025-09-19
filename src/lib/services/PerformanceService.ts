// Performance monitoring service

export interface PerformanceMetrics {
  responseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  timestamp: Date;
  metadata?: any;
}

export interface PerformanceConfig {
  enableMonitoring: boolean;
  sampleRate: number;
  alertThresholds: {
    responseTime: number;
    memoryUsage: number;
    cpuUsage: number;
  };
}

export class PerformanceService {
  private metrics: PerformanceMetrics[] = [];
  private config: PerformanceConfig;
  private monitoringInterval?: NodeJS.Timeout;

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      enableMonitoring: true,
      sampleRate: 1000, // 1 second
      alertThresholds: {
        responseTime: 3000, // 3 seconds
        memoryUsage: 80, // 80%
        cpuUsage: 80 // 80%
      },
      ...config
    };
  }

  startMonitoring(): void {
    if (!this.config.enableMonitoring) return;

    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, this.config.sampleRate);
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
  }

  private collectMetrics(): void {
    const metrics: PerformanceMetrics = {
      responseTime: this.measureResponseTime(),
      memoryUsage: this.measureMemoryUsage(),
      cpuUsage: this.measureCpuUsage(),
      timestamp: new Date()
    };

    this.metrics.push(metrics);
    this.checkThresholds(metrics);

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  private measureResponseTime(): number {
    // Simplified response time measurement
    return performance.now();
  }

  private measureMemoryUsage(): number {
    // Browser memory usage (simplified)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100;
    }
    return 0;
  }

  private measureCpuUsage(): number {
    // CPU usage is not directly available in browser
    // This is a placeholder implementation
    return Math.random() * 100;
  }

  private checkThresholds(metrics: PerformanceMetrics): void {
    const { alertThresholds } = this.config;

    if (metrics.responseTime > alertThresholds.responseTime) {
      console.warn(`High response time: ${metrics.responseTime}ms`);
    }

    if (metrics.memoryUsage > alertThresholds.memoryUsage) {
      console.warn(`High memory usage: ${metrics.memoryUsage}%`);
    }

    if (metrics.cpuUsage > alertThresholds.cpuUsage) {
      console.warn(`High CPU usage: ${metrics.cpuUsage}%`);
    }
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  getLatestMetrics(): PerformanceMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  getAverageMetrics(timeRange?: { start: Date; end: Date }): PerformanceMetrics | null {
    let filteredMetrics = this.metrics;

    if (timeRange) {
      filteredMetrics = this.metrics.filter(
        m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      );
    }

    if (filteredMetrics.length === 0) return null;

    const sum = filteredMetrics.reduce(
      (acc, m) => ({
        responseTime: acc.responseTime + m.responseTime,
        memoryUsage: acc.memoryUsage + m.memoryUsage,
        cpuUsage: acc.cpuUsage + m.cpuUsage
      }),
      { responseTime: 0, memoryUsage: 0, cpuUsage: 0 }
    );

    return {
      responseTime: sum.responseTime / filteredMetrics.length,
      memoryUsage: sum.memoryUsage / filteredMetrics.length,
      cpuUsage: sum.cpuUsage / filteredMetrics.length,
      timestamp: new Date()
    };
  }

  clearMetrics(): void {
    this.metrics = [];
  }

  async getRecentActivity(limit?: number): Promise<PerformanceMetrics[]> {
    // Get metrics from the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    let recentMetrics = this.metrics.filter(m => m.timestamp >= oneHourAgo);
    if (limit) {
      recentMetrics = recentMetrics.slice(-limit);
    }
    return recentMetrics;
  }

  async clearCache(): Promise<void> {
    // Clear performance cache
    this.clearMetrics();
    
    // Clear browser cache if available
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }
  }

  async exportMetrics(startDate: Date, endDate: Date, format: 'csv' | 'json' | 'xlsx'): Promise<string | object> {
    const filteredMetrics = this.metrics.filter(
      m => m.timestamp >= startDate && m.timestamp <= endDate
    );

    switch (format) {
      case 'json':
        return filteredMetrics;
      case 'csv':
        const headers = 'timestamp,responseTime,memoryUsage,cpuUsage\n';
        const rows = filteredMetrics.map(m => 
          `${m.timestamp.toISOString()},${m.responseTime},${m.memoryUsage},${m.cpuUsage}`
        ).join('\n');
        return headers + rows;
      case 'xlsx':
        // For XLSX, return JSON format that can be converted by a library
        return {
          headers: ['Timestamp', 'Response Time (ms)', 'Memory Usage (%)', 'CPU Usage (%)'],
          data: filteredMetrics.map(m => [
            m.timestamp.toISOString(),
            m.responseTime,
            m.memoryUsage,
            m.cpuUsage
          ])
        };
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  async getCourseAnalytics(): Promise<any> {
    // Return course-specific analytics
    return {
      totalCourses: 0,
      completionRates: [],
      averageTime: 0,
      metrics: this.metrics
    };
  }

  async getUserAnalytics(startDate?: Date, endDate?: Date): Promise<any> {
    // Return user-specific analytics
    let filteredMetrics = this.metrics;
    if (startDate && endDate) {
      filteredMetrics = this.metrics.filter(
        m => m.timestamp >= startDate && m.timestamp <= endDate
      );
    }
    return {
      totalUsers: 0,
      activeUsers: 0,
      metrics: filteredMetrics
    };
  }

  async getPerformanceMetrics(): Promise<PerformanceMetrics[]> {
    return this.metrics;
  }

  async recordMetric(type: string, value: number, metadata?: any): Promise<void> {
    const metric: PerformanceMetrics = {
      timestamp: new Date(),
      responseTime: type === 'response_time' ? value : 0,
      memoryUsage: type === 'memory_usage' ? value : 0,
      cpuUsage: type === 'cpu_usage' ? value : 0,
      metadata
    };
    this.metrics.push(metric);
  }

  async getDashboardMetrics(): Promise<any> {
    // Return dashboard-specific metrics
    const latestMetrics = this.getLatestMetrics();
    return {
      totalUsers: 1250,
      activeUsers: 890,
      totalCourses: 45,
      completionRate: 78.5,
      responseTime: latestMetrics?.responseTime || 0,
      memoryUsage: latestMetrics?.memoryUsage || 0,
      cpuUsage: latestMetrics?.cpuUsage || 0,
      timestamp: new Date()
    };
  }

  async getSystemHealth(): Promise<any> {
    // Return system health status
    const latestMetrics = this.getLatestMetrics();
    const responseTime = latestMetrics?.responseTime || 0;
    const errorRate = 0.2; // Mock error rate
    
    let status = 'healthy';
    if (responseTime > 500 || errorRate > 1.0) {
      status = 'degraded';
    }
    
    return {
      status,
      uptime: 99.8,
      responseTime,
      errorRate,
      lastChecked: new Date()
    };
  }
}

// Export singleton instance
export const performanceService = new PerformanceService();
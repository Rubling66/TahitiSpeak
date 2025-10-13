import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Clock,
  Cpu,
  Database,
  Download,
  Eye,
  Filter,
  HardDrive,
  MemoryStick,
  Monitor,
  Network,
  Play,
  Plus,
  Refresh,
  Search,
  Settings,
  TrendingUp,
  Users,
  Wifi,
  X
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { performanceService } from '../../../services/PerformanceService';
import {
  SystemMetrics,
  PerformanceAlert,
  PerformanceThreshold,
  ContentPerformance,
  PerformanceReport,
  MonitoringDashboard,
  LogEntry,
  AlertSeverity
} from '../../../types/performance';

const PerformanceMonitoring: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [currentMetrics, setCurrentMetrics] = useState<SystemMetrics | null>(null);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [thresholds, setThresholds] = useState<PerformanceThreshold[]>([]);
  const [contentPerformance, setContentPerformance] = useState<ContentPerformance[]>([]);
  const [reports, setReports] = useState<PerformanceReport[]>([]);
  const [dashboards, setDashboards] = useState<MonitoringDashboard[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<AlertSeverity | 'all'>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [metricsData, alertsData, thresholdsData, contentData, reportsData, dashboardsData, logsData] = await Promise.all([
        performanceService.getCurrentSystemStatus(),
        performanceService.getAlerts(),
        performanceService.getThresholds(),
        performanceService.getContentPerformance(),
        performanceService.getReports(),
        performanceService.getDashboards(),
        performanceService.getLogs({ limit: 100 })
      ]);

      setCurrentMetrics(metricsData);
      setAlerts(alertsData);
      setThresholds(thresholdsData);
      setContentPerformance(contentData);
      setReports(reportsData);
      setDashboards(dashboardsData);
      setLogs(logsData);
    } catch (error) {
      console.error('Failed to load performance data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Subscribe to real-time updates
    const unsubscribeMetrics = performanceService.subscribeToMetrics((metrics) => {
      setCurrentMetrics(metrics);
    });

    const unsubscribeAlerts = performanceService.subscribeToAlerts((alert) => {
      setAlerts(prev => [alert, ...prev]);
    });

    const unsubscribeLogs = performanceService.subscribeToLogs((log) => {
      setLogs(prev => [log, ...prev.slice(0, 999)]); // Keep last 1000 logs
    });

    // Auto-refresh interval
    let refreshInterval: NodeJS.Timeout;
    if (autoRefresh) {
      refreshInterval = setInterval(() => {
        loadData();
      }, 30000); // Refresh every 30 seconds
    }

    return () => {
      unsubscribeMetrics();
      unsubscribeAlerts();
      unsubscribeLogs();
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [loadData, autoRefresh]);

  const handleResolveAlert = async (alertId: string) => {
    try {
      await performanceService.resolveAlert(alertId);
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, resolved: true, resolvedAt: new Date() } : alert
      ));
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  const handleCreateThreshold = async () => {
    try {
      const newThreshold = await performanceService.createThreshold({
        name: 'New Threshold',
        metric: 'cpu.usage',
        operator: 'gt',
        value: 80,
        duration: 300,
        severity: 'medium',
        enabled: true,
        actions: []
      });
      setThresholds(prev => [...prev, newThreshold]);
    } catch (error) {
      console.error('Failed to create threshold:', error);
    }
  };

  const handleGenerateReport = async () => {
    try {
      const report = await performanceService.generateReport({
        name: `Performance Report ${new Date().toLocaleDateString()}`,
        type: 'system',
        period: 'daily',
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        endDate: new Date(),
        format: 'json',
        recommendations: []
      });
      setReports(prev => [report, ...prev]);
    } catch (error) {
      console.error('Failed to generate report:', error);
    }
  };

  const formatBytes = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const getSeverityColor = (severity: AlertSeverity): string => {
    switch (severity) {
      case 'low': return 'text-blue-600 bg-blue-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = selectedSeverity === 'all' || alert.severity === selectedSeverity;
    return matchesSearch && matchesSeverity;
  });

  const generateChartData = () => {
    if (!currentMetrics) return [];
    
    return [
      { name: 'CPU', value: currentMetrics.cpu.usage, color: '#3b82f6' },
      { name: 'Memory', value: (currentMetrics.memory.used / currentMetrics.memory.total) * 100, color: '#ef4444' },
      { name: 'Disk', value: (currentMetrics.disk.used / currentMetrics.disk.total) * 100, color: '#10b981' },
      { name: 'Network', value: (currentMetrics.network.bytesIn / currentMetrics.network.bandwidth) * 100, color: '#f59e0b' }
    ];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Monitoring</h1>
          <p className="text-gray-600">Real-time system monitoring and performance analytics</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
              autoRefresh ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-700'
            }`}
          >
            <Play className="h-4 w-4" />
            <span>{autoRefresh ? 'Auto-refresh On' : 'Auto-refresh Off'}</span>
          </button>
          <button
            onClick={loadData}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Refresh className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* System Status Cards */}
      {currentMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">CPU Usage</p>
                <p className="text-2xl font-bold text-gray-900">{formatPercentage(currentMetrics.cpu.usage)}</p>
              </div>
              <Cpu className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-4 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${currentMetrics.cpu.usage}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Memory Usage</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPercentage((currentMetrics.memory.used / currentMetrics.memory.total) * 100)}
                </p>
              </div>
              <MemoryStick className="h-8 w-8 text-red-600" />
            </div>
            <div className="mt-4 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentMetrics.memory.used / currentMetrics.memory.total) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Disk Usage</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPercentage((currentMetrics.disk.used / currentMetrics.disk.total) * 100)}
                </p>
              </div>
              <HardDrive className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-4 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentMetrics.disk.used / currentMetrics.disk.total) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">{currentMetrics.application.activeUsers}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            <div className="mt-2">
              <p className="text-sm text-gray-600">
                {currentMetrics.application.requests} requests/min
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: Monitor },
            { id: 'alerts', name: 'Alerts', icon: Bell },
            { id: 'content', name: 'Content Performance', icon: BarChart3 },
            { id: 'reports', name: 'Reports', icon: TrendingUp },
            { id: 'logs', name: 'Logs', icon: Activity }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* System Overview Chart */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">System Resource Usage</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={generateChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Alerts */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Recent Alerts</h3>
                <button
                  onClick={() => setActiveTab('alerts')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View All
                </button>
              </div>
              <div className="space-y-3">
                {alerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className={`h-5 w-5 ${getSeverityColor(alert.severity).split(' ')[0]}`} />
                      <div>
                        <p className="font-medium text-gray-900">{alert.message}</p>
                        <p className="text-sm text-gray-600">{alert.timestamp.toLocaleString()}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                      {alert.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="space-y-6">
            {/* Alerts Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Performance Alerts</h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search alerts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <select
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value as AlertSeverity | 'all')}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">All Severities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
                <button
                  onClick={handleCreateThreshold}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Threshold</span>
                </button>
              </div>
            </div>

            {/* Alerts List */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="divide-y divide-gray-200">
                {filteredAlerts.map((alert) => (
                  <div key={alert.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <AlertTriangle className={`h-6 w-6 ${getSeverityColor(alert.severity).split(' ')[0]}`} />
                        <div>
                          <h4 className="font-medium text-gray-900">{alert.message}</h4>
                          <p className="text-sm text-gray-600">
                            {alert.metric}: {alert.currentValue.toFixed(2)} (threshold: {alert.threshold})
                          </p>
                          <p className="text-sm text-gray-500">{alert.timestamp.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </span>
                        {!alert.resolved && (
                          <button
                            onClick={() => handleResolveAlert(alert.id)}
                            className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                          >
                            Resolve
                          </button>
                        )}
                        {alert.resolved && (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm">
                            Resolved
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Content Performance Analytics</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {contentPerformance.map((content) => (
                <div key={content.contentId} className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">{content.title}</h4>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      {content.contentType}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Views</p>
                      <p className="text-xl font-bold text-gray-900">{content.metrics.views}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Completion Rate</p>
                      <p className="text-xl font-bold text-gray-900">{formatPercentage(content.metrics.completionRate)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Engagement</p>
                      <p className="text-xl font-bold text-gray-900">{formatPercentage(content.metrics.engagement)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Rating</p>
                      <p className="text-xl font-bold text-gray-900">{content.metrics.rating.toFixed(1)}/5</p>
                    </div>
                  </div>
                  {content.recommendations.length > 0 && (
                    <div className="border-t pt-4">
                      <p className="text-sm font-medium text-gray-900 mb-2">Recommendations</p>
                      {content.recommendations.slice(0, 2).map((rec) => (
                        <div key={rec.id} className="text-sm text-gray-600 mb-1">
                          • {rec.title}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Performance Reports</h3>
              <button
                onClick={handleGenerateReport}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                <span>Generate Report</span>
              </button>
            </div>
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="divide-y divide-gray-200">
                {reports.map((report) => (
                  <div key={report.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{report.name}</h4>
                        <p className="text-sm text-gray-600">
                          {report.type} • {report.period} • Generated {report.generatedAt.toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="flex items-center space-x-1 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Eye className="h-4 w-4" />
                          <span>View</span>
                        </button>
                        <button className="flex items-center space-x-1 px-3 py-1 text-green-600 hover:bg-green-50 rounded-lg">
                          <Download className="h-4 w-4" />
                          <span>Download</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">System Logs</h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="max-h-96 overflow-y-auto">
                {logs.slice(0, 50).map((log) => (
                  <div key={log.id} className="p-4 border-b border-gray-100 hover:bg-gray-50">
                    <div className="flex items-start space-x-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        log.level === 'error' ? 'bg-red-100 text-red-700' :
                        log.level === 'warn' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {log.level.toUpperCase()}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{log.message}</p>
                        <p className="text-xs text-gray-500">
                          {log.timestamp.toLocaleString()} • {log.source}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceMonitoring;
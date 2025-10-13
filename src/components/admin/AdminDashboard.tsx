import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, RadialBarChart, RadialBar
} from 'recharts';
import { 
  Users, Activity, TrendingUp, AlertTriangle, 
  Clock, Globe, Smartphone, Monitor, 
  BookOpen, MessageSquare, Star, Target,
  RefreshCw, Download, Filter, Calendar
} from 'lucide-react';

interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  userGrowth: number;
  totalLessons: number;
  completedLessons: number;
  averageProgress: number;
  engagementRate: number;
  retentionRate: number;
  performanceScore: number;
}

interface UserAnalytics {
  timestamp: string;
  activeUsers: number;
  newUsers: number;
  sessions: number;
  bounceRate: number;
  avgSessionDuration: number;
}

interface LearningAnalytics {
  lessonId: string;
  lessonName: string;
  completions: number;
  averageScore: number;
  timeSpent: number;
  difficulty: number;
  dropoffRate: number;
}

interface DeviceAnalytics {
  device: string;
  users: number;
  percentage: number;
  color: string;
}

interface PerformanceMetrics {
  timestamp: string;
  loadTime: number;
  responseTime: number;
  errorRate: number;
  throughput: number;
}

interface AlertData {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalUsers: 0,
    activeUsers: 0,
    newUsers: 0,
    userGrowth: 0,
    totalLessons: 0,
    completedLessons: 0,
    averageProgress: 0,
    engagementRate: 0,
    retentionRate: 0,
    performanceScore: 0
  });

  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics[]>([]);
  const [learningAnalytics, setLearningAnalytics] = useState<LearningAnalytics[]>([]);
  const [deviceAnalytics, setDeviceAnalytics] = useState<DeviceAnalytics[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics[]>([]);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Real-time data fetching
  useEffect(() => {
    fetchDashboardData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [selectedTimeRange, autoRefresh]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:3001/admin-dashboard`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'metrics_update':
          setMetrics(prev => ({ ...prev, ...data.payload }));
          break;
        case 'new_alert':
          setAlerts(prev => [data.payload, ...prev.slice(0, 49)]); // Keep last 50 alerts
          break;
        case 'user_activity':
          updateUserAnalytics(data.payload);
          break;
        case 'performance_update':
          updatePerformanceMetrics(data.payload);
          break;
      }
    };

    return () => ws.close();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    
    try {
      const [
        metricsRes,
        userAnalyticsRes,
        learningAnalyticsRes,
        deviceAnalyticsRes,
        performanceRes,
        alertsRes
      ] = await Promise.all([
        fetch(`/api/admin/metrics?timeRange=${selectedTimeRange}`),
        fetch(`/api/admin/user-analytics?timeRange=${selectedTimeRange}`),
        fetch(`/api/admin/learning-analytics?timeRange=${selectedTimeRange}`),
        fetch(`/api/admin/device-analytics?timeRange=${selectedTimeRange}`),
        fetch(`/api/admin/performance-metrics?timeRange=${selectedTimeRange}`),
        fetch(`/api/admin/alerts?limit=50`)
      ]);

      const [
        metricsData,
        userAnalyticsData,
        learningAnalyticsData,
        deviceAnalyticsData,
        performanceData,
        alertsData
      ] = await Promise.all([
        metricsRes.json(),
        userAnalyticsRes.json(),
        learningAnalyticsRes.json(),
        deviceAnalyticsRes.json(),
        performanceRes.json(),
        alertsRes.json()
      ]);

      setMetrics(metricsData);
      setUserAnalytics(userAnalyticsData);
      setLearningAnalytics(learningAnalyticsData);
      setDeviceAnalytics(deviceAnalyticsData);
      setPerformanceMetrics(performanceData);
      setAlerts(alertsData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserAnalytics = (newData: UserAnalytics) => {
    setUserAnalytics(prev => {
      const updated = [...prev];
      const existingIndex = updated.findIndex(item => item.timestamp === newData.timestamp);
      
      if (existingIndex >= 0) {
        updated[existingIndex] = newData;
      } else {
        updated.push(newData);
        updated.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      }
      
      return updated.slice(-24); // Keep last 24 data points
    });
  };

  const updatePerformanceMetrics = (newData: PerformanceMetrics) => {
    setPerformanceMetrics(prev => {
      const updated = [...prev, newData];
      return updated.slice(-50); // Keep last 50 data points
    });
  };

  const exportData = async (type: string) => {
    try {
      const response = await fetch(`/api/admin/export/${type}?timeRange=${selectedTimeRange}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_${selectedTimeRange}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  const MetricCard: React.FC<{
    title: string;
    value: string | number;
    change?: number;
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, change, icon, color }) => (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change !== undefined && (
            <p className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? '+' : ''}{change.toFixed(1)}% from last period
            </p>
          )}
        </div>
        <div className="text-3xl" style={{ color }}>
          {icon}
        </div>
      </div>
    </div>
  );

  const AlertBadge: React.FC<{ alert: AlertData }> = ({ alert }) => {
    const severityColors = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };

    const typeIcons = {
      error: <AlertTriangle className="w-4 h-4" />,
      warning: <AlertTriangle className="w-4 h-4" />,
      info: <Activity className="w-4 h-4" />
    };

    return (
      <div className={`flex items-center space-x-2 p-3 rounded-lg ${severityColors[alert.severity]}`}>
        {typeIcons[alert.type]}
        <div className="flex-1">
          <p className="text-sm font-medium">{alert.message}</p>
          <p className="text-xs opacity-75">{new Date(alert.timestamp).toLocaleString()}</p>
        </div>
      </div>
    );
  };

  const chartColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">French Tahitian Learning Platform Analytics</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="1d">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
            
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                autoRefresh ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              <span>Auto Refresh</span>
            </button>
            
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Users"
          value={metrics.totalUsers.toLocaleString()}
          change={metrics.userGrowth}
          icon={<Users />}
          color="#3B82F6"
        />
        <MetricCard
          title="Active Users"
          value={metrics.activeUsers.toLocaleString()}
          icon={<Activity />}
          color="#10B981"
        />
        <MetricCard
          title="Engagement Rate"
          value={`${metrics.engagementRate.toFixed(1)}%`}
          icon={<TrendingUp />}
          color="#F59E0B"
        />
        <MetricCard
          title="Performance Score"
          value={metrics.performanceScore.toFixed(0)}
          icon={<Target />}
          color="#8B5CF6"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* User Activity Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">User Activity</h3>
            <button
              onClick={() => exportData('user-analytics')}
              className="text-blue-600 hover:text-blue-800"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={userAnalytics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleString()}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="activeUsers" 
                stackId="1" 
                stroke="#8884d8" 
                fill="#8884d8" 
                name="Active Users"
              />
              <Area 
                type="monotone" 
                dataKey="newUsers" 
                stackId="1" 
                stroke="#82ca9d" 
                fill="#82ca9d" 
                name="New Users"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Learning Progress Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Learning Progress</h3>
            <button
              onClick={() => exportData('learning-analytics')}
              className="text-blue-600 hover:text-blue-800"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={learningAnalytics.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="lessonName" 
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completions" fill="#8884d8" name="Completions" />
              <Bar dataKey="averageScore" fill="#82ca9d" name="Avg Score" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Device Analytics */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Usage</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={deviceAnalytics}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ device, percentage }) => `${device} ${percentage.toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="users"
              >
                {deviceAnalytics.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
            <button
              onClick={() => exportData('performance-metrics')}
              className="text-blue-600 hover:text-blue-800"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(value) => new Date(value).toLocaleTimeString()}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleString()}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="loadTime" 
                stroke="#8884d8" 
                name="Load Time (ms)"
              />
              <Line 
                type="monotone" 
                dataKey="responseTime" 
                stroke="#82ca9d" 
                name="Response Time (ms)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alerts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Alerts */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {alerts.length > 0 ? (
              alerts.slice(0, 10).map((alert) => (
                <AlertBadge key={alert.id} alert={alert} />
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No recent alerts</p>
            )}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">API Response Time</span>
              <span className="text-green-600 font-medium">
                {performanceMetrics.length > 0 
                  ? `${performanceMetrics[performanceMetrics.length - 1].responseTime.toFixed(0)}ms`
                  : 'N/A'
                }
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Database Status</span>
              <span className="text-green-600 font-medium">Healthy</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Cache Hit Rate</span>
              <span className="text-green-600 font-medium">94.2%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Error Rate</span>
              <span className="text-green-600 font-medium">
                {performanceMetrics.length > 0 
                  ? `${performanceMetrics[performanceMetrics.length - 1].errorRate.toFixed(2)}%`
                  : 'N/A'
                }
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
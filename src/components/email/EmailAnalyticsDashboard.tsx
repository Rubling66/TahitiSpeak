import React, { useState, useEffect } from 'react';
import { useEmail } from '../../hooks/useEmail';
import { EmailAnalytics } from '../../services/EmailService';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { 
  Mail, 
  TrendingUp, 
  Users, 
  MousePointer, 
  Eye, 
  AlertTriangle,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Loader2
} from 'lucide-react';

interface EmailAnalyticsDashboardProps {
  className?: string;
  timeRange?: '7d' | '30d' | '90d' | '1y';
}

const EmailAnalyticsDashboard: React.FC<EmailAnalyticsDashboardProps> = ({
  className = '',
  timeRange: initialTimeRange = '30d'
}) => {
  const { analytics, isLoading, error, loadAnalytics } = useEmail();
  const [timeRange, setTimeRange] = useState(initialTimeRange);
  const [selectedMetric, setSelectedMetric] = useState<'sent' | 'delivered' | 'opened' | 'clicked'>('sent');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics, timeRange]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAnalytics();
    setIsRefreshing(false);
  };

  const handleExport = () => {
    if (!analytics) return;
    
    const dataStr = JSON.stringify(analytics, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `email_analytics_${timeRange}_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Mock data for demonstration
  const mockAnalytics: EmailAnalytics = analytics || {
    totalSent: 1250,
    totalDelivered: 1180,
    totalOpened: 590,
    totalClicked: 118,
    deliveryRate: 94.4,
    openRate: 50.0,
    clickRate: 10.0,
    bounceRate: 5.6,
    unsubscribeRate: 0.8,
    spamRate: 0.2,
    engagementTrends: [
      { date: '2024-01-01', sent: 45, delivered: 42, opened: 21, clicked: 4 },
      { date: '2024-01-02', sent: 52, delivered: 49, opened: 25, clicked: 5 },
      { date: '2024-01-03', sent: 38, delivered: 36, opened: 18, clicked: 3 },
      { date: '2024-01-04', sent: 61, delivered: 58, opened: 29, clicked: 6 },
      { date: '2024-01-05', sent: 44, delivered: 41, opened: 20, clicked: 4 },
      { date: '2024-01-06', sent: 55, delivered: 52, opened: 26, clicked: 5 },
      { date: '2024-01-07', sent: 49, delivered: 46, opened: 23, clicked: 5 }
    ],
    templatePerformance: [
      { templateName: 'welcome', sent: 320, opened: 192, clicked: 38, openRate: 60.0, clickRate: 11.9 },
      { templateName: 'lessonReminder', sent: 450, opened: 225, clicked: 45, openRate: 50.0, clickRate: 10.0 },
      { templateName: 'achievementUnlocked', sent: 180, opened: 126, clicked: 25, openRate: 70.0, clickRate: 13.9 },
      { templateName: 'progressUpdate', sent: 200, opened: 80, clicked: 12, openRate: 40.0, clickRate: 6.0 },
      { templateName: 'weeklyDigest', sent: 100, opened: 45, clicked: 9, openRate: 45.0, clickRate: 9.0 }
    ],
    userEngagement: [
      { segment: 'Highly Engaged', count: 245, percentage: 24.5 },
      { segment: 'Moderately Engaged', count: 380, percentage: 38.0 },
      { segment: 'Low Engagement', count: 275, percentage: 27.5 },
      { segment: 'Inactive', count: 100, percentage: 10.0 }
    ]
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatPercentage = (num: number) => `${num.toFixed(1)}%`;

  if (isLoading && !analytics) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading analytics...</span>
      </div>
    );
  }

  if (error && !analytics) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">Failed to load email analytics</span>
          </div>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Mail className="w-6 h-6 text-blue-500 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Email Analytics</h2>
              <p className="text-gray-600 text-sm mt-1">
                Track email performance and engagement metrics
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={handleExport}
              className="p-2 text-gray-400 hover:text-gray-600"
              title="Export Data"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Sent</p>
                <p className="text-2xl font-bold text-blue-900">{formatNumber(mockAnalytics.totalSent)}</p>
              </div>
              <Mail className="w-8 h-8 text-blue-500" />
            </div>
            <div className="mt-2 flex items-center">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600 text-sm">+12% from last period</span>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Delivery Rate</p>
                <p className="text-2xl font-bold text-green-900">{formatPercentage(mockAnalytics.deliveryRate)}</p>
              </div>
              <Users className="w-8 h-8 text-green-500" />
            </div>
            <div className="mt-2 flex items-center">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600 text-sm">+2.1% from last period</span>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Open Rate</p>
                <p className="text-2xl font-bold text-purple-900">{formatPercentage(mockAnalytics.openRate)}</p>
              </div>
              <Eye className="w-8 h-8 text-purple-500" />
            </div>
            <div className="mt-2 flex items-center">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600 text-sm">+5.3% from last period</span>
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">Click Rate</p>
                <p className="text-2xl font-bold text-orange-900">{formatPercentage(mockAnalytics.clickRate)}</p>
              </div>
              <MousePointer className="w-8 h-8 text-orange-500" />
            </div>
            <div className="mt-2 flex items-center">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600 text-sm">+1.8% from last period</span>
            </div>
          </div>
        </div>

        {/* Engagement Trends Chart */}
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Engagement Trends</h3>
            <div className="flex items-center space-x-2">
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="sent">Sent</option>
                <option value="delivered">Delivered</option>
                <option value="opened">Opened</option>
                <option value="clicked">Clicked</option>
              </select>
            </div>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockAnalytics.engagementTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: number, name: string) => [formatNumber(value), name.charAt(0).toUpperCase() + name.slice(1)]}
                />
                <Area 
                  type="monotone" 
                  dataKey={selectedMetric} 
                  stroke="#3B82F6" 
                  fill="#3B82F6" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Template Performance */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Template Performance</h3>
            <div className="space-y-4">
              {mockAnalytics.templatePerformance.map((template, index) => (
                <div key={template.templateName} className="bg-white rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 capitalize">
                      {template.templateName.replace(/([A-Z])/g, ' $1').trim()}
                    </h4>
                    <span className="text-sm text-gray-500">{formatNumber(template.sent)} sent</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Open Rate:</span>
                      <span className="ml-2 font-medium text-purple-600">
                        {formatPercentage(template.openRate)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Click Rate:</span>
                      <span className="ml-2 font-medium text-orange-600">
                        {formatPercentage(template.clickRate)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Performance</span>
                      <span>{formatPercentage(template.openRate)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(template.openRate, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* User Engagement Distribution */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">User Engagement Distribution</h3>
            
            <div className="h-64 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mockAnalytics.userEngagement}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {mockAnalytics.userEngagement.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [formatNumber(value), 'Users']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-2">
              {mockAnalytics.userEngagement.map((segment, index) => (
                <div key={segment.segment} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm text-gray-700">{segment.segment}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">{formatNumber(segment.count)}</span>
                    <span className="text-gray-500 ml-1">({formatPercentage(segment.percentage)})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-medium">Bounce Rate</p>
                <p className="text-xl font-bold text-red-900">{formatPercentage(mockAnalytics.bounceRate)}</p>
              </div>
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-red-600 text-xs mt-1">Industry avg: 2-5%</p>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 text-sm font-medium">Unsubscribe Rate</p>
                <p className="text-xl font-bold text-yellow-900">{formatPercentage(mockAnalytics.unsubscribeRate)}</p>
              </div>
              <Users className="w-6 h-6 text-yellow-500" />
            </div>
            <p className="text-yellow-600 text-xs mt-1">Industry avg: 0.2-0.5%</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Spam Rate</p>
                <p className="text-xl font-bold text-gray-900">{formatPercentage(mockAnalytics.spamRate)}</p>
              </div>
              <Filter className="w-6 h-6 text-gray-500" />
            </div>
            <p className="text-gray-600 text-xs mt-1">Industry avg: &lt;0.1%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailAnalyticsDashboard;
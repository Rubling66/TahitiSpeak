'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadialBarChart, RadialBar, ScatterChart, Scatter
} from 'recharts';
import {
  Activity, TrendingUp, TrendingDown, AlertTriangle, Users, Globe,
  Brain, Zap, Target, Award, Clock, Calendar, Filter, Download,
  RefreshCw, Settings, Eye, EyeOff, Maximize2, Minimize2
} from 'lucide-react';
import { useAnomalyDetection } from '@/hooks/useAnomalyDetection';
import { usePredictiveAnalytics } from '@/hooks/usePredictiveAnalytics';
import { AlertSystem } from './AlertSystem';

interface DashboardProps {
  className?: string;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
  trend?: 'up' | 'down' | 'stable';
}

interface ChartConfig {
  type: 'line' | 'bar' | 'area' | 'pie' | 'radial' | 'scatter';
  title: string;
  visible: boolean;
}

const TROPICAL_COLORS = {
  primary: '#00B4D8',
  secondary: '#0077B6',
  accent: '#90E0EF',
  success: '#06D6A0',
  warning: '#FFD60A',
  danger: '#F72585',
  coral: '#FF6B6B',
  turquoise: '#4ECDC4',
  sunset: '#FF8E53',
  lagoon: '#45B7D1'
};

const CHART_COLORS = [
  TROPICAL_COLORS.primary,
  TROPICAL_COLORS.coral,
  TROPICAL_COLORS.turquoise,
  TROPICAL_COLORS.sunset,
  TROPICAL_COLORS.success,
  TROPICAL_COLORS.warning
];

export function AnalyticsDashboard({ className = '', isMinimized = false, onToggleMinimize }: DashboardProps) {
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('24h');
  const [refreshInterval, setRefreshInterval] = useState(30000);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['all']);
  const [chartConfigs, setChartConfigs] = useState<Record<string, ChartConfig>>({
    anomalies: { type: 'line', title: 'Anomaly Detection', visible: true },
    predictions: { type: 'area', title: 'Predictive Analytics', visible: true },
    performance: { type: 'bar', title: 'Performance Metrics', visible: true },
    cultural: { type: 'pie', title: 'Cultural Engagement', visible: true },
    realtime: { type: 'scatter', title: 'Real-time Activity', visible: true }
  });

  // Hooks for analytics data
  const anomalyDetection = useAnomalyDetection({
    thresholds: { high: 0.8, medium: 0.6, low: 0.4 },
    windowSize: 50,
    enableCulturalContext: true
  });

  const predictiveAnalytics = usePredictiveAnalytics({
    predictionHorizon: 24,
    updateInterval: refreshInterval,
    confidenceThreshold: 0.7,
    enableCulturalFactors: true
  });

  // Start monitoring on mount
  useEffect(() => {
    anomalyDetection.startMonitoring();
    predictiveAnalytics.startPredictiveAnalysis();

    return () => {
      anomalyDetection.stopMonitoring();
      predictiveAnalytics.stopPredictiveAnalysis();
    };
  }, []);

  // Auto-refresh data
  useEffect(() => {
    if (!isAutoRefresh) return;

    const interval = setInterval(() => {
      // Simulate new data points
      const timestamp = new Date();
      const value = Math.random() * 100;
      
      anomalyDetection.addDataPoint({
        timestamp,
        value,
        category: 'user_engagement',
        metadata: { source: 'dashboard_simulation' }
      });

      predictiveAnalytics.addDataPoint({
        timestamp,
        value,
        category: 'cultural_activity',
        metadata: { source: 'dashboard_simulation' }
      });
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [isAutoRefresh, refreshInterval]);

  // Prepare chart data
  const chartData = useMemo(() => {
    const now = new Date();
    const timeRangeMs = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000
    }[timeRange];

    const startTime = new Date(now.getTime() - timeRangeMs);

    // Anomaly data
    const anomalyData = anomalyDetection.recentAnomalies
      .filter(a => a.timestamp >= startTime)
      .map(a => ({
        time: a.timestamp.toLocaleTimeString(),
        severity: a.severity,
        value: a.dataPoint.value,
        type: a.type
      }));

    // Prediction data
    const predictionData = predictiveAnalytics.recentPredictions
      .filter(p => p.timestamp >= startTime)
      .map(p => ({
        time: p.timestamp.toLocaleTimeString(),
        predicted: p.value,
        confidence: p.confidence * 100,
        actual: p.value + (Math.random() - 0.5) * 10
      }));

    // Performance metrics
    const performanceData = [
      { name: 'Response Time', value: 45, target: 50 },
      { name: 'Throughput', value: 89, target: 80 },
      { name: 'Error Rate', value: 2, target: 5 },
      { name: 'CPU Usage', value: 67, target: 70 },
      { name: 'Memory', value: 54, target: 60 }
    ];

    // Cultural engagement
    const culturalData = [
      { name: 'Language Learning', value: 35, color: TROPICAL_COLORS.primary },
      { name: 'Cultural Events', value: 25, color: TROPICAL_COLORS.coral },
      { name: 'Traditional Music', value: 20, color: TROPICAL_COLORS.turquoise },
      { name: 'Island Stories', value: 15, color: TROPICAL_COLORS.sunset },
      { name: 'Art & Crafts', value: 5, color: TROPICAL_COLORS.success }
    ];

    // Real-time activity
    const realtimeData = Array.from({ length: 50 }, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      z: Math.random() * 50 + 10,
      category: ['engagement', 'learning', 'cultural', 'social'][Math.floor(Math.random() * 4)]
    }));

    return {
      anomalyData,
      predictionData,
      performanceData,
      culturalData,
      realtimeData
    };
  }, [timeRange, anomalyDetection.recentAnomalies, predictiveAnalytics.recentPredictions]);

  // Metric cards data
  const metrics = [
    {
      title: 'Active Users',
      value: '2,847',
      change: 12.5,
      icon: <Users className="w-6 h-6" />,
      color: TROPICAL_COLORS.primary,
      trend: 'up' as const
    },
    {
      title: 'Cultural Engagement',
      value: '94.2%',
      change: 8.3,
      icon: <Globe className="w-6 h-6" />,
      color: TROPICAL_COLORS.success,
      trend: 'up' as const
    },
    {
      title: 'AI Interactions',
      value: '1,523',
      change: -2.1,
      icon: <Brain className="w-6 h-6" />,
      color: TROPICAL_COLORS.coral,
      trend: 'down' as const
    },
    {
      title: 'Anomalies Detected',
      value: anomalyDetection.totalAnomalies,
      change: 0,
      icon: <AlertTriangle className="w-6 h-6" />,
      color: TROPICAL_COLORS.warning,
      trend: 'stable' as const
    },
    {
      title: 'Prediction Accuracy',
      value: `${Math.round(predictiveAnalytics.metrics.averageConfidence * 100)}%`,
      change: 5.7,
      icon: <Target className="w-6 h-6" />,
      color: TROPICAL_COLORS.turquoise,
      trend: 'up' as const
    },
    {
      title: 'Response Time',
      value: '45ms',
      change: -15.2,
      icon: <Zap className="w-6 h-6" />,
      color: TROPICAL_COLORS.sunset,
      trend: 'up' as const
    }
  ];

  const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, icon, color, trend }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 rounded-lg" style={{ backgroundColor: `${color}20` }}>
          <div style={{ color }}>{icon}</div>
        </div>
        {trend && (
          <div className={`flex items-center space-x-1 ${
            trend === 'up' ? 'text-green-400' : 
            trend === 'down' ? 'text-red-400' : 'text-gray-400'
          }`}>
            {trend === 'up' && <TrendingUp className="w-4 h-4" />}
            {trend === 'down' && <TrendingDown className="w-4 h-4" />}
            {trend === 'stable' && <Activity className="w-4 h-4" />}
            {change !== undefined && <span className="text-sm">{change > 0 ? '+' : ''}{change}%</span>}
          </div>
        )}
      </div>
      <h3 className="text-white/70 text-sm font-medium mb-1">{title}</h3>
      <p className="text-white text-2xl font-bold">{value}</p>
    </motion.div>
  );

  const ChartContainer: React.FC<{ title: string; children: React.ReactNode; configKey: string }> = ({ 
    title, children, configKey 
  }) => {
    const config = chartConfigs[configKey];
    if (!config?.visible) return null;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white text-lg font-semibold">{title}</h3>
          <button
            onClick={() => setChartConfigs(prev => ({
              ...prev,
              [configKey]: { ...prev[configKey], visible: false }
            }))}
            className="text-white/50 hover:text-white/80 transition-colors"
          >
            <EyeOff className="w-4 h-4" />
          </button>
        </div>
        <div className="h-64">
          {children}
        </div>
      </motion.div>
    );
  };

  if (isMinimized) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`fixed bottom-4 right-4 bg-gradient-to-br from-blue-600/90 to-purple-600/90 backdrop-blur-md rounded-xl p-4 border border-white/20 shadow-2xl z-50 ${className}`}
      >
        <div className="flex items-center space-x-3">
          <Activity className="w-6 h-6 text-white animate-pulse" />
          <div className="text-white">
            <p className="text-sm font-medium">Analytics Active</p>
            <p className="text-xs text-white/70">{anomalyDetection.totalAnomalies} anomalies detected</p>
          </div>
          <button
            onClick={onToggleMinimize}
            className="text-white/70 hover:text-white transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-6 ${className}`}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">🌺 Tahitian Analytics Dashboard</h1>
          <p className="text-white/70">Real-time insights into your cultural immersion platform</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
          >
            <option value="1h">Last Hour</option>
            <option value="6h">Last 6 Hours</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
          </select>

          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            className={`p-2 rounded-lg transition-colors ${
              isAutoRefresh ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/50'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isAutoRefresh ? 'animate-spin' : ''}`} />
          </button>

          {/* Minimize Button */}
          {onToggleMinimize && (
            <button
              onClick={onToggleMinimize}
              className="p-2 rounded-lg bg-white/10 text-white/70 hover:text-white transition-colors"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>

      {/* Alert System */}
      <AlertSystem className="mb-6" />

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Anomaly Detection Chart */}
        <ChartContainer title="Anomaly Detection Timeline" configKey="anomalies">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData.anomalyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="time" stroke="rgba(255,255,255,0.7)" />
              <YAxis stroke="rgba(255,255,255,0.7)" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)', 
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="severity" 
                stroke={TROPICAL_COLORS.coral} 
                strokeWidth={2}
                dot={{ fill: TROPICAL_COLORS.coral, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Predictive Analytics Chart */}
        <ChartContainer title="Predictive Analytics" configKey="predictions">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData.predictionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="time" stroke="rgba(255,255,255,0.7)" />
              <YAxis stroke="rgba(255,255,255,0.7)" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)', 
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="predicted" 
                stackId="1"
                stroke={TROPICAL_COLORS.primary} 
                fill={`${TROPICAL_COLORS.primary}40`}
              />
              <Area 
                type="monotone" 
                dataKey="confidence" 
                stackId="2"
                stroke={TROPICAL_COLORS.turquoise} 
                fill={`${TROPICAL_COLORS.turquoise}40`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Performance Metrics */}
        <ChartContainer title="Performance Metrics" configKey="performance">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.7)" />
              <YAxis stroke="rgba(255,255,255,0.7)" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)', 
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="value" fill={TROPICAL_COLORS.success} />
              <Bar dataKey="target" fill={`${TROPICAL_COLORS.warning}60`} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Cultural Engagement */}
        <ChartContainer title="Cultural Engagement Distribution" configKey="cultural">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData.culturalData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {chartData.culturalData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Real-time Activity Scatter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 mb-8"
      >
        <h3 className="text-white text-lg font-semibold mb-4">Real-time User Activity</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart data={chartData.realtimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="x" stroke="rgba(255,255,255,0.7)" />
              <YAxis dataKey="y" stroke="rgba(255,255,255,0.7)" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)', 
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px'
                }}
              />
              <Scatter dataKey="z" fill={TROPICAL_COLORS.primary} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Cultural Insights Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20"
      >
        <h3 className="text-white text-lg font-semibold mb-4">🌺 Cultural Insights & Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-white/80 font-medium mb-3">Anomaly Insights</h4>
            <div className="space-y-2">
              {anomalyDetection.culturalInsights.slice(0, 3).map((insight, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-coral-400 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-white/70 text-sm">{insight}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-white/80 font-medium mb-3">Predictive Recommendations</h4>
            <div className="space-y-2">
              {predictiveAnalytics.getCulturalRecommendations().slice(0, 3).map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-turquoise-400 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-white/70 text-sm">{recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default AnalyticsDashboard;
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, TrendingUp, Clock, Heart, AlertTriangle, Target,
  Calendar, BarChart3, PieChart, Activity, Zap, Award,
  Filter, Download, RefreshCw, Eye, UserCheck, MessageSquare,
  Star, Globe, Waves, Sun, Palmtree
} from 'lucide-react';
import { useEngagementAnalytics } from '../hooks/useEngagementAnalytics';

const EngagementDashboard: React.FC = () => {
  const { state, actions } = useEngagementAnalytics();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'features' | 'retention' | 'alerts'>('overview');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const {
    userEngagements,
    communityMetrics,
    engagementTrends,
    retentionCohorts,
    featureUsage,
    personalizationInsights,
    engagementAlerts,
    isLoading,
    selectedTimeRange,
    filters
  } = state;

  // Filter users based on current filters
  const filteredUsers = userEngagements.filter(user => {
    if (filters.engagementLevel !== 'all') {
      const level = user.engagementScore >= 80 ? 'high' : user.engagementScore >= 60 ? 'medium' : 'low';
      if (level !== filters.engagementLevel) return false;
    }
    if (filters.retentionRisk !== 'all' && user.retentionRisk !== filters.retentionRisk) return false;
    return true;
  });

  const MetricCard: React.FC<{
    title: string;
    value: string | number;
    change?: string;
    icon: React.ReactNode;
    color: string;
    trend?: 'up' | 'down' | 'stable';
  }> = ({ title, value, change, icon, color, trend }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`bg-gradient-to-br ${color} rounded-xl p-6 text-white shadow-lg`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-white/20 rounded-lg">
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center space-x-1 ${
            trend === 'up' ? 'text-green-200' : trend === 'down' ? 'text-red-200' : 'text-yellow-200'
          }`}>
            <TrendingUp className={`w-4 h-4 ${trend === 'down' ? 'rotate-180' : ''}`} />
          </div>
        )}
      </div>
      <h3 className="text-2xl font-bold mb-1">{value}</h3>
      <p className="text-white/80 text-sm">{title}</p>
      {change && (
        <p className="text-white/60 text-xs mt-2">{change}</p>
      )}
    </motion.div>
  );

  const EngagementChart: React.FC = () => (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800">Engagement Trends</h3>
        <div className="flex space-x-2">
          {(['7d', '30d', '90d', '1y'] as const).map((range) => (
            <button
              key={range}
              onClick={() => actions.setTimeRange(range)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                selectedTimeRange === range
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>
      
      <div className="h-64 flex items-end space-x-2">
        {engagementTrends.slice(-14).map((trend, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${(trend.engagementScore / 100) * 200}px` }}
              transition={{ delay: index * 0.1 }}
              className="w-full bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t-lg min-h-[20px]"
            />
            <span className="text-xs text-gray-500 mt-2">
              {trend.date.getDate()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const UserEngagementList: React.FC = () => (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800">User Engagement</h3>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Filter className="w-4 h-4" />
          <span>Filters</span>
        </button>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 bg-gray-50 rounded-lg"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                value={filters.engagementLevel}
                onChange={(e) => actions.updateFilters({ engagementLevel: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Engagement Levels</option>
                <option value="high">High (80+)</option>
                <option value="medium">Medium (60-79)</option>
                <option value="low">Low (&lt;60)</option>
              </select>
              
              <select
                value={filters.retentionRisk}
                onChange={(e) => actions.updateFilters({ retentionRisk: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Retention Risks</option>
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
              </select>
              
              <select
                value={filters.culturalInterest}
                onChange={(e) => actions.updateFilters({ culturalInterest: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Cultural Interests</option>
                <option value="cooking">Cooking</option>
                <option value="dance">Dance</option>
                <option value="language">Language</option>
                <option value="navigation">Navigation</option>
              </select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {filteredUsers.map((user) => (
          <motion.div
            key={user.userId}
            whileHover={{ scale: 1.01 }}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            onClick={() => setSelectedUser(user.userId)}
          >
            <div className="flex items-center space-x-4">
              <img
                src={user.avatar}
                alt={user.userName}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <h4 className="font-semibold text-gray-800">{user.userName}</h4>
                <p className="text-sm text-gray-600">
                  {user.streakDays} day streak • {user.completedLessons} lessons
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-semibold text-gray-800">{user.engagementScore}%</p>
                <p className={`text-sm ${
                  user.retentionRisk === 'low' ? 'text-green-600' :
                  user.retentionRisk === 'medium' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {user.retentionRisk} risk
                </p>
              </div>
              
              <div className="w-16 h-2 bg-gray-200 rounded-full">
                <div
                  className={`h-full rounded-full ${
                    user.engagementScore >= 80 ? 'bg-green-500' :
                    user.engagementScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${user.engagementScore}%` }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const FeatureUsageChart: React.FC = () => (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <h3 className="text-xl font-bold text-gray-800 mb-6">Feature Usage</h3>
      
      <div className="space-y-4">
        {featureUsage.map((feature, index) => (
          <div key={feature.featureName} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-800">{feature.featureName}</span>
              <span className="text-sm text-gray-600">{feature.adoptionRate.toFixed(1)}%</span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${feature.adoptionRate}%` }}
                transition={{ delay: index * 0.1 }}
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
              />
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{feature.activeUsers} active users</span>
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-yellow-500" />
                <span>{feature.satisfactionScore.toFixed(1)}</span>
                <Palmtree className="w-4 h-4 text-green-500" />
                <span>{feature.culturalRelevance.toFixed(1)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const RetentionCohortTable: React.FC = () => (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <h3 className="text-xl font-bold text-gray-800 mb-6">Retention Cohorts</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-2 font-semibold text-gray-800">Cohort</th>
              <th className="text-center py-3 px-2 font-semibold text-gray-800">Users</th>
              <th className="text-center py-3 px-2 font-semibold text-gray-800">Week 1</th>
              <th className="text-center py-3 px-2 font-semibold text-gray-800">Week 2</th>
              <th className="text-center py-3 px-2 font-semibold text-gray-800">Week 4</th>
              <th className="text-center py-3 px-2 font-semibold text-gray-800">Month 2</th>
              <th className="text-center py-3 px-2 font-semibold text-gray-800">Month 6</th>
            </tr>
          </thead>
          <tbody>
            {retentionCohorts.slice(-6).map((cohort, index) => (
              <tr key={cohort.cohortMonth} className="border-b border-gray-100">
                <td className="py-3 px-2 font-medium text-gray-800">{cohort.cohortMonth}</td>
                <td className="py-3 px-2 text-center text-gray-600">{cohort.totalUsers}</td>
                <td className="py-3 px-2 text-center">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    (cohort.week1 / cohort.totalUsers) >= 0.8 ? 'bg-green-100 text-green-800' :
                    (cohort.week1 / cohort.totalUsers) >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {((cohort.week1 / cohort.totalUsers) * 100).toFixed(0)}%
                  </span>
                </td>
                <td className="py-3 px-2 text-center">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    (cohort.week2 / cohort.totalUsers) >= 0.6 ? 'bg-green-100 text-green-800' :
                    (cohort.week2 / cohort.totalUsers) >= 0.4 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {((cohort.week2 / cohort.totalUsers) * 100).toFixed(0)}%
                  </span>
                </td>
                <td className="py-3 px-2 text-center">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    (cohort.week4 / cohort.totalUsers) >= 0.4 ? 'bg-green-100 text-green-800' :
                    (cohort.week4 / cohort.totalUsers) >= 0.25 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {((cohort.week4 / cohort.totalUsers) * 100).toFixed(0)}%
                  </span>
                </td>
                <td className="py-3 px-2 text-center">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    (cohort.month2 / cohort.totalUsers) >= 0.3 ? 'bg-green-100 text-green-800' :
                    (cohort.month2 / cohort.totalUsers) >= 0.2 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {((cohort.month2 / cohort.totalUsers) * 100).toFixed(0)}%
                  </span>
                </td>
                <td className="py-3 px-2 text-center">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    (cohort.month6 / cohort.totalUsers) >= 0.15 ? 'bg-green-100 text-green-800' :
                    (cohort.month6 / cohort.totalUsers) >= 0.1 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {((cohort.month6 / cohort.totalUsers) * 100).toFixed(0)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const AlertsPanel: React.FC = () => (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800">Engagement Alerts</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">
            {engagementAlerts.filter(alert => !alert.isResolved).length} active
          </span>
        </div>
      </div>
      
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {engagementAlerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`p-4 rounded-lg border-l-4 ${
              alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
              alert.severity === 'high' ? 'border-orange-500 bg-orange-50' :
              alert.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
              'border-blue-500 bg-blue-50'
            } ${alert.isResolved ? 'opacity-60' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className={`w-5 h-5 ${
                    alert.severity === 'critical' ? 'text-red-500' :
                    alert.severity === 'high' ? 'text-orange-500' :
                    alert.severity === 'medium' ? 'text-yellow-500' :
                    'text-blue-500'
                  }`} />
                  <h4 className="font-semibold text-gray-800">{alert.title}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                    alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                    alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {alert.severity}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-3">{alert.description}</p>
                
                <div className="mb-3">
                  <p className="text-sm text-gray-500 mb-1">Cultural Context:</p>
                  <p className="text-sm text-gray-700 italic">{alert.culturalContext}</p>
                </div>
                
                <div className="mb-3">
                  <p className="text-sm text-gray-500 mb-1">Recommended Actions:</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {alert.recommendedActions.map((action, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{alert.affectedUsers} users affected</span>
                  <span>{alert.timestamp.toLocaleDateString()}</span>
                </div>
              </div>
              
              {!alert.isResolved && (
                <button
                  onClick={() => actions.resolveAlert(alert.id)}
                  className="ml-4 px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                >
                  Resolve
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="text-lg text-gray-600">Loading engagement analytics...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Engagement Analytics</h1>
            <p className="text-gray-600">Monitor community health and user engagement</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={actions.refreshData}
              className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            
            <button
              onClick={() => actions.exportAnalytics('csv')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-white rounded-lg p-1 shadow">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'features', label: 'Features', icon: Target },
            { id: 'retention', label: 'Retention', icon: UserCheck },
            { id: 'alerts', label: 'Alerts', icon: AlertTriangle }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                  title="Total Users"
                  value={communityMetrics.totalUsers.toLocaleString()}
                  change="+12% this month"
                  icon={<Users className="w-6 h-6" />}
                  color="from-blue-500 to-cyan-400"
                  trend="up"
                />
                <MetricCard
                  title="Active Users"
                  value={communityMetrics.activeUsers.toLocaleString()}
                  change={`${communityMetrics.engagementRate.toFixed(1)}% engagement rate`}
                  icon={<Activity className="w-6 h-6" />}
                  color="from-green-500 to-emerald-400"
                  trend="up"
                />
                <MetricCard
                  title="Avg Session Time"
                  value={`${communityMetrics.averageSessionTime.toFixed(1)}m`}
                  change="+8% from last week"
                  icon={<Clock className="w-6 h-6" />}
                  color="from-purple-500 to-pink-400"
                  trend="up"
                />
                <MetricCard
                  title="Retention Rate"
                  value={`${communityMetrics.retentionRate.toFixed(1)}%`}
                  change={`${communityMetrics.churnRate.toFixed(1)}% churn rate`}
                  icon={<Heart className="w-6 h-6" />}
                  color="from-orange-500 to-red-400"
                  trend="stable"
                />
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <EngagementChart />
                <FeatureUsageChart />
              </div>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <UserEngagementList />
            </motion.div>
          )}

          {activeTab === 'features' && (
            <motion.div
              key="features"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <FeatureUsageChart />
            </motion.div>
          )}

          {activeTab === 'retention' && (
            <motion.div
              key="retention"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <RetentionCohortTable />
            </motion.div>
          )}

          {activeTab === 'alerts' && (
            <motion.div
              key="alerts"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <AlertsPanel />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cultural Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <div className="flex items-center justify-center space-x-4 text-gray-500">
            <Waves className="w-5 h-5" />
            <span className="text-sm">Powered by Tahitian Cultural Analytics</span>
            <Sun className="w-5 h-5" />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default EngagementDashboard;
export { EngagementDashboard };
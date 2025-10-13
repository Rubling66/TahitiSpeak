'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, RadialBarChart, RadialBar, ScatterChart, Scatter,
  ComposedChart, ReferenceLine
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, BookOpen, Clock, 
  Target, Download, RefreshCw, Filter, Calendar,
  Activity, Award, Brain, Globe, AlertTriangle,
  Zap, Eye, Heart, MessageCircle, Star,
  ArrowUp, ArrowDown, Minus, Lightbulb,
  PlayCircle, PauseCircle, SkipForward
} from 'lucide-react';
import { AnalyticsService } from '@/lib/services/AnalyticsService';
import { 
  LearningMetrics, 
  CourseAnalytics, 
  LearnerProgress, 
  ContentEffectiveness,
  SystemMetrics,
  DateRange,
  DashboardWidget
} from '@/types/analytics';
import { DataService } from '@/lib/data/DataService';

interface EnhancedAnalyticsDashboardProps {
  className?: string;
}

// Enhanced analytics interfaces
interface RealTimeMetrics {
  currentActiveUsers: number;
  sessionsToday: number;
  completionsToday: number;
  averageSessionDuration: number;
  bounceRate: number;
  engagementScore: number;
}

interface EngagementMetrics {
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  sessionDuration: number;
  pagesPerSession: number;
  interactionRate: number;
  contentEngagement: {
    videoWatchTime: number;
    quizAttempts: number;
    discussionPosts: number;
    bookmarks: number;
  };
}

interface RetentionAnalysis {
  day1Retention: number;
  day7Retention: number;
  day30Retention: number;
  cohortAnalysis: Array<{
    cohort: string;
    week0: number;
    week1: number;
    week2: number;
    week3: number;
    week4: number;
  }>;
  dropOffPoints: Array<{
    lessonId: string;
    lessonName: string;
    dropOffRate: number;
    stage: 'intro' | 'content' | 'practice' | 'assessment';
  }>;
}

interface AIInsights {
  recommendations: Array<{
    id: string;
    type: 'content' | 'engagement' | 'retention' | 'performance';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    impact: string;
    actionItems: string[];
    confidence: number;
  }>;
  predictions: {
    nextWeekEngagement: number;
    churnRisk: Array<{
      learnerId: string;
      learnerName: string;
      riskScore: number;
      factors: string[];
    }>;
    contentPerformance: Array<{
      contentId: string;
      contentName: string;
      predictedEngagement: number;
      suggestedImprovements: string[];
    }>;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const EnhancedAnalyticsDashboard = React.memo(function EnhancedAnalyticsDashboard({ className }: EnhancedAnalyticsDashboardProps) {
  const analyticsService = useMemo(() => new AnalyticsService(new DataService()), []);
  const [loading, setLoading] = useState(true);
  const [realTimeLoading, setRealTimeLoading] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date()
  });
  
  // Enhanced analytics data state
  const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimeMetrics | null>(null);
  const [engagementMetrics, setEngagementMetrics] = useState<EngagementMetrics | null>(null);
  const [retentionAnalysis, setRetentionAnalysis] = useState<RetentionAnalysis | null>(null);
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  
  // Original analytics data
  const [learningMetrics, setLearningMetrics] = useState<LearningMetrics | null>(null);
  const [courseAnalytics, setCourseAnalytics] = useState<CourseAnalytics[]>([]);
  const [learnerProgress, setLearnerProgress] = useState<LearnerProgress[]>([]);
  const [contentEffectiveness, setContentEffectiveness] = useState<ContentEffectiveness[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  
  // UI state
  const [selectedTab, setSelectedTab] = useState('realtime');
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds

  // Real-time data refresh
  useEffect(() => {
    if (autoRefresh && selectedTab === 'realtime') {
      const interval = setInterval(() => {
        loadRealTimeData();
      }, refreshInterval * 1000);
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, selectedTab]);

  useEffect(() => {
    loadAllAnalyticsData();
  }, [dateRange]);

  const loadAllAnalyticsData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadRealTimeData(),
        loadEngagementData(),
        loadRetentionData(),
        loadAIInsights(),
        loadOriginalAnalyticsData()
      ]);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRealTimeData = async () => {
    setRealTimeLoading(true);
    try {
      // Simulate real-time data - in production, this would call actual APIs
      const mockRealTimeData: RealTimeMetrics = {
        currentActiveUsers: Math.floor(Math.random() * 50) + 10,
        sessionsToday: Math.floor(Math.random() * 200) + 100,
        completionsToday: Math.floor(Math.random() * 30) + 15,
        averageSessionDuration: Math.floor(Math.random() * 600) + 300, // 5-15 minutes
        bounceRate: Math.random() * 0.3 + 0.1, // 10-40%
        engagementScore: Math.random() * 30 + 70 // 70-100%
      };
      setRealTimeMetrics(mockRealTimeData);
    } catch (error) {
      console.error('Error loading real-time data:', error);
    } finally {
      setRealTimeLoading(false);
    }
  };

  const loadEngagementData = async () => {
    try {
      const mockEngagementData: EngagementMetrics = {
        dailyActiveUsers: Math.floor(Math.random() * 100) + 50,
        weeklyActiveUsers: Math.floor(Math.random() * 300) + 200,
        monthlyActiveUsers: Math.floor(Math.random() * 800) + 500,
        sessionDuration: Math.floor(Math.random() * 600) + 300,
        pagesPerSession: Math.random() * 5 + 3,
        interactionRate: Math.random() * 0.4 + 0.6,
        contentEngagement: {
          videoWatchTime: Math.floor(Math.random() * 3600) + 1800,
          quizAttempts: Math.floor(Math.random() * 50) + 20,
          discussionPosts: Math.floor(Math.random() * 30) + 10,
          bookmarks: Math.floor(Math.random() * 40) + 15
        }
      };
      setEngagementMetrics(mockEngagementData);
    } catch (error) {
      console.error('Error loading engagement data:', error);
    }
  };

  const loadRetentionData = async () => {
    try {
      const mockRetentionData: RetentionAnalysis = {
        day1Retention: Math.random() * 0.3 + 0.6, // 60-90%
        day7Retention: Math.random() * 0.2 + 0.4, // 40-60%
        day30Retention: Math.random() * 0.15 + 0.25, // 25-40%
        cohortAnalysis: generateCohortData(),
        dropOffPoints: generateDropOffData()
      };
      setRetentionAnalysis(mockRetentionData);
    } catch (error) {
      console.error('Error loading retention data:', error);
    }
  };

  const loadAIInsights = async () => {
    try {
      const mockAIInsights: AIInsights = {
        recommendations: generateAIRecommendations(),
        predictions: {
          nextWeekEngagement: Math.random() * 20 + 75, // 75-95%
          churnRisk: generateChurnRiskData(),
          contentPerformance: generateContentPredictions()
        }
      };
      setAiInsights(mockAIInsights);
    } catch (error) {
      console.error('Error loading AI insights:', error);
    }
  };

  const loadOriginalAnalyticsData = async () => {
    try {
      const [metrics, courses, learners, content, system] = await Promise.all([
        analyticsService.getLearningMetrics(dateRange),
        analyticsService.getCourseAnalytics(undefined, dateRange),
        analyticsService.getLearnerProgress(),
        analyticsService.getContentEffectiveness(),
        analyticsService.getSystemMetrics()
      ]);
      
      setLearningMetrics(metrics);
      setCourseAnalytics(courses);
      setLearnerProgress(learners);
      setContentEffectiveness(content);
      setSystemMetrics(system);
    } catch (error) {
      console.error('Error loading original analytics data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllAnalyticsData();
    setRefreshing(false);
  };

  // Enhanced Metric Card with trend indicators
  const EnhancedMetricCard = ({ 
    title, 
    value, 
    change, 
    trend,
    icon: Icon, 
    description,
    realTime = false,
    status = 'neutral'
  }: {
    title: string;
    value: string | number;
    change?: string;
    trend?: 'up' | 'down' | 'neutral';
    icon: React.ElementType;
    description?: string;
    realTime?: boolean;
    status?: 'good' | 'warning' | 'critical' | 'neutral';
  }) => {
    const getStatusColor = () => {
      switch (status) {
        case 'good': return 'border-green-200 bg-green-50';
        case 'warning': return 'border-yellow-200 bg-yellow-50';
        case 'critical': return 'border-red-200 bg-red-50';
        default: return 'border-gray-200 bg-white';
      }
    };

    return (
      <Card className={getStatusColor()}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {title}
            {realTime && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
          </CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {change && (
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {trend === 'up' && <ArrowUp className="h-3 w-3 mr-1 text-green-500" />}
              {trend === 'down' && <ArrowDown className="h-3 w-3 mr-1 text-red-500" />}
              {trend === 'neutral' && <Minus className="h-3 w-3 mr-1 text-gray-500" />}
              <span className={
                trend === 'up' ? 'text-green-500' : 
                trend === 'down' ? 'text-red-500' : 
                'text-gray-500'
              }>
                {change}
              </span>
            </div>
          )}
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </CardContent>
      </Card>
    );
  };

  // Real-time Dashboard Tab
  const RealTimeTab = () => (
    <div className="space-y-6">
      {/* Real-time Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium">Live Data</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? <PauseCircle className="h-4 w-4 mr-2" /> : <PlayCircle className="h-4 w-4 mr-2" />}
            {autoRefresh ? 'Pause' : 'Resume'}
          </Button>
          <Select value={refreshInterval.toString()} onValueChange={(value) => setRefreshInterval(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10s</SelectItem>
              <SelectItem value="30">30s</SelectItem>
              <SelectItem value="60">1m</SelectItem>
              <SelectItem value="300">5m</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={loadRealTimeData} disabled={realTimeLoading} size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${realTimeLoading ? 'animate-spin' : ''}`} />
          Refresh Now
        </Button>
      </div>

      {/* Real-time Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <EnhancedMetricCard
          title="Active Users Now"
          value={realTimeMetrics?.currentActiveUsers || 0}
          icon={Users}
          realTime={true}
          status="good"
          description="Currently online"
        />
        <EnhancedMetricCard
          title="Sessions Today"
          value={realTimeMetrics?.sessionsToday || 0}
          change="+12% vs yesterday"
          trend="up"
          icon={Activity}
          status="good"
        />
        <EnhancedMetricCard
          title="Completions Today"
          value={realTimeMetrics?.completionsToday || 0}
          change="+8% vs yesterday"
          trend="up"
          icon={Target}
          status="good"
        />
        <EnhancedMetricCard
          title="Avg Session Duration"
          value={`${Math.round((realTimeMetrics?.averageSessionDuration || 0) / 60)}m`}
          change="-2% vs yesterday"
          trend="down"
          icon={Clock}
          status="warning"
        />
        <EnhancedMetricCard
          title="Bounce Rate"
          value={`${((realTimeMetrics?.bounceRate || 0) * 100).toFixed(1)}%`}
          change="-5% vs yesterday"
          trend="up"
          icon={SkipForward}
          status="good"
        />
        <EnhancedMetricCard
          title="Engagement Score"
          value={`${(realTimeMetrics?.engagementScore || 0).toFixed(0)}%`}
          change="+3% vs yesterday"
          trend="up"
          icon={Heart}
          status="good"
        />
      </div>

      {/* Real-time Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Real-time Activity</CardTitle>
          <CardDescription>Live user activity and engagement over the last 24 hours</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={generateRealTimeActivityData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Area 
                yAxisId="left"
                type="monotone" 
                dataKey="activeUsers" 
                fill="#8884d8" 
                fillOpacity={0.6}
                name="Active Users"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="engagementRate" 
                stroke="#82ca9d" 
                strokeWidth={2}
                name="Engagement Rate %"
              />
              <Bar 
                yAxisId="left"
                dataKey="completions" 
                fill="#ffc658" 
                name="Completions"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Live Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Live Alerts & Notifications</CardTitle>
          <CardDescription>Real-time system alerts and important events</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Alert>
            <TrendingUp className="h-4 w-4" />
            <AlertDescription>
              <strong>High Engagement Alert:</strong> Lesson "Basic Greetings" is experiencing 40% above average engagement in the last hour.
            </AlertDescription>
          </Alert>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Drop-off Warning:</strong> 15% higher than usual drop-off rate detected in "Family Vocabulary" lesson at the practice section.
            </AlertDescription>
          </Alert>
          <Alert>
            <Activity className="h-4 w-4" />
            <AlertDescription>
              <strong>Peak Activity:</strong> Current user activity is 25% above average for this time of day.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );

  // Engagement Analytics Tab
  const EngagementTab = () => (
    <div className="space-y-6">
      {/* Engagement Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <EnhancedMetricCard
          title="Daily Active Users"
          value={engagementMetrics?.dailyActiveUsers || 0}
          change="+15% vs last week"
          trend="up"
          icon={Users}
          status="good"
        />
        <EnhancedMetricCard
          title="Session Duration"
          value={`${Math.round((engagementMetrics?.sessionDuration || 0) / 60)}m`}
          change="+8% vs last week"
          trend="up"
          icon={Clock}
          status="good"
        />
        <EnhancedMetricCard
          title="Pages per Session"
          value={(engagementMetrics?.pagesPerSession || 0).toFixed(1)}
          change="+12% vs last week"
          trend="up"
          icon={BookOpen}
          status="good"
        />
        <EnhancedMetricCard
          title="Interaction Rate"
          value={`${((engagementMetrics?.interactionRate || 0) * 100).toFixed(0)}%`}
          change="+5% vs last week"
          trend="up"
          icon={MessageCircle}
          status="good"
        />
      </div>

      {/* Engagement Trends */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Engagement Trends</CardTitle>
            <CardDescription>Daily, weekly, and monthly active users</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={generateEngagementTrendData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="dau" 
                  stackId="1" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.6}
                  name="Daily Active Users"
                />
                <Area 
                  type="monotone" 
                  dataKey="wau" 
                  stackId="2" 
                  stroke="#82ca9d" 
                  fill="#82ca9d" 
                  fillOpacity={0.6}
                  name="Weekly Active Users"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content Engagement Breakdown</CardTitle>
            <CardDescription>How users interact with different content types</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={generateContentEngagementData()}>
                <RadialBar 
                  minAngle={15} 
                  label={{ position: 'insideStart', fill: '#fff' }} 
                  background 
                  clockWise 
                  dataKey="value" 
                />
                <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" />
                <Tooltip />
              </RadialBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Engagement Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Engagement Analysis</CardTitle>
          <CardDescription>Comprehensive breakdown of user engagement patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h4 className="font-semibold">Content Interaction</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Video Watch Time</span>
                  <div className="flex items-center gap-2">
                    <Progress value={75} className="w-20 h-2" />
                    <span className="text-sm font-medium">{Math.round((engagementMetrics?.contentEngagement.videoWatchTime || 0) / 60)}m</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Quiz Attempts</span>
                  <div className="flex items-center gap-2">
                    <Progress value={60} className="w-20 h-2" />
                    <span className="text-sm font-medium">{engagementMetrics?.contentEngagement.quizAttempts || 0}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Discussion Posts</span>
                  <div className="flex items-center gap-2">
                    <Progress value={45} className="w-20 h-2" />
                    <span className="text-sm font-medium">{engagementMetrics?.contentEngagement.discussionPosts || 0}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Bookmarks</span>
                  <div className="flex items-center gap-2">
                    <Progress value={30} className="w-20 h-2" />
                    <span className="text-sm font-medium">{engagementMetrics?.contentEngagement.bookmarks || 0}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Engagement Quality</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Deep Engagement Rate</span>
                  <Badge variant="default">85%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Return Visitor Rate</span>
                  <Badge variant="default">72%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Feature Adoption</span>
                  <Badge variant="secondary">68%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Social Sharing</span>
                  <Badge variant="secondary">23%</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Retention Analysis Tab
  const RetentionTab = () => (
    <div className="space-y-6">
      {/* Retention Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <EnhancedMetricCard
          title="Day 1 Retention"
          value={`${((retentionAnalysis?.day1Retention || 0) * 100).toFixed(1)}%`}
          change="+5% vs last month"
          trend="up"
          icon={Users}
          status="good"
        />
        <EnhancedMetricCard
          title="Day 7 Retention"
          value={`${((retentionAnalysis?.day7Retention || 0) * 100).toFixed(1)}%`}
          change="+2% vs last month"
          trend="up"
          icon={Calendar}
          status="good"
        />
        <EnhancedMetricCard
          title="Day 30 Retention"
          value={`${((retentionAnalysis?.day30Retention || 0) * 100).toFixed(1)}%`}
          change="-1% vs last month"
          trend="down"
          icon={Target}
          status="warning"
        />
      </div>

      {/* Cohort Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Cohort Retention Analysis</CardTitle>
          <CardDescription>User retention by registration cohort over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Cohort</th>
                  <th className="text-left p-2">Week 0</th>
                  <th className="text-left p-2">Week 1</th>
                  <th className="text-left p-2">Week 2</th>
                  <th className="text-left p-2">Week 3</th>
                  <th className="text-left p-2">Week 4</th>
                </tr>
              </thead>
              <tbody>
                {retentionAnalysis?.cohortAnalysis.map((cohort) => (
                  <tr key={cohort.cohort} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{cohort.cohort}</td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-2 bg-green-500 rounded" />
                        <span>{cohort.week0}%</span>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-12 h-2 bg-blue-500 rounded" 
                          style={{ width: `${(cohort.week1 / cohort.week0) * 48}px` }}
                        />
                        <span>{cohort.week1}%</span>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-12 h-2 bg-yellow-500 rounded" 
                          style={{ width: `${(cohort.week2 / cohort.week0) * 48}px` }}
                        />
                        <span>{cohort.week2}%</span>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-12 h-2 bg-orange-500 rounded" 
                          style={{ width: `${(cohort.week3 / cohort.week0) * 48}px` }}
                        />
                        <span>{cohort.week3}%</span>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-12 h-2 bg-red-500 rounded" 
                          style={{ width: `${(cohort.week4 / cohort.week0) * 48}px` }}
                        />
                        <span>{cohort.week4}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Drop-off Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Drop-off Point Analysis</CardTitle>
          <CardDescription>Identify where learners are most likely to disengage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {retentionAnalysis?.dropOffPoints.map((point, index) => (
              <div key={point.lessonId} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 font-semibold text-sm">{index + 1}</span>
                  </div>
                  <div>
                    <h4 className="font-medium">{point.lessonName}</h4>
                    <p className="text-sm text-muted-foreground">Stage: {point.stage}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-lg font-semibold text-red-600">
                      {(point.dropOffRate * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Drop-off Rate</div>
                  </div>
                  <Progress value={point.dropOffRate * 100} className="w-20 h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // AI Insights Tab
  const AIInsightsTab = () => (
    <div className="space-y-6">
      {/* AI Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI-Powered Recommendations
          </CardTitle>
          <CardDescription>Intelligent insights and actionable recommendations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {aiInsights?.recommendations.map((rec) => (
            <div key={rec.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  <div>
                    <h4 className="font-semibold">{rec.title}</h4>
                    <p className="text-sm text-muted-foreground">{rec.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}>
                    {rec.priority}
                  </Badge>
                  <Badge variant="outline">{rec.confidence}% confidence</Badge>
                </div>
              </div>
              <div className="mb-3">
                <p className="text-sm"><strong>Expected Impact:</strong> {rec.impact}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Action Items:</p>
                <ul className="text-sm space-y-1">
                  {rec.actionItems.map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-muted-foreground">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Predictions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Churn Risk Prediction</CardTitle>
            <CardDescription>Learners at risk of disengaging</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aiInsights?.predictions.churnRisk.slice(0, 5).map((risk) => (
                <div key={risk.learnerId} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{risk.learnerName}</div>
                    <div className="text-xs text-muted-foreground">
                      Risk factors: {risk.factors.join(', ')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={risk.riskScore} className="w-16 h-2" />
                    <Badge variant={risk.riskScore > 70 ? 'destructive' : risk.riskScore > 40 ? 'default' : 'secondary'}>
                      {risk.riskScore}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content Performance Predictions</CardTitle>
            <CardDescription>Predicted engagement for upcoming content</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aiInsights?.predictions.contentPerformance.slice(0, 5).map((content) => (
                <div key={content.contentId} className="p-3 border rounded">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{content.contentName}</div>
                    <Badge variant="outline">{content.predictedEngagement.toFixed(0)}% predicted</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <strong>Suggestions:</strong> {content.suggestedImprovements.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Helper functions for generating mock data
  const generateRealTimeActivityData = () => {
    const data = [];
    for (let i = 23; i >= 0; i--) {
      const hour = 23 - i;
      data.push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        activeUsers: Math.floor(Math.random() * 50) + 10,
        engagementRate: Math.floor(Math.random() * 40) + 60,
        completions: Math.floor(Math.random() * 10) + 2
      });
    }
    return data;
  };

  const generateEngagementTrendData = () => {
    const data = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        dau: Math.floor(Math.random() * 100) + 50,
        wau: Math.floor(Math.random() * 300) + 200,
        mau: Math.floor(Math.random() * 800) + 500
      });
    }
    return data;
  };

  const generateContentEngagementData = () => [
    { name: 'Video Content', value: 85, fill: '#8884d8' },
    { name: 'Interactive Exercises', value: 75, fill: '#82ca9d' },
    { name: 'Quizzes', value: 65, fill: '#ffc658' },
    { name: 'Reading Material', value: 55, fill: '#ff7300' },
    { name: 'Audio Lessons', value: 70, fill: '#00ff00' }
  ];

  const generateCohortData = () => [
    { cohort: 'Jan 2024', week0: 100, week1: 75, week2: 60, week3: 50, week4: 45 },
    { cohort: 'Feb 2024', week0: 100, week1: 80, week2: 65, week3: 55, week4: 48 },
    { cohort: 'Mar 2024', week0: 100, week1: 78, week2: 62, week3: 52, week4: 46 },
    { cohort: 'Apr 2024', week0: 100, week1: 82, week2: 68, week3: 58, week4: 52 }
  ];

  const generateDropOffData = () => [
    { lessonId: '1', lessonName: 'Basic Greetings', dropOffRate: 0.25, stage: 'practice' as const },
    { lessonId: '2', lessonName: 'Family Vocabulary', dropOffRate: 0.32, stage: 'content' as const },
    { lessonId: '3', lessonName: 'Numbers and Counting', dropOffRate: 0.18, stage: 'assessment' as const },
    { lessonId: '4', lessonName: 'Cultural Context', dropOffRate: 0.28, stage: 'intro' as const }
  ];

  const generateAIRecommendations = () => [
    {
      id: '1',
      type: 'content' as const,
      priority: 'high' as const,
      title: 'Optimize Family Vocabulary Lesson',
      description: 'High drop-off rate detected in practice section',
      impact: 'Could improve retention by 15% and reduce drop-off by 8%',
      actionItems: [
        'Add more interactive elements to practice section',
        'Include audio pronunciation guides',
        'Reduce complexity of initial exercises'
      ],
      confidence: 87
    },
    {
      id: '2',
      type: 'engagement' as const,
      priority: 'medium' as const,
      title: 'Increase Video Content Engagement',
      description: 'Video completion rates below average',
      impact: 'Could increase overall engagement by 12%',
      actionItems: [
        'Add interactive elements within videos',
        'Create shorter video segments',
        'Include progress indicators'
      ],
      confidence: 73
    },
    {
      id: '3',
      type: 'retention' as const,
      priority: 'high' as const,
      title: 'Implement Personalized Learning Paths',
      description: 'One-size-fits-all approach showing limitations',
      impact: 'Could improve 30-day retention by 20%',
      actionItems: [
        'Create adaptive difficulty system',
        'Implement skill-based recommendations',
        'Add personalized review sessions'
      ],
      confidence: 91
    }
  ];

  const generateChurnRiskData = () => [
    { learnerId: '1', learnerName: 'Marie Dupont', riskScore: 85, factors: ['Low engagement', 'Missed sessions'] },
    { learnerId: '2', learnerName: 'Jean Martin', riskScore: 72, factors: ['Difficulty progression', 'Low scores'] },
    { learnerId: '3', learnerName: 'Sophie Bernard', riskScore: 68, factors: ['Irregular login', 'Incomplete lessons'] },
    { learnerId: '4', learnerName: 'Pierre Moreau', riskScore: 45, factors: ['Slow progress'] },
    { learnerId: '5', learnerName: 'Claire Dubois', riskScore: 38, factors: ['Time constraints'] }
  ];

  const generateContentPredictions = () => [
    { 
      contentId: '1', 
      contentName: 'Advanced Conversations', 
      predictedEngagement: 78, 
      suggestedImprovements: ['Add cultural context', 'Include real-world scenarios'] 
    },
    { 
      contentId: '2', 
      contentName: 'Tahitian Music & Culture', 
      predictedEngagement: 85, 
      suggestedImprovements: ['Interactive timeline', 'Audio samples'] 
    },
    { 
      contentId: '3', 
      contentName: 'Business Tahitian', 
      predictedEngagement: 65, 
      suggestedImprovements: ['Practical exercises', 'Role-play scenarios'] 
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading enhanced analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Enhanced Analytics Dashboard</h1>
          <p className="text-muted-foreground">Real-time insights, engagement metrics, and AI-powered recommendations</p>
        </div>
        
        <div className="flex items-center gap-2">
          <DatePickerWithRange
            value={dateRange}
            onChange={setDateRange}
          />
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            size="sm"
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh All
          </Button>
        </div>
      </div>

      {/* Enhanced Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="realtime" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Real-time
          </TabsTrigger>
          <TabsTrigger value="engagement" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Engagement
          </TabsTrigger>
          <TabsTrigger value="retention" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Retention
          </TabsTrigger>
          <TabsTrigger value="ai-insights" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Insights
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="realtime">
          <RealTimeTab />
        </TabsContent>
        
        <TabsContent value="engagement">
          <EngagementTab />
        </TabsContent>
        
        <TabsContent value="retention">
          <RetentionTab />
        </TabsContent>
        
        <TabsContent value="ai-insights">
          <AIInsightsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
});

export default EnhancedAnalyticsDashboard;
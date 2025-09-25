'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, RadialBarChart, RadialBar
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, BookOpen, Clock, 
  Target, Download, RefreshCw, Filter, Calendar,
  Activity, Award, Brain, Globe
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

interface AnalyticsDashboardProps {
  className?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function AnalyticsDashboard({ className }: AnalyticsDashboardProps) {
  const [analyticsService] = useState(() => new AnalyticsService(new DataService()));
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date()
  });
  
  // Analytics data state
  const [learningMetrics, setLearningMetrics] = useState<LearningMetrics | null>(null);
  const [courseAnalytics, setCourseAnalytics] = useState<CourseAnalytics[]>([]);
  const [learnerProgress, setLearnerProgress] = useState<LearnerProgress[]>([]);
  const [contentEffectiveness, setContentEffectiveness] = useState<ContentEffectiveness[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  
  // UI state
  const [selectedTab, setSelectedTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv' | 'xlsx'>('pdf');

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange]);

  const loadAnalyticsData = async () => {
    setLoading(true);
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
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalyticsData();
    setRefreshing(false);
  };

  const handleExport = async () => {
    try {
      const reportConfig = {
        type: 'comprehensive' as const,
        dateRange,
        format: exportFormat,
        includeCharts: true,
        sections: ['overview', 'courses', 'learners', 'content', 'system']
      };
      
      const blob = await analyticsService.generateReport(reportConfig);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    description,
    trend = 'neutral'
  }: {
    title: string;
    value: string | number;
    change?: string;
    icon: React.ElementType;
    description?: string;
    trend?: 'up' | 'down' | 'neutral';
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <div className="flex items-center text-xs text-muted-foreground">
            {trend === 'up' && <TrendingUp className="h-3 w-3 mr-1 text-green-500" />}
            {trend === 'down' && <TrendingDown className="h-3 w-3 mr-1 text-red-500" />}
            <span className={trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : ''}>
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

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Learners"
          value={learningMetrics?.totalLearners || 0}
          change="+12% from last month"
          icon={Users}
          trend="up"
        />
        <MetricCard
          title="Active Learners"
          value={learningMetrics?.activeLearners || 0}
          change="+8% from last month"
          icon={Activity}
          trend="up"
        />
        <MetricCard
          title="Completion Rate"
          value={`${(learningMetrics?.completionRate || 0).toFixed(1)}%`}
          change="+2.1% from last month"
          icon={Target}
          trend="up"
        />
        <MetricCard
          title="Avg. Time on Task"
          value={`${Math.round((learningMetrics?.averageTimeOnTask || 0) / 60)}m`}
          change="-5% from last month"
          icon={Clock}
          trend="down"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Engagement Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Engagement Over Time</CardTitle>
            <CardDescription>Daily active learners and completion rates</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={generateEngagementData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="activeLearners" 
                  stackId="1" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone" 
                  dataKey="completions" 
                  stackId="1" 
                  stroke="#82ca9d" 
                  fill="#82ca9d" 
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Course Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Courses</CardTitle>
            <CardDescription>Completion rates by course</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={courseAnalytics.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="courseName" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="completionRate" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Learning Progress Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Learning Progress Distribution</CardTitle>
          <CardDescription>How learners are progressing through courses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Beginners</span>
                <span>45%</span>
              </div>
              <Progress value={45} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Intermediate</span>
                <span>35%</span>
              </div>
              <Progress value={35} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Advanced</span>
                <span>20%</span>
              </div>
              <Progress value={20} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const CoursesTab = () => (
    <div className="space-y-6">
      {/* Course Analytics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Course Performance Analytics</CardTitle>
          <CardDescription>Detailed metrics for all courses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Course</th>
                  <th className="text-left p-2">Enrollments</th>
                  <th className="text-left p-2">Completions</th>
                  <th className="text-left p-2">Completion Rate</th>
                  <th className="text-left p-2">Avg. Score</th>
                  <th className="text-left p-2">Avg. Time</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {courseAnalytics.map((course) => (
                  <tr key={course.courseId} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{course.courseName}</td>
                    <td className="p-2">{course.enrollments}</td>
                    <td className="p-2">{course.completions}</td>
                    <td className="p-2">
                      <div className="flex items-center space-x-2">
                        <Progress value={course.completionRate} className="w-16 h-2" />
                        <span>{course.completionRate.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="p-2">{course.averageScore.toFixed(1)}</td>
                    <td className="p-2">{Math.round(course.averageTimeToComplete / 60)}m</td>
                    <td className="p-2">
                      <Badge variant={course.completionRate > 70 ? 'default' : 'secondary'}>
                        {course.completionRate > 70 ? 'Excellent' : 'Needs Attention'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Course Completion Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Course Completion Trends</CardTitle>
          <CardDescription>Monthly completion rates by course</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={generateCourseCompletionTrends()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              {courseAnalytics.slice(0, 3).map((course, index) => (
                <Line 
                  key={course.courseId}
                  type="monotone" 
                  dataKey={course.courseName.replace(/\s+/g, '')} 
                  stroke={COLORS[index]} 
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );

  const LearnersTab = () => (
    <div className="space-y-6">
      {/* Learner Progress Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Total Learners"
          value={learnerProgress.length}
          icon={Users}
          description="Registered users"
        />
        <MetricCard
          title="Active This Month"
          value={learnerProgress.filter(l => 
            new Date(l.lastActivity) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          ).length}
          icon={Activity}
          description="Active in last 30 days"
        />
        <MetricCard
          title="Course Completers"
          value={learnerProgress.filter(l => l.coursesCompleted > 0).length}
          icon={Award}
          description="Completed at least one course"
        />
      </div>

      {/* Learner Progress Table */}
      <Card>
        <CardHeader>
          <CardTitle>Learner Progress Details</CardTitle>
          <CardDescription>Individual learner performance and progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Learner</th>
                  <th className="text-left p-2">Enrolled</th>
                  <th className="text-left p-2">Completed</th>
                  <th className="text-left p-2">Progress</th>
                  <th className="text-left p-2">Avg. Score</th>
                  <th className="text-left p-2">Time Spent</th>
                  <th className="text-left p-2">Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {learnerProgress.slice(0, 10).map((learner) => (
                  <tr key={learner.learnerId} className="border-b hover:bg-muted/50">
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{learner.learnerName}</div>
                        <div className="text-xs text-muted-foreground">{learner.email}</div>
                      </div>
                    </td>
                    <td className="p-2">{learner.coursesEnrolled}</td>
                    <td className="p-2">{learner.coursesCompleted}</td>
                    <td className="p-2">
                      <div className="flex items-center space-x-2">
                        <Progress 
                          value={learner.coursesEnrolled > 0 ? 
                            (learner.coursesCompleted / learner.coursesEnrolled) * 100 : 0} 
                          className="w-16 h-2" 
                        />
                        <span>
                          {learner.coursesEnrolled > 0 ? 
                            Math.round((learner.coursesCompleted / learner.coursesEnrolled) * 100) : 0}%
                        </span>
                      </div>
                    </td>
                    <td className="p-2">{learner.averageScore.toFixed(1)}</td>
                    <td className="p-2">{Math.round(learner.totalTimeSpent / 3600)}h</td>
                    <td className="p-2">
                      {new Date(learner.lastActivity).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const ContentTab = () => (
    <div className="space-y-6">
      {/* Content Effectiveness Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Content Type Performance</CardTitle>
            <CardDescription>Effectiveness by content type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={generateContentTypeData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {generateContentTypeData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content Engagement Metrics</CardTitle>
            <CardDescription>View counts and completion rates</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={contentEffectiveness.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="title" angle={-45} textAnchor="end" height={80} />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="viewCount" fill="#8884d8" name="Views" />
                <Bar yAxisId="right" dataKey="completionRate" fill="#82ca9d" name="Completion %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Content Effectiveness Table */}
      <Card>
        <CardHeader>
          <CardTitle>Content Effectiveness Analysis</CardTitle>
          <CardDescription>Detailed performance metrics for all content</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Content</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Views</th>
                  <th className="text-left p-2">Completion</th>
                  <th className="text-left p-2">Rating</th>
                  <th className="text-left p-2">Effectiveness</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {contentEffectiveness.map((content) => (
                  <tr key={content.contentId} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{content.title}</td>
                    <td className="p-2">
                      <Badge variant="outline">{content.contentType}</Badge>
                    </td>
                    <td className="p-2">{content.viewCount}</td>
                    <td className="p-2">{content.completionRate.toFixed(1)}%</td>
                    <td className="p-2">
                      <div className="flex items-center">
                        <span>{content.averageRating.toFixed(1)}</span>
                        <span className="text-yellow-500 ml-1">★</span>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center space-x-2">
                        <Progress value={content.effectivenessScore} className="w-16 h-2" />
                        <span>{content.effectivenessScore.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="p-2">
                      <Badge variant={content.effectivenessScore > 70 ? 'default' : 'destructive'}>
                        {content.effectivenessScore > 70 ? 'Effective' : 'Needs Review'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const SystemTab = () => (
    <div className="space-y-6">
      {/* System Health Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="System Uptime"
          value={`${systemMetrics?.uptime.toFixed(1)}%`}
          icon={Activity}
          description="Last 30 days"
        />
        <MetricCard
          title="Response Time"
          value={`${systemMetrics?.averageResponseTime}ms`}
          icon={Clock}
          description="Average API response"
        />
        <MetricCard
          title="Error Rate"
          value={`${systemMetrics?.errorRate.toFixed(2)}%`}
          icon={TrendingDown}
          description="System error percentage"
        />
        <MetricCard
          title="Storage Used"
          value={`${(systemMetrics?.storageUsed || 0 / 1024 / 1024 / 1024).toFixed(1)}GB`}
          icon={Globe}
          description="Total storage consumption"
        />
      </div>

      {/* System Performance Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Response Time Trends</CardTitle>
            <CardDescription>API response times over the last 24 hours</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={generateResponseTimeData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="responseTime" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Activity</CardTitle>
            <CardDescription>Concurrent users throughout the day</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={generateUserActivityData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="users" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Helper functions for generating mock chart data
  const generateEngagementData = () => {
    const data = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        activeLearners: Math.floor(Math.random() * 100) + 50,
        completions: Math.floor(Math.random() * 30) + 10
      });
    }
    return data;
  };

  const generateCourseCompletionTrends = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      month,
      ...courseAnalytics.slice(0, 3).reduce((acc, course) => {
        acc[course.courseName.replace(/\s+/g, '')] = Math.floor(Math.random() * 100) + 20;
        return acc;
      }, {} as Record<string, number>)
    }));
  };

  const generateContentTypeData = () => [
    { name: 'Video', value: 35 },
    { name: 'Interactive', value: 25 },
    { name: 'Text', value: 20 },
    { name: 'Audio', value: 15 },
    { name: 'Quiz', value: 5 }
  ];

  const generateResponseTimeData = () => {
    const data = [];
    for (let i = 23; i >= 0; i--) {
      data.push({
        time: `${23 - i}:00`,
        responseTime: Math.floor(Math.random() * 200) + 100
      });
    }
    return data;
  };

  const generateUserActivityData = () => {
    const data = [];
    for (let i = 0; i < 24; i++) {
      data.push({
        hour: `${i}:00`,
        users: Math.floor(Math.random() * 150) + 20
      });
    }
    return data;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive learning analytics and insights</p>
        </div>
        
        <div className="flex items-center gap-2">
          <DatePickerWithRange
            value={dateRange}
            onChange={setDateRange}
          />
          <Select value={exportFormat} onValueChange={(value: 'pdf' | 'csv' | 'xlsx') => setExportFormat(value)}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="xlsx">Excel</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            size="sm"
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="learners">Learners</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>
        
        <TabsContent value="courses">
          <CoursesTab />
        </TabsContent>
        
        <TabsContent value="learners">
          <LearnersTab />
        </TabsContent>
        
        <TabsContent value="content">
          <ContentTab />
        </TabsContent>
        
        <TabsContent value="system">
          <SystemTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AnalyticsDashboard;
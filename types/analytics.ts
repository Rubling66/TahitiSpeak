// Analytics and Reporting Types

export interface LearningMetrics {
  totalLearners: number;
  activeLearners: number;
  completionRate: number;
  averageTimeOnTask: number;
  engagementScore: number;
  retentionRate: number;
}

export interface CourseAnalytics {
  courseId: string;
  courseName: string;
  enrollments: number;
  completions: number;
  completionRate: number;
  averageScore: number;
  averageTimeToComplete: number;
  dropoffPoints: DropoffPoint[];
  engagementMetrics: EngagementMetrics;
  lastUpdated: Date;
}

export interface DropoffPoint {
  lessonId: string;
  lessonName: string;
  dropoffRate: number;
  position: number;
}

export interface EngagementMetrics {
  averageSessionDuration: number;
  sessionsPerLearner: number;
  interactionRate: number;
  feedbackScore: number;
  socialEngagement: number;
}

export interface LearnerProgress {
  learnerId: string;
  learnerName: string;
  email: string;
  coursesEnrolled: number;
  coursesCompleted: number;
  totalTimeSpent: number;
  averageScore: number;
  lastActivity: Date;
  learningPath: LearningPathProgress[];
  achievements: Achievement[];
}

export interface LearningPathProgress {
  courseId: string;
  courseName: string;
  progress: number;
  timeSpent: number;
  lastAccessed: Date;
  currentLesson: string;
  score?: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  earnedDate: Date;
  category: 'completion' | 'performance' | 'engagement' | 'streak';
}

export interface ContentEffectiveness {
  contentId: string;
  contentType: 'lesson' | 'quiz' | 'exercise' | 'media';
  title: string;
  viewCount: number;
  completionRate: number;
  averageRating: number;
  timeSpent: number;
  difficultyRating: number;
  effectivenessScore: number;
  improvementSuggestions: string[];
}

export interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  peakConcurrentUsers: number;
  averageResponseTime: number;
  errorRate: number;
  uptime: number;
  storageUsed: number;
  bandwidthUsage: number;
  lastUpdated: Date;
}

export interface ReportConfig {
  id: string;
  name: string;
  description: string;
  type: 'learner' | 'course' | 'system' | 'content' | 'custom';
  filters: ReportFilter[];
  metrics: string[];
  dateRange: DateRange;
  format: 'pdf' | 'csv' | 'xlsx' | 'json';
  schedule?: ReportSchedule;
  recipients?: string[];
}

export interface ReportFilter {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between';
  value: any;
}

export interface DateRange {
  start: Date;
  end: Date;
  preset?: 'last_7_days' | 'last_30_days' | 'last_quarter' | 'last_year' | 'custom';
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  time: string; // HH:MM format
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  enabled: boolean;
}

export interface AnalyticsEvent {
  id: string;
  userId: string;
  sessionId: string;
  eventType: 'page_view' | 'lesson_start' | 'lesson_complete' | 'quiz_attempt' | 'media_play' | 'interaction';
  contentId?: string;
  timestamp: Date;
  duration?: number;
  metadata: Record<string, any>;
}

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'progress' | 'heatmap';
  title: string;
  description?: string;
  dataSource: string;
  config: WidgetConfig;
  position: WidgetPosition;
  refreshInterval?: number;
}

export interface WidgetConfig {
  chartType?: 'line' | 'bar' | 'pie' | 'doughnut' | 'area';
  metrics: string[];
  filters?: ReportFilter[];
  groupBy?: string;
  sortBy?: string;
  limit?: number;
  showLegend?: boolean;
  showLabels?: boolean;
}

export interface WidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ExportOptions {
  format: 'pdf' | 'csv' | 'xlsx' | 'png' | 'svg';
  includeCharts: boolean;
  includeRawData: boolean;
  dateRange: DateRange;
  filters: ReportFilter[];
}

export interface AnalyticsAPI {
  getLearningMetrics(dateRange: DateRange): Promise<LearningMetrics>;
  getCourseAnalytics(courseId?: string, dateRange?: DateRange): Promise<CourseAnalytics[]>;
  getLearnerProgress(learnerId?: string): Promise<LearnerProgress[]>;
  getContentEffectiveness(contentType?: string): Promise<ContentEffectiveness[]>;
  getSystemMetrics(): Promise<SystemMetrics>;
  trackEvent(event: Omit<AnalyticsEvent, 'id' | 'timestamp'>): Promise<void>;
  generateReport(config: ReportConfig): Promise<Blob>;
  exportData(options: ExportOptions): Promise<Blob>;
}
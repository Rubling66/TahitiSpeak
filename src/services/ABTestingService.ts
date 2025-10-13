export enum TestStatus {
  DRAFT = 'draft',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum TestType {
  SIMPLE = 'simple',
  MULTIVARIATE = 'multivariate',
  SPLIT_URL = 'split_url',
  FEATURE_FLAG = 'feature_flag'
}

export enum VariantType {
  CONTROL = 'control',
  TREATMENT = 'treatment'
}

export enum MetricType {
  CONVERSION = 'conversion',
  CLICK_THROUGH = 'click_through',
  ENGAGEMENT = 'engagement',
  REVENUE = 'revenue',
  RETENTION = 'retention',
  CUSTOM = 'custom'
}

export enum SegmentType {
  ALL_USERS = 'all_users',
  NEW_USERS = 'new_users',
  RETURNING_USERS = 'returning_users',
  GEOGRAPHIC = 'geographic',
  DEVICE = 'device',
  CUSTOM = 'custom'
}

export enum StatisticalSignificance {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high'
}

export interface ABTestVariant {
  id: string;
  name: string;
  type: VariantType;
  description: string;
  trafficAllocation: number; // Percentage 0-100
  config: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ABTestMetric {
  id: string;
  name: string;
  type: MetricType;
  description: string;
  isPrimary: boolean;
  targetValue?: number;
  improvementThreshold: number; // Minimum improvement to consider significant
  trackingCode?: string;
  customEventName?: string;
  conversionFunnel?: string[];
}

export interface ABTestSegment {
  id: string;
  name: string;
  type: SegmentType;
  description: string;
  criteria: Record<string, any>;
  userCount: number;
  isActive: boolean;
}

export interface ABTestResult {
  variantId: string;
  metricId: string;
  value: number;
  conversions: number;
  visitors: number;
  conversionRate: number;
  confidence: number;
  pValue: number;
  significance: StatisticalSignificance;
  improvement: number; // Percentage improvement over control
  lowerBound: number;
  upperBound: number;
}

export interface ABTestAnalytics {
  testId: string;
  totalVisitors: number;
  totalConversions: number;
  overallConversionRate: number;
  duration: number; // Test duration in milliseconds
  results: ABTestResult[];
  winningVariant?: string;
  statisticalPower: number;
  sampleSize: number;
  confidenceLevel: number;
  segmentResults: Record<string, ABTestResult[]>;
  timeSeriesData: {
    date: string;
    variantResults: Record<string, {
      visitors: number;
      conversions: number;
      conversionRate: number;
    }>;
  }[];
}

export interface ABTest {
  id: string;
  name: string;
  description: string;
  type: TestType;
  status: TestStatus;
  hypothesis: string;
  variants: ABTestVariant[];
  metrics: ABTestMetric[];
  segments: ABTestSegment[];
  trafficAllocation: number; // Percentage of total traffic
  startDate?: Date;
  endDate?: Date;
  duration?: number; // Planned duration in days
  minSampleSize: number;
  confidenceLevel: number; // 90, 95, 99
  statisticalPower: number; // 80, 90, 95
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  notes: string;
  analytics?: ABTestAnalytics;
}

export interface ABTestConfig {
  defaultConfidenceLevel: number;
  defaultStatisticalPower: number;
  defaultTrafficAllocation: number;
  minTestDuration: number; // Days
  maxTestDuration: number; // Days
  autoStopOnSignificance: boolean;
  enableSegmentation: boolean;
  enableMultivariate: boolean;
  maxVariantsPerTest: number;
  maxMetricsPerTest: number;
  cookieDuration: number; // Days
  excludeBots: boolean;
  enableQualityAssurance: boolean;
}

export interface ABTestEvent {
  id: string;
  testId: string;
  variantId: string;
  userId: string;
  sessionId: string;
  eventType: 'exposure' | 'conversion' | 'custom';
  metricId?: string;
  value?: number;
  properties: Record<string, any>;
  timestamp: Date;
  userAgent?: string;
  ipAddress?: string;
  location?: {
    country: string;
    region: string;
    city: string;
  };
}

export interface ABTestReport {
  id: string;
  testId: string;
  name: string;
  generatedAt: Date;
  format: 'pdf' | 'html' | 'json' | 'csv';
  summary: {
    testName: string;
    status: TestStatus;
    duration: number;
    totalVisitors: number;
    winningVariant?: string;
    primaryMetricImprovement: number;
    confidence: number;
  };
  recommendations: string[];
  nextSteps: string[];
  data: any;
}

export interface FeatureFlag {
  id: string;
  name: string;
  key: string;
  description: string;
  isEnabled: boolean;
  rolloutPercentage: number;
  variants: Record<string, any>;
  segments: string[];
  conditions: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

class ABTestingService {
  private tests: Map<string, ABTest> = new Map();
  private events: ABTestEvent[] = [];
  private reports: ABTestReport[] = [];
  private featureFlags: Map<string, FeatureFlag> = new Map();
  private config: ABTestConfig;
  private userAssignments: Map<string, Map<string, string>> = new Map(); // userId -> testId -> variantId

  constructor() {
    this.config = this.getDefaultConfig();
    this.loadFromStorage();
    this.generateSampleData();
  }

  // Test Management
  createTest(testData: Omit<ABTest, 'id' | 'createdAt' | 'updatedAt'>): ABTest {
    const test: ABTest = {
      ...testData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.tests.set(test.id, test);
    this.saveToStorage();
    return test;
  }

  updateTest(testId: string, updates: Partial<ABTest>): ABTest | null {
    const test = this.tests.get(testId);
    if (!test) return null;

    const updatedTest = {
      ...test,
      ...updates,
      updatedAt: new Date()
    };

    this.tests.set(testId, updatedTest);
    this.saveToStorage();
    return updatedTest;
  }

  deleteTest(testId: string): boolean {
    const deleted = this.tests.delete(testId);
    if (deleted) {
      // Clean up related data
      this.events = this.events.filter(event => event.testId !== testId);
      this.reports = this.reports.filter(report => report.testId !== testId);
      this.saveToStorage();
    }
    return deleted;
  }

  getTest(testId: string): ABTest | null {
    return this.tests.get(testId) || null;
  }

  getAllTests(): ABTest[] {
    return Array.from(this.tests.values());
  }

  getTestsByStatus(status: TestStatus): ABTest[] {
    return Array.from(this.tests.values()).filter(test => test.status === status);
  }

  // Test Execution
  startTest(testId: string): boolean {
    const test = this.tests.get(testId);
    if (!test || test.status !== TestStatus.DRAFT) return false;

    const updatedTest = {
      ...test,
      status: TestStatus.RUNNING,
      startDate: new Date(),
      updatedAt: new Date()
    };

    this.tests.set(testId, updatedTest);
    this.saveToStorage();
    return true;
  }

  pauseTest(testId: string): boolean {
    const test = this.tests.get(testId);
    if (!test || test.status !== TestStatus.RUNNING) return false;

    const updatedTest = {
      ...test,
      status: TestStatus.PAUSED,
      updatedAt: new Date()
    };

    this.tests.set(testId, updatedTest);
    this.saveToStorage();
    return true;
  }

  resumeTest(testId: string): boolean {
    const test = this.tests.get(testId);
    if (!test || test.status !== TestStatus.PAUSED) return false;

    const updatedTest = {
      ...test,
      status: TestStatus.RUNNING,
      updatedAt: new Date()
    };

    this.tests.set(testId, updatedTest);
    this.saveToStorage();
    return true;
  }

  stopTest(testId: string): boolean {
    const test = this.tests.get(testId);
    if (!test || (test.status !== TestStatus.RUNNING && test.status !== TestStatus.PAUSED)) return false;

    const updatedTest = {
      ...test,
      status: TestStatus.COMPLETED,
      endDate: new Date(),
      updatedAt: new Date()
    };

    this.tests.set(testId, updatedTest);
    this.saveToStorage();
    return true;
  }

  // User Assignment
  assignUserToVariant(testId: string, userId: string, segmentId?: string): string | null {
    const test = this.tests.get(testId);
    if (!test || test.status !== TestStatus.RUNNING) return null;

    // Check if user is already assigned
    const userTests = this.userAssignments.get(userId) || new Map();
    if (userTests.has(testId)) {
      return userTests.get(testId) || null;
    }

    // Filter variants based on segment if provided
    let eligibleVariants = test.variants.filter(v => v.isActive);
    
    if (segmentId) {
      const segment = test.segments.find(s => s.id === segmentId);
      if (!segment || !segment.isActive) return null;
    }

    // Assign variant based on traffic allocation
    const random = Math.random() * 100;
    let cumulative = 0;

    for (const variant of eligibleVariants) {
      cumulative += variant.trafficAllocation;
      if (random <= cumulative) {
        // Record assignment
        userTests.set(testId, variant.id);
        this.userAssignments.set(userId, userTests);

        // Track exposure event
        this.trackEvent({
          testId,
          variantId: variant.id,
          userId,
          sessionId: this.generateSessionId(),
          eventType: 'exposure',
          properties: { segmentId },
          timestamp: new Date()
        });

        return variant.id;
      }
    }

    return null;
  }

  getUserVariant(testId: string, userId: string): string | null {
    const userTests = this.userAssignments.get(userId);
    return userTests?.get(testId) || null;
  }

  // Event Tracking
  trackEvent(eventData: Omit<ABTestEvent, 'id'>): ABTestEvent {
    const event: ABTestEvent = {
      ...eventData,
      id: this.generateId()
    };

    this.events.push(event);
    this.saveToStorage();
    return event;
  }

  trackConversion(testId: string, variantId: string, userId: string, metricId: string, value?: number): boolean {
    const test = this.tests.get(testId);
    if (!test) return false;

    this.trackEvent({
      testId,
      variantId,
      userId,
      sessionId: this.generateSessionId(),
      eventType: 'conversion',
      metricId,
      value,
      properties: {},
      timestamp: new Date()
    });

    return true;
  }

  // Analytics and Results
  calculateTestResults(testId: string): ABTestAnalytics | null {
    const test = this.tests.get(testId);
    if (!test) return null;

    const testEvents = this.events.filter(event => event.testId === testId);
    const exposureEvents = testEvents.filter(event => event.eventType === 'exposure');
    const conversionEvents = testEvents.filter(event => event.eventType === 'conversion');

    const results: ABTestResult[] = [];
    const variantResults: Record<string, any> = {};

    // Calculate results for each variant and metric
    for (const variant of test.variants) {
      const variantExposures = exposureEvents.filter(event => event.variantId === variant.id);
      const visitors = new Set(variantExposures.map(event => event.userId)).size;

      for (const metric of test.metrics) {
        const variantConversions = conversionEvents.filter(
          event => event.variantId === variant.id && event.metricId === metric.id
        );
        const conversions = new Set(variantConversions.map(event => event.userId)).size;
        const conversionRate = visitors > 0 ? (conversions / visitors) * 100 : 0;

        // Calculate statistical significance (simplified)
        const { confidence, pValue, significance } = this.calculateStatisticalSignificance(
          conversions, visitors, test
        );

        // Calculate improvement over control
        const controlResult = results.find(r => 
          r.metricId === metric.id && 
          test.variants.find(v => v.id === r.variantId)?.type === VariantType.CONTROL
        );
        const improvement = controlResult ? 
          ((conversionRate - controlResult.conversionRate) / controlResult.conversionRate) * 100 : 0;

        const result: ABTestResult = {
          variantId: variant.id,
          metricId: metric.id,
          value: variantConversions.reduce((sum, event) => sum + (event.value || 0), 0),
          conversions,
          visitors,
          conversionRate,
          confidence,
          pValue,
          significance,
          improvement,
          lowerBound: Math.max(0, conversionRate - (confidence / 100) * conversionRate),
          upperBound: conversionRate + (confidence / 100) * conversionRate
        };

        results.push(result);
        variantResults[variant.id] = result;
      }
    }

    // Determine winning variant
    const primaryMetric = test.metrics.find(m => m.isPrimary);
    let winningVariant: string | undefined;
    
    if (primaryMetric) {
      const primaryResults = results.filter(r => r.metricId === primaryMetric.id);
      const significantResults = primaryResults.filter(r => r.significance === StatisticalSignificance.HIGH || r.significance === StatisticalSignificance.VERY_HIGH);
      
      if (significantResults.length > 0) {
        winningVariant = significantResults.reduce((winner, current) => 
          current.conversionRate > winner.conversionRate ? current : winner
        ).variantId;
      }
    }

    // Generate time series data
    const timeSeriesData = this.generateTimeSeriesData(testId, test.startDate || new Date());

    const analytics: ABTestAnalytics = {
      testId,
      totalVisitors: new Set(exposureEvents.map(event => event.userId)).size,
      totalConversions: new Set(conversionEvents.map(event => event.userId)).size,
      overallConversionRate: exposureEvents.length > 0 ? 
        (new Set(conversionEvents.map(event => event.userId)).size / new Set(exposureEvents.map(event => event.userId)).size) * 100 : 0,
      duration: test.endDate ? 
        test.endDate.getTime() - (test.startDate?.getTime() || Date.now()) : 
        Date.now() - (test.startDate?.getTime() || Date.now()),
      results,
      winningVariant,
      statisticalPower: test.statisticalPower,
      sampleSize: exposureEvents.length,
      confidenceLevel: test.confidenceLevel,
      segmentResults: {},
      timeSeriesData
    };

    // Update test with analytics
    const updatedTest = { ...test, analytics };
    this.tests.set(testId, updatedTest);

    return analytics;
  }

  private calculateStatisticalSignificance(conversions: number, visitors: number, test: ABTest) {
    // Simplified statistical significance calculation
    const conversionRate = visitors > 0 ? conversions / visitors : 0;
    const standardError = Math.sqrt((conversionRate * (1 - conversionRate)) / visitors);
    const zScore = Math.abs(conversionRate - 0.1) / standardError; // Assuming 10% baseline
    
    let pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));
    let confidence = (1 - pValue) * 100;
    
    let significance: StatisticalSignificance;
    if (confidence >= 99) significance = StatisticalSignificance.VERY_HIGH;
    else if (confidence >= 95) significance = StatisticalSignificance.HIGH;
    else if (confidence >= 90) significance = StatisticalSignificance.MEDIUM;
    else significance = StatisticalSignificance.LOW;

    return { confidence, pValue, significance };
  }

  private normalCDF(x: number): number {
    // Approximation of the cumulative distribution function for standard normal distribution
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  private erf(x: number): number {
    // Approximation of the error function
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  private generateTimeSeriesData(testId: string, startDate: Date) {
    const days = Math.min(30, Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const data = [];

    for (let i = 0; i <= days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const variantResults: Record<string, any> = {};

      const test = this.tests.get(testId);
      if (test) {
        for (const variant of test.variants) {
          variantResults[variant.id] = {
            visitors: Math.floor(Math.random() * 100) + 50,
            conversions: Math.floor(Math.random() * 20) + 5,
            conversionRate: Math.random() * 15 + 5
          };
        }
      }

      data.push({
        date: date.toISOString().split('T')[0],
        variantResults
      });
    }

    return data;
  }

  // Feature Flags
  createFeatureFlag(flagData: Omit<FeatureFlag, 'id' | 'createdAt' | 'updatedAt'>): FeatureFlag {
    const flag: FeatureFlag = {
      ...flagData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.featureFlags.set(flag.id, flag);
    this.saveToStorage();
    return flag;
  }

  updateFeatureFlag(flagId: string, updates: Partial<FeatureFlag>): FeatureFlag | null {
    const flag = this.featureFlags.get(flagId);
    if (!flag) return null;

    const updatedFlag = {
      ...flag,
      ...updates,
      updatedAt: new Date()
    };

    this.featureFlags.set(flagId, updatedFlag);
    this.saveToStorage();
    return updatedFlag;
  }

  deleteFeatureFlag(flagId: string): boolean {
    const deleted = this.featureFlags.delete(flagId);
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  getFeatureFlag(flagId: string): FeatureFlag | null {
    return this.featureFlags.get(flagId) || null;
  }

  getAllFeatureFlags(): FeatureFlag[] {
    return Array.from(this.featureFlags.values());
  }

  isFeatureEnabled(flagKey: string, userId?: string, context?: Record<string, any>): boolean {
    const flag = Array.from(this.featureFlags.values()).find(f => f.key === flagKey);
    if (!flag || !flag.isEnabled) return false;

    // Simple rollout percentage check
    if (userId) {
      const hash = this.hashString(userId + flagKey);
      const percentage = (hash % 100) + 1;
      return percentage <= flag.rolloutPercentage;
    }

    return Math.random() * 100 <= flag.rolloutPercentage;
  }

  // Reports
  generateReport(testId: string, format: 'pdf' | 'html' | 'json' | 'csv' = 'json'): ABTestReport {
    const test = this.tests.get(testId);
    if (!test) throw new Error('Test not found');

    const analytics = this.calculateTestResults(testId);
    if (!analytics) throw new Error('Unable to calculate test results');

    const report: ABTestReport = {
      id: this.generateId(),
      testId,
      name: `${test.name} - Test Report`,
      generatedAt: new Date(),
      format,
      summary: {
        testName: test.name,
        status: test.status,
        duration: analytics.duration,
        totalVisitors: analytics.totalVisitors,
        winningVariant: analytics.winningVariant,
        primaryMetricImprovement: analytics.results.find(r => 
          test.metrics.find(m => m.isPrimary)?.id === r.metricId && 
          r.variantId === analytics.winningVariant
        )?.improvement || 0,
        confidence: analytics.results.find(r => 
          test.metrics.find(m => m.isPrimary)?.id === r.metricId && 
          r.variantId === analytics.winningVariant
        )?.confidence || 0
      },
      recommendations: this.generateRecommendations(test, analytics),
      nextSteps: this.generateNextSteps(test, analytics),
      data: { test, analytics }
    };

    this.reports.push(report);
    this.saveToStorage();
    return report;
  }

  private generateRecommendations(test: ABTest, analytics: ABTestAnalytics): string[] {
    const recommendations = [];

    if (analytics.winningVariant) {
      const winningVariant = test.variants.find(v => v.id === analytics.winningVariant);
      recommendations.push(`Implement the winning variant: ${winningVariant?.name}`);
    } else {
      recommendations.push('No statistically significant winner found. Consider running the test longer or increasing traffic allocation.');
    }

    if (analytics.sampleSize < test.minSampleSize) {
      recommendations.push('Sample size is below the minimum required. Consider increasing traffic allocation or extending the test duration.');
    }

    if (analytics.statisticalPower < 80) {
      recommendations.push('Statistical power is low. Consider increasing sample size for more reliable results.');
    }

    return recommendations;
  }

  private generateNextSteps(test: ABTest, analytics: ABTestAnalytics): string[] {
    const nextSteps = [];

    if (test.status === TestStatus.RUNNING) {
      nextSteps.push('Monitor test progress and wait for statistical significance');
    } else if (test.status === TestStatus.COMPLETED) {
      nextSteps.push('Implement winning variant in production');
      nextSteps.push('Plan follow-up tests to further optimize the experience');
    }

    nextSteps.push('Document learnings and share results with the team');
    nextSteps.push('Archive test data for future reference');

    return nextSteps;
  }

  getAllReports(): ABTestReport[] {
    return this.reports;
  }

  getReportsByTest(testId: string): ABTestReport[] {
    return this.reports.filter(report => report.testId === testId);
  }

  deleteReport(reportId: string): boolean {
    const index = this.reports.findIndex(report => report.id === reportId);
    if (index === -1) return false;

    this.reports.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  // Configuration
  updateConfig(updates: Partial<ABTestConfig>): ABTestConfig {
    this.config = { ...this.config, ...updates };
    this.saveToStorage();
    return this.config;
  }

  getConfig(): ABTestConfig {
    return { ...this.config };
  }

  // Analytics
  getTestAnalytics(): {
    totalTests: number;
    activeTests: number;
    completedTests: number;
    totalVisitors: number;
    totalConversions: number;
    averageConversionRate: number;
    testsWithWinners: number;
    averageTestDuration: number;
  } {
    const tests = Array.from(this.tests.values());
    const activeTests = tests.filter(t => t.status === TestStatus.RUNNING);
    const completedTests = tests.filter(t => t.status === TestStatus.COMPLETED);
    
    const totalVisitors = this.events.filter(e => e.eventType === 'exposure').length;
    const totalConversions = this.events.filter(e => e.eventType === 'conversion').length;
    
    const testsWithAnalytics = tests.filter(t => t.analytics);
    const testsWithWinners = testsWithAnalytics.filter(t => t.analytics?.winningVariant).length;
    
    const averageTestDuration = completedTests.length > 0 ? 
      completedTests.reduce((sum, test) => {
        const duration = test.endDate && test.startDate ? 
          test.endDate.getTime() - test.startDate.getTime() : 0;
        return sum + duration;
      }, 0) / completedTests.length : 0;

    return {
      totalTests: tests.length,
      activeTests: activeTests.length,
      completedTests: completedTests.length,
      totalVisitors,
      totalConversions,
      averageConversionRate: totalVisitors > 0 ? (totalConversions / totalVisitors) * 100 : 0,
      testsWithWinners,
      averageTestDuration
    };
  }

  // Data Management
  exportData(): any {
    return {
      tests: Array.from(this.tests.entries()),
      events: this.events,
      reports: this.reports,
      featureFlags: Array.from(this.featureFlags.entries()),
      userAssignments: Array.from(this.userAssignments.entries()),
      config: this.config,
      exportedAt: new Date().toISOString()
    };
  }

  importData(data: any): boolean {
    try {
      if (data.tests) {
        this.tests = new Map(data.tests);
      }
      if (data.events) {
        this.events = data.events.map((event: any) => ({
          ...event,
          timestamp: new Date(event.timestamp)
        }));
      }
      if (data.reports) {
        this.reports = data.reports.map((report: any) => ({
          ...report,
          generatedAt: new Date(report.generatedAt)
        }));
      }
      if (data.featureFlags) {
        this.featureFlags = new Map(data.featureFlags);
      }
      if (data.userAssignments) {
        this.userAssignments = new Map(data.userAssignments.map(([userId, assignments]: [string, any]) => [
          userId,
          new Map(assignments)
        ]));
      }
      if (data.config) {
        this.config = data.config;
      }

      this.saveToStorage();
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }

  clearAllData(): void {
    this.tests.clear();
    this.events = [];
    this.reports = [];
    this.featureFlags.clear();
    this.userAssignments.clear();
    this.config = this.getDefaultConfig();
    this.saveToStorage();
  }

  // Private Methods
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private generateSessionId(): string {
    return Math.random().toString(36).substr(2, 16);
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private getDefaultConfig(): ABTestConfig {
    return {
      defaultConfidenceLevel: 95,
      defaultStatisticalPower: 80,
      defaultTrafficAllocation: 100,
      minTestDuration: 7,
      maxTestDuration: 90,
      autoStopOnSignificance: false,
      enableSegmentation: true,
      enableMultivariate: true,
      maxVariantsPerTest: 10,
      maxMetricsPerTest: 5,
      cookieDuration: 30,
      excludeBots: true,
      enableQualityAssurance: true
    };
  }

  private saveToStorage(): void {
    try {
      const data = this.exportData();
      localStorage.setItem('abTestingService', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save to storage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem('abTestingService');
      if (data) {
        this.importData(JSON.parse(data));
      }
    } catch (error) {
      console.error('Failed to load from storage:', error);
    }
  }

  private generateSampleData(): void {
    if (this.tests.size > 0) return; // Don't generate if data already exists

    // Create sample segments
    const segments: ABTestSegment[] = [
      {
        id: 'seg1',
        name: 'New Users',
        type: SegmentType.NEW_USERS,
        description: 'Users who signed up in the last 30 days',
        criteria: { userAge: { max: 30 } },
        userCount: 1500,
        isActive: true
      },
      {
        id: 'seg2',
        name: 'Mobile Users',
        type: SegmentType.DEVICE,
        description: 'Users accessing from mobile devices',
        criteria: { device: 'mobile' },
        userCount: 3200,
        isActive: true
      }
    ];

    // Create sample metrics
    const metrics: ABTestMetric[] = [
      {
        id: 'metric1',
        name: 'Sign-up Conversion',
        type: MetricType.CONVERSION,
        description: 'Users who complete the sign-up process',
        isPrimary: true,
        improvementThreshold: 5,
        trackingCode: 'signup_conversion'
      },
      {
        id: 'metric2',
        name: 'Click-through Rate',
        type: MetricType.CLICK_THROUGH,
        description: 'Users who click the CTA button',
        isPrimary: false,
        improvementThreshold: 10,
        trackingCode: 'cta_click'
      }
    ];

    // Create sample variants
    const variants: ABTestVariant[] = [
      {
        id: 'var1',
        name: 'Control',
        type: VariantType.CONTROL,
        description: 'Original design',
        trafficAllocation: 50,
        config: { buttonColor: 'blue', headerText: 'Sign Up Now' },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'var2',
        name: 'Treatment A',
        type: VariantType.TREATMENT,
        description: 'Green button with new text',
        trafficAllocation: 50,
        config: { buttonColor: 'green', headerText: 'Join Today' },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Create sample tests
    const sampleTests = [
      {
        name: 'Homepage CTA Button Test',
        description: 'Testing different button colors and text for the main CTA',
        type: TestType.SIMPLE,
        status: TestStatus.RUNNING,
        hypothesis: 'A green button with "Join Today" text will increase conversion rates',
        variants,
        metrics,
        segments,
        trafficAllocation: 100,
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        duration: 14,
        minSampleSize: 1000,
        confidenceLevel: 95,
        statisticalPower: 80,
        createdBy: 'admin',
        tags: ['homepage', 'conversion', 'cta'],
        notes: 'Initial test to optimize main conversion funnel'
      },
      {
        name: 'Pricing Page Layout Test',
        description: 'Testing different pricing page layouts',
        type: TestType.MULTIVARIATE,
        status: TestStatus.DRAFT,
        hypothesis: 'A simplified pricing layout will reduce confusion and increase conversions',
        variants: [
          {
            id: 'var3',
            name: 'Current Layout',
            type: VariantType.CONTROL,
            description: 'Current pricing page design',
            trafficAllocation: 33,
            config: { layout: 'current' },
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'var4',
            name: 'Simplified Layout',
            type: VariantType.TREATMENT,
            description: 'Simplified pricing with fewer options',
            trafficAllocation: 33,
            config: { layout: 'simplified' },
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'var5',
            name: 'Feature-focused Layout',
            type: VariantType.TREATMENT,
            description: 'Layout emphasizing key features',
            trafficAllocation: 34,
            config: { layout: 'feature_focused' },
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        metrics: [
          {
            id: 'metric3',
            name: 'Purchase Conversion',
            type: MetricType.CONVERSION,
            description: 'Users who complete a purchase',
            isPrimary: true,
            improvementThreshold: 8,
            trackingCode: 'purchase_conversion'
          }
        ],
        segments: [],
        trafficAllocation: 50,
        duration: 21,
        minSampleSize: 2000,
        confidenceLevel: 95,
        statisticalPower: 80,
        createdBy: 'admin',
        tags: ['pricing', 'layout', 'purchase'],
        notes: 'Testing to improve pricing page performance'
      }
    ];

    // Create the tests
    sampleTests.forEach(testData => {
      this.createTest(testData);
    });

    // Generate sample events for the running test
    const runningTest = Array.from(this.tests.values()).find(t => t.status === TestStatus.RUNNING);
    if (runningTest) {
      this.generateSampleEvents(runningTest);
    }

    // Create sample feature flags
    const sampleFlags = [
      {
        name: 'New Dashboard',
        key: 'new_dashboard',
        description: 'Enable the new dashboard design',
        isEnabled: true,
        rolloutPercentage: 25,
        variants: { enabled: true, theme: 'modern' },
        segments: ['seg1'],
        conditions: {},
        createdBy: 'admin'
      },
      {
        name: 'Advanced Analytics',
        key: 'advanced_analytics',
        description: 'Enable advanced analytics features',
        isEnabled: false,
        rolloutPercentage: 0,
        variants: { enabled: false },
        segments: [],
        conditions: { userTier: 'premium' },
        createdBy: 'admin'
      }
    ];

    sampleFlags.forEach(flagData => {
      this.createFeatureFlag(flagData);
    });
  }

  private generateSampleEvents(test: ABTest): void {
    const userIds = Array.from({ length: 500 }, (_, i) => `user_${i + 1}`);
    const sessionIds = Array.from({ length: 300 }, (_, i) => `session_${i + 1}`);

    // Generate exposure events
    userIds.forEach(userId => {
      const variantId = test.variants[Math.floor(Math.random() * test.variants.length)].id;
      const sessionId = sessionIds[Math.floor(Math.random() * sessionIds.length)];

      this.trackEvent({
        testId: test.id,
        variantId,
        userId,
        sessionId,
        eventType: 'exposure',
        properties: {},
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      });

      // Some users convert
      if (Math.random() < 0.15) { // 15% conversion rate
        test.metrics.forEach(metric => {
          if (Math.random() < 0.8) { // 80% chance to track this metric
            this.trackEvent({
              testId: test.id,
              variantId,
              userId,
              sessionId,
              eventType: 'conversion',
              metricId: metric.id,
              value: metric.type === MetricType.REVENUE ? Math.random() * 100 + 20 : 1,
              properties: {},
              timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
            });
          }
        });
      }
    });
  }
}

export default ABTestingService;
/**
 * Advanced Anomaly Detection Engine for Tahitian Cultural Platform
 * Provides statistical analysis, pattern recognition, and threshold-based detection
 * with cultural context awareness and tropical-themed insights
 */

export interface AnomalyDataPoint {
  timestamp: number;
  value: number;
  metric: string;
  context?: Record<string, any>;
}

export interface AnomalyResult {
  id: string;
  timestamp: number;
  metric: string;
  value: number;
  expectedValue: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'statistical' | 'pattern' | 'threshold' | 'cultural';
  description: string;
  culturalContext?: string;
  recommendations: string[];
}

export interface AnomalyThreshold {
  metric: string;
  min?: number;
  max?: number;
  stdDevMultiplier: number;
  culturalWeight: number;
}

export interface CulturalPattern {
  name: string;
  timePattern: string; // cron-like pattern
  expectedRange: [number, number];
  culturalSignificance: string;
  description: string;
}

class AnomalyDetector {
  private dataHistory: Map<string, AnomalyDataPoint[]> = new Map();
  private thresholds: Map<string, AnomalyThreshold> = new Map();
  private culturalPatterns: CulturalPattern[] = [];
  private readonly maxHistorySize = 1000;
  private readonly minDataPoints = 10;

  constructor() {
    this.initializeDefaultThresholds();
    this.initializeCulturalPatterns();
  }

  /**
   * Initialize default thresholds for common metrics
   */
  private initializeDefaultThresholds(): void {
    const defaultThresholds: AnomalyThreshold[] = [
      {
        metric: 'user_engagement',
        min: 0,
        max: 100,
        stdDevMultiplier: 2.5,
        culturalWeight: 1.2
      },
      {
        metric: 'lesson_completion_rate',
        min: 0,
        max: 100,
        stdDevMultiplier: 2.0,
        culturalWeight: 1.5
      },
      {
        metric: 'ai_interaction_quality',
        min: 0,
        max: 10,
        stdDevMultiplier: 2.0,
        culturalWeight: 1.3
      },
      {
        metric: 'cultural_accuracy_score',
        min: 0,
        max: 100,
        stdDevMultiplier: 1.5,
        culturalWeight: 2.0
      },
      {
        metric: 'performance_score',
        min: 0,
        max: 100,
        stdDevMultiplier: 2.0,
        culturalWeight: 1.0
      },
      {
        metric: 'response_time',
        min: 0,
        stdDevMultiplier: 3.0,
        culturalWeight: 1.0
      }
    ];

    defaultThresholds.forEach(threshold => {
      this.thresholds.set(threshold.metric, threshold);
    });
  }

  /**
   * Initialize cultural patterns specific to Tahitian learning
   */
  private initializeCulturalPatterns(): void {
    this.culturalPatterns = [
      {
        name: 'morning_cultural_peak',
        timePattern: '0 6-9 * * *', // 6-9 AM
        expectedRange: [70, 90],
        culturalSignificance: 'Traditional Tahitian morning activities',
        description: 'Higher engagement during traditional morning hours'
      },
      {
        name: 'evening_storytelling',
        timePattern: '0 18-21 * * *', // 6-9 PM
        expectedRange: [75, 95],
        culturalSignificance: 'Traditional evening storytelling time',
        description: 'Peak engagement during traditional storytelling hours'
      },
      {
        name: 'weekend_cultural_immersion',
        timePattern: '0 * * * 6,0', // Weekends
        expectedRange: [80, 100],
        culturalSignificance: 'Weekend cultural activities',
        description: 'Enhanced cultural engagement on weekends'
      },
      {
        name: 'lunar_calendar_influence',
        timePattern: '0 * 1,15 * *', // New and full moon
        expectedRange: [85, 100],
        culturalSignificance: 'Lunar calendar cultural significance',
        description: 'Increased cultural awareness during lunar events'
      }
    ];
  }

  /**
   * Add a data point for anomaly detection
   */
  addDataPoint(dataPoint: AnomalyDataPoint): void {
    const { metric } = dataPoint;
    
    if (!this.dataHistory.has(metric)) {
      this.dataHistory.set(metric, []);
    }

    const history = this.dataHistory.get(metric)!;
    history.push(dataPoint);

    // Maintain history size limit
    if (history.length > this.maxHistorySize) {
      history.shift();
    }
  }

  /**
   * Detect anomalies in the provided data point
   */
  detectAnomalies(dataPoint: AnomalyDataPoint): AnomalyResult[] {
    const anomalies: AnomalyResult[] = [];
    const { metric, value, timestamp } = dataPoint;

    // Statistical anomaly detection
    const statisticalAnomaly = this.detectStatisticalAnomaly(dataPoint);
    if (statisticalAnomaly) {
      anomalies.push(statisticalAnomaly);
    }

    // Pattern-based anomaly detection
    const patternAnomaly = this.detectPatternAnomaly(dataPoint);
    if (patternAnomaly) {
      anomalies.push(patternAnomaly);
    }

    // Threshold-based anomaly detection
    const thresholdAnomaly = this.detectThresholdAnomaly(dataPoint);
    if (thresholdAnomaly) {
      anomalies.push(thresholdAnomaly);
    }

    // Cultural context anomaly detection
    const culturalAnomaly = this.detectCulturalAnomaly(dataPoint);
    if (culturalAnomaly) {
      anomalies.push(culturalAnomaly);
    }

    return anomalies;
  }

  /**
   * Statistical anomaly detection using Z-score and standard deviation
   */
  private detectStatisticalAnomaly(dataPoint: AnomalyDataPoint): AnomalyResult | null {
    const { metric, value, timestamp } = dataPoint;
    const history = this.dataHistory.get(metric);

    if (!history || history.length < this.minDataPoints) {
      return null;
    }

    const values = history.map(dp => dp.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    const threshold = this.thresholds.get(metric);
    const multiplier = threshold?.stdDevMultiplier || 2.0;
    const culturalWeight = threshold?.culturalWeight || 1.0;

    const zScore = Math.abs((value - mean) / stdDev);
    const adjustedThreshold = multiplier * culturalWeight;

    if (zScore > adjustedThreshold) {
      const deviation = Math.abs(value - mean);
      const severity = this.calculateSeverity(zScore, adjustedThreshold);

      return {
        id: `stat_${metric}_${timestamp}`,
        timestamp,
        metric,
        value,
        expectedValue: mean,
        deviation,
        severity,
        type: 'statistical',
        description: `Statistical anomaly detected: ${metric} value ${value.toFixed(2)} deviates significantly from expected ${mean.toFixed(2)} (Z-score: ${zScore.toFixed(2)})`,
        culturalContext: this.getCulturalContext(metric),
        recommendations: this.generateRecommendations('statistical', metric, severity)
      };
    }

    return null;
  }

  /**
   * Pattern-based anomaly detection using cultural patterns
   */
  private detectPatternAnomaly(dataPoint: AnomalyDataPoint): AnomalyResult | null {
    const { metric, value, timestamp } = dataPoint;
    const currentTime = new Date(timestamp);

    for (const pattern of this.culturalPatterns) {
      if (this.matchesTimePattern(currentTime, pattern.timePattern)) {
        const [minExpected, maxExpected] = pattern.expectedRange;
        
        if (value < minExpected || value > maxExpected) {
          const expectedValue = (minExpected + maxExpected) / 2;
          const deviation = Math.abs(value - expectedValue);
          const severity = this.calculatePatternSeverity(value, pattern.expectedRange);

          return {
            id: `pattern_${metric}_${timestamp}`,
            timestamp,
            metric,
            value,
            expectedValue,
            deviation,
            severity,
            type: 'pattern',
            description: `Pattern anomaly detected during ${pattern.name}: ${metric} value ${value.toFixed(2)} outside expected range [${minExpected}-${maxExpected}]`,
            culturalContext: pattern.culturalSignificance,
            recommendations: this.generateRecommendations('pattern', metric, severity, pattern)
          };
        }
      }
    }

    return null;
  }

  /**
   * Threshold-based anomaly detection
   */
  private detectThresholdAnomaly(dataPoint: AnomalyDataPoint): AnomalyResult | null {
    const { metric, value, timestamp } = dataPoint;
    const threshold = this.thresholds.get(metric);

    if (!threshold) return null;

    let isAnomaly = false;
    let expectedValue = value;
    let description = '';

    if (threshold.min !== undefined && value < threshold.min) {
      isAnomaly = true;
      expectedValue = threshold.min;
      description = `Threshold anomaly: ${metric} value ${value.toFixed(2)} below minimum threshold ${threshold.min}`;
    } else if (threshold.max !== undefined && value > threshold.max) {
      isAnomaly = true;
      expectedValue = threshold.max;
      description = `Threshold anomaly: ${metric} value ${value.toFixed(2)} above maximum threshold ${threshold.max}`;
    }

    if (isAnomaly) {
      const deviation = Math.abs(value - expectedValue);
      const severity = this.calculateThresholdSeverity(value, threshold);

      return {
        id: `threshold_${metric}_${timestamp}`,
        timestamp,
        metric,
        value,
        expectedValue,
        deviation,
        severity,
        type: 'threshold',
        description,
        culturalContext: this.getCulturalContext(metric),
        recommendations: this.generateRecommendations('threshold', metric, severity)
      };
    }

    return null;
  }

  /**
   * Cultural context anomaly detection
   */
  private detectCulturalAnomaly(dataPoint: AnomalyDataPoint): AnomalyResult | null {
    const { metric, value, timestamp, context } = dataPoint;

    // Check for cultural accuracy drops
    if (metric === 'cultural_accuracy_score' && value < 70) {
      return {
        id: `cultural_${metric}_${timestamp}`,
        timestamp,
        metric,
        value,
        expectedValue: 85,
        deviation: 85 - value,
        severity: value < 50 ? 'critical' : value < 60 ? 'high' : 'medium',
        type: 'cultural',
        description: `Cultural accuracy anomaly: Score ${value.toFixed(2)} indicates potential cultural misrepresentation`,
        culturalContext: 'Maintaining cultural authenticity is crucial for respectful learning',
        recommendations: [
          'Review cultural content for accuracy',
          'Consult with Tahitian cultural experts',
          'Update AI training data with verified cultural information',
          'Implement cultural validation checkpoints'
        ]
      };
    }

    return null;
  }

  /**
   * Calculate severity based on Z-score
   */
  private calculateSeverity(zScore: number, threshold: number): 'low' | 'medium' | 'high' | 'critical' {
    const ratio = zScore / threshold;
    
    if (ratio >= 3.0) return 'critical';
    if (ratio >= 2.0) return 'high';
    if (ratio >= 1.5) return 'medium';
    return 'low';
  }

  /**
   * Calculate pattern-based severity
   */
  private calculatePatternSeverity(value: number, expectedRange: [number, number]): 'low' | 'medium' | 'high' | 'critical' {
    const [min, max] = expectedRange;
    const rangeSize = max - min;
    const deviation = Math.max(min - value, value - max, 0);
    const deviationRatio = deviation / rangeSize;

    if (deviationRatio >= 1.0) return 'critical';
    if (deviationRatio >= 0.5) return 'high';
    if (deviationRatio >= 0.25) return 'medium';
    return 'low';
  }

  /**
   * Calculate threshold-based severity
   */
  private calculateThresholdSeverity(value: number, threshold: AnomalyThreshold): 'low' | 'medium' | 'high' | 'critical' {
    const culturalWeight = threshold.culturalWeight;
    
    if (threshold.min !== undefined && value < threshold.min) {
      const deviation = (threshold.min - value) * culturalWeight;
      if (deviation >= 50) return 'critical';
      if (deviation >= 25) return 'high';
      if (deviation >= 10) return 'medium';
    }
    
    if (threshold.max !== undefined && value > threshold.max) {
      const deviation = (value - threshold.max) * culturalWeight;
      if (deviation >= 50) return 'critical';
      if (deviation >= 25) return 'high';
      if (deviation >= 10) return 'medium';
    }

    return 'low';
  }

  /**
   * Check if current time matches a pattern (simplified cron-like matching)
   */
  private matchesTimePattern(time: Date, pattern: string): boolean {
    // Simplified pattern matching for demo
    // In production, use a proper cron parser
    const hour = time.getHours();
    const day = time.getDay();
    const date = time.getDate();

    if (pattern.includes('6-9') && hour >= 6 && hour <= 9) return true;
    if (pattern.includes('18-21') && hour >= 18 && hour <= 21) return true;
    if (pattern.includes('6,0') && (day === 6 || day === 0)) return true;
    if (pattern.includes('1,15') && (date === 1 || date === 15)) return true;

    return false;
  }

  /**
   * Get cultural context for a metric
   */
  private getCulturalContext(metric: string): string {
    const contexts: Record<string, string> = {
      'user_engagement': 'Engagement patterns reflect cultural learning preferences',
      'lesson_completion_rate': 'Completion rates indicate cultural content effectiveness',
      'ai_interaction_quality': 'AI interactions should maintain cultural sensitivity',
      'cultural_accuracy_score': 'Cultural accuracy is paramount for respectful learning',
      'performance_score': 'Performance metrics should consider cultural learning styles'
    };

    return contexts[metric] || 'Cultural context awareness is important for this metric';
  }

  /**
   * Generate recommendations based on anomaly type and severity
   */
  private generateRecommendations(
    type: string, 
    metric: string, 
    severity: string, 
    pattern?: CulturalPattern
  ): string[] {
    const recommendations: string[] = [];

    // Base recommendations by severity
    if (severity === 'critical') {
      recommendations.push('Immediate investigation required');
      recommendations.push('Consider temporarily disabling affected features');
    } else if (severity === 'high') {
      recommendations.push('Urgent review recommended');
      recommendations.push('Monitor closely for trend continuation');
    }

    // Type-specific recommendations
    if (type === 'statistical') {
      recommendations.push('Analyze recent changes that might affect ' + metric);
      recommendations.push('Review data collection methodology');
    } else if (type === 'pattern' && pattern) {
      recommendations.push(`Investigate factors affecting ${pattern.name}`);
      recommendations.push('Consider cultural calendar influences');
    } else if (type === 'threshold') {
      recommendations.push('Review threshold settings for appropriateness');
      recommendations.push('Consider adjusting limits based on cultural context');
    }

    // Metric-specific recommendations
    if (metric === 'cultural_accuracy_score') {
      recommendations.push('Consult with Tahitian cultural experts');
      recommendations.push('Review AI training data for cultural bias');
    } else if (metric === 'user_engagement') {
      recommendations.push('Analyze user feedback for cultural relevance');
      recommendations.push('Consider adjusting content presentation');
    }

    return recommendations;
  }

  /**
   * Get anomaly detection statistics
   */
  getStatistics(): Record<string, any> {
    const stats: Record<string, any> = {};

    for (const [metric, history] of this.dataHistory.entries()) {
      if (history.length > 0) {
        const values = history.map(dp => dp.value);
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        
        stats[metric] = {
          dataPoints: history.length,
          mean: mean.toFixed(2),
          standardDeviation: Math.sqrt(variance).toFixed(2),
          min: Math.min(...values).toFixed(2),
          max: Math.max(...values).toFixed(2),
          latest: values[values.length - 1].toFixed(2)
        };
      }
    }

    return stats;
  }

  /**
   * Update threshold for a specific metric
   */
  updateThreshold(metric: string, threshold: AnomalyThreshold): void {
    this.thresholds.set(metric, threshold);
  }

  /**
   * Clear history for a specific metric
   */
  clearHistory(metric?: string): void {
    if (metric) {
      this.dataHistory.delete(metric);
    } else {
      this.dataHistory.clear();
    }
  }
}

export default AnomalyDetector;
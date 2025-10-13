/**
 * useAnomalyDetection Hook
 * Real-time anomaly monitoring and detection for Tahitian Cultural Platform
 * Provides reactive anomaly detection with cultural context awareness
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import AnomalyDetector, { 
  AnomalyDataPoint, 
  AnomalyResult, 
  AnomalyThreshold 
} from '@/lib/analytics/AnomalyDetector';

export interface UseAnomalyDetectionOptions {
  enableRealTime?: boolean;
  pollingInterval?: number;
  maxAnomalies?: number;
  autoAlert?: boolean;
  culturalContextEnabled?: boolean;
}

export interface AnomalyDetectionState {
  anomalies: AnomalyResult[];
  isMonitoring: boolean;
  statistics: Record<string, any>;
  lastUpdate: number;
  totalAnomalies: number;
  criticalAnomalies: number;
  culturalAnomalies: number;
}

export interface UseAnomalyDetectionReturn {
  // State
  state: AnomalyDetectionState;
  
  // Actions
  addDataPoint: (dataPoint: AnomalyDataPoint) => AnomalyResult[];
  startMonitoring: () => void;
  stopMonitoring: () => void;
  clearAnomalies: () => void;
  updateThreshold: (metric: string, threshold: AnomalyThreshold) => void;
  
  // Utilities
  getAnomaliesByMetric: (metric: string) => AnomalyResult[];
  getAnomaliesBySeverity: (severity: string) => AnomalyResult[];
  getCulturalAnomalies: () => AnomalyResult[];
  getRecentAnomalies: (minutes: number) => AnomalyResult[];
  
  // Analytics
  getAnomalyTrends: () => Record<string, number>;
  getCulturalInsights: () => string[];
  getPerformanceMetrics: () => Record<string, number>;
}

const defaultOptions: UseAnomalyDetectionOptions = {
  enableRealTime: true,
  pollingInterval: 5000, // 5 seconds
  maxAnomalies: 100,
  autoAlert: true,
  culturalContextEnabled: true
};

export function useAnomalyDetection(
  options: UseAnomalyDetectionOptions = {}
): UseAnomalyDetectionReturn {
  const opts = { ...defaultOptions, ...options };
  
  // Refs
  const detectorRef = useRef<AnomalyDetector>(new AnomalyDetector());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const alertCallbackRef = useRef<((anomaly: AnomalyResult) => void) | null>(null);

  // State
  const [state, setState] = useState<AnomalyDetectionState>({
    anomalies: [],
    isMonitoring: false,
    statistics: {},
    lastUpdate: Date.now(),
    totalAnomalies: 0,
    criticalAnomalies: 0,
    culturalAnomalies: 0
  });

  // Update statistics periodically
  const updateStatistics = useCallback(() => {
    const statistics = detectorRef.current.getStatistics();
    const now = Date.now();
    
    setState(prev => ({
      ...prev,
      statistics,
      lastUpdate: now
    }));
  }, []);

  // Add data point and detect anomalies
  const addDataPoint = useCallback((dataPoint: AnomalyDataPoint): AnomalyResult[] => {
    const detector = detectorRef.current;
    
    // Add data point to detector
    detector.addDataPoint(dataPoint);
    
    // Detect anomalies
    const newAnomalies = detector.detectAnomalies(dataPoint);
    
    if (newAnomalies.length > 0) {
      setState(prev => {
        const updatedAnomalies = [...prev.anomalies, ...newAnomalies];
        
        // Limit anomalies to maxAnomalies
        if (updatedAnomalies.length > opts.maxAnomalies!) {
          updatedAnomalies.splice(0, updatedAnomalies.length - opts.maxAnomalies!);
        }
        
        // Calculate counts
        const criticalCount = updatedAnomalies.filter(a => a.severity === 'critical').length;
        const culturalCount = updatedAnomalies.filter(a => a.type === 'cultural').length;
        
        return {
          ...prev,
          anomalies: updatedAnomalies,
          totalAnomalies: updatedAnomalies.length,
          criticalAnomalies: criticalCount,
          culturalAnomalies: culturalCount,
          lastUpdate: Date.now()
        };
      });
      
      // Trigger alerts if enabled
      if (opts.autoAlert && alertCallbackRef.current) {
        newAnomalies.forEach(anomaly => {
          alertCallbackRef.current!(anomaly);
        });
      }
    }
    
    return newAnomalies;
  }, [opts.maxAnomalies, opts.autoAlert]);

  // Start real-time monitoring
  const startMonitoring = useCallback(() => {
    if (intervalRef.current) return;
    
    setState(prev => ({ ...prev, isMonitoring: true }));
    
    if (opts.enableRealTime) {
      intervalRef.current = setInterval(() => {
        updateStatistics();
        
        // Simulate real-time data points for demo
        if (typeof window !== 'undefined') {
          const metrics = [
            'user_engagement',
            'lesson_completion_rate',
            'ai_interaction_quality',
            'cultural_accuracy_score',
            'performance_score'
          ];
          
          const randomMetric = metrics[Math.floor(Math.random() * metrics.length)];
          const baseValue = getBaseValueForMetric(randomMetric);
          const variation = (Math.random() - 0.5) * 20; // ±10 variation
          
          const dataPoint: AnomalyDataPoint = {
            timestamp: Date.now(),
            value: Math.max(0, Math.min(100, baseValue + variation)),
            metric: randomMetric,
            context: {
              source: 'real_time_monitoring',
              culturalContext: opts.culturalContextEnabled
            }
          };
          
          addDataPoint(dataPoint);
        }
      }, opts.pollingInterval);
    }
  }, [opts.enableRealTime, opts.pollingInterval, updateStatistics, addDataPoint, opts.culturalContextEnabled]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setState(prev => ({ ...prev, isMonitoring: false }));
  }, []);

  // Clear all anomalies
  const clearAnomalies = useCallback(() => {
    setState(prev => ({
      ...prev,
      anomalies: [],
      totalAnomalies: 0,
      criticalAnomalies: 0,
      culturalAnomalies: 0
    }));
  }, []);

  // Update threshold
  const updateThreshold = useCallback((metric: string, threshold: AnomalyThreshold) => {
    detectorRef.current.updateThreshold(metric, threshold);
  }, []);

  // Get anomalies by metric
  const getAnomaliesByMetric = useCallback((metric: string): AnomalyResult[] => {
    return state.anomalies.filter(anomaly => anomaly.metric === metric);
  }, [state.anomalies]);

  // Get anomalies by severity
  const getAnomaliesBySeverity = useCallback((severity: string): AnomalyResult[] => {
    return state.anomalies.filter(anomaly => anomaly.severity === severity);
  }, [state.anomalies]);

  // Get cultural anomalies
  const getCulturalAnomalies = useCallback((): AnomalyResult[] => {
    return state.anomalies.filter(anomaly => 
      anomaly.type === 'cultural' || anomaly.culturalContext
    );
  }, [state.anomalies]);

  // Get recent anomalies
  const getRecentAnomalies = useCallback((minutes: number): AnomalyResult[] => {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return state.anomalies.filter(anomaly => anomaly.timestamp > cutoff);
  }, [state.anomalies]);

  // Get anomaly trends
  const getAnomalyTrends = useCallback((): Record<string, number> => {
    const trends: Record<string, number> = {};
    const recentAnomalies = getRecentAnomalies(60); // Last hour
    
    recentAnomalies.forEach(anomaly => {
      trends[anomaly.metric] = (trends[anomaly.metric] || 0) + 1;
    });
    
    return trends;
  }, [getRecentAnomalies]);

  // Get cultural insights
  const getCulturalInsights = useCallback((): string[] => {
    const insights: string[] = [];
    const culturalAnomalies = getCulturalAnomalies();
    
    if (culturalAnomalies.length > 0) {
      insights.push(`${culturalAnomalies.length} cultural anomalies detected`);
      
      const criticalCultural = culturalAnomalies.filter(a => a.severity === 'critical');
      if (criticalCultural.length > 0) {
        insights.push(`${criticalCultural.length} critical cultural issues require immediate attention`);
      }
      
      const accuracyIssues = culturalAnomalies.filter(a => a.metric === 'cultural_accuracy_score');
      if (accuracyIssues.length > 0) {
        insights.push('Cultural accuracy concerns detected - review content authenticity');
      }
    }
    
    const engagementTrends = getAnomalyTrends();
    if (engagementTrends.user_engagement > 3) {
      insights.push('User engagement patterns show unusual activity - investigate cultural relevance');
    }
    
    return insights;
  }, [getCulturalAnomalies, getAnomalyTrends]);

  // Get performance metrics
  const getPerformanceMetrics = useCallback((): Record<string, number> => {
    const metrics: Record<string, number> = {
      totalAnomalies: state.totalAnomalies,
      criticalAnomalies: state.criticalAnomalies,
      culturalAnomalies: state.culturalAnomalies,
      recentAnomalies: getRecentAnomalies(30).length,
      anomalyRate: 0,
      culturalAccuracy: 0
    };
    
    // Calculate anomaly rate (anomalies per hour)
    const hourlyAnomalies = getRecentAnomalies(60);
    metrics.anomalyRate = hourlyAnomalies.length;
    
    // Calculate cultural accuracy
    const culturalScores = state.anomalies
      .filter(a => a.metric === 'cultural_accuracy_score')
      .map(a => a.value);
    
    if (culturalScores.length > 0) {
      metrics.culturalAccuracy = culturalScores.reduce((sum, score) => sum + score, 0) / culturalScores.length;
    }
    
    return metrics;
  }, [state, getRecentAnomalies]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  // Auto-start monitoring if enabled
  useEffect(() => {
    if (opts.enableRealTime) {
      startMonitoring();
    }
    
    return () => {
      stopMonitoring();
    };
  }, [opts.enableRealTime, startMonitoring, stopMonitoring]);

  return {
    state,
    addDataPoint,
    startMonitoring,
    stopMonitoring,
    clearAnomalies,
    updateThreshold,
    getAnomaliesByMetric,
    getAnomaliesBySeverity,
    getCulturalAnomalies,
    getRecentAnomalies,
    getAnomalyTrends,
    getCulturalInsights,
    getPerformanceMetrics
  };
}

/**
 * Helper function to get base values for different metrics
 */
function getBaseValueForMetric(metric: string): number {
  const baseValues: Record<string, number> = {
    'user_engagement': 75,
    'lesson_completion_rate': 80,
    'ai_interaction_quality': 8,
    'cultural_accuracy_score': 85,
    'performance_score': 90,
    'response_time': 200
  };
  
  return baseValues[metric] || 50;
}

/**
 * Hook for setting up anomaly alerts
 */
export function useAnomalyAlerts(
  onAnomaly: (anomaly: AnomalyResult) => void
) {
  useEffect(() => {
    // This would be implemented to connect with the main hook
    // For now, it's a placeholder for the alert system integration
  }, [onAnomaly]);
}

export default useAnomalyDetection;
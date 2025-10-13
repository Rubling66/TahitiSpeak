'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import PredictiveScaler, { PredictiveDataPoint, PredictionResult, ScalingRecommendation, CulturalFactor } from '@/lib/analytics/PredictiveScaler';

export interface PredictiveAnalyticsState {
  predictions: PredictionResult[];
  recommendations: ScalingRecommendation[];
  isAnalyzing: boolean;
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  culturalInsights: string[];
  modelAccuracy: number;
  lastUpdate: Date | null;
}

export interface PredictiveMetrics {
  totalPredictions: number;
  averageConfidence: number;
  accuracyRate: number;
  trendStability: number;
  culturalAlignment: number;
  predictionLatency: number;
}

export interface PredictiveConfig {
  predictionHorizon: number; // hours
  updateInterval: number; // milliseconds
  confidenceThreshold: number;
  enableCulturalFactors: boolean;
  autoScaling: boolean;
  maxPredictions: number;
}

const defaultConfig: PredictiveConfig = {
  predictionHorizon: 24,
  updateInterval: 30000, // 30 seconds
  confidenceThreshold: 0.7,
  enableCulturalFactors: true,
  autoScaling: false,
  maxPredictions: 100
};

export function usePredictiveAnalytics(config: Partial<PredictiveConfig> = {}) {
  const finalConfig = { ...defaultConfig, ...config };
  const scalerRef = useRef<PredictiveScaler | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const [state, setState] = useState<PredictiveAnalyticsState>({
    predictions: [],
    recommendations: [],
    isAnalyzing: false,
    confidence: 0,
    trend: 'stable',
    culturalInsights: [],
    modelAccuracy: 0,
    lastUpdate: null
  });

  const [metrics, setMetrics] = useState<PredictiveMetrics>({
    totalPredictions: 0,
    averageConfidence: 0,
    accuracyRate: 0,
    trendStability: 0,
    culturalAlignment: 0,
    predictionLatency: 0
  });

  // Initialize the predictive scaler
  const initialize = useCallback(async () => {
    if (!scalerRef.current) {
      scalerRef.current = new PredictiveScaler();
      
      // Initialize with cultural factors for Tahitian platform
      const culturalFactors: CulturalFactor[] = [
        {
          name: 'Cultural Events',
          impact: 0.8,
          seasonality: 'monthly',
          description: 'Traditional Tahitian festivals and ceremonies'
        },
        {
          name: 'Language Learning Peaks',
          impact: 0.6,
          seasonality: 'weekly',
          description: 'Peak learning times for Tahitian language'
        },
        {
          name: 'Tourism Seasons',
          impact: 0.7,
          seasonality: 'yearly',
          description: 'Tourist influx affecting cultural interest'
        },
        {
          name: 'Island Time Patterns',
          impact: 0.5,
          seasonality: 'daily',
          description: 'Traditional Polynesian time concepts'
        }
      ];

      await scalerRef.current.initialize(culturalFactors);
      setIsInitialized(true);
    }
  }, []);

  // Add data point for prediction
  const addDataPoint = useCallback(async (dataPoint: PredictiveDataPoint) => {
    if (!scalerRef.current || !isInitialized) return;

    const startTime = performance.now();
    
    try {
      setState(prev => ({ ...prev, isAnalyzing: true }));
      
      await scalerRef.current.addDataPoint(dataPoint);
      
      // Generate new predictions
      const predictions = await scalerRef.current.predict(finalConfig.predictionHorizon);
      const recommendations = await scalerRef.current.getScalingRecommendations();
      
      const endTime = performance.now();
      const latency = endTime - startTime;

      setState(prev => ({
        ...prev,
        predictions: predictions.slice(-finalConfig.maxPredictions),
        recommendations,
        confidence: predictions.length > 0 ? predictions[predictions.length - 1].confidence : 0,
        trend: calculateTrend(predictions),
        culturalInsights: extractCulturalInsights(predictions),
        modelAccuracy: scalerRef.current?.getModelMetrics().accuracy || 0,
        lastUpdate: new Date(),
        isAnalyzing: false
      }));

      // Update metrics
      setMetrics(prev => ({
        ...prev,
        totalPredictions: prev.totalPredictions + 1,
        averageConfidence: calculateAverageConfidence(predictions),
        predictionLatency: latency,
        culturalAlignment: calculateCulturalAlignment(predictions)
      }));

    } catch (error) {
      console.error('Error adding data point:', error);
      setState(prev => ({ ...prev, isAnalyzing: false }));
    }
  }, [isInitialized, finalConfig.predictionHorizon, finalConfig.maxPredictions]);

  // Start continuous prediction updates
  const startPredictiveAnalysis = useCallback(() => {
    if (intervalRef.current) return;

    intervalRef.current = setInterval(async () => {
      if (!scalerRef.current || !isInitialized) return;

      // Generate synthetic data point for continuous analysis
      const syntheticDataPoint: PredictiveDataPoint = {
        timestamp: new Date(),
        value: Math.random() * 100,
        category: 'system',
        metadata: {
          source: 'continuous_monitoring',
          synthetic: true
        }
      };

      await addDataPoint(syntheticDataPoint);
    }, finalConfig.updateInterval);
  }, [addDataPoint, finalConfig.updateInterval, isInitialized]);

  // Stop continuous analysis
  const stopPredictiveAnalysis = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Get predictions for specific time range
  const getPredictionsForRange = useCallback((startTime: Date, endTime: Date): PredictionResult[] => {
    return state.predictions.filter(prediction => 
      prediction.timestamp >= startTime && prediction.timestamp <= endTime
    );
  }, [state.predictions]);

  // Get cultural recommendations
  const getCulturalRecommendations = useCallback((): string[] => {
    const recommendations: string[] = [];
    
    if (state.confidence > 0.8) {
      recommendations.push('High confidence predictions - ideal time for cultural events');
    }
    
    if (state.trend === 'increasing') {
      recommendations.push('Growing engagement - consider expanding cultural content');
    }
    
    if (state.culturalInsights.length > 0) {
      recommendations.push(...state.culturalInsights);
    }
    
    return recommendations;
  }, [state.confidence, state.trend, state.culturalInsights]);

  // Update configuration
  const updateConfig = useCallback((newConfig: Partial<PredictiveConfig>) => {
    Object.assign(finalConfig, newConfig);
    
    // Restart analysis with new config if running
    if (intervalRef.current) {
      stopPredictiveAnalysis();
      startPredictiveAnalysis();
    }
  }, [startPredictiveAnalysis, stopPredictiveAnalysis]);

  // Clear all predictions
  const clearPredictions = useCallback(() => {
    setState(prev => ({
      ...prev,
      predictions: [],
      recommendations: [],
      confidence: 0,
      trend: 'stable',
      culturalInsights: [],
      lastUpdate: null
    }));
    
    setMetrics({
      totalPredictions: 0,
      averageConfidence: 0,
      accuracyRate: 0,
      trendStability: 0,
      culturalAlignment: 0,
      predictionLatency: 0
    });
  }, []);

  // Initialize on mount
  useEffect(() => {
    initialize();
    
    return () => {
      stopPredictiveAnalysis();
    };
  }, [initialize, stopPredictiveAnalysis]);

  return {
    // State
    ...state,
    metrics,
    isInitialized,
    config: finalConfig,
    
    // Actions
    addDataPoint,
    startPredictiveAnalysis,
    stopPredictiveAnalysis,
    getPredictionsForRange,
    getCulturalRecommendations,
    updateConfig,
    clearPredictions,
    
    // Computed values
    hasHighConfidence: state.confidence > finalConfig.confidenceThreshold,
    isStableTrend: state.trend === 'stable',
    recentPredictions: state.predictions.slice(-10),
    topRecommendations: state.recommendations.slice(0, 5)
  };
}

// Helper functions
function calculateTrend(predictions: PredictionResult[]): 'increasing' | 'decreasing' | 'stable' {
  if (predictions.length < 2) return 'stable';
  
  const recent = predictions.slice(-5);
  const values = recent.map(p => p.value);
  
  let increasing = 0;
  let decreasing = 0;
  
  for (let i = 1; i < values.length; i++) {
    if (values[i] > values[i - 1]) increasing++;
    else if (values[i] < values[i - 1]) decreasing++;
  }
  
  if (increasing > decreasing) return 'increasing';
  if (decreasing > increasing) return 'decreasing';
  return 'stable';
}

function calculateAverageConfidence(predictions: PredictionResult[]): number {
  if (predictions.length === 0) return 0;
  
  const sum = predictions.reduce((acc, p) => acc + p.confidence, 0);
  return sum / predictions.length;
}

function extractCulturalInsights(predictions: PredictionResult[]): string[] {
  const insights: string[] = [];
  
  // Analyze patterns for cultural insights
  const highConfidencePredictions = predictions.filter(p => p.confidence > 0.8);
  
  if (highConfidencePredictions.length > predictions.length * 0.7) {
    insights.push('Strong cultural engagement patterns detected');
  }
  
  // Check for time-based patterns
  const hourlyDistribution = new Map<number, number>();
  predictions.forEach(p => {
    const hour = p.timestamp.getHours();
    hourlyDistribution.set(hour, (hourlyDistribution.get(hour) || 0) + 1);
  });
  
  const peakHour = Array.from(hourlyDistribution.entries())
    .sort((a, b) => b[1] - a[1])[0];
  
  if (peakHour && peakHour[1] > predictions.length * 0.3) {
    insights.push(`Peak cultural activity around ${peakHour[0]}:00 - align with island time`);
  }
  
  return insights;
}

function calculateCulturalAlignment(predictions: PredictionResult[]): number {
  // Calculate how well predictions align with cultural patterns
  // This is a simplified calculation - in reality, this would be more complex
  
  if (predictions.length === 0) return 0;
  
  let alignmentScore = 0;
  const totalPredictions = predictions.length;
  
  predictions.forEach(prediction => {
    // Higher confidence generally indicates better cultural alignment
    alignmentScore += prediction.confidence;
    
    // Time-based cultural alignment (Polynesian time concepts)
    const hour = prediction.timestamp.getHours();
    if (hour >= 6 && hour <= 18) { // Daylight hours are culturally significant
      alignmentScore += 0.1;
    }
  });
  
  return Math.min(alignmentScore / totalPredictions, 1);
}

export default usePredictiveAnalytics;
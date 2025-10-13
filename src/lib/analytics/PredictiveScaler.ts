/**
 * Predictive Analytics Engine for Tahitian Cultural Platform
 * Advanced predictive scaling and analytics with machine learning capabilities
 * Provides cultural context-aware predictions and insights
 */

export interface PredictiveDataPoint {
  timestamp: number;
  value: number;
  metric: string;
  features?: Record<string, number>;
  culturalContext?: string;
}

export interface PredictionResult {
  metric: string;
  timestamp: number;
  predictedValue: number;
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  culturalFactors: string[];
  recommendations: string[];
  timeHorizon: number; // minutes into the future
}

export interface CulturalFactor {
  name: string;
  weight: number;
  description: string;
  timePattern?: string;
  seasonalPattern?: string;
}

export interface ModelMetrics {
  accuracy: number;
  mse: number; // Mean Squared Error
  mae: number; // Mean Absolute Error
  r2: number;  // R-squared
  lastTrained: number;
  dataPoints: number;
}

export interface ScalingRecommendation {
  metric: string;
  action: 'scale_up' | 'scale_down' | 'maintain' | 'optimize';
  priority: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  culturalContext: string;
  estimatedImpact: number;
  timeframe: string;
}

class PredictiveScaler {
  private dataHistory: Map<string, PredictiveDataPoint[]> = new Map();
  private models: Map<string, any> = new Map(); // Simplified ML models
  private culturalFactors: CulturalFactor[] = [];
  private readonly maxHistorySize = 2000;
  private readonly minTrainingData = 50;
  private readonly retrainInterval = 3600000; // 1 hour

  constructor() {
    this.initializeCulturalFactors();
    this.initializeModels();
  }

  /**
   * Initialize cultural factors that influence predictions
   */
  private initializeCulturalFactors(): void {
    this.culturalFactors = [
      {
        name: 'traditional_learning_hours',
        weight: 1.5,
        description: 'Traditional Tahitian learning periods',
        timePattern: '6-9,18-21', // Morning and evening
      },
      {
        name: 'lunar_calendar_influence',
        weight: 1.2,
        description: 'Lunar calendar cultural significance',
        timePattern: '1,15', // New and full moon
      },
      {
        name: 'weekend_cultural_immersion',
        weight: 1.3,
        description: 'Weekend cultural activities',
        timePattern: 'weekend',
      },
      {
        name: 'seasonal_festivals',
        weight: 2.0,
        description: 'Tahitian seasonal festivals and celebrations',
        seasonalPattern: 'heiva_season', // July festival season
      },
      {
        name: 'storytelling_tradition',
        weight: 1.4,
        description: 'Traditional storytelling time influence',
        timePattern: '19-21', // Evening storytelling
      },
      {
        name: 'cultural_authenticity_focus',
        weight: 1.8,
        description: 'Emphasis on cultural accuracy and respect',
      },
      {
        name: 'community_engagement',
        weight: 1.6,
        description: 'Community-based learning patterns',
      }
    ];
  }

  /**
   * Initialize simplified ML models for each metric
   */
  private initializeModels(): void {
    const metrics = [
      'user_engagement',
      'lesson_completion_rate',
      'ai_interaction_quality',
      'cultural_accuracy_score',
      'performance_score',
      'response_time',
      'cultural_immersion_depth'
    ];

    metrics.forEach(metric => {
      this.models.set(metric, {
        weights: this.initializeWeights(),
        bias: 0,
        lastTrained: 0,
        trainingData: [],
        metrics: {
          accuracy: 0,
          mse: 0,
          mae: 0,
          r2: 0,
          lastTrained: 0,
          dataPoints: 0
        }
      });
    });
  }

  /**
   * Initialize random weights for the model
   */
  private initializeWeights(): number[] {
    const featureCount = 10; // Base features + cultural factors
    return Array.from({ length: featureCount }, () => (Math.random() - 0.5) * 0.1);
  }

  /**
   * Add data point for training and prediction
   */
  addDataPoint(dataPoint: PredictiveDataPoint): void {
    const { metric } = dataPoint;
    
    if (!this.dataHistory.has(metric)) {
      this.dataHistory.set(metric, []);
    }

    const history = this.dataHistory.get(metric)!;
    history.push(dataPoint);

    // Maintain history size
    if (history.length > this.maxHistorySize) {
      history.shift();
    }

    // Check if model needs retraining
    const model = this.models.get(metric);
    if (model && (Date.now() - model.lastTrained) > this.retrainInterval) {
      this.trainModel(metric);
    }
  }

  /**
   * Generate predictions for a specific metric
   */
  predict(metric: string, timeHorizonMinutes: number = 30): PredictionResult | null {
    const model = this.models.get(metric);
    const history = this.dataHistory.get(metric);

    if (!model || !history || history.length < this.minTrainingData) {
      return null;
    }

    const currentTime = Date.now();
    const futureTime = currentTime + (timeHorizonMinutes * 60 * 1000);
    
    // Extract features for prediction
    const features = this.extractFeatures(metric, futureTime, history);
    
    // Make prediction using simplified linear model
    const predictedValue = this.makePrediction(model, features);
    
    // Calculate confidence based on recent accuracy
    const confidence = this.calculateConfidence(model, history);
    
    // Determine trend
    const trend = this.determineTrend(history);
    
    // Get cultural factors affecting this prediction
    const culturalFactors = this.getCulturalFactorsForTime(futureTime);
    
    // Generate recommendations
    const recommendations = this.generatePredictiveRecommendations(
      metric, 
      predictedValue, 
      trend, 
      culturalFactors
    );

    return {
      metric,
      timestamp: futureTime,
      predictedValue: Math.max(0, predictedValue),
      confidence,
      trend,
      culturalFactors,
      recommendations,
      timeHorizon: timeHorizonMinutes
    };
  }

  /**
   * Generate multiple predictions for different time horizons
   */
  predictMultipleHorizons(metric: string, horizons: number[] = [15, 30, 60, 120]): PredictionResult[] {
    return horizons
      .map(horizon => this.predict(metric, horizon))
      .filter(prediction => prediction !== null) as PredictionResult[];
  }

  /**
   * Generate scaling recommendations based on predictions
   */
  generateScalingRecommendations(predictions: PredictionResult[]): ScalingRecommendation[] {
    const recommendations: ScalingRecommendation[] = [];

    predictions.forEach(prediction => {
      const recommendation = this.analyzeScalingNeed(prediction);
      if (recommendation) {
        recommendations.push(recommendation);
      }
    });

    // Sort by priority and cultural impact
    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Train the model for a specific metric
   */
  private trainModel(metric: string): void {
    const model = this.models.get(metric);
    const history = this.dataHistory.get(metric);

    if (!model || !history || history.length < this.minTrainingData) {
      return;
    }

    // Prepare training data
    const trainingData = this.prepareTrainingData(history);
    
    // Simple gradient descent training
    this.performGradientDescent(model, trainingData);
    
    // Update model metrics
    model.metrics = this.calculateModelMetrics(model, trainingData);
    model.lastTrained = Date.now();
    
    console.log(`Model trained for ${metric}:`, model.metrics);
  }

  /**
   * Extract features for prediction
   */
  private extractFeatures(metric: string, timestamp: number, history: PredictiveDataPoint[]): number[] {
    const features: number[] = [];
    const recentData = history.slice(-20); // Last 20 data points
    
    if (recentData.length === 0) return features;

    // Time-based features
    const date = new Date(timestamp);
    features.push(
      date.getHours() / 24,           // Hour of day (normalized)
      date.getDay() / 7,              // Day of week (normalized)
      date.getDate() / 31,            // Day of month (normalized)
      Math.sin(2 * Math.PI * date.getHours() / 24), // Cyclical hour
      Math.cos(2 * Math.PI * date.getHours() / 24)  // Cyclical hour
    );

    // Statistical features from recent data
    const values = recentData.map(d => d.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    features.push(
      mean / 100,                     // Normalized mean
      Math.sqrt(variance) / 100,      // Normalized standard deviation
      (values[values.length - 1] - mean) / 100, // Last value deviation
      this.calculateTrend(values),    // Trend indicator
      this.getCulturalWeight(timestamp) // Cultural weight
    );

    return features;
  }

  /**
   * Make prediction using the model
   */
  private makePrediction(model: any, features: number[]): number {
    const { weights, bias } = model;
    
    let prediction = bias;
    for (let i = 0; i < Math.min(features.length, weights.length); i++) {
      prediction += features[i] * weights[i];
    }
    
    return prediction;
  }

  /**
   * Calculate prediction confidence
   */
  private calculateConfidence(model: any, history: PredictiveDataPoint[]): number {
    const { metrics } = model;
    
    // Base confidence on model accuracy and data recency
    const baseConfidence = Math.max(0.1, metrics.accuracy || 0.5);
    const dataRecency = Math.min(1, history.length / this.minTrainingData);
    
    return Math.min(0.95, baseConfidence * dataRecency);
  }

  /**
   * Determine trend from historical data
   */
  private determineTrend(history: PredictiveDataPoint[]): 'increasing' | 'decreasing' | 'stable' {
    if (history.length < 5) return 'stable';
    
    const recent = history.slice(-10);
    const trend = this.calculateTrend(recent.map(d => d.value));
    
    if (trend > 0.1) return 'increasing';
    if (trend < -0.1) return 'decreasing';
    return 'stable';
  }

  /**
   * Calculate numerical trend
   */
  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, i) => sum + (i * val), 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope || 0;
  }

  /**
   * Get cultural factors affecting a specific time
   */
  private getCulturalFactorsForTime(timestamp: number): string[] {
    const factors: string[] = [];
    const date = new Date(timestamp);
    const hour = date.getHours();
    const day = date.getDay();
    const dayOfMonth = date.getDate();

    this.culturalFactors.forEach(factor => {
      if (this.factorAppliesAtTime(factor, date)) {
        factors.push(factor.description);
      }
    });

    return factors;
  }

  /**
   * Check if a cultural factor applies at a specific time
   */
  private factorAppliesAtTime(factor: CulturalFactor, date: Date): boolean {
    const hour = date.getHours();
    const day = date.getDay();
    const dayOfMonth = date.getDate();

    if (factor.timePattern) {
      if (factor.timePattern.includes('6-9') && hour >= 6 && hour <= 9) return true;
      if (factor.timePattern.includes('18-21') && hour >= 18 && hour <= 21) return true;
      if (factor.timePattern.includes('19-21') && hour >= 19 && hour <= 21) return true;
      if (factor.timePattern.includes('weekend') && (day === 0 || day === 6)) return true;
      if (factor.timePattern.includes('1,15') && (dayOfMonth === 1 || dayOfMonth === 15)) return true;
    }

    return false;
  }

  /**
   * Get cultural weight for a specific time
   */
  private getCulturalWeight(timestamp: number): number {
    const date = new Date(timestamp);
    let weight = 1.0;

    this.culturalFactors.forEach(factor => {
      if (this.factorAppliesAtTime(factor, date)) {
        weight *= factor.weight;
      }
    });

    return Math.min(3.0, weight); // Cap at 3x
  }

  /**
   * Generate predictive recommendations
   */
  private generatePredictiveRecommendations(
    metric: string,
    predictedValue: number,
    trend: string,
    culturalFactors: string[]
  ): string[] {
    const recommendations: string[] = [];

    // Trend-based recommendations
    if (trend === 'decreasing') {
      recommendations.push(`${metric} is predicted to decline - consider proactive measures`);
      
      if (metric === 'cultural_accuracy_score') {
        recommendations.push('Review cultural content for authenticity');
        recommendations.push('Consult with Tahitian cultural experts');
      } else if (metric === 'user_engagement') {
        recommendations.push('Enhance cultural immersion features');
        recommendations.push('Add interactive storytelling elements');
      }
    } else if (trend === 'increasing') {
      recommendations.push(`${metric} shows positive trend - optimize for continued growth`);
      
      if (metric === 'user_engagement') {
        recommendations.push('Scale infrastructure to handle increased activity');
        recommendations.push('Prepare additional cultural content');
      }
    }

    // Cultural factor recommendations
    if (culturalFactors.length > 0) {
      recommendations.push('Cultural factors detected - align features with traditional patterns');
      
      if (culturalFactors.some(f => f.includes('storytelling'))) {
        recommendations.push('Enhance storytelling features during predicted peak time');
      }
      
      if (culturalFactors.some(f => f.includes('lunar'))) {
        recommendations.push('Highlight lunar calendar cultural significance');
      }
    }

    // Value-based recommendations
    if (predictedValue < 50) {
      recommendations.push('Low predicted value - implement immediate improvements');
    } else if (predictedValue > 90) {
      recommendations.push('High predicted value - ensure system can handle peak performance');
    }

    return recommendations;
  }

  /**
   * Analyze scaling needs based on prediction
   */
  private analyzeScalingNeed(prediction: PredictionResult): ScalingRecommendation | null {
    const { metric, predictedValue, trend, confidence, culturalFactors } = prediction;

    let action: ScalingRecommendation['action'] = 'maintain';
    let priority: ScalingRecommendation['priority'] = 'low';
    let reason = '';
    let estimatedImpact = 0;

    // Determine action based on predicted value and trend
    if (predictedValue > 90 && trend === 'increasing') {
      action = 'scale_up';
      priority = confidence > 0.8 ? 'high' : 'medium';
      reason = 'High predicted load with increasing trend';
      estimatedImpact = (predictedValue - 90) * confidence;
    } else if (predictedValue < 30 && trend === 'decreasing') {
      action = 'optimize';
      priority = confidence > 0.7 ? 'high' : 'medium';
      reason = 'Low predicted performance with declining trend';
      estimatedImpact = (30 - predictedValue) * confidence;
    } else if (predictedValue > 80 && culturalFactors.length > 0) {
      action = 'scale_up';
      priority = 'medium';
      reason = 'Cultural factors indicate increased activity';
      estimatedImpact = culturalFactors.length * 10;
    }

    if (action === 'maintain') return null;

    return {
      metric,
      action,
      priority,
      reason,
      culturalContext: culturalFactors.join(', ') || 'General optimization',
      estimatedImpact,
      timeframe: `${prediction.timeHorizon} minutes`
    };
  }

  /**
   * Prepare training data from history
   */
  private prepareTrainingData(history: PredictiveDataPoint[]): Array<{ features: number[], target: number }> {
    const trainingData: Array<{ features: number[], target: number }> = [];
    
    for (let i = 10; i < history.length; i++) {
      const features = this.extractFeatures(
        history[i].metric,
        history[i].timestamp,
        history.slice(0, i)
      );
      
      trainingData.push({
        features,
        target: history[i].value
      });
    }
    
    return trainingData;
  }

  /**
   * Perform gradient descent training
   */
  private performGradientDescent(model: any, trainingData: Array<{ features: number[], target: number }>): void {
    const learningRate = 0.01;
    const epochs = 100;
    
    for (let epoch = 0; epoch < epochs; epoch++) {
      let totalError = 0;
      
      trainingData.forEach(({ features, target }) => {
        const prediction = this.makePrediction(model, features);
        const error = target - prediction;
        totalError += error * error;
        
        // Update weights
        for (let i = 0; i < model.weights.length && i < features.length; i++) {
          model.weights[i] += learningRate * error * features[i];
        }
        
        // Update bias
        model.bias += learningRate * error;
      });
      
      // Early stopping if error is small enough
      if (totalError / trainingData.length < 0.01) break;
    }
  }

  /**
   * Calculate model performance metrics
   */
  private calculateModelMetrics(model: any, trainingData: Array<{ features: number[], target: number }>): ModelMetrics {
    let totalError = 0;
    let totalAbsError = 0;
    let totalTargets = 0;
    let totalSquaredTargets = 0;
    
    trainingData.forEach(({ features, target }) => {
      const prediction = this.makePrediction(model, features);
      const error = target - prediction;
      
      totalError += error * error;
      totalAbsError += Math.abs(error);
      totalTargets += target;
      totalSquaredTargets += target * target;
    });
    
    const n = trainingData.length;
    const mse = totalError / n;
    const mae = totalAbsError / n;
    const meanTarget = totalTargets / n;
    const variance = (totalSquaredTargets / n) - (meanTarget * meanTarget);
    const r2 = Math.max(0, 1 - (mse / variance));
    
    return {
      accuracy: Math.max(0, 1 - (mae / 100)), // Normalized accuracy
      mse,
      mae,
      r2,
      lastTrained: Date.now(),
      dataPoints: n
    };
  }

  /**
   * Get model statistics
   */
  getModelStatistics(): Record<string, ModelMetrics> {
    const stats: Record<string, ModelMetrics> = {};
    
    for (const [metric, model] of this.models.entries()) {
      stats[metric] = { ...model.metrics };
    }
    
    return stats;
  }

  /**
   * Get cultural insights
   */
  getCulturalInsights(): string[] {
    const insights: string[] = [];
    const currentTime = Date.now();
    
    const activeFactor = this.culturalFactors.find(factor => 
      this.factorAppliesAtTime(factor, new Date(currentTime))
    );
    
    if (activeFactor) {
      insights.push(`Current cultural context: ${activeFactor.description}`);
      insights.push(`Cultural weight factor: ${activeFactor.weight}x`);
    }
    
    insights.push(`Tracking ${this.culturalFactors.length} cultural factors`);
    insights.push('Predictions incorporate traditional Tahitian learning patterns');
    
    return insights;
  }
}

export default PredictiveScaler;
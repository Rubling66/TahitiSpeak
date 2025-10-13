/**
 * AlertSystem Component
 * Real-time alert system with tropical styling and cultural context awareness
 * Provides notification management, severity levels, and user interaction
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle, 
  X, 
  Bell, 
  BellOff,
  Volume2,
  VolumeX,
  Settings,
  Filter,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { AnomalyResult } from '@/lib/analytics/AnomalyDetector';
import useAnomalyDetection from '@/hooks/useAnomalyDetection';

export interface AlertConfig {
  enableSound: boolean;
  enableVisual: boolean;
  enableCultural: boolean;
  severityFilter: ('low' | 'medium' | 'high' | 'critical')[];
  autoHide: boolean;
  hideDelay: number;
  maxAlerts: number;
}

export interface AlertSystemProps {
  className?: string;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
  config?: Partial<AlertConfig>;
  onAlertClick?: (alert: AnomalyResult) => void;
  onConfigChange?: (config: AlertConfig) => void;
}

const defaultConfig: AlertConfig = {
  enableSound: true,
  enableVisual: true,
  enableCultural: true,
  severityFilter: ['medium', 'high', 'critical'],
  autoHide: true,
  hideDelay: 5000,
  maxAlerts: 5
};

const severityConfig = {
  low: {
    icon: Info,
    color: 'from-blue-400 to-cyan-400',
    bgColor: 'bg-blue-50 border-blue-200',
    textColor: 'text-blue-800',
    sound: 'notification-low.mp3'
  },
  medium: {
    icon: AlertCircle,
    color: 'from-yellow-400 to-orange-400',
    bgColor: 'bg-yellow-50 border-yellow-200',
    textColor: 'text-yellow-800',
    sound: 'notification-medium.mp3'
  },
  high: {
    icon: AlertTriangle,
    color: 'from-orange-400 to-red-400',
    bgColor: 'bg-orange-50 border-orange-200',
    textColor: 'text-orange-800',
    sound: 'notification-high.mp3'
  },
  critical: {
    icon: AlertTriangle,
    color: 'from-red-500 to-pink-500',
    bgColor: 'bg-red-50 border-red-200',
    textColor: 'text-red-800',
    sound: 'notification-critical.mp3'
  }
};

const positionClasses = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'center': 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
};

function AlertSystem({
  className = '',
  position = 'top-right',
  config: configProp,
  onAlertClick,
  onConfigChange
}: AlertSystemProps) {
  const [config, setConfig] = useState<AlertConfig>({ ...defaultConfig, ...configProp });
  const [alerts, setAlerts] = useState<(AnomalyResult & { id: string; timestamp: number })[]>([]);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(config.enableSound);
  
  const { state, getRecentAnomalies, getCulturalAnomalies } = useAnomalyDetection({
    enableRealTime: true,
    autoAlert: true
  });

  // Handle new anomalies
  useEffect(() => {
    const recentAnomalies = getRecentAnomalies(1); // Last minute
    
    recentAnomalies.forEach(anomaly => {
      if (config.severityFilter.includes(anomaly.severity)) {
        const alertId = `${anomaly.id}_${Date.now()}`;
        const newAlert = {
          ...anomaly,
          id: alertId,
          timestamp: Date.now()
        };
        
        setAlerts(prev => {
          const updated = [newAlert, ...prev];
          
          // Limit alerts
          if (updated.length > config.maxAlerts) {
            updated.splice(config.maxAlerts);
          }
          
          return updated;
        });
        
        // Play sound if enabled
        if (config.enableSound && soundEnabled) {
          playNotificationSound(anomaly.severity);
        }
        
        // Auto-hide if enabled
        if (config.autoHide) {
          setTimeout(() => {
            removeAlert(alertId);
          }, config.hideDelay);
        }
      }
    });
  }, [state.lastUpdate, config, soundEnabled, getRecentAnomalies]);

  // Play notification sound
  const playNotificationSound = useCallback((severity: string) => {
    if (typeof window !== 'undefined' && 'Audio' in window) {
      try {
        const audio = new Audio(`/sounds/${severityConfig[severity as keyof typeof severityConfig]?.sound || 'notification-medium.mp3'}`);
        audio.volume = 0.3;
        audio.play().catch(() => {
          // Ignore audio play errors (user interaction required)
        });
      } catch (error) {
        console.warn('Could not play notification sound:', error);
      }
    }
  }, []);

  // Remove alert
  const removeAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  // Clear all alerts
  const clearAllAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // Handle alert click
  const handleAlertClick = useCallback((alert: AnomalyResult & { id: string; timestamp: number }) => {
    onAlertClick?.(alert);
    removeAlert(alert.id);
  }, [onAlertClick, removeAlert]);

  // Update config
  const updateConfig = useCallback((newConfig: Partial<AlertConfig>) => {
    const updated = { ...config, ...newConfig };
    setConfig(updated);
    onConfigChange?.(updated);
  }, [config, onConfigChange]);

  // Get cultural context message
  const getCulturalContextMessage = useCallback((alert: AnomalyResult): string => {
    if (!config.enableCultural || !alert.culturalContext) return '';
    
    const culturalMessages = [
      '🌺 Cultural sensitivity reminder',
      '🏝️ Tahitian context consideration',
      '🌊 Traditional wisdom applies',
      '🥥 Island culture insight',
      '🌴 Polynesian perspective needed'
    ];
    
    return culturalMessages[Math.floor(Math.random() * culturalMessages.length)];
  }, [config.enableCultural]);

  // Render alert item
  const renderAlert = (alert: AnomalyResult & { id: string; timestamp: number }) => {
    const severityInfo = severityConfig[alert.severity];
    const Icon = severityInfo.icon;
    const culturalMessage = getCulturalContextMessage(alert);

    return (
      <motion.div
        key={alert.id}
        initial={{ opacity: 0, x: 300, scale: 0.8 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 300, scale: 0.8 }}
        whileHover={{ scale: 1.02 }}
        className={`
          relative mb-3 p-4 rounded-xl border-2 shadow-lg backdrop-blur-sm
          ${severityInfo.bgColor} ${severityInfo.textColor}
          cursor-pointer transition-all duration-300
          hover:shadow-xl hover:border-opacity-80
          max-w-sm
        `}
        onClick={() => handleAlertClick(alert)}
      >
        {/* Tropical gradient border */}
        <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${severityInfo.color} opacity-20 -z-10`} />
        
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className={`p-1.5 rounded-lg bg-gradient-to-r ${severityInfo.color} text-white`}>
              <Icon size={16} />
            </div>
            <div>
              <h4 className="font-semibold text-sm capitalize">
                {alert.severity} {alert.type} Alert
              </h4>
              <p className="text-xs opacity-75">
                {alert.metric.replace(/_/g, ' ')}
              </p>
            </div>
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeAlert(alert.id);
            }}
            className="p-1 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <p className="text-sm leading-relaxed">
            {alert.description}
          </p>
          
          {culturalMessage && (
            <div className="flex items-center space-x-2 p-2 rounded-lg bg-gradient-to-r from-emerald-100 to-teal-100 border border-emerald-200">
              <span className="text-xs font-medium text-emerald-700">
                {culturalMessage}
              </span>
            </div>
          )}
          
          {/* Metrics */}
          <div className="flex justify-between text-xs opacity-75">
            <span>Value: {alert.value.toFixed(2)}</span>
            <span>Expected: {alert.expectedValue.toFixed(2)}</span>
          </div>
          
          {/* Recommendations */}
          {alert.recommendations.length > 0 && (
            <div className="mt-2 p-2 rounded-lg bg-white bg-opacity-50">
              <p className="text-xs font-medium mb-1">Recommendations:</p>
              <ul className="text-xs space-y-1">
                {alert.recommendations.slice(0, 2).map((rec, index) => (
                  <li key={index} className="flex items-start space-x-1">
                    <span className="text-emerald-600">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className="mt-3 pt-2 border-t border-current border-opacity-20">
          <p className="text-xs opacity-60">
            {new Date(alert.timestamp).toLocaleTimeString()}
          </p>
        </div>
      </motion.div>
    );
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50 ${className}`}>
      {/* Control Panel */}
      <div className="mb-4 flex items-center justify-end space-x-2">
        {/* Sound Toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`
            p-2 rounded-lg transition-all duration-300
            ${soundEnabled 
              ? 'bg-gradient-to-r from-emerald-400 to-teal-400 text-white shadow-lg' 
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }
          `}
          title={soundEnabled ? 'Disable sound' : 'Enable sound'}
        >
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>

        {/* Clear All */}
        {alerts.length > 0 && (
          <button
            onClick={clearAllAlerts}
            className="p-2 rounded-lg bg-gradient-to-r from-red-400 to-pink-400 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            title="Clear all alerts"
          >
            <Trash2 size={16} />
          </button>
        )}

        {/* Config Toggle */}
        <button
          onClick={() => setIsConfigOpen(!isConfigOpen)}
          className={`
            p-2 rounded-lg transition-all duration-300
            ${isConfigOpen 
              ? 'bg-gradient-to-r from-blue-400 to-cyan-400 text-white shadow-lg' 
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }
          `}
          title="Alert settings"
        >
          <Settings size={16} />
        </button>
      </div>

      {/* Configuration Panel */}
      <AnimatePresence>
        {isConfigOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-4 p-4 rounded-xl bg-white bg-opacity-95 backdrop-blur-sm border border-gray-200 shadow-xl max-w-sm"
          >
            <h3 className="font-semibold text-gray-800 mb-3">Alert Settings</h3>
            
            <div className="space-y-3">
              {/* Severity Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Severity Levels
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['low', 'medium', 'high', 'critical'] as const).map(severity => (
                    <label key={severity} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={config.severityFilter.includes(severity)}
                        onChange={(e) => {
                          const newFilter = e.target.checked
                            ? [...config.severityFilter, severity]
                            : config.severityFilter.filter(s => s !== severity);
                          updateConfig({ severityFilter: newFilter });
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm capitalize">{severity}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Auto Hide */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Auto Hide
                </label>
                <input
                  type="checkbox"
                  checked={config.autoHide}
                  onChange={(e) => updateConfig({ autoHide: e.target.checked })}
                  className="rounded border-gray-300"
                />
              </div>

              {/* Cultural Context */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Cultural Context
                </label>
                <input
                  type="checkbox"
                  checked={config.enableCultural}
                  onChange={(e) => updateConfig({ enableCultural: e.target.checked })}
                  className="rounded border-gray-300"
                />
              </div>

              {/* Max Alerts */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Alerts: {config.maxAlerts}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={config.maxAlerts}
                  onChange={(e) => updateConfig({ maxAlerts: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alerts Container */}
      <div className="space-y-3">
        <AnimatePresence>
          {alerts.map(renderAlert)}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {alerts.length === 0 && !isConfigOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-center max-w-sm"
        >
          <CheckCircle className="mx-auto mb-2 text-emerald-500" size={24} />
          <p className="text-sm text-emerald-700 font-medium">
            All systems running smoothly
          </p>
          <p className="text-xs text-emerald-600 mt-1">
            🌺 Tahitian cultural platform is healthy
          </p>
        </motion.div>
      )}
    </div>
  );
}

export default AlertSystem;
export { AlertSystem };
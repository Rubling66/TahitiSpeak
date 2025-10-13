'use client';

import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  WifiOff, 
  Wifi, 
  RefreshCw, 
  Clock,
  Signal,
  SignalLow,
  SignalMedium,
  SignalHigh
} from 'lucide-react';
import useNetworkStatus from '@/hooks/useNetworkStatus';

interface OfflineIndicatorProps {
  showWhenOnline?: boolean;
  position?: 'top' | 'bottom' | 'fixed-top' | 'fixed-bottom';
  className?: string;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  showWhenOnline = false,
  position = 'fixed-top',
  className = ''
}) => {
  const {
    isOnline,
    isSlowConnection,
    connectionType,
    effectiveType,
    downlink,
    rtt,
    retryConnection,
    offlineDuration
  } = useNetworkStatus();

  const [isRetrying, setIsRetrying] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await retryConnection();
    } finally {
      setIsRetrying(false);
    }
  };

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getConnectionIcon = () => {
    if (!isOnline) return <WifiOff className="h-4 w-4" />;
    
    if (isSlowConnection) return <SignalLow className="h-4 w-4" />;
    
    switch (effectiveType) {
      case '4g':
        return <SignalHigh className="h-4 w-4" />;
      case '3g':
        return <SignalMedium className="h-4 w-4" />;
      case '2g':
      case 'slow-2g':
        return <SignalLow className="h-4 w-4" />;
      default:
        return <Wifi className="h-4 w-4" />;
    }
  };

  const getConnectionQuality = () => {
    if (!isOnline) return 'offline';
    if (isSlowConnection) return 'slow';
    if (effectiveType === '4g' && downlink > 10) return 'excellent';
    if (effectiveType === '4g') return 'good';
    if (effectiveType === '3g') return 'fair';
    return 'poor';
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-blue-500';
      case 'fair': return 'bg-yellow-500';
      case 'poor': return 'bg-orange-500';
      case 'slow': return 'bg-red-400';
      case 'offline': return 'bg-red-600';
      default: return 'bg-gray-500';
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'fixed-top':
        return 'fixed top-0 left-0 right-0 z-50';
      case 'fixed-bottom':
        return 'fixed bottom-0 left-0 right-0 z-50';
      case 'top':
        return 'relative';
      case 'bottom':
        return 'relative';
      default:
        return 'fixed top-0 left-0 right-0 z-50';
    }
  };

  // Don't show if online and showWhenOnline is false
  if (isOnline && !showWhenOnline) {
    return null;
  }

  return (
    <div className={`${getPositionClasses()} ${className}`}>
      <Alert className={`border-0 rounded-none ${isOnline ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            {getConnectionIcon()}
            
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {isOnline ? (
                  <>
                    <span className="text-green-700">En ligne</span>
                    {isSlowConnection && (
                      <span className="text-yellow-600 ml-2">(Connexion lente)</span>
                    )}
                  </>
                ) : (
                  <span className="text-red-700">Hors ligne</span>
                )}
              </span>
              
              <Badge 
                variant="outline" 
                className={`${getQualityColor(getConnectionQuality())} text-white border-0`}
              >
                {effectiveType.toUpperCase() || 'Unknown'}
              </Badge>
            </div>

            {!isOnline && offlineDuration > 0 && (
              <div className="flex items-center gap-1 text-sm text-red-600">
                <Clock className="h-3 w-3" />
                {formatDuration(offlineDuration)}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isOnline && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleRetry}
                disabled={isRetrying}
                className="h-8"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${isRetrying ? 'animate-spin' : ''}`} />
                Réessayer
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowDetails(!showDetails)}
              className="h-8 text-xs"
            >
              {showDetails ? 'Masquer' : 'Détails'}
            </Button>
          </div>
        </div>

        {showDetails && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Type:</span>
                <br />
                {connectionType || 'Unknown'}
              </div>
              <div>
                <span className="font-medium">Vitesse:</span>
                <br />
                {downlink ? `${downlink} Mbps` : 'Unknown'}
              </div>
              <div>
                <span className="font-medium">Latence:</span>
                <br />
                {rtt ? `${rtt} ms` : 'Unknown'}
              </div>
              <div>
                <span className="font-medium">Qualité:</span>
                <br />
                <span className={`px-2 py-1 rounded text-white text-xs ${getQualityColor(getConnectionQuality())}`}>
                  {getConnectionQuality().toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        )}
      </Alert>
    </div>
  );
};

export default OfflineIndicator;
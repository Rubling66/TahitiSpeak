'use client';

import { useState, useEffect, useCallback } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
}

interface UseNetworkStatusReturn extends NetworkStatus {
  retryConnection: () => Promise<boolean>;
  lastOnlineTime: Date | null;
  offlineDuration: number;
}

// Extended Navigator interface for connection API
interface NavigatorWithConnection extends Navigator {
  connection?: {
    effectiveType: string;
    type: string;
    downlink: number;
    rtt: number;
    addEventListener: (event: string, handler: () => void) => void;
    removeEventListener: (event: string, handler: () => void) => void;
  };
}

const useNetworkStatus = (): UseNetworkStatusReturn => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSlowConnection: false,
    connectionType: 'unknown',
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0
  });

  const [lastOnlineTime, setLastOnlineTime] = useState<Date | null>(null);
  const [offlineStartTime, setOfflineStartTime] = useState<Date | null>(null);
  const [offlineDuration, setOfflineDuration] = useState<number>(0);

  // Check if connection is slow based on effective type and downlink
  const isSlowConnection = useCallback((effectiveType: string, downlink: number): boolean => {
    return effectiveType === 'slow-2g' || 
           effectiveType === '2g' || 
           (effectiveType === '3g' && downlink < 1.5);
  }, []);

  // Update network status from connection API
  const updateNetworkStatus = useCallback(() => {
    const nav = navigator as NavigatorWithConnection;
    const connection = nav.connection;
    
    if (connection) {
      const slowConnection = isSlowConnection(connection.effectiveType, connection.downlink);
      
      setNetworkStatus(prev => ({
        ...prev,
        connectionType: connection.type || 'unknown',
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0,
        isSlowConnection: slowConnection
      }));
    }
  }, [isSlowConnection]);

  // Handle online status change
  const handleOnline = useCallback(() => {
    setNetworkStatus(prev => ({ ...prev, isOnline: true }));
    setLastOnlineTime(new Date());
    setOfflineStartTime(null);
    setOfflineDuration(0);
    updateNetworkStatus();
  }, [updateNetworkStatus]);

  // Handle offline status change
  const handleOffline = useCallback(() => {
    setNetworkStatus(prev => ({ ...prev, isOnline: false }));
    setOfflineStartTime(new Date());
  }, []);

  // Retry connection by attempting to fetch a small resource
  const retryConnection = useCallback(async (): Promise<boolean> => {
    try {
      // Try to fetch a small resource to test connectivity
      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      const isConnected = response.ok;
      
      if (isConnected && !networkStatus.isOnline) {
        handleOnline();
      } else if (!isConnected && networkStatus.isOnline) {
        handleOffline();
      }
      
      return isConnected;
    } catch (error) {
      console.warn('Connection retry failed:', error);
      if (networkStatus.isOnline) {
        handleOffline();
      }
      return false;
    }
  }, [networkStatus.isOnline, handleOnline, handleOffline]);

  // Calculate offline duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (offlineStartTime && !networkStatus.isOnline) {
      interval = setInterval(() => {
        const duration = Date.now() - offlineStartTime.getTime();
        setOfflineDuration(duration);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [offlineStartTime, networkStatus.isOnline]);

  // Set up event listeners
  useEffect(() => {
    // Online/offline event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Connection change listener
    const nav = navigator as NavigatorWithConnection;
    if (nav.connection) {
      nav.connection.addEventListener('change', updateNetworkStatus);
    }

    // Initial network status update
    updateNetworkStatus();

    // Periodic connection check (every 30 seconds when online)
    const connectionCheckInterval = setInterval(() => {
      if (networkStatus.isOnline) {
        retryConnection();
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (nav.connection) {
        nav.connection.removeEventListener('change', updateNetworkStatus);
      }
      
      clearInterval(connectionCheckInterval);
    };
  }, [handleOnline, handleOffline, updateNetworkStatus, networkStatus.isOnline, retryConnection]);

  return {
    ...networkStatus,
    retryConnection,
    lastOnlineTime,
    offlineDuration
  };
};

export default useNetworkStatus;
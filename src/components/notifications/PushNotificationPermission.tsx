import React, { useState, useEffect } from 'react';
import { Bell, BellOff, AlertCircle, CheckCircle, X } from 'lucide-react';

interface PushNotificationPermissionProps {
  onPermissionGranted?: (token: string) => void;
  onPermissionDenied?: () => void;
  className?: string;
}

type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

export const PushNotificationPermission: React.FC<PushNotificationPermissionProps> = ({
  onPermissionGranted,
  onPermissionDenied,
  className = ''
}) => {
  const [permissionState, setPermissionState] = useState<PermissionState>('default');
  const [isRequesting, setIsRequesting] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if push notifications are supported
  const isPushSupported = () => {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  };

  // Check current permission state
  const checkPermissionState = () => {
    if (!isPushSupported()) {
      setPermissionState('unsupported');
      return;
    }

    const permission = Notification.permission;
    setPermissionState(permission as PermissionState);
    
    // Show prompt if permission is default and we haven't shown it yet
    if (permission === 'default' && !localStorage.getItem('push_prompt_shown')) {
      setShowPrompt(true);
    }
  };

  useEffect(() => {
    checkPermissionState();
  }, []);

  // Initialize Firebase Cloud Messaging (mock implementation)
  const initializeFCM = async (): Promise<string> => {
    // In a real implementation, this would initialize Firebase and get the FCM token
    // For now, we'll simulate this process
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.1) { // 90% success rate
          const mockToken = `fcm_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          resolve(mockToken);
        } else {
          reject(new Error('Failed to get FCM token'));
        }
      }, 1000);
    });
  };

  // Request notification permission
  const requestPermission = async () => {
    if (!isPushSupported()) {
      setError('Push notifications are not supported in this browser');
      return;
    }

    setIsRequesting(true);
    setError(null);

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      setPermissionState(permission as PermissionState);

      if (permission === 'granted') {
        // Get FCM token
        const token = await initializeFCM();
        setFcmToken(token);
        onPermissionGranted?.(token);
        
        // Show success notification
        new Notification('Notifications Enabled!', {
          body: 'You\'ll now receive push notifications for your Tahitian learning progress.',
          icon: '/favicon.ico',
          badge: '/favicon.ico'
        });
      } else {
        onPermissionDenied?.();
      }

      // Mark that we've shown the prompt
      localStorage.setItem('push_prompt_shown', 'true');
      setShowPrompt(false);
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      setError('Failed to enable notifications. Please try again.');
    } finally {
      setIsRequesting(false);
    }
  };

  // Dismiss the prompt
  const dismissPrompt = () => {
    setShowPrompt(false);
    localStorage.setItem('push_prompt_shown', 'true');
  };

  // Test notification
  const sendTestNotification = () => {
    if (permissionState === 'granted') {
      new Notification('Test Notification', {
        body: 'This is a test notification from TahitiSpeak!',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'test-notification'
      });
    }
  };

  // Reset permission (for testing)
  const resetPermission = () => {
    localStorage.removeItem('push_prompt_shown');
    setShowPrompt(true);
    setError(null);
  };

  if (permissionState === 'unsupported') {
    return (
      <div className={`p-4 bg-yellow-50 border border-yellow-200 rounded-lg ${className}`}>
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-yellow-600 mr-3" />
          <div>
            <p className="text-sm font-medium text-yellow-800">
              Push notifications not supported
            </p>
            <p className="text-sm text-yellow-700">
              Your browser doesn't support push notifications. Please use a modern browser for the best experience.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!showPrompt && permissionState === 'granted') {
    return (
      <div className={`p-4 bg-green-50 border border-green-200 rounded-lg ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-green-800">
                Push notifications enabled
              </p>
              <p className="text-sm text-green-700">
                You'll receive notifications for your learning progress.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={sendTestNotification}
              className="text-sm text-green-700 hover:text-green-900 underline"
            >
              Test
            </button>
            <button
              onClick={resetPermission}
              className="text-sm text-green-700 hover:text-green-900 underline"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!showPrompt && permissionState === 'denied') {
    return (
      <div className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <BellOff className="w-5 h-5 text-red-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-red-800">
                Push notifications blocked
              </p>
              <p className="text-sm text-red-700">
                To enable notifications, please allow them in your browser settings.
              </p>
            </div>
          </div>
          <button
            onClick={resetPermission}
            className="text-sm text-red-700 hover:text-red-900 underline"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!showPrompt) {
    return null;
  }

  return (
    <div className={`p-6 bg-blue-50 border border-blue-200 rounded-lg ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start">
          <Bell className="w-6 h-6 text-blue-600 mr-4 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Enable Push Notifications
            </h3>
            <p className="text-blue-800 mb-4">
              Stay on track with your Tahitian learning! Get notified about:
            </p>
            <ul className="text-sm text-blue-700 space-y-1 mb-6">
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></span>
                Daily lesson reminders
              </li>
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></span>
                Achievement unlocks and milestones
              </li>
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></span>
                Friend requests and social interactions
              </li>
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></span>
                Learning streak reminders
              </li>
            </ul>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-md">
                <div className="flex items-center">
                  <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-3">
              <button
                onClick={requestPermission}
                disabled={isRequesting}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors duration-200"
              >
                {isRequesting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Enabling...</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    <span>Enable Notifications</span>
                  </>
                )}
              </button>
              
              <button
                onClick={dismissPrompt}
                className="px-4 py-2 text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors duration-200"
              >
                Maybe Later
              </button>
            </div>

            <p className="text-xs text-blue-600 mt-3">
              You can change this setting anytime in your browser or account preferences.
            </p>
          </div>
        </div>

        <button
          onClick={dismissPrompt}
          className="text-blue-400 hover:text-blue-600 p-1"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default PushNotificationPermission;
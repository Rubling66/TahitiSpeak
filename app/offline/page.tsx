'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw, Home, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { PublicLayout } from '@/components/layout/AppLayout';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine);

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      setRetryCount(0);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);

    try {
      // Try to fetch a simple endpoint to test connectivity
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache'
      });

      if (response.ok) {
        // If successful, reload the page
        window.location.reload();
      } else {
        throw new Error('Network request failed');
      }
    } catch (error) {
      console.log('Retry failed:', error);
      // The retry failed, but we'll update the UI anyway
    } finally {
      setIsRetrying(false);
    }
  };

  const handleGoHome = () => {
    // Try to navigate to home page
    window.location.href = '/';
  };

  return (
    <PublicLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Status Icon */}
        <div className="mb-6">
          {isOnline ? (
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wifi className="w-10 h-10 text-green-600" />
            </div>
          ) : (
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <WifiOff className="w-10 h-10 text-red-600" />
            </div>
          )}
        </div>

        {/* Title and Message */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {isOnline ? 'Connection Restored!' : 'You\'re Offline'}
        </h1>
        
        <p className="text-gray-600 mb-8">
          {isOnline 
            ? 'Your internet connection has been restored. You can now access all features of Tahitian Tutor.'
            : 'It looks like you\'re not connected to the internet. Some features may not be available, but you can still access cached content.'
          }
        </p>

        {/* Connection Status */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Connection Status:</span>
            <span className={`font-medium ${
              isOnline ? 'text-green-600' : 'text-red-600'
            }`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          {retryCount > 0 && (
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-gray-600">Retry Attempts:</span>
              <span className="font-medium text-gray-900">{retryCount}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {isOnline ? (
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Page
            </button>
          ) : (
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Checking Connection...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </>
              )}
            </button>
          )}

          <button
            onClick={handleGoHome}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Go to Home
          </button>
        </div>

        {/* Offline Features */}
        {!isOnline && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Available Offline
            </h3>
            <div className="space-y-2">
              <Link
                href="/lessons"
                className="block w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                Cached Lessons
              </Link>
              <Link
                href="/vocabulary"
                className="block w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                Saved Vocabulary
              </Link>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Note: Some features require an internet connection and may not work offline.
            </p>
          </div>
        )}

        {/* Tips */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">Tips:</h4>
          <ul className="text-xs text-blue-700 space-y-1 text-left">
            <li>• Check your WiFi or mobile data connection</li>
            <li>• Try moving to an area with better signal</li>
            <li>• Some content is available offline in cached form</li>
            <li>• Your progress will sync when you\'re back online</li>
          </ul>
        </div>
      </div>
    </div>
    </PublicLayout>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor, Wifi, Zap } from 'lucide-react';
import { usePWA } from '@/services/PWAService';

interface PWAInstallPromptProps {
  onInstall?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export default function PWAInstallPrompt({ 
  onInstall, 
  onDismiss, 
  className = '' 
}: PWAInstallPromptProps) {
  const { isInstallable, isInstalled, install } = usePWA();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Check if user has previously dismissed the prompt
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      setIsDismissed(true);
    }

    // Show prompt if installable and not dismissed
    if (isInstallable && !isInstalled && !dismissed) {
      // Delay showing the prompt to avoid being too aggressive
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000); // Show after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled]);

  const handleInstall = async () => {
    setIsInstalling(true);
    
    try {
      const success = await install();
      if (success) {
        setIsVisible(false);
        onInstall?.();
      }
    } catch (error) {
      console.error('Installation failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
    onDismiss?.();
  };

  const handleDismissTemporary = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  // Don't render if not installable, already installed, or dismissed
  if (!isInstallable || isInstalled || isDismissed || !isVisible) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-4">
        {/* Modal */}
        <div className={`bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md transform transition-all duration-300 ${className}`}>
          {/* Header */}
          <div className="relative p-6 pb-4">
            <button
              onClick={handleDismissTemporary}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Download className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Install Tahitian Tutor
                </h3>
                <p className="text-sm text-gray-600">
                  Get the full app experience
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pb-6">
            <p className="text-gray-600 mb-6">
              Install our app for a better learning experience with offline access, 
              faster loading, and native app features.
            </p>

            {/* Features */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Wifi className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Offline Access</p>
                  <p className="text-xs text-gray-600">Learn even without internet</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Faster Loading</p>
                  <p className="text-xs text-gray-600">Instant access to your lessons</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Native Experience</p>
                  <p className="text-xs text-gray-600">Feels like a real app</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleInstall}
                disabled={isInstalling}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-blue-400 disabled:to-indigo-400 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isInstalling ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Installing...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Install App
                  </>
                )}
              </button>
              
              <div className="flex gap-2">
                <button
                  onClick={handleDismissTemporary}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Not Now
                </button>
                <button
                  onClick={handleDismiss}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Don't Ask Again
                </button>
              </div>
            </div>

            {/* Installation Instructions */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                How to Install:
              </h4>
              <div className="text-xs text-gray-600 space-y-1">
                <div className="flex items-center gap-2">
                  <Monitor className="w-3 h-3" />
                  <span><strong>Desktop:</strong> Click "Install App" above</span>
                </div>
                <div className="flex items-center gap-2">
                  <Smartphone className="w-3 h-3" />
                  <span><strong>Mobile:</strong> Use "Add to Home Screen" in your browser menu</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Compact version for header/navbar
export function PWAInstallButton({ className = '' }: { className?: string }) {
  const { isInstallable, isInstalled, install } = usePWA();
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstall = async () => {
    setIsInstalling(true);
    
    try {
      await install();
    } catch (error) {
      console.error('Installation failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  // Don't render if not installable or already installed
  if (!isInstallable || isInstalled) {
    return null;
  }

  return (
    <button
      onClick={handleInstall}
      disabled={isInstalling}
      className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors duration-200 ${className}`}
      title="Install Tahitian Tutor App"
    >
      {isInstalling ? (
        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      <span className="hidden sm:inline">Install App</span>
    </button>
  );
}

// Hook for programmatic control
export function usePWAInstallPrompt() {
  const { isInstallable, isInstalled, install } = usePWA();
  const [isVisible, setIsVisible] = useState(false);

  const showPrompt = () => {
    if (isInstallable && !isInstalled) {
      setIsVisible(true);
    }
  };

  const hidePrompt = () => {
    setIsVisible(false);
  };

  const installApp = async () => {
    try {
      const success = await install();
      if (success) {
        setIsVisible(false);
      }
      return success;
    } catch (error) {
      console.error('Installation failed:', error);
      return false;
    }
  };

  return {
    isInstallable,
    isInstalled,
    isVisible,
    showPrompt,
    hidePrompt,
    installApp
  };
}
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { FloatingActionButton } from './FloatingActionButton';
import { SystemTray } from './SystemTray';
import { QuickLaunch } from './QuickLaunch';
import { useKeyboardShortcuts, createAppShortcuts } from '../hooks/useKeyboardShortcuts';
import { useGlobalHotkeys } from '../hooks/useGlobalHotkeys';

interface TriggerManagerProps {
  // Navigation callbacks
  onNavigateToLearn?: () => void;
  onNavigateToPractice?: () => void;
  onNavigateToCulture?: () => void;
  onNavigateToProfile?: () => void;
  
  // Feature callbacks
  onStartLesson?: () => void;
  onOpenPronunciation?: () => void;
  onShowProgress?: () => void;
  onOpenApp?: () => void;
  
  // Initial settings
  initialFloatingButtonEnabled?: boolean;
  initialSystemTrayEnabled?: boolean;
  initialHotkeysEnabled?: boolean;
  
  // Layout props
  showQuickLaunch?: boolean;
  children?: React.ReactNode;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'lesson' | 'progress' | 'reminder' | 'achievement';
  timestamp: Date;
  action?: () => void;
}

export const TriggerManager: React.FC<TriggerManagerProps> = ({
  onNavigateToLearn,
  onNavigateToPractice,
  onNavigateToCulture,
  onNavigateToProfile,
  onStartLesson,
  onOpenPronunciation,
  onShowProgress,
  onOpenApp,
  initialFloatingButtonEnabled = true,
  initialSystemTrayEnabled = Platform.OS === 'web',
  initialHotkeysEnabled = Platform.OS === 'web',
  showQuickLaunch = false,
  children
}) => {
  // Trigger states
  const [floatingButtonEnabled, setFloatingButtonEnabled] = useState(initialFloatingButtonEnabled);
  const [systemTrayEnabled, setSystemTrayEnabled] = useState(initialSystemTrayEnabled);
  const [hotkeysEnabled, setHotkeysEnabled] = useState(initialHotkeysEnabled);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  
  // Floating button state
  const [floatingButtonVisible, setFloatingButtonVisible] = useState(true);
  
  // Create unified action handlers
  const handleStartLesson = useCallback(() => {
    onStartLesson?.();
    onNavigateToLearn?.();
    addNotification({
      id: `lesson-${Date.now()}`,
      title: 'Leçon Commencée',
      message: 'Bonne chance avec votre apprentissage!',
      type: 'lesson',
      timestamp: new Date()
    });
  }, [onStartLesson, onNavigateToLearn]);
  
  const handleOpenPronunciation = useCallback(() => {
    onOpenPronunciation?.();
    onNavigateToPractice?.();
    addNotification({
      id: `pronunciation-${Date.now()}`,
      title: 'Prononciation',
      message: 'Pratiquez vos sons tahitiens',
      type: 'lesson',
      timestamp: new Date()
    });
  }, [onOpenPronunciation, onNavigateToPractice]);
  
  const handleShowProgress = useCallback(() => {
    onShowProgress?.();
    onNavigateToProfile?.();
  }, [onShowProgress, onNavigateToProfile]);
  
  const handleOpenCulture = useCallback(() => {
    onNavigateToCulture?.();
  }, [onNavigateToCulture]);
  
  const handleOpenProfile = useCallback(() => {
    onNavigateToProfile?.();
  }, [onNavigateToProfile]);
  
  const handleOpenApp = useCallback(() => {
    onOpenApp?.();
    // Focus the app window if on web
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.focus();
    }
  }, [onOpenApp]);
  
  // Trigger toggle handlers
  const toggleFloatingButton = useCallback(() => {
    setFloatingButtonEnabled(prev => !prev);
  }, []);
  
  const toggleSystemTray = useCallback(() => {
    setSystemTrayEnabled(prev => !prev);
  }, []);
  
  const toggleHotkeys = useCallback((enabled?: boolean) => {
    setHotkeysEnabled(enabled !== undefined ? enabled : !hotkeysEnabled);
  }, [hotkeysEnabled]);
  
  const toggleFloatingButtonVisibility = useCallback(() => {
    setFloatingButtonVisible(prev => !prev);
  }, []);
  
  // Notification management
  const addNotification = useCallback((notification: NotificationItem) => {
    setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep max 5 notifications
    
    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  }, []);
  
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);
  
  // Initialize keyboard shortcuts
  const shortcuts = createAppShortcuts({
    focusApp: handleOpenApp,
    openQuickLaunch: () => {/* Handle quick launch */},
    startLesson: handleStartLesson,
    openPronunciation: handleOpenPronunciation,
    toggleFloatingButton: () => setFloatingButtonVisible(!floatingButtonVisible),
  });
  
  const keyboardShortcuts = useKeyboardShortcuts({
    shortcuts,
    enabled: true,
  });
  
  // Initialize global hotkeys
  useGlobalHotkeys({
    onOpenApp: handleOpenApp,
    onStartLesson: handleStartLesson,
    onOpenPronunciation: handleOpenPronunciation,
    onShowProgress: handleShowProgress,
    onToggleFloatingButton: toggleFloatingButtonVisibility,
    onToggleSystemTray: toggleSystemTray,
    enabled: hotkeysEnabled
  });
  
  // Add welcome notification on mount
  useEffect(() => {
    const welcomeTimer = setTimeout(() => {
      addNotification({
        id: 'welcome',
        title: 'Bienvenue!',
        message: 'Utilisez Ctrl+Shift+T pour accès rapide',
        type: 'reminder',
        timestamp: new Date(),
        action: () => {
          // Show hotkey help or quick launch
        }
      });
    }, 2000);
    
    return () => clearTimeout(welcomeTimer);
  }, [addNotification]);
  
  // Add periodic learning reminders
  useEffect(() => {
    if (!hotkeysEnabled) return;
    
    const reminderInterval = setInterval(() => {
      const now = new Date();
      const hour = now.getHours();
      
      // Only show reminders during reasonable hours (9 AM - 9 PM)
      if (hour >= 9 && hour <= 21) {
        addNotification({
          id: `reminder-${Date.now()}`,
          title: 'Moment d\'apprentissage',
          message: 'Que diriez-vous d\'une petite leçon?',
          type: 'reminder',
          timestamp: new Date(),
          action: handleStartLesson
        });
      }
    }, 30 * 60 * 1000); // Every 30 minutes
    
    return () => clearInterval(reminderInterval);
  }, [hotkeysEnabled, addNotification, handleStartLesson]);
  
  if (showQuickLaunch) {
    return (
      <QuickLaunch
        onStartLesson={handleStartLesson}
        onOpenPronunciation={handleOpenPronunciation}
        onShowProgress={handleShowProgress}
        onOpenCulture={handleOpenCulture}
        onOpenProfile={handleOpenProfile}
        onToggleFloatingButton={toggleFloatingButton}
        onToggleSystemTray={toggleSystemTray}
        floatingButtonEnabled={floatingButtonEnabled}
        systemTrayEnabled={systemTrayEnabled}
        hotkeyEnabled={hotkeysEnabled}
        onToggleHotkeys={toggleHotkeys}
      />
    );
  }
  
  return (
    <View style={styles.container}>
      {children}
      
      {/* System Tray */}
      {systemTrayEnabled && (
        <SystemTray
          onOpenApp={handleOpenApp}
          onStartLesson={handleStartLesson}
          onOpenPronunciation={handleOpenPronunciation}

          notifications={notifications}
          visible={systemTrayEnabled}
        />
      )}
      
      {/* Floating Action Button */}
      {floatingButtonEnabled && floatingButtonVisible && (
        <FloatingActionButton
          onStartLesson={handleStartLesson}
          onOpenPronunciation={handleOpenPronunciation}

          onOpenQuickLaunch={() => {/* Handle quick launch */}}
          initialPosition={{ x: 20, y: 100 }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
});

export default TriggerManager;

// Export hook for external trigger management
export const useTriggerManager = () => {
  const [settings, setSettings] = useState({
    floatingButton: true,
    systemTray: Platform.OS === 'web',
    hotkeys: Platform.OS === 'web'
  });
  
  const updateSetting = useCallback((key: keyof typeof settings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);
  
  return {
    settings,
    updateSetting,
    isWebPlatform: Platform.OS === 'web'
  };
};
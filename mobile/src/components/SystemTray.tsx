import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TiarePattern, WavePattern, TapaPattern } from './TahitianPatterns';
import TahitianDancer from './TahitianDancer';

interface SystemTrayProps {
  onOpenApp?: () => void;
  onStartLesson?: () => void;
  onOpenPronunciation?: () => void;
  onShowProgress?: () => void;
  notifications?: NotificationItem[];
  visible?: boolean;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'lesson' | 'progress' | 'reminder' | 'achievement';
  timestamp: Date;
  action?: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

export const SystemTray: React.FC<SystemTrayProps> = ({
  onOpenApp,
  onStartLesson,
  onOpenPronunciation,
  onShowProgress,
  notifications = [],
  visible = true
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const slideAnim = useRef(new Animated.Value(visible ? 0 : -100)).current;
  const expandAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const notificationAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : -100,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  useEffect(() => {
    setUnreadCount(notifications.length);
    if (notifications.length > 0) {
      // Pulse animation for new notifications
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [notifications]);

  const toggleExpanded = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    
    Animated.spring(expandAnim, {
      toValue: newExpanded ? 1 : 0,
      useNativeDriver: false,
    }).start();
  };

  const toggleNotifications = () => {
    const newShow = !showNotifications;
    setShowNotifications(newShow);
    
    Animated.spring(notificationAnim, {
      toValue: newShow ? 1 : 0,
      useNativeDriver: false,
    }).start();
    
    if (newShow) {
      setUnreadCount(0);
    }
  };

  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'lesson':
        return <TiarePattern size="sm" color="coral" />;
      case 'progress':
        return <TapaPattern size="sm" color="sunset" />;
      case 'reminder':
        return <WavePattern size="sm" color="ocean" />;
      case 'achievement':
        return <TahitianDancer size="sm" color="primary" />;
      default:
        return <TiarePattern size="sm" color="primary" />;
    }
  };

  const expandWidth = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [60, 300],
  });

  const notificationHeight = notificationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.min(notifications.length * 60 + 20, 300)],
  });

  if (Platform.OS !== 'web') {
    return null; // System tray is primarily for web platform
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* Notifications Panel */}
      <Animated.View
        style={[
          styles.notificationsPanel,
          {
            height: notificationHeight,
            opacity: notificationAnim,
          },
        ]}
      >
        <Text style={styles.notificationTitle}>Notifications Tahiti</Text>
        {notifications.map((notification) => (
          <TouchableOpacity
            key={notification.id}
            style={styles.notificationItem}
            onPress={notification.action}
          >
            <View style={styles.notificationIcon}>
              {getNotificationIcon(notification.type)}
            </View>
            <View style={styles.notificationContent}>
              <Text style={styles.notificationItemTitle}>{notification.title}</Text>
              <Text style={styles.notificationMessage}>{notification.message}</Text>
              <Text style={styles.notificationTime}>
                {notification.timestamp.toLocaleTimeString()}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </Animated.View>

      {/* Main Tray */}
      <Animated.View
        style={[
          styles.tray,
          {
            width: expandWidth,
          },
        ]}
      >
        <LinearGradient
          colors={['#4ECDC4', '#44A08D', '#2E8B57']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          {/* Main App Button */}
          <Animated.View
            style={[
              styles.mainButton,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            <TouchableOpacity
              onPress={onOpenApp}
              style={styles.buttonTouchable}
            >
              <TahitianDancer size="sm" color="primary" animate={true} />
            </TouchableOpacity>
          </Animated.View>

          {/* Notification Badge */}
          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.notificationBadge}
              onPress={toggleNotifications}
            >
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </TouchableOpacity>
          )}

          {/* Expanded Menu Items */}
          {isExpanded && (
            <View style={styles.expandedItems}>
              <TouchableOpacity
                style={styles.menuButton}
                onPress={onStartLesson}
              >
                <TiarePattern size="sm" color="coral" />
                <Text style={styles.menuButtonText}>Leçon</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.menuButton}
                onPress={onOpenPronunciation}
              >
                <WavePattern size="sm" color="ocean" />
                <Text style={styles.menuButtonText}>Audio</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.menuButton}
                onPress={onShowProgress}
              >
                <TapaPattern size="sm" color="sunset" />
                <Text style={styles.menuButtonText}>Progrès</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Expand/Collapse Button */}
          <TouchableOpacity
            style={styles.expandButton}
            onPress={toggleExpanded}
          >
            <Text style={styles.expandButtonText}>
              {isExpanded ? '‹' : '›'}
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    elevation: 999,
  },
  tray: {
    height: 50,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  gradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  mainButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  buttonTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  expandedItems: {
    flexDirection: 'row',
    marginLeft: 10,
    flex: 1,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginHorizontal: 4,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  menuButtonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  expandButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  expandButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  notificationsPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 10,
    borderRadius: 10,
    padding: 10,
    marginBottom: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E8B57',
    marginBottom: 10,
    textAlign: 'center',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(46, 139, 87, 0.1)',
  },
  notificationIcon: {
    marginRight: 10,
  },
  notificationContent: {
    flex: 1,
  },
  notificationItemTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E8B57',
  },
  notificationMessage: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  notificationTime: {
    fontSize: 9,
    color: '#999',
    marginTop: 2,
  },
});

export default SystemTray;
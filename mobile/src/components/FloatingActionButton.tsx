import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  PanResponder,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TiarePattern, WavePattern, TapaPattern } from './TahitianPatterns';
import TahitianDancer from './TahitianDancer';

interface FloatingActionButtonProps {
  onStartLesson?: () => void;
  onOpenPronunciation?: () => void;
  onOpenQuickLaunch?: () => void;
  onToggleVisibility?: (visible: boolean) => void;
  initialPosition?: { x: number; y: number };
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onStartLesson,
  onOpenPronunciation,
  onOpenQuickLaunch,
  onToggleVisibility,
  initialPosition = { x: screenWidth - 80, y: screenHeight / 2 }
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const position = useRef(new Animated.ValueXY(initialPosition)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const expandAnim = useRef(new Animated.Value(0)).current;

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      setIsDragging(true);
      Animated.spring(scaleAnim, {
        toValue: 1.1,
        useNativeDriver: true,
      }).start();
    },
    onPanResponderMove: Animated.event(
      [null, { dx: position.x, dy: position.y }],
      { useNativeDriver: false }
    ),
    onPanResponderRelease: (evt, gestureState) => {
      setIsDragging(false);
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();

      // Snap to edges
      const { dx, dy } = gestureState;
      const newX = dx < screenWidth / 2 ? 20 : screenWidth - 80;
      const newY = Math.max(50, Math.min(screenHeight - 150, dy));

      Animated.spring(position, {
        toValue: { x: newX, y: newY },
        useNativeDriver: false,
      }).start();
    },
  });

  const toggleExpanded = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    
    Animated.parallel([
      Animated.spring(expandAnim, {
        toValue: newExpanded ? 1 : 0,
        useNativeDriver: false,
      }),
      Animated.spring(rotateAnim, {
        toValue: newExpanded ? 1 : 0,
        useNativeDriver: true,
      })
    ]).start();
  };

  const toggleMinimized = () => {
    const newMinimized = !isMinimized;
    setIsMinimized(newMinimized);
    onToggleVisibility?.(newMinimized);
    
    Animated.spring(scaleAnim, {
      toValue: newMinimized ? 0.3 : 1,
      useNativeDriver: true,
    }).start();
  };

  const handleAction = (action: () => void | undefined) => {
    if (action) {
      action();
      setIsExpanded(false);
      Animated.spring(expandAnim, {
        toValue: 0,
        useNativeDriver: false,
      }).start();
    }
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const expandHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200],
  });

  if (Platform.OS !== 'web' && Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateX: position.x },
            { translateY: position.y },
            { scale: scaleAnim }
          ],
        },
      ]}
      {...panResponder.panHandlers}
    >
      {/* Expanded Menu */}
      <Animated.View
        style={[
          styles.expandedMenu,
          {
            height: expandHeight,
            opacity: expandAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleAction(onStartLesson)}
        >
          <TiarePattern size="sm" color="coral" />
          <Text style={styles.menuText}>Leçon</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleAction(onOpenPronunciation)}
        >
          <WavePattern size="sm" color="ocean" />
          <Text style={styles.menuText}>Prononciation</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleAction(onOpenQuickLaunch)}
        >
          <TapaPattern size="sm" color="sunset" />
          <Text style={styles.menuText}>Menu Rapide</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Main Button */}
      <TouchableOpacity
        style={styles.mainButton}
        onPress={toggleExpanded}
        onLongPress={toggleMinimized}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#4ECDC4', '#44A08D', '#2E8B57']}
          style={styles.gradient}
        >
          <Animated.View
            style={[
              styles.iconContainer,
              { transform: [{ rotate: rotation }] }
            ]}
          >
            {isMinimized ? (
              <TiarePattern size="sm" color="primary" />
            ) : (
              <TahitianDancer size="sm" color="primary" animate={isExpanded} />
            )}
          </Animated.View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Minimize/Maximize indicator */}
      {!isMinimized && (
        <View style={styles.indicator}>
          <Text style={styles.indicatorText}>⋯</Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1000,
    elevation: 1000,
  },
  mainButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  gradient: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandedMenu: {
    position: 'absolute',
    bottom: 70,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    paddingVertical: 10,
    paddingHorizontal: 5,
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
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 2,
    borderRadius: 8,
  },
  menuText: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#2E8B57',
  },
  indicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicatorText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
  },
});

export default FloatingActionButton;
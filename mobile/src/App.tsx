import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import LearnScreen from './screens/LearnScreen';
import PracticeScreen from './screens/PracticeScreen';
import CultureScreen from './screens/CultureScreen';
import ProfileScreen from './screens/ProfileScreen';

// Import trigger system
import { TriggerManager } from './components/TriggerManager';

const Tab = createBottomTabNavigator();

function App() {
  const handleNavigateToLearn = () => {
    // Navigation logic will be handled by the tab navigator
  };

  const handleNavigateToPractice = () => {
    // Navigation logic will be handled by the tab navigator
  };

  const handleNavigateToCulture = () => {
    // Navigation logic will be handled by the tab navigator
  };

  const handleNavigateToProfile = () => {
    // Navigation logic will be handled by the tab navigator
  };

  const handleStartLesson = () => {
    // Start lesson logic
  };

  const handleOpenPronunciation = () => {
    // Open pronunciation practice
  };

  const handleShowProgress = () => {
    // Show progress
  };

  const handleOpenApp = () => {
    // Focus app
  };

  return (
    <View style={styles.container}>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;

              if (route.name === 'Learn') {
                iconName = focused ? 'book' : 'book-outline';
              } else if (route.name === 'Practice') {
                iconName = focused ? 'mic' : 'mic-outline';
              } else if (route.name === 'Culture') {
                iconName = focused ? 'earth' : 'earth-outline';
              } else if (route.name === 'Profile') {
                iconName = focused ? 'person' : 'person-outline';
              }

              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#4ECDC4',
            tabBarInactiveTintColor: 'gray',
            headerShown: false,
          })}
        >
          <Tab.Screen name="Learn" component={LearnScreen} />
          <Tab.Screen name="Practice" component={PracticeScreen} />
          <Tab.Screen name="Culture" component={CultureScreen} />
          <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
      </NavigationContainer>

      {/* Trigger System */}
      <TriggerManager
        onNavigateToLearn={handleNavigateToLearn}
        onNavigateToPractice={handleNavigateToPractice}
        onNavigateToCulture={handleNavigateToCulture}
        onNavigateToProfile={handleNavigateToProfile}
        onStartLesson={handleStartLesson}
        onOpenPronunciation={handleOpenPronunciation}
        onShowProgress={handleShowProgress}
        onOpenApp={handleOpenApp}
        initialFloatingButtonEnabled={true}
        initialSystemTrayEnabled={true}
        initialHotkeysEnabled={true}
        showQuickLaunch={true}
      />

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useProgress } from '../hooks/useProgress';
import { useSubscription } from '../hooks/useSubscription';
import SubscriptionModal from '../components/SubscriptionModal';
import TahitianDancer, { DancerPoses } from '../components/TahitianDancer';
import { TiarePattern, WavePattern, TapaPattern, TahitianBorder } from '../components/TahitianPatterns';

// Mock user data
const userData = {
  name: 'Utilisateur',
  email: 'user@example.com',
  level: 'Débutant',
  lessonsCompleted: 3,
  totalLessons: 20,
  streakDays: 5,
  isPremium: false,
};

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showArrow?: boolean;
  rightComponent?: React.ReactNode;
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  showArrow = true,
  rightComponent,
}) => {
  return (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}${subtitle ? `: ${subtitle}` : ''}`}
      accessibilityHint={showArrow ? "Appuyez pour accéder aux options" : "Appuyez pour activer cette option"}
    >
      <View style={styles.settingLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color="#0066CC" />
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightComponent}
        {showArrow && !rightComponent && (
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        )}
      </View>
    </TouchableOpacity>
  );
};



export default function ProfileScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [subscriptionModalVisible, setSubscriptionModalVisible] = useState(false);
  
  const {
    overallProgress,
    isLoading,
    error,
    getProgressPercentage,
    getLevelProgress,
    getStreakInfo,
    resetProgress,
    exportProgress
  } = useProgress();
  
  const {
    subscriptionStatus,
    isLoading: subscriptionLoading,
    subscribe,
    unsubscribe,
    isSubscribed,
    daysUntilExpiration,
    refreshSubscription
  } = useSubscription();

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnexion', style: 'destructive', onPress: () => console.log('Logout') },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer le compte',
      'Cette action est irréversible. Toutes vos données seront perdues.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => console.log('Delete account') },
      ]
    );
  };
  
  const handleSubscriptionComplete = async (planId: string) => {
    try {
      await refreshSubscription();
      Alert.alert(
        'Welcome to Premium!',
        'Your subscription is now active. Enjoy unlimited access to all features!',
        [{ text: 'Get Started' }]
      );
    } catch (error) {
      console.error('Error refreshing subscription:', error);
    }
  };
  
  const handleSubscribe = () => {
    setSubscriptionModalVisible(true);
  };

  const handleUnsubscribe = () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription? You will lose access to premium features.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel Subscription',
          style: 'destructive',
          onPress: async () => {
            try {
              await unsubscribe();
              Alert.alert('Subscription Cancelled', 'Your subscription has been cancelled.');
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel subscription. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleResetProgress = () => {
    Alert.alert(
      'Reset Progress',
      'Are you sure you want to reset all your learning progress? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: resetProgress },
      ]
    );
  };

  const handleExportProgress = async () => {
    try {
      const progressData = await exportProgress();
      Alert.alert('Progress Exported', 'Your progress data has been exported successfully.');
      console.log('Exported progress:', progressData);
    } catch (error) {
      Alert.alert('Export Failed', 'Failed to export progress data.');
    }
  };

  const progressPercentage = getProgressPercentage();
  const levelProgress = getLevelProgress();
  const streakInfo = getStreakInfo();

  const ProgressCard = ({ title, value, subtitle, icon: Icon, color }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: any;
    color: string;
  }) => (
    <View style={[styles.progressCard, { borderLeftColor: color }]}>
      <View style={styles.progressCardHeader}>
        <Icon size={24} color={color} />
        <Text style={styles.progressCardTitle}>{title}</Text>
      </View>
      <Text style={styles.progressCardValue}>{value}</Text>
      {subtitle && <Text style={styles.progressCardSubtitle}>{subtitle}</Text>}
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading progress...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#4ECDC4', '#44A08D', '#093637']}
        style={styles.backgroundGradient}
      >
        <ScrollView style={styles.scrollView}>
          {/* User Profile Header */}
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
            style={styles.profileHeader}
          >
            <View style={styles.headerContent}>
              <DancerPoses.Otea size="xl" className="text-pink-500" />
              <View style={styles.avatarContainer}>
                <TahitianDancer size="xl" className="text-teal-400" />
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{userData.name}</Text>
                <Text style={styles.userEmail}>{userData.email}</Text>
                <Text style={styles.userLevel}>Level: {overallProgress.level}</Text>
              </View>
              <DancerPoses.Aparima size="xl" className="text-pink-500" />
            </View>
            <View style={styles.headerDecoration}>
              <TiarePattern size="lg" color="coral" />
              <WavePattern size="md" color="ocean" />
              <TiarePattern size="lg" color="coral" />
            </View>
          </LinearGradient>

          {/* Progress Statistics */}
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
            style={styles.progressSection}
          >
            <View style={styles.sectionHeader}>
              <TapaPattern size="md" color="coral" />
              <Text style={styles.sectionTitle}>Your Progress</Text>
              <TapaPattern size="md" color="coral" />
            </View>
          
          <View style={styles.progressGrid}>
            <ProgressCard
              title="Overall Progress"
              value={`${progressPercentage}%`}
              subtitle={`${overallProgress.completedLessons}/${overallProgress.totalLessons} lessons`}
              icon={({ size, color }: any) => <Ionicons name="checkmark-circle" size={size} color={color} />}
              color="#007AFF"
            />
            
            <ProgressCard
              title="Current Level"
              value={levelProgress.current}
              subtitle={`${levelProgress.progress}% to ${levelProgress.next}`}
              icon={({ size, color }: any) => <Ionicons name="trophy" size={size} color={color} />}
              color="#FF9500"
            />
            
            <ProgressCard
              title="Study Streak"
              value={`${streakInfo.current} days`}
              subtitle={streakInfo.isActive ? 'Keep it up!' : 'Start studying today'}
              icon={({ size, color }: any) => <Ionicons name="flame" size={size} color={color} />}
              color={streakInfo.isActive ? '#FF3B30' : '#8E8E93'}
            />
            
            <ProgressCard
              title="Average Score"
              value={`${overallProgress.averageScore}%`}
              subtitle={`${Math.floor(overallProgress.totalTimeSpent / 60)} minutes studied`}
              icon={({ size, color }: any) => <Ionicons name="trophy" size={size} color={color} />}
              color="#34C759"
            />
          </View>
          </LinearGradient>

          {/* Progress Section */}
          <LinearGradient
            colors={['rgba(78, 205, 196, 0.1)', 'rgba(233, 30, 99, 0.1)']}
            style={styles.progressSection}
          >
            <View style={styles.sectionHeader}>
              <DancerPoses.Otea size="md" className="text-teal-400" />
              <Text style={styles.sectionTitle}>Votre Progression</Text>
              <DancerPoses.Aparima size="md" className="text-pink-500" />
            </View>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userData.lessonsCompleted}</Text>
              <Text style={styles.statLabel}>Leçons terminées</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userData.streakDays}</Text>
              <Text style={styles.statLabel}>Jours consécutifs</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {Math.round((userData.lessonsCompleted / userData.totalLessons) * 100)}%
              </Text>
              <Text style={styles.statLabel}>Progression</Text>
            </View>
          </View>
          </LinearGradient>

          {/* Subscription Section */}
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
            style={styles.settingsSection}
          >
            <View style={styles.sectionHeader}>
              <WavePattern size="md" color="ocean" />
              <Text style={styles.sectionTitle}>Subscription</Text>
              <WavePattern size="md" color="ocean" />
            </View>
          {subscriptionLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>Loading subscription...</Text>
            </View>
          ) : isSubscribed ? (
            <View>
              <View style={styles.subscriptionCard}>
                <View style={styles.subscriptionHeader}>
                  <Ionicons name="star" size={20} color="#FFD700" />
                  <Text style={styles.subscriptionTitle}>Premium Active</Text>
                </View>
                <Text style={styles.subscriptionPlan}>
                  {subscriptionStatus?.planName || 'Premium Plan'}
                </Text>
                {daysUntilExpiration !== null && (
                  <View style={styles.expirationInfo}>
                    <Ionicons name="calendar" size={16} color="#8E8E93" />
                    <Text style={styles.expirationText}>
                      {daysUntilExpiration > 0 
                        ? `${daysUntilExpiration} days remaining`
                        : 'Expires today'
                      }
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity style={styles.menuItem} onPress={handleUnsubscribe}>
                <Ionicons name="settings" size={20} color="#FF3B30" />
                <Text style={[styles.menuText, { color: '#FF3B30' }]}>Manage Subscription</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.menuItem} onPress={handleSubscribe}>
              <Ionicons name="star" size={20} color="#FFD700" />
              <Text style={styles.menuText}>Upgrade to Premium</Text>
              <Ionicons name="star" size={16} color="#FFD700" />
            </TouchableOpacity>
          )}
          </LinearGradient>

          {/* Settings Section */}
          <LinearGradient
            colors={['rgba(78, 205, 196, 0.1)', 'rgba(233, 30, 99, 0.1)']}
            style={styles.settingsSection}
          >
            <View style={styles.sectionHeader}>
              <TiarePattern size="md" color="coral" />
              <Text style={styles.sectionTitle}>Paramètres</Text>
              <TiarePattern size="md" color="coral" />
            </View>
          
          <SettingItem
            icon="notifications"
            title="Notifications"
            subtitle="Rappels d'apprentissage quotidiens"
            showArrow={false}
            rightComponent={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#ccc', true: '#0066CC' }}
              />
            }
          />
          
          <SettingItem
            icon="volume-high"
            title="Sons"
            subtitle="Effets sonores et audio"
            showArrow={false}
            rightComponent={
              <Switch
                value={soundEnabled}
                onValueChange={setSoundEnabled}
                trackColor={{ false: '#ccc', true: '#0066CC' }}
              />
            }
          />
          
          <SettingItem
            icon="language"
            title="Langue de l'interface"
            subtitle="Français"
            onPress={() => console.log('Language settings')}
          />
          
          <SettingItem
            icon="download"
            title="Contenu hors ligne"
            subtitle="Gérer les téléchargements"
            onPress={() => console.log('Offline content')}
          />
          </LinearGradient>

          {/* Support Section */}
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
            style={styles.settingsSection}
          >
            <View style={styles.sectionHeader}>
              <DancerPoses.Aparima size="md" className="text-pink-500" />
              <Text style={styles.sectionTitle}>Support</Text>
              <DancerPoses.Otea size="md" className="text-teal-400" />
            </View>
          
          <SettingItem
            icon="help-circle"
            title="Centre d'aide"
            onPress={() => console.log('Help center')}
          />
          
          <SettingItem
            icon="mail"
            title="Nous contacter"
            onPress={() => console.log('Contact us')}
          />
          
          <SettingItem
            icon="star"
            title="Évaluer l'application"
            onPress={() => console.log('Rate app')}
          />
          
          <SettingItem
            icon="document-text"
            title="Conditions d'utilisation"
            onPress={() => console.log('Terms of service')}
          />
          
          <SettingItem
            icon="shield-checkmark"
            title="Politique de confidentialité"
            onPress={() => console.log('Privacy policy')}
          />
          </LinearGradient>

          {/* Progress Management */}
          <LinearGradient
            colors={['rgba(78, 205, 196, 0.1)', 'rgba(233, 30, 99, 0.1)']}
            style={styles.settingsSection}
          >
            <View style={styles.sectionHeader}>
              <TapaPattern size="md" color="ocean" />
              <Text style={styles.sectionTitle}>Progress</Text>
              <TapaPattern size="md" color="coral" />
            </View>
          
          <SettingItem
            icon="download"
            title="Export Progress Data"
            onPress={handleExportProgress}
          />
          
          <SettingItem
            icon="trash"
            title="Reset Progress"
            onPress={handleResetProgress}
          />
          </LinearGradient>

          {/* Account Section */}
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
            style={styles.settingsSection}
          >
            <View style={styles.sectionHeader}>
              <WavePattern size="md" color="ocean" />
              <Text style={styles.sectionTitle}>Compte</Text>
              <WavePattern size="md" color="ocean" />
            </View>
          
          <SettingItem
            icon="log-out"
            title="Déconnexion"
            onPress={handleLogout}
          />
          
          <SettingItem
            icon="trash"
            title="Supprimer le compte"
            onPress={handleDeleteAccount}
          />
          </LinearGradient>

          <View style={styles.footer}>
            <View style={styles.footerContent}>
              <TapaPattern size="lg" color="primary" />
              <View style={styles.footerTexts}>
                <Text style={styles.footerText}>Version 1.0.0</Text>
                <Text style={styles.footerSubtext}>Immersion culturelle tahitienne</Text>
              </View>
              <WavePattern size="lg" color="primary" />
            </View>
          </View>
        </ScrollView>
      </LinearGradient>

      <SubscriptionModal
        visible={subscriptionModalVisible}
        onClose={() => setSubscriptionModalVisible(false)}
        onSubscribe={handleSubscriptionComplete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  backgroundGradient: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#8E8E93',
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(224, 224, 224, 0.3)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  headerDecoration: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 15,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
    textAlign: 'center',
  },
  userLevel: {
    fontSize: 14,
    color: '#4ECDC4',
    fontWeight: '600',
    textAlign: 'center',
  },
  progressGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  progressCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  progressCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressCardTitle: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 8,
    fontWeight: '600',
  },
  progressCardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  progressCardSubtitle: {
    fontSize: 11,
    color: '#8E8E93',
  },
  subscriptionCard: {
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  subscriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 8,
  },
  subscriptionPlan: {
    fontSize: 14,
    color: '#1D1D1F',
    marginBottom: 8,
  },
  expirationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expirationText: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  progressSection: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 10,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066CC',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e0e0e0',
  },
  premiumSection: {
    margin: 15,
  },
  premiumCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  premiumCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  premiumCardText: {
    marginLeft: 15,
  },
  premiumCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  premiumCardSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  settingsSection: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
  },
  menuText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    marginLeft: 12,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerTexts: {
    alignItems: 'center',
    marginHorizontal: 15,
  },
  footerText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  footerSubtext: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    fontStyle: 'italic',
    marginTop: 2,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  premiumBadge: {
    alignItems: 'center',
    marginBottom: 20,
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  premiumDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  featuresContainer: {
    marginBottom: 30,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  pricingContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  priceText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0066CC',
    marginBottom: 5,
  },
  priceSubtext: {
    fontSize: 14,
    color: '#666',
  },
  subscribeButton: {
    backgroundColor: '#0066CC',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  subscribeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  subscribeButtonSubtext: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  termsText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    lineHeight: 18,
  },
});
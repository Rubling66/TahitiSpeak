import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Modal,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TiarePattern, WavePattern, TapaPattern, SpearPattern } from './TahitianPatterns';
import TahitianDancer from './TahitianDancer';

interface QuickLaunchProps {
  onStartLesson?: () => void;
  onOpenPronunciation?: () => void;
  onShowProgress?: () => void;
  onOpenCulture?: () => void;
  onOpenProfile?: () => void;
  onToggleFloatingButton?: () => void;
  onToggleSystemTray?: () => void;
  floatingButtonEnabled?: boolean;
  systemTrayEnabled?: boolean;
  hotkeyEnabled?: boolean;
  onToggleHotkeys?: (enabled: boolean) => void;
}

interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  action: () => void;
  color: string;
  enabled?: boolean;
}

interface TriggerSetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  icon: React.ReactNode;
}

export const QuickLaunch: React.FC<QuickLaunchProps> = ({
  onStartLesson,
  onOpenPronunciation,
  onShowProgress,
  onOpenCulture,
  onOpenProfile,
  onToggleFloatingButton,
  onToggleSystemTray,
  floatingButtonEnabled = false,
  systemTrayEnabled = false,
  hotkeyEnabled = false,
  onToggleHotkeys
}) => {
  const [showHotkeyHelp, setShowHotkeyHelp] = useState(false);
  const [recentActions, setRecentActions] = useState<string[]>([]);

  const quickActions: QuickAction[] = [
    {
      id: 'lesson',
      title: 'Nouvelle Leçon',
      subtitle: 'Commencer à apprendre',
      icon: <TiarePattern size="md" color="coral" />,
      action: () => {
        onStartLesson?.();
        addToRecent('lesson');
      },
      color: '#FF6B6B',
      enabled: !!onStartLesson
    },
    {
      id: 'pronunciation',
      title: 'Prononciation',
      subtitle: 'Pratiquer les sons',
      icon: <WavePattern size="md" color="ocean" />,
      action: () => {
        onOpenPronunciation?.();
        addToRecent('pronunciation');
      },
      color: '#4ECDC4',
      enabled: !!onOpenPronunciation
    },
    {
      id: 'progress',
      title: 'Mes Progrès',
      subtitle: 'Voir les statistiques',
      icon: <TapaPattern size="md" color="sunset" />,
      action: () => {
        onShowProgress?.();
        addToRecent('progress');
      },
      color: '#FFE66D',
      enabled: !!onShowProgress
    },
    {
      id: 'culture',
      title: 'Culture Tahitienne',
      subtitle: 'Explorer la culture',
      icon: <SpearPattern size="md" color="primary" />,
      action: () => {
        onOpenCulture?.();
        addToRecent('culture');
      },
      color: '#A8E6CF',
      enabled: !!onOpenCulture
    },
    {
      id: 'profile',
      title: 'Mon Profil',
      subtitle: 'Paramètres utilisateur',
      icon: <TahitianDancer size="md" color="primary" />,
      action: () => {
        onOpenProfile?.();
        addToRecent('profile');
      },
      color: '#DDA0DD',
      enabled: !!onOpenProfile
    }
  ];

  const triggerSettings: TriggerSetting[] = [
    {
      id: 'floating',
      title: 'Bouton Flottant',
      description: 'Afficher un bouton d\'accès rapide',
      enabled: floatingButtonEnabled,
      onToggle: (enabled) => {
        onToggleFloatingButton?.();
      },
      icon: <TiarePattern size="sm" color="coral" />
    },
    {
      id: 'systemtray',
      title: 'Barre Système',
      description: 'Notifications et accès depuis la barre',
      enabled: systemTrayEnabled,
      onToggle: (enabled) => {
        onToggleSystemTray?.();
      },
      icon: <WavePattern size="sm" color="ocean" />
    },
    {
      id: 'hotkeys',
      title: 'Raccourcis Clavier',
      description: 'Ctrl+Shift+T pour ouvrir l\'app',
      enabled: hotkeyEnabled,
      onToggle: (enabled) => {
        onToggleHotkeys?.(enabled);
      },
      icon: <TapaPattern size="sm" color="sunset" />
    }
  ];

  const addToRecent = (actionId: string) => {
    setRecentActions(prev => {
      const filtered = prev.filter(id => id !== actionId);
      return [actionId, ...filtered].slice(0, 3);
    });
  };

  const getRecentActions = () => {
    return recentActions
      .map(id => quickActions.find(action => action.id === id))
      .filter(Boolean) as QuickAction[];
  };

  const showHotkeyReference = () => {
    setShowHotkeyHelp(true);
  };

  const hotkeyReference = [
    { keys: 'Ctrl + Shift + T', action: 'Ouvrir l\'application' },
    { keys: 'Ctrl + Shift + L', action: 'Nouvelle leçon' },
    { keys: 'Ctrl + Shift + P', action: 'Prononciation' },
    { keys: 'Ctrl + Shift + R', action: 'Voir les progrès' },
    { keys: 'Ctrl + Alt + F', action: 'Basculer bouton flottant' },
    { keys: 'Ctrl + Alt + S', action: 'Basculer barre système' }
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={['#4ECDC4', '#44A08D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TahitianDancer size="lg" color="primary" animate={true} />
        <Text style={styles.headerTitle}>Accès Rapide Tahiti</Text>
        <Text style={styles.headerSubtitle}>Lancez vos activités préférées</Text>
      </LinearGradient>

      {/* Recent Actions */}
      {getRecentActions().length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌺 Actions Récentes</Text>
          <View style={styles.recentGrid}>
            {getRecentActions().map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[styles.recentAction, { borderColor: action.color }]}
                onPress={action.action}
              >
                {action.icon}
                <Text style={styles.recentActionText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Quick Actions Grid */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🚀 Actions Rapides</Text>
        <View style={styles.actionsGrid}>
          {quickActions.filter(action => action.enabled).map((action) => (
            <TouchableOpacity
              key={action.id}
              style={[styles.actionCard, { backgroundColor: action.color + '20' }]}
              onPress={action.action}
            >
              <LinearGradient
                colors={[action.color + '40', action.color + '20']}
                style={styles.actionGradient}
              >
                <View style={styles.actionIcon}>
                  {action.icon}
                </View>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Trigger Settings */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>⚡ Déclencheurs d'Accès</Text>
          <TouchableOpacity
            style={styles.helpButton}
            onPress={showHotkeyReference}
          >
            <Text style={styles.helpButtonText}>?</Text>
          </TouchableOpacity>
        </View>
        
        {triggerSettings.map((setting) => (
          <View key={setting.id} style={styles.settingItem}>
            <View style={styles.settingIcon}>
              {setting.icon}
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>{setting.title}</Text>
              <Text style={styles.settingDescription}>{setting.description}</Text>
            </View>
            <Switch
              value={setting.enabled}
              onValueChange={setting.onToggle}
              trackColor={{ false: '#E0E0E0', true: '#4ECDC4' }}
              thumbColor={setting.enabled ? '#2E8B57' : '#F4F3F4'}
            />
          </View>
        ))}
      </View>

      {/* Hotkey Reference Modal */}
      <Modal
        visible={showHotkeyHelp}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowHotkeyHelp(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🎹 Raccourcis Clavier</Text>
            
            {hotkeyReference.map((hotkey, index) => (
              <View key={index} style={styles.hotkeyItem}>
                <Text style={styles.hotkeyKeys}>{hotkey.keys}</Text>
                <Text style={styles.hotkeyAction}>{hotkey.action}</Text>
              </View>
            ))}
            
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowHotkeyHelp(false)}
            >
              <Text style={styles.modalCloseText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 5,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E8B57',
    marginBottom: 15,
  },
  helpButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  recentGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  recentAction: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 2,
    backgroundColor: 'white',
    minWidth: 80,
  },
  recentActionText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2E8B57',
    marginTop: 5,
    textAlign: 'center',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
  },
  actionGradient: {
    padding: 15,
    alignItems: 'center',
  },
  actionIcon: {
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E8B57',
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingIcon: {
    marginRight: 15,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E8B57',
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    maxWidth: 350,
    width: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E8B57',
    textAlign: 'center',
    marginBottom: 20,
  },
  hotkeyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  hotkeyKeys: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4ECDC4',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  hotkeyAction: {
    fontSize: 12,
    color: '#666',
    flex: 1,
    textAlign: 'right',
    marginLeft: 10,
  },
  modalCloseButton: {
    backgroundColor: '#4ECDC4',
    borderRadius: 10,
    padding: 12,
    marginTop: 20,
    alignItems: 'center',
  },
  modalCloseText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default QuickLaunch;
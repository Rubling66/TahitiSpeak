import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTTS } from '../hooks/useTTS';
import { useSubscription } from '../hooks/useSubscription';
import { TTSLanguage } from '../types/tts';
import TahitianDancer from './TahitianDancer';
import { TiarePattern, WavePattern, TapaPattern } from './TahitianPatterns';
import { DancerPoses } from './TahitianDancer';

interface TestPhrase {
  id: string;
  text: string;
  language: TTSLanguage;
  translation: string;
  category: string;
}

const TEST_PHRASES: TestPhrase[] = [
  {
    id: '1',
    text: 'Bonjour, bienvenue en Polynésie',
    language: 'french',
    translation: 'Hello, welcome to Polynesia',
    category: 'Greetings',
  },
  {
    id: '2',
    text: 'Comment allez-vous ?',
    language: 'french',
    translation: 'How are you?',
    category: 'Greetings',
  },
  {
    id: '3',
    text: 'Je voudrais apprendre le français',
    language: 'french',
    translation: 'I would like to learn French',
    category: 'Learning',
  },
  {
    id: '4',
    text: 'Où est la plage ?',
    language: 'french',
    translation: 'Where is the beach?',
    category: 'Directions',
  },
  {
    id: '5',
    text: 'Hello, welcome to Polynesia',
    language: 'english',
    translation: 'Bonjour, bienvenue en Polynésie',
    category: 'Greetings',
  },
];

interface PhraseCardProps {
  phrase: TestPhrase;
  onPlay: (text: string, language: TTSLanguage) => void;
  isPlaying: boolean;
  isLoading: boolean;
}

const PhraseCard: React.FC<PhraseCardProps> = ({ phrase, onPlay, isPlaying, isLoading }) => {
  const handlePlay = () => {
    onPlay(phrase.text, phrase.language);
  };

  return (
    <LinearGradient
      colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
      style={styles.phraseCard}
    >
      <View style={styles.phraseHeader}>
        <TiarePattern size="md" color="ocean" />
        <View style={styles.phraseInfo}>
          <Text style={styles.phraseText}>{phrase.text}</Text>
          <Text style={styles.phraseTranslation}>{phrase.translation}</Text>
          <View style={styles.phraseMetadata}>
            <Text style={styles.phraseCategory}>{phrase.category}</Text>
            <Text style={styles.phraseLanguage}>
              {phrase.language === 'french' ? '🇫🇷 Français' : '🇺🇸 English'}
            </Text>
          </View>
        </View>
        <View style={styles.playButtonContainer}>
          <DancerPoses.Otea size="md" className="text-teal-400" />
          <TouchableOpacity
            style={[styles.playButton, isLoading && styles.playButtonDisabled]}
            onPress={handlePlay}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={20}
                color="#fff"
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
};

interface ServerStatusProps {
  isAvailable: boolean;
  onRefresh: () => void;
}

const ServerStatus: React.FC<ServerStatusProps> = ({ isAvailable, onRefresh }) => {
  return (
    <View style={[styles.serverStatus, isAvailable ? styles.serverOnline : styles.serverOffline]}>
      <View style={styles.serverStatusLeft}>
        <Ionicons
          name={isAvailable ? 'checkmark-circle' : 'alert-circle'}
          size={20}
          color={isAvailable ? '#4CAF50' : '#F44336'}
        />
        <Text style={styles.serverStatusText}>
          TTS Server: {isAvailable ? 'Online' : 'Offline'}
        </Text>
      </View>
      <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
        <Ionicons name="refresh" size={16} color="#666" />
      </TouchableOpacity>
    </View>
  );
};

interface TTSTestComponentProps {
  onUpgradePress?: () => void;
}

export default function TTSTestComponent({ onUpgradePress }: TTSTestComponentProps) {
  const { ttsUsage, isSubscribed } = useSubscription();
  const {
    generateAndPlay,
    stopAudio,
    isLoading,
    isPlaying,
    error,
    isServerAvailable,
    checkServerStatus,
    clearError,
    state,
  } = useTTS({
    onError: (error) => {
      Alert.alert('TTS Error', error.message);
    },
    onPlaybackComplete: () => {
      console.log('Playback completed');
    },
    onUpgradeRequired: () => {
      onUpgradePress?.();
    },
  });

  const [customText, setCustomText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<TTSLanguage>('french');
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);

  // Check server status on mount
  useEffect(() => {
    checkServerStatus();
  }, [checkServerStatus]);

  const handlePlayPhrase = async (text: string, language: TTSLanguage, phraseId?: string) => {
    try {
      if (isPlaying) {
        await stopAudio();
        setCurrentPlayingId(null);
        return;
      }

      setCurrentPlayingId(phraseId || 'custom');
      await generateAndPlay(text, language);
    } catch (err) {
      console.error('Error playing phrase:', err);
      setCurrentPlayingId(null);
    }
  };

  const handlePlayCustomText = () => {
    if (!customText.trim()) {
      Alert.alert('Error', 'Please enter some text to convert to speech');
      return;
    }
    handlePlayPhrase(customText, selectedLanguage);
  };

  const handleStopAudio = async () => {
    await stopAudio();
    setCurrentPlayingId(null);
  };

  const handleRefreshServer = async () => {
    await checkServerStatus();
  };

  return (
    <LinearGradient
      colors={['#4ECDC4', '#44A08D', '#093637']}
      style={styles.backgroundGradient}
    >
      <ScrollView style={styles.container}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <DancerPoses.Aparima size="xl" className="text-teal-400" />
            <View style={styles.headerTexts}>
              <Text style={styles.title}>TTS Test Component</Text>
              <Text style={styles.subtitle}>
                Test the free Coqui TTS integration with French and English phrases
              </Text>
            </View>
            <TahitianDancer size="xl" className="text-pink-500" />
          </View>
          <View style={styles.headerDecoration}>
            <TiarePattern size="md" color="ocean" />
            <WavePattern size="lg" color="ocean" />
            <TiarePattern size="md" color="ocean" />
          </View>
        </LinearGradient>

      {/* TTS Usage Status */}
      {!isSubscribed && ttsUsage && (
        <View style={styles.usageContainer}>
          <View style={styles.usageHeader}>
            <Ionicons name="volume-high" size={20} color="#007AFF" />
            <Text style={styles.usageTitle}>Daily TTS Usage</Text>
          </View>
          <Text style={styles.usageText}>
            {ttsUsage.used} / {ttsUsage.limit} generations used
          </Text>
          <View style={styles.usageBar}>
            <View 
              style={[
                styles.usageProgress, 
                { width: `${(ttsUsage.used / ttsUsage.limit) * 100}%` }
              ]} 
            />
          </View>
          {ttsUsage.used >= ttsUsage.limit && (
            <TouchableOpacity style={styles.upgradeButton} onPress={onUpgradePress}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.upgradeButtonText}>Upgrade for Unlimited</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <ServerStatus isAvailable={isServerAvailable} onRefresh={handleRefreshServer} />

      {error && (
        <View style={styles.errorContainer}>
          <View style={styles.errorContent}>
            <Ionicons name="alert-circle" size={20} color="#F44336" />
            <Text style={styles.errorText}>{error.message}</Text>
          </View>
          <TouchableOpacity onPress={clearError} style={styles.errorCloseButton}>
            <Ionicons name="close" size={16} color="#F44336" />
          </TouchableOpacity>
        </View>
      )}

      {!isServerAvailable && (
        <View style={styles.setupInstructions}>
          <Text style={styles.setupTitle}>Setup Required</Text>
          <Text style={styles.setupText}>
            To use free TTS, please start the Coqui TTS server:
          </Text>
          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>pip install coqui-tts</Text>
            <Text style={styles.codeText}>tts-server --model_name "tts_models/fr/mai/tacotron2-DDC" --port 5002</Text>
          </View>
        </View>
      )}

      <LinearGradient
        colors={['rgba(78, 205, 196, 0.1)', 'rgba(233, 30, 99, 0.1)']}
        style={styles.section}
      >
        <View style={styles.sectionHeader}>
          <DancerPoses.Otea size="lg" className="text-teal-400" />
          <Text style={styles.sectionTitle}>Test Phrases</Text>
          <DancerPoses.Aparima size="lg" className="text-pink-500" />
        </View>
        {TEST_PHRASES.map((phrase, index) => (
          <View key={phrase.id}>
            <PhraseCard
              phrase={phrase}
              onPlay={(text, language) => handlePlayPhrase(text, language, phrase.id)}
              isPlaying={isPlaying && currentPlayingId === phrase.id}
              isLoading={isLoading && currentPlayingId === phrase.id}
            />
            {index < TEST_PHRASES.length - 1 && (
              <View style={styles.phraseSeparator}>
                <TapaPattern size="md" color="ocean" />
              </View>
            )}
          </View>
        ))}
      </LinearGradient>

      <LinearGradient
        colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
        style={styles.section}
      >
        <View style={styles.sectionHeader}>
          <WavePattern size="lg" color="ocean" />
          <Text style={styles.sectionTitle}>Custom Text</Text>
          <TiarePattern size="lg" color="ocean" />
        </View>
        <View style={styles.customTextContainer}>
          <View style={styles.languageSelector}>
            <TouchableOpacity
              style={[
                styles.languageButton,
                selectedLanguage === 'french' && styles.languageButtonActive,
              ]}
              onPress={() => setSelectedLanguage('french')}
            >
              <Text
                style={[
                  styles.languageButtonText,
                  selectedLanguage === 'french' && styles.languageButtonTextActive,
                ]}
              >
                🇫🇷 Français
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.languageButton,
                selectedLanguage === 'english' && styles.languageButtonActive,
              ]}
              onPress={() => setSelectedLanguage('english')}
            >
              <Text
                style={[
                  styles.languageButtonText,
                  selectedLanguage === 'english' && styles.languageButtonTextActive,
                ]}
              >
                🇺🇸 English
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.textInput}
            placeholder="Enter text to convert to speech..."
            placeholderTextColor="#999"
            value={customText}
            onChangeText={setCustomText}
            multiline
            numberOfLines={3}
            accessibilityLabel={`Zone de texte pour saisir du texte en ${selectedLanguage === 'french' ? 'français' : 'anglais'}`}
            accessibilityHint="Tapez votre texte ici pour le faire lire par la synthèse vocale"
          />

          <View style={styles.customControls}>
            <TouchableOpacity
              style={[
                styles.customPlayButton,
                (!customText.trim() || !isServerAvailable) && styles.customPlayButtonDisabled,
              ]}
              onPress={handlePlayCustomText}
              disabled={!customText.trim() || !isServerAvailable || isLoading}
              accessibilityRole="button"
              accessibilityLabel={`Lire le texte personnalisé en ${selectedLanguage === 'french' ? 'français' : 'anglais'}`}
              accessibilityHint="Appuyez pour entendre la synthèse vocale de votre texte"
              accessibilityState={{ disabled: !customText.trim() || !isServerAvailable || isLoading }}
            >
              {isLoading && currentPlayingId === 'custom' ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons
                  name={isPlaying && currentPlayingId === 'custom' ? 'pause' : 'play'}
                  size={20}
                  color="#fff"
                />
              )}
              <Text style={styles.customPlayButtonText}>
                {isPlaying && currentPlayingId === 'custom' ? 'Pause' : 'Play'}
              </Text>
            </TouchableOpacity>

            {isPlaying && (
              <TouchableOpacity style={styles.stopButton} onPress={handleStopAudio}>
                <Ionicons name="stop" size={20} color="#F44336" />
                <Text style={styles.stopButtonText}>Stop</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>

      <LinearGradient
        colors={['rgba(78, 205, 196, 0.1)', 'rgba(233, 30, 99, 0.1)']}
        style={styles.statusSection}
      >
        <View style={styles.sectionHeader}>
          <TapaPattern size="lg" color="ocean" />
          <Text style={styles.sectionTitle}>Status</Text>
          <DancerPoses.Otea size="lg" className="text-pink-500" />
        </View>
        <View style={styles.statusGrid}>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>State</Text>
            <Text style={styles.statusValue}>{state}</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Server</Text>
            <Text style={[styles.statusValue, { color: isServerAvailable ? '#4CAF50' : '#F44336' }]}>
              {isServerAvailable ? 'Available' : 'Unavailable'}
            </Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Loading</Text>
            <Text style={styles.statusValue}>{isLoading ? 'Yes' : 'No'}</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Playing</Text>
            <Text style={styles.statusValue}>{isPlaying ? 'Yes' : 'No'}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <TapaPattern size="md" color="primary" />
          <WavePattern size="lg" color="primary" />
          <TiarePattern size="md" color="primary" />
        </View>
        <Text style={styles.footerText}>Immersion culturelle tahitienne</Text>
      </View>
    </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  backgroundGradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
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
  headerTexts: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 15,
  },
  headerDecoration: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  phraseSeparator: {
    alignItems: 'center',
    marginVertical: 5,
  },
  playButtonContainer: {
    alignItems: 'center',
    gap: 5,
  },
  serverStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    margin: 15,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  serverOnline: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
  },
  serverOffline: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336',
  },
  serverStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serverStatusText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  refreshButton: {
    padding: 4,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336',
    borderWidth: 1,
    borderRadius: 8,
    margin: 15,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#F44336',
    flex: 1,
  },
  errorCloseButton: {
    padding: 4,
  },
  setupInstructions: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FF9800',
    borderWidth: 1,
    borderRadius: 8,
    margin: 15,
    padding: 15,
  },
  setupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 8,
  },
  setupText: {
    fontSize: 14,
    color: '#BF360C',
    marginBottom: 10,
  },
  codeBlock: {
    backgroundColor: '#2D2D2D',
    borderRadius: 4,
    padding: 10,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#E0E0E0',
    marginBottom: 4,
  },
  section: {
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
  phraseCard: {
    borderWidth: 1,
    borderColor: 'rgba(224, 224, 224, 0.3)',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  phraseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  phraseInfo: {
    flex: 1,
    marginRight: 15,
  },
  phraseText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  phraseTranslation: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  phraseMetadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  phraseCategory: {
    fontSize: 12,
    color: '#0066CC',
    fontWeight: '500',
  },
  phraseLanguage: {
    fontSize: 12,
    color: '#666',
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0066CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonDisabled: {
    backgroundColor: '#ccc',
  },
  customTextContainer: {
    gap: 15,
  },
  languageSelector: {
    flexDirection: 'row',
    gap: 10,
  },
  languageButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  languageButtonActive: {
    backgroundColor: '#0066CC',
    borderColor: '#0066CC',
  },
  languageButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  languageButtonTextActive: {
    color: '#fff',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  customControls: {
    flexDirection: 'row',
    gap: 10,
  },
  customPlayButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0066CC',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  customPlayButtonDisabled: {
    backgroundColor: '#ccc',
  },
  customPlayButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderColor: '#F44336',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 8,
    minWidth: 80,
  },
  stopButtonText: {
    color: '#F44336',
    fontSize: 16,
    fontWeight: '500',
  },
  statusSection: {
    margin: 15,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  footerText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
    fontStyle: 'italic',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  statusItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  statusLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  usageContainer: {
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
  usageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  usageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  usageText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  usageBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  usageProgress: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD700',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  upgradeButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
});
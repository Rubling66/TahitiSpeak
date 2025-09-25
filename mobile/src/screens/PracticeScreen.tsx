import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTTS } from '../hooks/useTTS';
import TahitianDancer, { DancerPoses } from '../components/TahitianDancer';
import { WavePattern, TiarePattern, TapaPattern } from '../components/TahitianPatterns';

// Sample practice phrases
const practiceData = [
  {
    id: 1,
    french: 'Bonjour, bienvenue en Polynésie',
    tahitian: 'Ia ora na, maeva i Porinetia',
    english: 'Hello, welcome to Polynesia',
    category: 'Greetings'
  },
  {
    id: 2,
    french: 'Comment allez-vous ?',
    tahitian: 'Eaha tō oe huru ?',
    english: 'How are you?',
    category: 'Greetings'
  },
  {
    id: 3,
    french: 'Merci beaucoup',
    tahitian: 'Mauruuru roa',
    english: 'Thank you very much',
    category: 'Politeness'
  },
  {
    id: 4,
    french: 'Au revoir',
    tahitian: 'Nana',
    english: 'Goodbye',
    category: 'Greetings'
  },
  {
    id: 5,
    french: 'Je ne comprends pas',
    tahitian: 'Aita vau e hinaaro',
    english: 'I don\'t understand',
    category: 'Communication'
  },
  {
    id: 6,
    french: 'La danse traditionnelle',
    tahitian: 'Te ori maohi',
    english: 'Traditional dance',
    category: 'Dance'
  },
  {
    id: 7,
    french: 'Dansons ensemble',
    tahitian: 'Ori tatou',
    english: 'Let\'s dance together',
    category: 'Dance'
  },
  {
    id: 8,
    french: 'Le rythme du tambour',
    tahitian: 'Te tarava o te pahu',
    english: 'The rhythm of the drum',
    category: 'Dance'
  },
  {
    id: 9,
    french: 'Mouvement gracieux',
    tahitian: 'Nehenehe rahi',
    english: 'Graceful movement',
    category: 'Dance'
  },
  {
    id: 10,
    french: 'Festival de danse',
    tahitian: 'Heiva ori',
    english: 'Dance festival',
    category: 'Dance'
  },
];

interface PhraseCardProps {
  phrase: {
    id: number;
    french: string;
    tahitian: string;
    english: string;
    category: string;
  };
}

const PhraseCard: React.FC<PhraseCardProps> = ({ phrase }) => {
  const { generateAudio, isLoading, error } = useTTS();
  const [activeLanguage, setActiveLanguage] = useState<string | null>(null);

  const handlePlayAudio = async (text: string, language: 'french' | 'english') => {
    try {
      setActiveLanguage(language);
      await generateAudio(text, language);
    } catch (err) {
      Alert.alert('Erreur TTS', 'Impossible de générer l\'audio. Vérifiez que le serveur Coqui TTS est démarré.');
    } finally {
      setActiveLanguage(null);
    }
  };

  const getCategoryIcon = () => {
    switch (phrase.category) {
      case 'Dance':
        return <DancerPoses.Aparima size="md" className="text-white" />;
      case 'Greetings':
        return <TiarePattern size="md" color="primary" />;
      case 'Politeness':
        return <WavePattern size="md" color="primary" />;
      default:
        return <TapaPattern size="md" color="primary" />;
    }
  };

  const getCategoryGradient = (): string[] => {
    switch (phrase.category) {
      case 'Dance':
        return ['#FF6B6B', '#FF8E53', '#FF6B9D'];
      case 'Greetings':
        return ['#4ECDC4', '#44A08D', '#093637'];
      case 'Politeness':
        return ['#A8E6CF', '#7FCDCD', '#41B3A3'];
      default:
        return ['#FFD93D', '#6BCF7F', '#4D96FF'];
    }
  };

  return (
    <View style={styles.phraseCard}>
      <LinearGradient
        colors={getCategoryGradient()}
        style={styles.cardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.categoryBadge}>
          {getCategoryIcon()}
          <Text style={styles.categoryText}>{phrase.category}</Text>
        </View>
      
      <View style={styles.languageRow}>
          <Text style={styles.languageLabel}>Français:</Text>
          <View style={styles.textWithButton}>
            <Text style={styles.phraseText}>{phrase.french}</Text>
            <TouchableOpacity
              style={[styles.playButton, activeLanguage === 'french' && styles.playButtonActive]}
              onPress={() => handlePlayAudio(phrase.french, 'french')}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel={`Écouter la phrase en français: ${phrase.french}`}
              accessibilityHint="Appuyez pour entendre la prononciation française"
              accessibilityState={{ disabled: isLoading }}
            >
              <Ionicons 
                name={activeLanguage === 'french' ? 'stop' : 'play'} 
                size={16} 
                color={activeLanguage === 'french' ? '#333' : 'white'} 
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.languageRow}>
          <Text style={styles.languageLabel}>Tahitien:</Text>
          <Text style={[styles.phraseText, styles.tahitianText]}>{phrase.tahitian}</Text>
        </View>

        <View style={styles.languageRow}>
          <Text style={styles.languageLabel}>English:</Text>
          <View style={styles.textWithButton}>
            <Text style={styles.phraseText}>{phrase.english}</Text>
            <TouchableOpacity
              style={[styles.playButton, activeLanguage === 'english' && styles.playButtonActive]}
              onPress={() => handlePlayAudio(phrase.english, 'english')}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel={`Listen to English phrase: ${phrase.english}`}
              accessibilityHint="Tap to hear English pronunciation"
              accessibilityState={{ disabled: isLoading }}
            >
              <Ionicons 
                name={activeLanguage === 'english' ? 'stop' : 'play'} 
                size={16} 
                color={activeLanguage === 'english' ? '#333' : 'white'} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

export default function PracticeScreen() {
  const [customText, setCustomText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<'french' | 'english'>('french');
  const { generateAudio, isLoading, error } = useTTS();

  const handleCustomTTS = async () => {
    if (!customText.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir du texte à prononcer.');
      return;
    }

    try {
      await generateAudio(customText, selectedLanguage);
    } catch (err) {
      Alert.alert('Erreur TTS', 'Impossible de générer l\'audio. Vérifiez que le serveur Coqui TTS est démarré.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#4ECDC4', '#44A08D', '#093637']}
        style={styles.backgroundGradient}
      >
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <DancerPoses.Otea size="xl" className="text-white" />
              <View style={styles.headerTexts}>
                <Text style={styles.headerTitle}>Pratique de Prononciation</Text>
                <Text style={styles.headerSubtitle}>
                  Écoutez et répétez les phrases essentielles
                </Text>
              </View>
              <TiarePattern size="lg" color="primary" />
            </View>
          </View>

          {/* Custom TTS Section */}
          <View style={styles.customSection}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
              style={styles.sectionGradient}
            >
              <View style={styles.sectionHeader}>
                <WavePattern size="md" color="ocean" />
                <Text style={styles.sectionTitle}>Texte Personnalisé</Text>
                <TapaPattern size="md" color="ocean" />
              </View>
          <TextInput
            style={styles.textInput}
            placeholder="Saisissez votre texte ici..."
            value={customText}
            onChangeText={setCustomText}
            multiline
            numberOfLines={3}
          />
          
          <View style={styles.languageSelector}>
            <TouchableOpacity
              style={[
                styles.languageButton,
                selectedLanguage === 'french' && styles.languageButtonActive
              ]}
              onPress={() => setSelectedLanguage('french')}
            >
              <Text style={[
                styles.languageButtonText,
                selectedLanguage === 'french' && styles.languageButtonTextActive
              ]}>Français</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.languageButton,
                selectedLanguage === 'english' && styles.languageButtonActive
              ]}
              onPress={() => setSelectedLanguage('english')}
            >
              <Text style={[
                styles.languageButtonText,
                selectedLanguage === 'english' && styles.languageButtonTextActive
              ]}>English</Text>
            </TouchableOpacity>
          </View>

              <TouchableOpacity
                style={[styles.generateButton, isLoading && styles.generateButtonDisabled]}
                onPress={handleCustomTTS}
                disabled={isLoading}
              >
                <Ionicons 
                  name={isLoading ? 'hourglass' : 'volume-high'} 
                  size={20} 
                  color="#fff" 
                />
                <Text style={styles.generateButtonText}>
                  {isLoading ? 'Génération...' : 'Générer Audio'}
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>

          {/* Practice Phrases */}
          <View style={styles.phrasesSection}>
            <View style={styles.sectionHeader}>
              <TahitianDancer size="lg" className="text-white" />
              <Text style={styles.sectionTitleWhite}>Phrases d'Entraînement</Text>
              <DancerPoses.Aparima size="lg" className="text-white" />
            </View>
            {practiceData.map((phrase) => (
              <PhraseCard key={phrase.id} phrase={phrase} />
            ))}
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Erreur: {error.message}</Text>
            </View>
          )}

          {/* Footer with cultural elements */}
          <View style={styles.footer}>
            <TapaPattern size="md" color="primary" />
            <Text style={styles.footerText}>Pratique avec passion</Text>
            <WavePattern size="md" color="primary" />
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
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
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTexts: {
    flex: 1,
    marginHorizontal: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginTop: 5,
    opacity: 0.9,
  },
  customSection: {
    margin: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionGradient: {
    padding: 20,
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  sectionTitleWhite: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    marginBottom: 15,
  },
  languageSelector: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  languageButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#0066CC',
    borderRadius: 6,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  languageButtonActive: {
    backgroundColor: '#0066CC',
  },
  languageButtonText: {
    color: '#0066CC',
    fontWeight: '500',
  },
  languageButtonTextActive: {
    color: '#fff',
  },
  generateButton: {
    flexDirection: 'row',
    backgroundColor: '#0066CC',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateButtonDisabled: {
    backgroundColor: '#ccc',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  phrasesSection: {
    padding: 15,
  },
  phraseCard: {
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardGradient: {
    padding: 16,
    borderRadius: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
    marginLeft: 5,
  },
  languageRow: {
    marginBottom: 8,
  },
  languageLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    marginBottom: 4,
  },
  textWithButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  phraseText: {
    fontSize: 16,
    color: 'white',
    flex: 1,
  },
  tahitianText: {
    fontStyle: 'italic',
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  playButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 20,
  },
  footerText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginHorizontal: 15,
  },
  errorContainer: {
    margin: 15,
    padding: 15,
    backgroundColor: 'rgba(255, 235, 238, 0.9)',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
  },
});
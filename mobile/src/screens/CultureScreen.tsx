import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import TahitianDancer, { DancerPoses } from '../components/TahitianDancer';
import { TapaPattern, WavePattern, TiarePattern, TahitianBorder } from '../components/TahitianPatterns';

// Sample cultural content
const culturalStories = [
  {
    id: 1,
    title: 'La Légende de Maui',
    category: 'Mythologie',
    description: 'Découvrez l\'histoire du héros polynésien qui a pêché les îles.',
    content: `Maui est l'un des héros les plus célèbres de la mythologie polynésienne. Selon la légende, il a utilisé un hameçon magique pour pêcher les îles de Polynésie depuis les profondeurs de l'océan.\n\nCette histoire explique la formation géologique des îles et reste un élément central de la culture tahitienne. Maui représente l'ingéniosité et le courage du peuple polynésien.`,
    imageUrl: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Polynesian%20hero%20Maui%20fishing%20islands%20from%20ocean%20traditional%20art%20style&image_size=landscape_4_3',
    readTime: '3 min'
  },
  {
    id: 2,
    title: 'L\'Art du Tatouage Polynésien',
    category: 'Traditions',
    description: 'L\'histoire et la signification des tatouages traditionnels.',
    content: `Le tatouage polynésien, appelé "tatau" en tahitien, est bien plus qu'une décoration corporelle. Chaque motif raconte une histoire, représente un statut social ou protège spirituellement.\n\nLes motifs incluent des vagues (l'océan), des tortues (la longévité), et des requins (la protection). Cette tradition millénaire continue d'être pratiquée aujourd'hui.`,
    imageUrl: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Traditional%20Polynesian%20tattoo%20patterns%20geometric%20tribal%20art%20black%20ink&image_size=landscape_4_3',
    readTime: '4 min'
  },
  {
    id: 3,
    title: 'La Danse Tahitienne - Ori Tahiti',
    category: 'Arts',
    description: 'L\'art ancestral de la danse polynésienne et ses traditions sacrées.',
    content: `L'Ori Tahiti est bien plus qu'une simple danse - c'est l'âme de la Polynésie qui s'exprime à travers le corps. Cette tradition millénaire était autrefois interdite par les missionnaires mais a resurgi avec force au 20ème siècle.\n\n**Les Types de Danse Traditionnelle :**\n\n• **Otea** : La danse la plus énergique, caractérisée par des mouvements rapides des hanches (fa'arapu) au rythme des tambours (to'ere). Les danseurs portent des costumes végétaux traditionnels.\n\n• **Aparima** : Danse narrative où les mains racontent des histoires d'amour, de nature ou de légendes. Chaque geste a une signification précise - les vagues de l'océan, le vol des oiseaux, la croissance des plantes.\n\n• **Hivinau** : Danse de groupe où les participants forment un cercle, chantent et dansent ensemble, renforçant les liens communautaires.\n\n**Signification Culturelle :**\nChaque mouvement dans l'Ori Tahiti a une signification spirituelle. Les hanches représentent la fertilité et la vie, les bras imitent les éléments naturels, et les expressions faciales transmettent les émotions de l'histoire racontée.\n\n**Costumes Traditionnels :**\n• **More** : Jupe en fibres végétales (pandanus, cocotier)\n• **Hei** : Couronnes de fleurs de tiare, gardénia ou hibiscus\n• **Colliers de coquillages** et ornements en nacre\n• **Pareu** : Tissu traditionnel aux motifs polynésiens\n\nAujourd'hui, l'Ori Tahiti est enseigné dans les écoles et célébré lors du festival annuel Heiva i Tahiti, perpétuant cette tradition sacrée pour les générations futures.`,
    imageUrl: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Traditional%20Tahitian%20Ori%20Tahiti%20dancers%20in%20authentic%20costumes%20performing%20otea%20dance%20with%20tropical%20flowers%20and%20traditional%20drums&image_size=landscape_4_3',
    readTime: '8 min'
  },
  {
    id: 4,
    title: 'La Navigation Polynésienne',
    category: 'Histoire',
    description: 'Comment les ancêtres ont navigué à travers le Pacifique.',
    content: `Les Polynésiens étaient des navigateurs exceptionnels qui ont colonisé le Pacifique il y a plus de 1000 ans, sans instruments modernes.\n\nIls utilisaient les étoiles, les courants, les vents et même le comportement des oiseaux pour naviguer sur des milliers de kilomètres. Cette connaissance se transmettait oralement de génération en génération.`,
    imageUrl: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Polynesian%20outrigger%20canoe%20sailing%20Pacific%20ocean%20traditional%20navigation&image_size=landscape_4_3',
    readTime: '5 min'
  },
  {
    id: 5,
    title: 'Les Perles de Tahiti',
    category: 'Artisanat',
    description: 'L\'or noir des lagons polynésiens.',
    content: `Les perles de Tahiti, appelées "perles noires", sont cultivées dans les lagons cristallins de Polynésie française. Leur couleur unique varie du gris argenté au noir profond avec des reflets verts, bleus ou pourpres.\n\nCette industrie représente un savoir-faire local important et ces perles sont recherchées dans le monde entier pour leur beauté exceptionnelle.`,
    imageUrl: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Black%20Tahitian%20pearls%20in%20crystal%20clear%20lagoon%20luxury%20jewelry&image_size=landscape_4_3',
    readTime: '3 min'
  },
  {
    id: 6,
    title: 'Les Instruments de Musique Traditionnels',
    category: 'Arts',
    description: 'Les rythmes sacrés qui accompagnent la danse.',
    content: `La musique traditionnelle tahitienne est indissociable de la danse Ori Tahiti. Chaque instrument a un rôle précis dans l\'accompagnement des mouvements.\n\n**Instruments Principaux :**\n\n• **To\'ere** : Tambour fendu en bois de miro, instrument roi de l\'Ori Tahiti. Ses rythmes rapides guident les mouvements de hanches.\n\n• **Pahu** : Grand tambour en peau de requin, utilisé pour les rythmes de base et les cérémonies sacrées.\n\n• **Fa\'atete** : Tambour de bambou qui produit des sons aigus, complément mélodique du to\'ere.\n\n• **Vivo** : Flûte nasale en bambou, utilisée pour les mélodies douces et les chants d\'amour.\n\n**Rôle Spirituel :**\nCes instruments ne sont pas de simples accompagnements musicaux - ils sont considérés comme des liens avec les ancêtres et les dieux polynésiens. Le rythme du to\'ere imite le battement du cœur de la terre-mère.`,
    imageUrl: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Traditional%20Tahitian%20musical%20instruments%20toere%20drums%20pahu%20bamboo%20flute%20polynesian%20cultural%20artifacts&image_size=landscape_4_3',
    readTime: '5 min'
  },
  {
    id: 7,
    title: 'Le Festival Heiva i Tahiti',
    category: 'Traditions',
    description: 'La plus grande célébration de la culture polynésienne.',
    content: `Le Heiva i Tahiti est le festival culturel le plus important de Polynésie française, célébré chaque année en juillet. C\'est l\'événement qui perpétue et honore les traditions ancestrales.\n\n**Histoire du Festival :**\nOriginellement appelé "Tiurai" (juillet en tahitien), ce festival était une célébration de la récolte et des traditions. Interdit pendant la période coloniale, il a été restauré en 1956 et rebaptisé "Heiva" (assemblée, rassemblement).\n\n**Compétitions Principales :**\n\n• **Ori Tahiti** : Concours de danse traditionnelle avec différentes catégories (solo, groupe, enfants)\n• **Himene** : Chants polyphoniques traditionnels\n• **Artisanat** : Exposition des savoir-faire locaux\n• **Sports traditionnels** : Course de porteurs de fruits, lancer de javelot\n\n**Impact Culturel :**\nLe Heiva permet aux jeunes générations d\'apprendre et de préserver leur héritage culturel. C\'est aussi un moment de fierté identitaire où toute la Polynésie se rassemble pour célébrer ses racines.\n\nLes groupes de danse s\'entraînent toute l\'année pour cette compétition prestigieuse, créant de nouveaux spectacles qui mêlent tradition et créativité contemporaine.`,
    imageUrl: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Heiva%20Tahiti%20festival%20traditional%20dance%20competition%20colorful%20costumes%20polynesian%20celebration&image_size=landscape_4_3',
    readTime: '6 min'
  },
];

interface StoryCardProps {
  story: {
    id: number;
    title: string;
    category: string;
    description: string;
    content: string;
    imageUrl: string;
    readTime: string;
  };
  onPress: () => void;
}

const StoryCard: React.FC<StoryCardProps> = ({ story, onPress }) => {
  const getCategoryColor = (category: string): string[] => {
    switch (category) {
      case 'Mythologie': return ['#9C27B0', '#673AB7'];
      case 'Traditions': return ['#FF5722', '#E65100'];
      case 'Arts': return ['#E91E63', '#C2185B'];
      case 'Histoire': return ['#3F51B5', '#303F9F'];
      case 'Artisanat': return ['#FF9800', '#F57C00'];
      default: return ['#607D8B', '#455A64'];
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Arts': return <DancerPoses.Aparima size="sm" className="text-white" />;
      case 'Traditions': return <TiarePattern size="sm" color="primary" />;
        case 'Histoire': return <WavePattern size="sm" color="primary" />;
        default: return <TapaPattern size="sm" color="primary" />;
    }
  };

  return (
    <TouchableOpacity style={styles.storyCard} onPress={onPress}>
      <Image source={{ uri: story.imageUrl }} style={styles.storyImage} />
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
        style={styles.storyContentGradient}
      >
        <View style={styles.storyContent}>
          <View style={styles.storyHeader}>
            <LinearGradient
              colors={getCategoryColor(story.category)}
              style={styles.categoryBadge}
            >
              <View style={styles.categoryContent}>
                {getCategoryIcon(story.category)}
                <Text style={styles.categoryText}>{story.category}</Text>
              </View>
            </LinearGradient>
            <Text style={styles.readTime}>{story.readTime}</Text>
          </View>
          <Text style={styles.storyTitle}>{story.title}</Text>
          <Text style={styles.storyDescription}>{story.description}</Text>
          <View style={styles.readMoreContainer}>
            <Text style={styles.readMoreText}>Lire la suite</Text>
            <Ionicons name="chevron-forward" size={16} color="#0066CC" />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

interface StoryModalProps {
  story: {
    id: number;
    title: string;
    category: string;
    description: string;
    content: string;
    imageUrl: string;
    readTime: string;
  } | null;
  visible: boolean;
  onClose: () => void;
}

const StoryModal: React.FC<StoryModalProps> = ({ story, visible, onClose }) => {
  if (!story) return null;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Mythologie': return '#9C27B0';
      case 'Traditions': return '#FF5722';
      case 'Arts': return '#E91E63';
      case 'Histoire': return '#3F51B5';
      case 'Artisanat': return '#FF9800';
      default: return '#607D8B';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <Image source={{ uri: story.imageUrl }} style={styles.modalImage} />
          
          <View style={styles.modalTextContent}>
            <View style={styles.modalStoryHeader}>
              <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(story.category) }]}>
                <Text style={styles.categoryText}>{story.category}</Text>
              </View>
              <Text style={styles.readTime}>{story.readTime}</Text>
            </View>
            
            <Text style={styles.modalTitle}>{story.title}</Text>
            <Text style={styles.modalDescription}>{story.description}</Text>
            
            <View style={styles.divider} />
            
            <Text style={styles.modalStoryContent}>{story.content}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

export default function CultureScreen() {
  const [selectedStory, setSelectedStory] = useState<typeof culturalStories[0] | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleStoryPress = (story: typeof culturalStories[0]) => {
    setSelectedStory(story);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedStory(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#4ECDC4', '#44A08D', '#093637']}
        style={styles.backgroundGradient}
      >
        <ScrollView style={styles.scrollView}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <DancerPoses.Otea size="md" className="text-pink-500" />
              <View style={styles.headerTexts}>
                <Text style={styles.headerTitle}>Culture Polynésienne</Text>
                <Text style={styles.headerSubtitle}>
                  Découvrez les traditions et l'histoire de Tahiti
                </Text>
              </View>
              <TiarePattern size="md" color="ocean" />
            </View>
          </View>
          <TahitianBorder className="mt-4" />
        </LinearGradient>

        {/* Featured Dance Section */}
        <LinearGradient
          colors={['rgba(233, 30, 99, 0.1)', 'rgba(78, 205, 196, 0.1)']}
          style={styles.featuredSection}
        >
          <View style={styles.featuredHeader}>
            <TiarePattern size="md" color="coral" />
            <Text style={styles.featuredTitle}>Ori Tahiti - Danse Sacrée</Text>
            <TiarePattern size="md" color="coral" />
          </View>
          <View style={styles.dancerShowcase}>
            <DancerPoses.Otea size="lg" className="text-teal-400" />
            <View style={styles.danceDescription}>
              <Text style={styles.danceTitle}>Art Traditionnel</Text>
              <Text style={styles.danceSubtitle}>Mouvements sacrés transmis de génération en génération</Text>
            </View>
            <DancerPoses.Aparima size="lg" className="text-pink-500" />
          </View>
          <WavePattern size="md" color="ocean" />
        </LinearGradient>

        <View style={styles.storiesContainer}>
          {culturalStories.map((story, index) => (
            <View key={story.id}>
              <StoryCard
                story={story}
                onPress={() => handleStoryPress(story)}
              />
              {/* Add decorative patterns between cards */}
              {index < culturalStories.length - 1 && (
                <View style={styles.decorativePattern}>
                  <TapaPattern size="sm" color="primary" />
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <View style={styles.footerContent}>
            <TapaPattern size="md" color="ocean" />
            <WavePattern size="md" color="coral" />
            <Text style={styles.footerText}>
              Plus d'histoires culturelles bientôt disponibles !
            </Text>
            <Text style={styles.footerSubtext}>
              Mauruuru (Merci) de découvrir notre culture
            </Text>
            <TapaPattern size="md" color="ocean" />
            <WavePattern size="md" color="ocean" />
          </View>
          <TahitianBorder className="mt-4" />
        </View>
        </ScrollView>
      </LinearGradient>

      <StoryModal
        story={selectedStory}
        visible={modalVisible}
        onClose={handleCloseModal}
      />
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(224, 224, 224, 0.3)',
  },
  headerContent: {
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  headerTexts: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  featuredSection: {
    padding: 20,
    margin: 15,
    borderRadius: 15,
    alignItems: 'center',
  },
  featuredHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 10,
  },
  dancerShowcase: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  danceDescription: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 15,
  },
  danceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  danceSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  decorativePattern: {
    alignItems: 'center',
    marginVertical: 10,
  },
  storiesContainer: {
    padding: 15,
  },
  storyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  storyImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  storyContent: {
    padding: 16,
  },
  storyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  storyContentGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  readTime: {
    fontSize: 12,
    color: '#888',
  },
  storyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  storyDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  readMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readMoreText: {
    fontSize: 14,
    color: '#0066CC',
    fontWeight: '500',
    marginRight: 4,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerContent: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 14,
    color: 'white',
    fontStyle: 'italic',
    marginHorizontal: 10,
    textAlign: 'center',
  },
  footerSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontStyle: 'italic',
    marginTop: 5,
    textAlign: 'center',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 5,
  },
  modalContent: {
    flex: 1,
  },
  modalImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  modalTextContent: {
    padding: 20,
  },
  modalStoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  modalDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginBottom: 20,
  },
  modalStoryContent: {
    fontSize: 16,
    color: '#333',
    lineHeight: 26,
  },
});
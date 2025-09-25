import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LESSONS, Lesson } from '../data/lessons';
import TahitianDancer, { DancerPoses } from '../components/TahitianDancer';
import { TiarePattern, WavePattern, TapaPattern } from '../components/TahitianPatterns';

const LessonCard: React.FC<{ lesson: Lesson }> = ({ lesson }) => {
  const progressWidth = `${lesson.progress * 100}%`;
  
  const getCategoryIcon = () => {
    switch (lesson.category) {
      case 'dance':
        return <TahitianDancer size="sm" color="coral" animate={false} />;
      case 'culture':
        return <DancerPoses.Aparima size="sm" className="text-sunset-500" />;
      case 'nature':
        return <WavePattern size="sm" color="ocean" />;
      default:
        return <TiarePattern size="sm" color="coral" />;
    }
  };
  
  const getCategoryGradient = (): string[] => {
    switch (lesson.category) {
      case 'dance':
        return ['#FF6B6B', '#FF8E8E', '#FFB3B3'];
      case 'culture':
        return ['#4ECDC4', '#7EDDD8', '#B3E8E5'];
      case 'nature':
        return ['#45B7D1', '#74C7E3', '#A3D7F0'];
      default:
        return ['#FFA726', '#FFB74D', '#FFCC80'];
    }
  };
  
  return (
    <TouchableOpacity 
      style={styles.lessonCard}
      accessibilityRole="button"
      accessibilityLabel={`Leçon: ${lesson.title} - ${lesson.titleTahitian}. Progression: ${Math.round(lesson.progress * 100)}%. Niveau: ${lesson.level}`}
      accessibilityHint="Appuyez pour commencer cette leçon"
    >
      <LinearGradient
        colors={getCategoryGradient()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        <View style={styles.lessonHeader}>
          <View style={styles.titleContainer}>
            <View style={styles.titleRow}>
              {getCategoryIcon()}
              <View style={styles.titleTexts}>
                <Text style={styles.lessonTitle}>{lesson.title}</Text>
                <Text style={styles.lessonTahitian}>{lesson.titleTahitian}</Text>
              </View>
            </View>
          </View>
          <View style={styles.progressContainer}>
            <Text style={styles.lessonProgress}>{Math.round(lesson.progress * 100)}%</Text>
            <TapaPattern size="sm" color="primary" />
          </View>
        </View>
        <Text style={styles.lessonDescription}>{lesson.description}</Text>
        <View style={styles.lessonMeta}>
          <Text style={styles.lessonLevel}>{lesson.level}</Text>
          <Text style={styles.lessonCategory}>{lesson.category}</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${lesson.progress * 100}%` }]} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default function LearnScreen() {
  const danceCategories = LESSONS.filter(lesson => lesson.category === 'dance');
  const otherCategories = LESSONS.filter(lesson => lesson.category !== 'dance');
  
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#E8F5E8', '#F0F8F0', '#F8FBF8']}
        style={styles.backgroundGradient}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <LinearGradient
            colors={['#4ECDC4', '#44A08D', '#2E8B57']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <DancerPoses.Otea size="md" className="text-white" />
              <View style={styles.headerTexts}>
                <Text style={styles.title}>Leçons de Tahitien</Text>
                <Text style={styles.subtitle}>Apprenez le tahitien étape par étape</Text>
              </View>
              <TiarePattern size="md" color="primary" />
            </View>
            <WavePattern size="lg" color="primary" />
          </LinearGradient>
          
          {danceCategories.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <TahitianDancer size="sm" color="coral" animate={true} />
                <Text style={styles.sectionTitle}>Danse Traditionnelle - Ori Tahiti</Text>
                <TahitianDancer size="sm" color="coral" animate={true} />
              </View>
              {danceCategories.map((lesson) => (
                <LessonCard key={lesson.id} lesson={lesson} />
              ))}
            </View>
          )}
          
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <TiarePattern size="sm" color="ocean" />
              <Text style={styles.sectionTitle}>Leçons Générales</Text>
              <TiarePattern size="sm" color="ocean" />
            </View>
            {otherCategories.map((lesson) => (
              <LessonCard key={lesson.id} lesson={lesson} />
            ))}
          </View>
          
          <View style={styles.footer}>
            <TapaPattern size="md" color="ocean" />
            <Text style={styles.footerText}>{LESSONS.length} leçons disponibles</Text>
            <TapaPattern size="md" color="ocean" />
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
  header: {
    padding: 20,
    paddingBottom: 30,
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
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  section: {
    marginVertical: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 15,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E8B57',
    marginHorizontal: 15,
    textAlign: 'center',
  },
  lessonCard: {
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 16,
    borderRadius: 16,
  },
  lessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleTexts: {
    marginLeft: 12,
    flex: 1,
  },
  lessonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  lessonTahitian: {
    fontSize: 14,
    fontStyle: 'italic',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  progressContainer: {
    alignItems: 'center',
  },
  lessonProgress: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  lessonDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.95)',
    lineHeight: 20,
    marginBottom: 12,
  },
  lessonMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  lessonLevel: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
    textTransform: 'capitalize',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  lessonCategory: {
    fontSize: 12,
    color: 'white',
    textTransform: 'capitalize',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 3,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 16,
    color: '#2E8B57',
    fontWeight: '600',
    marginHorizontal: 15,
  },
});
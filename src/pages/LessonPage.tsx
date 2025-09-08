// Main lesson page with tab navigation and vocabulary table

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Pause, Volume2, BookOpen, MessageSquare, Trophy, ArrowLeft, Mic } from 'lucide-react';
import { jsonDataService } from '@/lib/data/JSONDataService';
import type { Lesson, VocabularyItem, UserProgress } from '@/types';
import { PronunciationPractice } from '../components/PronunciationPractice';

interface LessonPageProps {
  userId?: string;
}

type TabType = 'overview' | 'vocabulary' | 'exercises' | 'cultural' | 'pronunciation';

export default function LessonPage({ userId = 'guest' }: LessonPageProps) {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [audioElements, setAudioElements] = useState<Map<string, HTMLAudioElement>>(new Map());
  const [selectedVocabulary, setSelectedVocabulary] = useState<VocabularyItem | null>(null);

  // Load lesson data
  useEffect(() => {
    const loadLesson = async () => {
      if (!slug) {
        setError('Lesson not found');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Initialize data service if needed
        await jsonDataService.initialize();
        
        // Load lesson
        const lessonData = await jsonDataService.getLesson(slug);
        if (!lessonData) {
          setError('Lesson not found');
          return;
        }
        
        setLesson(lessonData);
        
        // Load user progress
        const progressData = await jsonDataService.getLessonProgress(userId, slug);
        setProgress(progressData);
        
        // Preload lesson media
        await jsonDataService.preloadLessonMedia(slug);
        
      } catch (err) {
        console.error('Failed to load lesson:', err);
        setError('Failed to load lesson');
      } finally {
        setLoading(false);
      }
    };

    loadLesson();
  }, [slug, userId]);

  // Audio playback management
  const playAudio = useCallback(async (audioId: string) => {
    try {
      // Stop currently playing audio
      if (playingAudio && audioElements.has(playingAudio)) {
        const currentAudio = audioElements.get(playingAudio)!;
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }

      // Get or create audio element
      let audio = audioElements.get(audioId);
      if (!audio) {
        // Try to get cached media asset
        const mediaAsset = await jsonDataService.getMediaAsset(audioId);
        if (mediaAsset && mediaAsset.data) {
          const audioUrl = URL.createObjectURL(mediaAsset.data);
          audio = new Audio(audioUrl);
        } else {
          // Fallback to direct URL
          audio = new Audio(`/data/media/${audioId}`);
        }
        
        audio.addEventListener('ended', () => {
          setPlayingAudio(null);
        });
        
        audio.addEventListener('error', (e) => {
          console.error('Audio playback error:', e);
          setPlayingAudio(null);
        });
        
        setAudioElements(prev => new Map(prev.set(audioId, audio!)));
      }

      setPlayingAudio(audioId);
      await audio.play();
    } catch (error) {
      console.error('Failed to play audio:', error);
      setPlayingAudio(null);
    }
  }, [playingAudio, audioElements]);

  const stopAudio = useCallback(() => {
    if (playingAudio && audioElements.has(playingAudio)) {
      const audio = audioElements.get(playingAudio)!;
      audio.pause();
      audio.currentTime = 0;
    }
    setPlayingAudio(null);
  }, [playingAudio, audioElements]);

  // Update progress
  const updateProgress = useCallback(async (updates: Partial<UserProgress>) => {
    if (!slug) return;
    
    try {
      await jsonDataService.updateLessonProgress(userId, slug, {
        ...updates,
        lastAccessedAt: new Date()
      });
      
      // Reload progress
      const updatedProgress = await jsonDataService.getLessonProgress(userId, slug);
      setProgress(updatedProgress);
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  }, [slug, userId]);

  // Mark lesson as started
  useEffect(() => {
    if (lesson && !progress?.lastAccessedAt) {
      updateProgress({ attempts: 1 });
    }
  }, [lesson, progress, updateProgress]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Lesson not found'}</p>
          <button
            onClick={() => navigate('/lessons')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Lessons
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: BookOpen },
    { id: 'vocabulary' as TabType, label: 'Vocabulary', icon: Volume2 },
    { id: 'exercises' as TabType, label: 'Exercises', icon: MessageSquare },
    { id: 'cultural' as TabType, label: 'Cultural Notes', icon: Trophy },
    { id: 'pronunciation' as TabType, label: 'Pronunciation', icon: Mic }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/lessons')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {lesson.title.en}
                </h1>
                <p className="text-sm text-gray-600">
                  {lesson.title.ty} • {lesson.level} • {lesson.durationMin} min
                </p>
              </div>
            </div>
            
            {progress && (
              <div className="text-right">
                <p className="text-sm text-gray-600">Progress</p>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress.score || 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {progress.score || 0}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Lesson Overview</h2>
              <p className="text-gray-700 leading-relaxed">{lesson.summary}</p>
              
              {lesson.tags && lesson.tags.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Topics</h3>
                  <div className="flex flex-wrap gap-2">
                    {lesson.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'vocabulary' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Vocabulary</h2>
              <p className="text-gray-600 mt-1">Click the play button to hear pronunciation</p>
            </div>
            
            {lesson.vocabulary && lesson.vocabulary.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tahitian
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        French
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        English
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Audio
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {lesson.vocabulary.map((vocab, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {vocab.tahitian}
                          </div>
                          {vocab.pronunciation && (
                            <div className="text-xs text-gray-500">
                              [{vocab.pronunciation}]
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {vocab.french}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {vocab.english}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            {vocab.audioId && (
                              <button
                                onClick={() => {
                                  if (playingAudio === vocab.audioId) {
                                    stopAudio();
                                  } else {
                                    playAudio(vocab.audioId!);
                                  }
                                }}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                disabled={!vocab.audioId}
                              >
                                {playingAudio === vocab.audioId ? (
                                  <Pause className="h-4 w-4" />
                                ) : (
                                  <Play className="h-4 w-4" />
                                )}
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedVocabulary(vocab)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Practice pronunciation"
                            >
                              <Mic className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                No vocabulary items available for this lesson.
              </div>
            )}
          </div>
        )}

        {activeTab === 'exercises' && (
          <div className="space-y-6">
            {lesson.exercises && lesson.exercises.length > 0 ? (
              lesson.exercises.map((exercise, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Exercise {index + 1}: {exercise.type}
                  </h3>
                  <p className="text-gray-700 mb-4">{exercise.instruction}</p>
                  
                  {exercise.type === 'multiple-choice' && exercise.options && (
                    <div className="space-y-2">
                      {exercise.options.map((option, optionIndex) => (
                        <button
                          key={optionIndex}
                          className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {exercise.type === 'translation' && (
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="font-medium">{exercise.prompt}</p>
                      </div>
                      <textarea
                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                        placeholder="Enter your translation..."
                      />
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-500">
                No exercises available for this lesson.
              </div>
            )}
          </div>
        )}

        {activeTab === 'cultural' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Cultural Notes</h2>
            {lesson.culturalNotes ? (
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed">{lesson.culturalNotes}</p>
              </div>
            ) : (
              <p className="text-gray-500">No cultural notes available for this lesson.</p>
            )}
          </div>
        )}

        {activeTab === 'pronunciation' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Pronunciation Practice
              </h2>
              <p className="text-gray-600 mb-6">
                Practice pronouncing vocabulary words from this lesson. Click on a word below or select from the vocabulary table.
              </p>
              
              {selectedVocabulary ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">
                      Practicing: {selectedVocabulary.tahitian}
                    </h3>
                    <button
                      onClick={() => setSelectedVocabulary(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ✕
                    </button>
                  </div>
                  <PronunciationPractice
                    targetText={selectedVocabulary.tahitian}
                    audioUrl={selectedVocabulary.audioId}
                    language="ty-PF"
                    onResult={(result) => {
                      console.log('Pronunciation result:', result);
                      // Here you could save the result to progress tracking
                    }}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {lesson.vocabulary && lesson.vocabulary.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedVocabulary(item)}
                      className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                    >
                      <div className="font-medium text-gray-900">{item.tahitian}</div>
                      <div className="text-sm text-gray-600">{item.english}</div>
                      <div className="text-xs text-gray-500 mt-1">{item.french}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
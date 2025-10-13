import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Download, Wifi, WifiOff, BookOpen, Clock, Star } from 'lucide-react';
import { offlineDB, OfflineLesson, OfflineUserProgress } from '../../services/offlineDatabase';
import { offlineManager } from '../../services/offlineManager';

interface OfflineLessonPlayerProps {
  lessonId: string;
  userId: string;
  onProgress?: (progress: OfflineUserProgress) => void;
  onComplete?: (lesson: OfflineLesson) => void;
  className?: string;
}

interface LessonProgress {
  currentStep: number;
  totalSteps: number;
  timeSpent: number;
  score: number;
  completed: boolean;
  answers: Record<string, any>;
}

interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
}

export const OfflineLessonPlayer: React.FC<OfflineLessonPlayerProps> = ({
  lessonId,
  userId,
  onProgress,
  onComplete,
  className = ''
}) => {
  const [lesson, setLesson] = useState<OfflineLesson | null>(null);
  const [progress, setProgress] = useState<LessonProgress>({
    currentStep: 0,
    totalSteps: 0,
    timeSpent: 0,
    score: 0,
    completed: false,
    answers: {}
  });
  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    muted: false
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const startTimeRef = useRef<number>(Date.now());
  const progressIntervalRef = useRef<NodeJS.Timeout>();

  // Load lesson data
  useEffect(() => {
    loadLesson();
  }, [lessonId]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Track time spent
  useEffect(() => {
    startTimeRef.current = Date.now();

    progressIntervalRef.current = setInterval(() => {
      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setProgress(prev => ({ ...prev, timeSpent: prev.timeSpent + timeSpent }));
      startTimeRef.current = Date.now();
    }, 10000); // Update every 10 seconds

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setAudioState(prev => ({ ...prev, duration: audio.duration }));
    };

    const handleTimeUpdate = () => {
      setAudioState(prev => ({ ...prev, currentTime: audio.currentTime }));
    };

    const handleEnded = () => {
      setAudioState(prev => ({ ...prev, isPlaying: false }));
    };

    const handleError = () => {
      setError('Failed to load audio content');
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [lesson]);

  const loadLesson = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load lesson from offline database
      const lessonData = await offlineDB.lessons.get(lessonId);
      if (!lessonData) {
        throw new Error('Lesson not found in offline storage');
      }

      setLesson(lessonData);

      // Load existing progress
      const existingProgress = await offlineDB.userProgress
        .where(['userId', 'lessonId'])
        .equals([userId, lessonId])
        .first();

      if (existingProgress) {
        const progressData = existingProgress.progressData || {};
        setProgress({
          currentStep: progressData.currentStep || 0,
          totalSteps: progressData.totalSteps || 0,
          timeSpent: existingProgress.timeSpent || 0,
          score: existingProgress.score || 0,
          completed: !!existingProgress.completedAt,
          answers: progressData.answers || {}
        });
      } else {
        // Initialize progress for new lesson
        const lessonContent = typeof lessonData.content === 'string' 
          ? JSON.parse(lessonData.content) 
          : lessonData.content;
        
        const totalSteps = lessonContent?.steps?.length || 1;
        setProgress(prev => ({ ...prev, totalSteps }));
      }

      // Update last accessed time
      await offlineDB.lessons.update(lessonId, {
        lastAccessed: new Date().toISOString()
      });

    } catch (err) {
      console.error('Failed to load lesson:', err);
      setError(err instanceof Error ? err.message : 'Failed to load lesson');
    } finally {
      setLoading(false);
    }
  };

  const saveProgress = useCallback(async (progressUpdate: Partial<LessonProgress>) => {
    try {
      const updatedProgress = { ...progress, ...progressUpdate };
      setProgress(updatedProgress);

      // Save to offline database
      const progressData = {
        currentStep: updatedProgress.currentStep,
        totalSteps: updatedProgress.totalSteps,
        answers: updatedProgress.answers
      };

      const progressRecord: OfflineUserProgress = {
        id: `${userId}_${lessonId}`,
        userId,
        lessonId,
        score: updatedProgress.score,
        timeSpent: updatedProgress.timeSpent,
        completedAt: updatedProgress.completed ? new Date().toISOString() : undefined,
        progressData,
        lastModified: new Date().toISOString(),
        syncStatus: 'pending',
        localVersion: 1
      };

      await offlineDB.userProgress.put(progressRecord);

      // Trigger callback
      if (onProgress) {
        onProgress(progressRecord);
      }

      // Check if lesson is completed
      if (updatedProgress.completed && lesson && onComplete) {
        onComplete(lesson);
      }

    } catch (err) {
      console.error('Failed to save progress:', err);
      setError('Failed to save progress');
    }
  }, [progress, userId, lessonId, lesson, onProgress, onComplete]);

  const toggleAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audioState.isPlaying) {
      audio.pause();
      setAudioState(prev => ({ ...prev, isPlaying: false }));
    } else {
      audio.play().catch(err => {
        console.error('Failed to play audio:', err);
        setError('Failed to play audio');
      });
      setAudioState(prev => ({ ...prev, isPlaying: true }));
    }
  };

  const restartAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = 0;
    setAudioState(prev => ({ ...prev, currentTime: 0 }));
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const newMuted = !audioState.muted;
    audio.muted = newMuted;
    setAudioState(prev => ({ ...prev, muted: newMuted }));
  };

  const handleVolumeChange = (volume: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;
    setAudioState(prev => ({ ...prev, volume }));
  };

  const handleSeek = (time: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = time;
    setAudioState(prev => ({ ...prev, currentTime: time }));
  };

  const nextStep = () => {
    if (progress.currentStep < progress.totalSteps - 1) {
      const newStep = progress.currentStep + 1;
      saveProgress({ currentStep: newStep });
    }
  };

  const previousStep = () => {
    if (progress.currentStep > 0) {
      const newStep = progress.currentStep - 1;
      saveProgress({ currentStep: newStep });
    }
  };

  const completeLesson = () => {
    const finalScore = Math.round((progress.score / progress.totalSteps) * 100);
    saveProgress({ 
      completed: true, 
      score: finalScore,
      currentStep: progress.totalSteps - 1
    });
  };

  const downloadLesson = async () => {
    if (!lesson) return;

    try {
      await offlineManager.downloadLesson(lesson.id);
      // Reload lesson to update download status
      await loadLesson();
    } catch (err) {
      console.error('Failed to download lesson:', err);
      setError('Failed to download lesson content');
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = (): number => {
    if (progress.totalSteps === 0) return 0;
    return Math.round((progress.currentStep / progress.totalSteps) * 100);
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading lesson...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <div className="text-red-600 text-sm">{error}</div>
          <button
            onClick={loadLesson}
            className="ml-4 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className={`text-center p-8 text-gray-500 ${className}`}>
        Lesson not found
      </div>
    );
  }

  const lessonContent = typeof lesson.content === 'string' 
    ? JSON.parse(lesson.content) 
    : lesson.content;

  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BookOpen className="h-6 w-6" />
            <div>
              <h1 className="text-xl font-bold">{lesson.title}</h1>
              <p className="text-blue-100 text-sm">{lesson.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <Wifi className="h-5 w-5 text-green-300" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-300" />
            )}
            {lesson.downloadStatus !== 'downloaded' && (
              <button
                onClick={downloadLesson}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                title="Download for offline use"
              >
                <Download className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span>Progress: {getProgressPercentage()}%</span>
            <span>Step {progress.currentStep + 1} of {progress.totalSteps}</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div
              className="bg-white rounded-full h-2 transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>
      </div>

      {/* Audio Player */}
      {lesson.audioUrl && (
        <div className="bg-gray-50 p-4 border-b">
          <audio ref={audioRef} src={lesson.audioUrl} preload="metadata" />
          
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleAudio}
              className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
            >
              {audioState.isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </button>

            <button
              onClick={restartAudio}
              className="p-2 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            <div className="flex-1">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>{formatTime(audioState.currentTime)}</span>
                <span>{formatTime(audioState.duration)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 cursor-pointer">
                <div
                  className="bg-blue-600 rounded-full h-2 transition-all duration-100"
                  style={{
                    width: audioState.duration > 0 
                      ? `${(audioState.currentTime / audioState.duration) * 100}%` 
                      : '0%'
                  }}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const percent = (e.clientX - rect.left) / rect.width;
                    handleSeek(percent * audioState.duration);
                  }}
                />
              </div>
            </div>

            <button
              onClick={toggleMute}
              className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              {audioState.muted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={audioState.volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-20"
            />
          </div>
        </div>
      )}

      {/* Lesson Content */}
      <div className="p-6">
        {lessonContent?.steps && lessonContent.steps[progress.currentStep] && (
          <div className="space-y-6">
            <div className="prose max-w-none">
              <h2 className="text-lg font-semibold mb-4">
                {lessonContent.steps[progress.currentStep].title}
              </h2>
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: lessonContent.steps[progress.currentStep].content 
                }}
              />
            </div>

            {/* Exercise or Interactive Content */}
            {lessonContent.steps[progress.currentStep].exercise && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-medium mb-2">Exercise</h3>
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: lessonContent.steps[progress.currentStep].exercise 
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t">
          <button
            onClick={previousStep}
            disabled={progress.currentStep === 0}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{formatTime(progress.timeSpent)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4" />
              <span>{progress.score}%</span>
            </div>
          </div>

          {progress.currentStep === progress.totalSteps - 1 ? (
            <button
              onClick={completeLesson}
              disabled={progress.completed}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {progress.completed ? 'Completed' : 'Complete Lesson'}
            </button>
          ) : (
            <button
              onClick={nextStep}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Next
            </button>
          )}
        </div>
      </div>

      {/* Transcript Toggle */}
      {lesson.audioUrl && (
        <div className="border-t p-4">
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {showTranscript ? 'Hide' : 'Show'} Transcript
          </button>
          
          {showTranscript && lessonContent?.transcript && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm">
              <div dangerouslySetInnerHTML={{ __html: lessonContent.transcript }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OfflineLessonPlayer;
// Progress tracking drawer with completion indicators

import React, { useState, useEffect } from 'react';
import { X, Trophy, Clock, Target, TrendingUp, Calendar, Award } from 'lucide-react';
import { jsonDataService } from '@/lib/data/JSONDataService';
import type { UserProgress, Lesson } from '@/types';

interface ProgressDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentLessonSlug?: string;
}

interface ProgressStats {
  totalLessons: number;
  completedLessons: number;
  totalTimeSpent: number;
  averageScore: number;
  currentStreak: number;
  lastActivity: Date | null;
}

interface LessonProgressItem {
  lesson: Lesson;
  progress: UserProgress | null;
}

export default function ProgressDrawer({ 
  isOpen, 
  onClose, 
  userId, 
  currentLessonSlug 
}: ProgressDrawerProps) {
  const [progressData, setProgressData] = useState<LessonProgressItem[]>([]);
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadProgressData();
    }
  }, [isOpen, userId]);

  const loadProgressData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Initialize data service
      await jsonDataService.initialize();

      // Load all lessons and user progress
      const [lessons, userProgress] = await Promise.all([
        jsonDataService.getLessons(),
        jsonDataService.getUserProgress(userId)
      ]);

      // Combine lessons with progress data
      const progressItems: LessonProgressItem[] = lessons.map(lesson => {
        const progress = userProgress.find(p => p.lessonSlug === lesson.slug) || null;
        return { lesson, progress };
      });

      // Sort by lesson order or last accessed
      progressItems.sort((a, b) => {
        if (a.progress?.lastAccessedAt && b.progress?.lastAccessedAt) {
          return new Date(b.progress.lastAccessedAt).getTime() - new Date(a.progress.lastAccessedAt).getTime();
        }
        if (a.progress?.lastAccessedAt) return -1;
        if (b.progress?.lastAccessedAt) return 1;
        return a.lesson.title.en.localeCompare(b.lesson.title.en);
      });

      setProgressData(progressItems);

      // Calculate stats
      const completedLessons = userProgress.filter(p => p.completedAt).length;
      const totalTimeSpent = userProgress.reduce((sum, p) => sum + (p.timeSpent || 0), 0);
      const averageScore = userProgress.length > 0 
        ? userProgress.reduce((sum, p) => sum + (p.score || 0), 0) / userProgress.length 
        : 0;
      
      // Calculate streak (simplified - consecutive days with activity)
      const sortedProgress = userProgress
        .filter(p => p.lastAccessedAt)
        .sort((a, b) => new Date(b.lastAccessedAt!).getTime() - new Date(a.lastAccessedAt!).getTime());
      
      let currentStreak = 0;
      if (sortedProgress.length > 0) {
        const today = new Date();
        const lastActivity = new Date(sortedProgress[0].lastAccessedAt!);
        const daysDiff = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff <= 1) {
          currentStreak = 1; // Simplified streak calculation
        }
      }

      setStats({
        totalLessons: lessons.length,
        completedLessons,
        totalTimeSpent,
        averageScore,
        currentStreak,
        lastActivity: sortedProgress.length > 0 ? new Date(sortedProgress[0].lastAccessedAt!) : null
      });

    } catch (err) {
      console.error('Failed to load progress data:', err);
      setError('Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return `${hours}h ${remainingMinutes}m`;
  };

  const getProgressColor = (score: number): string => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getCompletionBadge = (progress: UserProgress | null) => {
    if (!progress) {
      return <span className="text-xs text-gray-400">Not started</span>;
    }
    
    if (progress.completedAt) {
      return (
        <div className="flex items-center space-x-1">
          <Trophy className="h-3 w-3 text-yellow-500" />
          <span className="text-xs text-green-600 font-medium">Completed</span>
        </div>
      );
    }
    
    if (progress.lastAccessedAt) {
      return (
        <div className="flex items-center space-x-1">
          <Clock className="h-3 w-3 text-blue-500" />
          <span className="text-xs text-blue-600 font-medium">In Progress</span>
        </div>
      );
    }
    
    return <span className="text-xs text-gray-400">Not started</span>;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 transform transition-transform">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Your Progress</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-red-600">{error}</p>
              <button
                onClick={loadProgressData}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {/* Stats Overview */}
              {stats && (
                <div className="p-6 border-b">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Overview</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Target className="h-4 w-4 text-blue-600" />
                        <span className="text-xs text-blue-600 font-medium">Completed</span>
                      </div>
                      <p className="text-lg font-bold text-blue-900">
                        {stats.completedLessons}/{stats.totalLessons}
                      </p>
                    </div>
                    
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-xs text-green-600 font-medium">Avg Score</span>
                      </div>
                      <p className="text-lg font-bold text-green-900">
                        {Math.round(stats.averageScore)}%
                      </p>
                    </div>
                    
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-purple-600" />
                        <span className="text-xs text-purple-600 font-medium">Time Spent</span>
                      </div>
                      <p className="text-lg font-bold text-purple-900">
                        {formatTime(stats.totalTimeSpent)}
                      </p>
                    </div>
                    
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Award className="h-4 w-4 text-orange-600" />
                        <span className="text-xs text-orange-600 font-medium">Streak</span>
                      </div>
                      <p className="text-lg font-bold text-orange-900">
                        {stats.currentStreak} day{stats.currentStreak !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  
                  {stats.lastActivity && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Last activity: {stats.lastActivity.toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Lesson Progress List */}
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Lesson Progress</h3>
                
                <div className="space-y-3">
                  {progressData.map(({ lesson, progress }) => {
                    const isCurrentLesson = lesson.slug === currentLessonSlug;
                    
                    return (
                      <div
                        key={lesson.slug}
                        className={`p-4 rounded-lg border transition-colors ${
                          isCurrentLesson 
                            ? 'border-blue-200 bg-blue-50' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 text-sm">
                              {lesson.title.en}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {lesson.level} • {lesson.durationMin} min
                            </p>
                          </div>
                          
                          {getCompletionBadge(progress)}
                        </div>
                        
                        {progress && (
                          <div className="space-y-2">
                            {/* Progress Bar */}
                            <div className="flex items-center space-x-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-300 ${
                                    getProgressColor(progress.score || 0)
                                  }`}
                                  style={{ width: `${progress.score || 0}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-600 font-medium">
                                {progress.score || 0}%
                              </span>
                            </div>
                            
                            {/* Additional Info */}
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>
                                {progress.attempts || 0} attempt{(progress.attempts || 0) !== 1 ? 's' : ''}
                              </span>
                              {progress.timeSpent && (
                                <span>{formatTime(progress.timeSpent)}</span>
                              )}
                            </div>
                            
                            {progress.lastAccessedAt && (
                              <p className="text-xs text-gray-400">
                                Last accessed: {new Date(progress.lastAccessedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {progressData.length === 0 && (
                  <div className="text-center py-8">
                    <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No lessons found</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
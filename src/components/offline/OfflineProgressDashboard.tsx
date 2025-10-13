import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Trophy, Clock, BookOpen, Target, TrendingUp, Download, Wifi, WifiOff, Calendar, Star, Award } from 'lucide-react';
import { offlineDB, OfflineUserProgress, OfflineAchievement } from '../../services/offlineDatabase';
import { syncManager } from '../../services/syncManager';

interface OfflineProgressDashboardProps {
  userId: string;
  className?: string;
}

interface ProgressStats {
  totalLessons: number;
  completedLessons: number;
  totalTimeSpent: number;
  averageScore: number;
  currentStreak: number;
  totalAchievements: number;
  weeklyProgress: Array<{ day: string; lessons: number; time: number }>;
  categoryProgress: Array<{ category: string; completed: number; total: number }>;
  recentAchievements: OfflineAchievement[];
  syncStatus: {
    lastSync: Date | null;
    pendingItems: number;
    isOnline: boolean;
  };
}

interface LevelProgress {
  level: string;
  completed: number;
  total: number;
  percentage: number;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export const OfflineProgressDashboard: React.FC<OfflineProgressDashboardProps> = ({
  userId,
  className = ''
}) => {
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [levelProgress, setLevelProgress] = useState<LevelProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'year'>('week');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    loadProgressData();
  }, [userId, selectedTimeRange]);

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

  const loadProgressData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load user progress
      const userProgress = await offlineDB.userProgress
        .where('userId')
        .equals(userId)
        .toArray();

      // Load lessons for context
      const lessons = await offlineDB.lessons.toArray();
      
      // Load achievements
      const achievements = await offlineDB.userAchievements
        .where('userId')
        .equals(userId)
        .toArray();

      // Calculate basic stats
      const completedLessons = userProgress.filter(p => p.completedAt).length;
      const totalTimeSpent = userProgress.reduce((sum, p) => sum + (p.timeSpent || 0), 0);
      const averageScore = userProgress.length > 0 
        ? userProgress.reduce((sum, p) => sum + (p.score || 0), 0) / userProgress.length 
        : 0;

      // Calculate streak
      const currentStreak = calculateCurrentStreak(userProgress);

      // Calculate weekly progress
      const weeklyProgress = calculateWeeklyProgress(userProgress, selectedTimeRange);

      // Calculate category progress
      const categoryProgress = calculateCategoryProgress(userProgress, lessons);

      // Calculate level progress
      const levelProgressData = calculateLevelProgress(userProgress, lessons);
      setLevelProgress(levelProgressData);

      // Get recent achievements
      const recentAchievements = achievements
        .sort((a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime())
        .slice(0, 5);

      // Get sync status
      const lastSync = await syncManager.getLastSyncTime();
      const pendingProgress = await offlineDB.userProgress.where('syncStatus').equals('pending').count();
      const pendingNotes = await offlineDB.userNotes.where('syncStatus').equals('pending').count();
      const pendingBookmarks = await offlineDB.userBookmarks.where('syncStatus').equals('pending').count();
      const pendingAchievements = await offlineDB.userAchievements.where('syncStatus').equals('pending').count();
      const pendingItems = pendingProgress + pendingNotes + pendingBookmarks + pendingAchievements;

      setStats({
        totalLessons: lessons.length,
        completedLessons,
        totalTimeSpent,
        averageScore: Math.round(averageScore),
        currentStreak,
        totalAchievements: achievements.length,
        weeklyProgress,
        categoryProgress,
        recentAchievements,
        syncStatus: {
          lastSync,
          pendingItems,
          isOnline
        }
      });

    } catch (err) {
      console.error('Failed to load progress data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  const calculateCurrentStreak = (progress: OfflineUserProgress[]): number => {
    const completedDates = progress
      .filter(p => p.completedAt)
      .map(p => new Date(p.completedAt!).toDateString())
      .sort();

    if (completedDates.length === 0) return 0;

    const uniqueDates = [...new Set(completedDates)];
    let streak = 0;
    const today = new Date().toDateString();
    let currentDate = new Date();

    for (let i = uniqueDates.length - 1; i >= 0; i--) {
      const dateStr = currentDate.toDateString();
      if (uniqueDates.includes(dateStr)) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  };

  const calculateWeeklyProgress = (
    progress: OfflineUserProgress[], 
    timeRange: 'week' | 'month' | 'year'
  ) => {
    const now = new Date();
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365;
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();

      const dayProgress = progress.filter(p => 
        p.completedAt && new Date(p.completedAt).toDateString() === dateStr
      );

      const dayLabel = timeRange === 'week' 
        ? date.toLocaleDateString('en', { weekday: 'short' })
        : timeRange === 'month'
        ? date.getDate().toString()
        : date.toLocaleDateString('en', { month: 'short' });

      data.push({
        day: dayLabel,
        lessons: dayProgress.length,
        time: Math.round(dayProgress.reduce((sum, p) => sum + (p.timeSpent || 0), 0) / 60) // Convert to minutes
      });
    }

    return data;
  };

  const calculateCategoryProgress = (
    progress: OfflineUserProgress[], 
    lessons: any[]
  ) => {
    const categoryMap = new Map<string, { completed: number; total: number }>();

    lessons.forEach(lesson => {
      const category = lesson.category || 'Other';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { completed: 0, total: 0 });
      }
      categoryMap.get(category)!.total++;
    });

    progress.forEach(p => {
      const lesson = lessons.find(l => l.id === p.lessonId);
      if (lesson && p.completedAt) {
        const category = lesson.category || 'Other';
        if (categoryMap.has(category)) {
          categoryMap.get(category)!.completed++;
        }
      }
    });

    return Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      ...data
    }));
  };

  const calculateLevelProgress = (
    progress: OfflineUserProgress[], 
    lessons: any[]
  ): LevelProgress[] => {
    const levelMap = new Map<string, { completed: number; total: number }>();

    lessons.forEach(lesson => {
      const level = lesson.level || 'Beginner';
      if (!levelMap.has(level)) {
        levelMap.set(level, { completed: 0, total: 0 });
      }
      levelMap.get(level)!.total++;
    });

    progress.forEach(p => {
      const lesson = lessons.find(l => l.id === p.lessonId);
      if (lesson && p.completedAt) {
        const level = lesson.level || 'Beginner';
        if (levelMap.has(level)) {
          levelMap.get(level)!.completed++;
        }
      }
    });

    return Array.from(levelMap.entries()).map(([level, data]) => ({
      level,
      ...data,
      percentage: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0
    }));
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatTimeDetailed = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const getCompletionPercentage = (): number => {
    if (!stats || stats.totalLessons === 0) return 0;
    return Math.round((stats.completedLessons / stats.totalLessons) * 100);
  };

  const triggerSync = async () => {
    try {
      await syncManager.performFullSync();
      await loadProgressData(); // Reload data after sync
    } catch (err) {
      console.error('Sync failed:', err);
      setError('Failed to sync data');
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading progress data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <div className="text-red-600 text-sm">{error}</div>
          <button
            onClick={loadProgressData}
            className="ml-4 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={`text-center p-8 text-gray-500 ${className}`}>
        No progress data available
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Sync Status */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Learning Progress</h1>
            <p className="text-gray-600">Track your offline learning journey</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {isOnline ? (
                <Wifi className="h-5 w-5 text-green-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-500" />
              )}
              <span className="text-sm text-gray-600">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            
            {stats.syncStatus.pendingItems > 0 && (
              <div className="flex items-center space-x-2">
                <Download className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-orange-600">
                  {stats.syncStatus.pendingItems} pending sync
                </span>
                {isOnline && (
                  <button
                    onClick={triggerSync}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Sync Now
                  </button>
                )}
              </div>
            )}
            
            {stats.syncStatus.lastSync && (
              <div className="text-sm text-gray-500">
                Last sync: {stats.syncStatus.lastSync.toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Lessons Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.completedLessons}/{stats.totalLessons}
              </p>
              <p className="text-sm text-gray-500">{getCompletionPercentage()}% complete</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Clock className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Time Spent</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatTime(stats.totalTimeSpent)}
              </p>
              <p className="text-sm text-gray-500">Total learning time</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Average Score</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageScore}%</p>
              <p className="text-sm text-gray-500">Across all lessons</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Current Streak</p>
              <p className="text-2xl font-bold text-gray-900">{stats.currentStreak}</p>
              <p className="text-sm text-gray-500">Days in a row</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Learning Activity</h3>
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as any)}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
              <option value="year">Last year</option>
            </select>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.weeklyProgress}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'lessons' ? `${value} lessons` : `${value} minutes`,
                  name === 'lessons' ? 'Lessons' : 'Time'
                ]}
              />
              <Bar dataKey="lessons" fill="#3B82F6" name="lessons" />
              <Bar dataKey="time" fill="#10B981" name="time" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Progress */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress by Category</h3>
          
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.categoryProgress}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ category, completed, total }) => 
                  `${category}: ${completed}/${total}`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="completed"
              >
                {stats.categoryProgress.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name, props) => [
                  `${value}/${props.payload.total} completed`,
                  props.payload.category
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Level Progress */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress by Level</h3>
        
        <div className="space-y-4">
          {levelProgress.map((level, index) => (
            <div key={level.level} className="flex items-center">
              <div className="w-24 text-sm font-medium text-gray-700">
                {level.level}
              </div>
              <div className="flex-1 mx-4">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="h-3 rounded-full transition-all duration-300"
                    style={{
                      width: `${level.percentage}%`,
                      backgroundColor: COLORS[index % COLORS.length]
                    }}
                  />
                </div>
              </div>
              <div className="w-20 text-sm text-gray-600 text-right">
                {level.completed}/{level.total} ({level.percentage}%)
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Achievements */}
      {stats.recentAchievements.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center mb-4">
            <Trophy className="h-6 w-6 text-yellow-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Recent Achievements</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.recentAchievements.map((achievement) => (
              <div key={achievement.id} className="flex items-center p-3 bg-yellow-50 rounded-lg">
                <Award className="h-8 w-8 text-yellow-500 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">{achievement.achievementId}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(achievement.earnedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold">{stats.totalAchievements}</div>
            <div className="text-blue-100">Total Achievements</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold">{formatTimeDetailed(stats.totalTimeSpent)}</div>
            <div className="text-blue-100">Total Study Time</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold">{getCompletionPercentage()}%</div>
            <div className="text-blue-100">Course Completion</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfflineProgressDashboard;
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Lesson } from '../data/lessons';

export interface UserProgress {
  lessonId: string;
  completed: boolean;
  score: number; // 0-100
  timeSpent: number; // in seconds
  lastAccessed: Date;
  attempts: number;
  bestScore: number;
}

export interface OverallProgress {
  totalLessons: number;
  completedLessons: number;
  averageScore: number;
  totalTimeSpent: number;
  streak: number; // consecutive days
  lastStudyDate: Date;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface StudySession {
  date: Date;
  lessonsStudied: string[];
  timeSpent: number;
  averageScore: number;
}

class ProgressService {
  private static readonly PROGRESS_KEY = 'user_progress';
  private static readonly SESSIONS_KEY = 'study_sessions';
  private static readonly OVERALL_KEY = 'overall_progress';

  // Get progress for a specific lesson
  async getLessonProgress(lessonId: string): Promise<UserProgress | null> {
    try {
      const progressData = await AsyncStorage.getItem(ProgressService.PROGRESS_KEY);
      if (!progressData) return null;
      
      const progress: Record<string, UserProgress> = JSON.parse(progressData);
      return progress[lessonId] || null;
    } catch (error) {
      console.error('Error getting lesson progress:', error);
      return null;
    }
  }

  // Update progress for a specific lesson
  async updateLessonProgress(
    lessonId: string, 
    score: number, 
    timeSpent: number, 
    completed: boolean = false
  ): Promise<void> {
    try {
      const progressData = await AsyncStorage.getItem(ProgressService.PROGRESS_KEY);
      const progress: Record<string, UserProgress> = progressData ? JSON.parse(progressData) : {};
      
      const existingProgress = progress[lessonId];
      const now = new Date();
      
      progress[lessonId] = {
        lessonId,
        completed: completed || (existingProgress?.completed ?? false),
        score,
        timeSpent: (existingProgress?.timeSpent ?? 0) + timeSpent,
        lastAccessed: now,
        attempts: (existingProgress?.attempts ?? 0) + 1,
        bestScore: Math.max(score, existingProgress?.bestScore ?? 0)
      };
      
      await AsyncStorage.setItem(ProgressService.PROGRESS_KEY, JSON.stringify(progress));
      
      // Update overall progress
      await this.updateOverallProgress();
      
      // Record study session
      await this.recordStudySession(lessonId, timeSpent, score);
    } catch (error) {
      console.error('Error updating lesson progress:', error);
    }
  }

  // Get all lesson progress
  async getAllProgress(): Promise<Record<string, UserProgress>> {
    try {
      const progressData = await AsyncStorage.getItem(ProgressService.PROGRESS_KEY);
      return progressData ? JSON.parse(progressData) : {};
    } catch (error) {
      console.error('Error getting all progress:', error);
      return {};
    }
  }

  // Get overall progress statistics
  async getOverallProgress(): Promise<OverallProgress> {
    try {
      const overallData = await AsyncStorage.getItem(ProgressService.OVERALL_KEY);
      if (overallData) {
        const progress = JSON.parse(overallData);
        // Convert date strings back to Date objects
        progress.lastStudyDate = new Date(progress.lastStudyDate);
        return progress;
      }
      
      // Return default progress if none exists
      return {
        totalLessons: 20,
        completedLessons: 0,
        averageScore: 0,
        totalTimeSpent: 0,
        streak: 0,
        lastStudyDate: new Date(),
        level: 'Beginner'
      };
    } catch (error) {
      console.error('Error getting overall progress:', error);
      return {
        totalLessons: 20,
        completedLessons: 0,
        averageScore: 0,
        totalTimeSpent: 0,
        streak: 0,
        lastStudyDate: new Date(),
        level: 'Beginner'
      };
    }
  }

  // Update overall progress statistics
  private async updateOverallProgress(): Promise<void> {
    try {
      const allProgress = await this.getAllProgress();
      const progressArray = Object.values(allProgress);
      
      const completedLessons = progressArray.filter(p => p.completed).length;
      const totalTimeSpent = progressArray.reduce((sum, p) => sum + p.timeSpent, 0);
      const averageScore = progressArray.length > 0 
        ? progressArray.reduce((sum, p) => sum + p.bestScore, 0) / progressArray.length 
        : 0;
      
      // Calculate level based on completed lessons and average score
      let level: 'Beginner' | 'Intermediate' | 'Advanced' = 'Beginner';
      if (completedLessons >= 15 && averageScore >= 80) {
        level = 'Advanced';
      } else if (completedLessons >= 8 && averageScore >= 60) {
        level = 'Intermediate';
      }
      
      // Calculate streak
      const streak = await this.calculateStreak();
      
      const overallProgress: OverallProgress = {
        totalLessons: 20,
        completedLessons,
        averageScore: Math.round(averageScore),
        totalTimeSpent,
        streak,
        lastStudyDate: new Date(),
        level
      };
      
      await AsyncStorage.setItem(ProgressService.OVERALL_KEY, JSON.stringify(overallProgress));
    } catch (error) {
      console.error('Error updating overall progress:', error);
    }
  }

  // Record a study session
  private async recordStudySession(
    lessonId: string, 
    timeSpent: number, 
    score: number
  ): Promise<void> {
    try {
      const sessionsData = await AsyncStorage.getItem(ProgressService.SESSIONS_KEY);
      const sessions: StudySession[] = sessionsData ? JSON.parse(sessionsData) : [];
      
      const today = new Date();
      const todayStr = today.toDateString();
      
      // Find or create today's session
      let todaySession = sessions.find(s => new Date(s.date).toDateString() === todayStr);
      
      if (todaySession) {
        // Update existing session
        if (!todaySession.lessonsStudied.includes(lessonId)) {
          todaySession.lessonsStudied.push(lessonId);
        }
        todaySession.timeSpent += timeSpent;
        todaySession.averageScore = (
          (todaySession.averageScore * (todaySession.lessonsStudied.length - 1) + score) / 
          todaySession.lessonsStudied.length
        );
      } else {
        // Create new session
        todaySession = {
          date: today,
          lessonsStudied: [lessonId],
          timeSpent,
          averageScore: score
        };
        sessions.push(todaySession);
      }
      
      // Keep only last 30 days of sessions
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentSessions = sessions.filter(s => new Date(s.date) >= thirtyDaysAgo);
      
      await AsyncStorage.setItem(ProgressService.SESSIONS_KEY, JSON.stringify(recentSessions));
    } catch (error) {
      console.error('Error recording study session:', error);
    }
  }

  // Calculate current study streak
  private async calculateStreak(): Promise<number> {
    try {
      const sessionsData = await AsyncStorage.getItem(ProgressService.SESSIONS_KEY);
      if (!sessionsData) return 0;
      
      const sessions: StudySession[] = JSON.parse(sessionsData);
      if (sessions.length === 0) return 0;
      
      // Sort sessions by date (newest first)
      sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      let streak = 0;
      const today = new Date();
      
      for (let i = 0; i < sessions.length; i++) {
        const sessionDate = new Date(sessions[i].date);
        const daysDiff = Math.floor((today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === streak) {
          streak++;
        } else if (daysDiff > streak) {
          break;
        }
      }
      
      return streak;
    } catch (error) {
      console.error('Error calculating streak:', error);
      return 0;
    }
  }

  // Get study sessions for analytics
  async getStudySessions(days: number = 7): Promise<StudySession[]> {
    try {
      const sessionsData = await AsyncStorage.getItem(ProgressService.SESSIONS_KEY);
      if (!sessionsData) return [];
      
      const sessions: StudySession[] = JSON.parse(sessionsData);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      return sessions
        .filter(s => new Date(s.date) >= cutoffDate)
        .map(s => ({ ...s, date: new Date(s.date) }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());
    } catch (error) {
      console.error('Error getting study sessions:', error);
      return [];
    }
  }

  // Reset all progress (for testing or user request)
  async resetProgress(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([ProgressService.PROGRESS_KEY, ProgressService.SESSIONS_KEY, ProgressService.OVERALL_KEY]);
    } catch (error) {
      console.error('Error resetting progress:', error);
    }
  }

  // Export progress data
  async exportProgress(): Promise<string> {
    try {
      const allProgress = await this.getAllProgress();
      const overallProgress = await this.getOverallProgress();
      const sessions = await this.getStudySessions(30);
      
      return JSON.stringify({
        lessonProgress: allProgress,
        overallProgress,
        studySessions: sessions,
        exportDate: new Date().toISOString()
      }, null, 2);
    } catch (error) {
      console.error('Error exporting progress:', error);
      return '{}';
    }
  }
}

export const progressService = new ProgressService();
export default progressService;
import { EmailService } from '../EmailService';
import { supabase } from '../../../api/config/supabase';
import { isMaintenanceMode } from '../../utils/maintenance';

export interface AutomationTrigger {
  id: string;
  name: string;
  event: string;
  conditions: Record<string, any>;
  templateName: string;
  delay?: number; // in minutes
  isActive: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

export interface AutomationRule {
  trigger: AutomationTrigger;
  templateData: (eventData: any) => Record<string, any>;
  shouldSend: (eventData: any, userPreferences: any) => boolean;
}

export class EmailAutomation {
  private emailService: EmailService;
  private rules: Map<string, AutomationRule> = new Map();

  constructor() {
    this.emailService = new EmailService();
    this.initializeRules();
  }

  private initializeRules() {
    // Welcome email automation
    this.addRule({
      trigger: {
        id: 'welcome-email',
        name: 'Welcome Email',
        event: 'user.registered',
        conditions: {},
        templateName: 'welcome',
        delay: 0,
        isActive: true,
        priority: 'high'
      },
      templateData: (eventData) => ({
        userName: eventData.user.name || eventData.user.email.split('@')[0],
        userEmail: eventData.user.email,
        loginUrl: `${process.env.FRONTEND_URL}/login`,
        supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com'
      }),
      shouldSend: (eventData, preferences) => preferences?.welcomeEmails !== false
    });

    // Lesson reminder automation
    this.addRule({
      trigger: {
        id: 'lesson-reminder',
        name: 'Daily Lesson Reminder',
        event: 'lesson.reminder',
        conditions: { hasActiveStreak: true },
        templateName: 'lessonReminder',
        delay: 0,
        isActive: true,
        priority: 'normal'
      },
      templateData: (eventData) => ({
        userName: eventData.user.name || eventData.user.email.split('@')[0],
        streakDays: eventData.streakDays || 0,
        nextLessonTitle: eventData.nextLesson?.title || 'Continue Learning',
        nextLessonUrl: eventData.nextLesson?.url || `${process.env.FRONTEND_URL}/lessons`,
        continueUrl: `${process.env.FRONTEND_URL}/lessons`
      }),
      shouldSend: (eventData, preferences) => 
        preferences?.lessonReminders !== false && 
        preferences?.frequency !== 'never'
    });

    // Achievement unlocked automation
    this.addRule({
      trigger: {
        id: 'achievement-unlocked',
        name: 'Achievement Unlocked',
        event: 'achievement.unlocked',
        conditions: {},
        templateName: 'achievementUnlocked',
        delay: 5, // 5 minute delay to batch multiple achievements
        isActive: true,
        priority: 'normal'
      },
      templateData: (eventData) => ({
        userName: eventData.user.name || eventData.user.email.split('@')[0],
        achievementName: eventData.achievement.name,
        achievementDescription: eventData.achievement.description,
        achievementIcon: eventData.achievement.icon || '🏆',
        pointsEarned: eventData.achievement.points || 0,
        totalPoints: eventData.user.totalPoints || 0,
        totalAchievements: eventData.user.totalAchievements || 0,
        streakDays: eventData.user.streakDays || 0,
        profileUrl: `${process.env.FRONTEND_URL}/profile`
      }),
      shouldSend: (eventData, preferences) => preferences?.achievementNotifications !== false
    });

    // Progress update automation
    this.addRule({
      trigger: {
        id: 'progress-update',
        name: 'Weekly Progress Update',
        event: 'progress.weekly',
        conditions: { hasActivity: true },
        templateName: 'progressUpdate',
        delay: 0,
        isActive: true,
        priority: 'low'
      },
      templateData: (eventData) => ({
        userName: eventData.user.name || eventData.user.email.split('@')[0],
        weeklyStats: eventData.stats,
        lessonsCompleted: eventData.stats.lessonsCompleted || 0,
        timeSpent: eventData.stats.timeSpent || 0,
        streakDays: eventData.stats.streakDays || 0,
        pointsEarned: eventData.stats.pointsEarned || 0,
        nextGoals: eventData.nextGoals || [],
        dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`
      }),
      shouldSend: (eventData, preferences) => 
        preferences?.progressUpdates !== false && 
        preferences?.frequency !== 'never'
    });

    // Weekly digest automation
    this.addRule({
      trigger: {
        id: 'weekly-digest',
        name: 'Weekly Digest',
        event: 'digest.weekly',
        conditions: { isActive: true },
        templateName: 'weeklyDigest',
        delay: 0,
        isActive: true,
        priority: 'low'
      },
      templateData: (eventData) => ({
        userName: eventData.user.name || eventData.user.email.split('@')[0],
        weeklyHighlights: eventData.highlights || [],
        communityStats: eventData.communityStats || {},
        recommendedLessons: eventData.recommendations || [],
        upcomingFeatures: eventData.upcomingFeatures || [],
        unsubscribeUrl: `${process.env.FRONTEND_URL}/email/unsubscribe?token=${eventData.unsubscribeToken}`
      }),
      shouldSend: (eventData, preferences) => 
        preferences?.weeklyDigest !== false && 
        preferences?.frequency !== 'never'
    });

    // Password reset automation
    this.addRule({
      trigger: {
        id: 'password-reset',
        name: 'Password Reset',
        event: 'auth.password_reset',
        conditions: {},
        templateName: 'passwordReset',
        delay: 0,
        isActive: true,
        priority: 'urgent'
      },
      templateData: (eventData) => ({
        userName: eventData.user.name || eventData.user.email.split('@')[0],
        resetUrl: eventData.resetUrl,
        expiresIn: eventData.expiresIn || '1 hour',
        supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com'
      }),
      shouldSend: () => true // Always send password reset emails
    });
  }

  addRule(rule: AutomationRule) {
    this.rules.set(rule.trigger.id, rule);
  }

  removeRule(triggerId: string) {
    this.rules.delete(triggerId);
  }

  async processEvent(eventType: string, eventData: any) {
    if (isMaintenanceMode()) {
      if (eventData?.user?.id) {
        await this.logAutomationExecution(eventType, eventData.user.id, 'skipped', 'maintenance');
      }
      return;
    }
    const matchingRules = Array.from(this.rules.values()).filter(
      rule => rule.trigger.event === eventType && rule.trigger.isActive
    );

    for (const rule of matchingRules) {
      try {
        // Check if conditions are met
        if (!this.checkConditions(rule.trigger.conditions, eventData)) {
          continue;
        }

        // Get user preferences
        const userPreferences = await this.emailService.getUserPreferences(eventData.user.id);
        
        // Check if we should send the email
        if (!rule.shouldSend(eventData, userPreferences)) {
          continue;
        }

        // Generate template data
        const templateData = rule.templateData(eventData);

        // Send email (with delay if specified)
        if (rule.trigger.delay && rule.trigger.delay > 0) {
          const scheduledFor = new Date(Date.now() + rule.trigger.delay * 60 * 1000);
          await this.emailService.sendEmail(
            rule.trigger.templateName,
            eventData.user.email,
            templateData,
            {
              scheduledFor,
              priority: rule.trigger.priority
            }
          );
        } else {
          await this.emailService.sendEmail(
            rule.trigger.templateName,
            eventData.user.email,
            templateData,
            {
              priority: rule.trigger.priority
            }
          );
        }

        // Log the automation execution
        await this.logAutomationExecution(rule.trigger.id, eventData.user.id, 'sent');
      } catch (error) {
        console.error(`Email automation error for rule ${rule.trigger.id}:`, error);
        await this.logAutomationExecution(rule.trigger.id, eventData.user.id, 'failed', error.message);
      }
    }
  }

  private checkConditions(conditions: Record<string, any>, eventData: any): boolean {
    for (const [key, expectedValue] of Object.entries(conditions)) {
      const actualValue = this.getNestedValue(eventData, key);
      if (actualValue !== expectedValue) {
        return false;
      }
    }
    return true;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private async logAutomationExecution(
    triggerId: string, 
    userId: string, 
    status: 'sent' | 'failed' | 'skipped',
    errorMessage?: string
  ) {
    try {
      await supabase
        .from('email_automation_logs')
        .insert({
          trigger_id: triggerId,
          user_id: userId,
          status,
          error_message: errorMessage,
          executed_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log automation execution:', error);
    }
  }

  // Convenience methods for common automation triggers
  async sendWelcomeEmail(user: any) {
    await this.processEvent('user.registered', { user });
  }

  async sendLessonReminder(user: any, lessonData: any) {
    await this.processEvent('lesson.reminder', { 
      user, 
      streakDays: lessonData.streakDays,
      nextLesson: lessonData.nextLesson
    });
  }

  async sendAchievementNotification(user: any, achievement: any) {
    await this.processEvent('achievement.unlocked', { 
      user, 
      achievement,
      user: {
        ...user,
        totalPoints: user.totalPoints,
        totalAchievements: user.totalAchievements,
        streakDays: user.streakDays
      }
    });
  }

  async sendProgressUpdate(user: any, stats: any) {
    await this.processEvent('progress.weekly', { 
      user, 
      stats,
      nextGoals: stats.nextGoals || []
    });
  }

  async sendWeeklyDigest(user: any, digestData: any) {
    await this.processEvent('digest.weekly', { 
      user, 
      highlights: digestData.highlights,
      communityStats: digestData.communityStats,
      recommendations: digestData.recommendations,
      upcomingFeatures: digestData.upcomingFeatures,
      unsubscribeToken: digestData.unsubscribeToken
    });
  }

  async sendPasswordReset(user: any, resetData: any) {
    await this.processEvent('auth.password_reset', { 
      user, 
      resetUrl: resetData.resetUrl,
      expiresIn: resetData.expiresIn
    });
  }

  // Batch processing for scheduled automations
  async processDailyReminders() {
    try {
      if (isMaintenanceMode()) return;
      // Get users who should receive daily reminders
      const { data: users, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          email_preferences!inner(*)
        `)
        .eq('email_preferences.lesson_reminders', true)
        .eq('email_preferences.frequency', 'daily')
        .not('email_preferences.is_unsubscribed', 'eq', true);

      if (error) {
        throw error;
      }

      for (const user of users || []) {
        // Get user's learning progress
        const { data: progress } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (progress && progress.streak_days > 0) {
          await this.sendLessonReminder(user, {
            streakDays: progress.streak_days,
            nextLesson: {
              title: 'Continue Your Learning Journey',
              url: `${process.env.FRONTEND_URL}/lessons`
            }
          });
        }
      }
    } catch (error) {
      console.error('Failed to process daily reminders:', error);
    }
  }

  async processWeeklyDigests() {
    try {
      if (isMaintenanceMode()) return;
      // Get users who should receive weekly digests
      const { data: users, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          email_preferences!inner(*)
        `)
        .eq('email_preferences.weekly_digest', true)
        .in('email_preferences.frequency', ['weekly', 'daily'])
        .not('email_preferences.is_unsubscribed', 'eq', true);

      if (error) {
        throw error;
      }

      for (const user of users || []) {
        // Generate digest data for the user
        const digestData = await this.generateWeeklyDigestData(user.id);
        
        await this.sendWeeklyDigest(user, digestData);
      }
    } catch (error) {
      console.error('Failed to process weekly digests:', error);
    }
  }

  private async generateWeeklyDigestData(userId: string) {
    // This would typically aggregate user data from the past week
    // For now, return mock data
    return {
      highlights: [
        'Completed 5 lessons this week',
        'Maintained a 7-day streak',
        'Earned 150 points'
      ],
      communityStats: {
        totalLearners: 1250,
        lessonsCompleted: 15000,
        averageStreak: 12
      },
      recommendations: [
        {
          title: 'Advanced Grammar',
          description: 'Take your skills to the next level',
          url: `${process.env.FRONTEND_URL}/lessons/advanced-grammar`
        }
      ],
      upcomingFeatures: [
        'New pronunciation exercises',
        'Community challenges',
        'Mobile app improvements'
      ],
      unsubscribeToken: 'mock-unsubscribe-token'
    };
  }

  // Get automation statistics
  async getAutomationStats(timeRange: string = '30d') {
    try {
      const startDate = new Date();
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      startDate.setDate(startDate.getDate() - days);

      const { data: logs, error } = await supabase
        .from('email_automation_logs')
        .select('trigger_id, status, executed_at')
        .gte('executed_at', startDate.toISOString());

      if (error) {
        throw error;
      }

      const stats = {
        totalExecutions: logs?.length || 0,
        successfulExecutions: logs?.filter(log => log.status === 'sent').length || 0,
        failedExecutions: logs?.filter(log => log.status === 'failed').length || 0,
        skippedExecutions: logs?.filter(log => log.status === 'skipped').length || 0,
        byTrigger: {} as Record<string, { sent: number; failed: number; skipped: number }>
      };

      // Group by trigger
      logs?.forEach(log => {
        if (!stats.byTrigger[log.trigger_id]) {
          stats.byTrigger[log.trigger_id] = { sent: 0, failed: 0, skipped: 0 };
        }
        stats.byTrigger[log.trigger_id][log.status]++;
      });

      return stats;
    } catch (error) {
      console.error('Failed to get automation stats:', error);
      return {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        skippedExecutions: 0,
        byTrigger: {}
      };
    }
  }

  // Get active automation rules
  getActiveRules(): AutomationTrigger[] {
    return Array.from(this.rules.values())
      .map(rule => rule.trigger)
      .filter(trigger => trigger.isActive);
  }

  // Update rule status
  updateRuleStatus(triggerId: string, isActive: boolean) {
    const rule = this.rules.get(triggerId);
    if (rule) {
      rule.trigger.isActive = isActive;
    }
  }
}

// Export singleton instance
export const emailAutomation = new EmailAutomation();

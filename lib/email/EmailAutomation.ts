import { emailService } from './EmailService';

export interface AutomationTrigger {
  id: string;
  name: string;
  event: string;
  conditions?: Record<string, any>;
  delay?: number; // in minutes
  active: boolean;
}

export interface AutomationAction {
  id: string;
  triggerId: string;
  type: 'send_email' | 'add_tag' | 'update_user' | 'send_notification';
  config: Record<string, any>;
  order: number;
}

export interface EmailCampaign {
  id: string;
  name: string;
  type: 'welcome_series' | 'engagement' | 'retention' | 'promotional';
  status: 'draft' | 'active' | 'paused' | 'completed';
  emails: Array<{
    id: string;
    subject: string;
    templateId?: string;
    delay: number; // days after trigger
    conditions?: Record<string, any>;
  }>;
  triggers: AutomationTrigger[];
  analytics: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    unsubscribed: number;
  };
}

class EmailAutomation {
  private campaigns: Map<string, EmailCampaign> = new Map();
  private triggers: Map<string, AutomationTrigger> = new Map();
  private actions: Map<string, AutomationAction[]> = new Map();

  constructor() {
    this.initializeDefaultCampaigns();
  }

  private initializeDefaultCampaigns(): void {
    // Welcome Series Campaign
    const welcomeCampaign: EmailCampaign = {
      id: 'welcome_series',
      name: 'Welcome Series',
      type: 'welcome_series',
      status: 'active',
      emails: [
        {
          id: 'welcome_1',
          subject: 'Welcome to TahitiSpeak! 🌺',
          delay: 0,
        },
        {
          id: 'welcome_2',
          subject: 'Your First Tahitian Lesson Awaits',
          delay: 1,
          conditions: { hasCompletedLesson: false },
        },
        {
          id: 'welcome_3',
          subject: 'Discover Tahitian Culture Through Stories',
          delay: 3,
          conditions: { hasReadStory: false },
        },
        {
          id: 'welcome_4',
          subject: 'Tips for Effective Language Learning',
          delay: 7,
        },
      ],
      triggers: [
        {
          id: 'user_registered',
          name: 'User Registration',
          event: 'user.registered',
          active: true,
        },
      ],
      analytics: {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        unsubscribed: 0,
      },
    };

    // Engagement Campaign
    const engagementCampaign: EmailCampaign = {
      id: 'engagement_series',
      name: 'Engagement Series',
      type: 'engagement',
      status: 'active',
      emails: [
        {
          id: 'lesson_reminder',
          subject: 'Continue Your Tahitian Journey',
          delay: 0,
        },
        {
          id: 'streak_motivation',
          subject: 'Keep Your Learning Streak Alive! 🔥',
          delay: 0,
        },
        {
          id: 'achievement_celebration',
          subject: 'Congratulations on Your Achievement! 🎉',
          delay: 0,
        },
      ],
      triggers: [
        {
          id: 'lesson_completed',
          name: 'Lesson Completed',
          event: 'lesson.completed',
          active: true,
        },
        {
          id: 'inactive_user',
          name: 'User Inactive',
          event: 'user.inactive',
          conditions: { daysInactive: 3 },
          active: true,
        },
        {
          id: 'streak_achieved',
          name: 'Streak Achieved',
          event: 'streak.achieved',
          conditions: { streakDays: [7, 14, 30, 60, 100] },
          active: true,
        },
      ],
      analytics: {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        unsubscribed: 0,
      },
    };

    // Retention Campaign
    const retentionCampaign: EmailCampaign = {
      id: 'retention_series',
      name: 'Retention Series',
      type: 'retention',
      status: 'active',
      emails: [
        {
          id: 'win_back_1',
          subject: 'We Miss You! Come Back to Your Tahitian Journey',
          delay: 0,
        },
        {
          id: 'win_back_2',
          subject: 'Special Offer: Premium Access for Returning Learners',
          delay: 7,
        },
        {
          id: 'win_back_3',
          subject: 'Last Chance: Your Tahitian Progress is Waiting',
          delay: 14,
        },
      ],
      triggers: [
        {
          id: 'user_churned',
          name: 'User Churned',
          event: 'user.churned',
          conditions: { daysInactive: 14 },
          active: true,
        },
      ],
      analytics: {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        unsubscribed: 0,
      },
    };

    this.campaigns.set(welcomeCampaign.id, welcomeCampaign);
    this.campaigns.set(engagementCampaign.id, engagementCampaign);
    this.campaigns.set(retentionCampaign.id, retentionCampaign);
  }

  async triggerEvent(event: string, userId: string, data: Record<string, any> = {}): Promise<void> {
    try {
      // Find all active triggers for this event
      const activeTriggers = Array.from(this.triggers.values()).filter(
        trigger => trigger.event === event && trigger.active
      );

      for (const trigger of activeTriggers) {
        // Check if conditions are met
        if (this.checkConditions(trigger.conditions, data)) {
          await this.executeTrigger(trigger, userId, data);
        }
      }

      // Also check campaign triggers
      for (const campaign of this.campaigns.values()) {
        if (campaign.status !== 'active') continue;

        for (const trigger of campaign.triggers) {
          if (trigger.event === event && trigger.active) {
            if (this.checkConditions(trigger.conditions, data)) {
              await this.executeCampaignTrigger(campaign, trigger, userId, data);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to trigger email automation:', error);
    }
  }

  private checkConditions(conditions: Record<string, any> | undefined, data: Record<string, any>): boolean {
    if (!conditions) return true;

    for (const [key, value] of Object.entries(conditions)) {
      if (Array.isArray(value)) {
        if (!value.includes(data[key])) return false;
      } else if (data[key] !== value) {
        return false;
      }
    }

    return true;
  }

  private async executeTrigger(trigger: AutomationTrigger, userId: string, data: Record<string, any>): Promise<void> {
    const actions = this.actions.get(trigger.id) || [];
    
    for (const action of actions.sort((a, b) => a.order - b.order)) {
      await this.executeAction(action, userId, data);
    }
  }

  private async executeCampaignTrigger(
    campaign: EmailCampaign,
    trigger: AutomationTrigger,
    userId: string,
    data: Record<string, any>
  ): Promise<void> {
    try {
      // Schedule emails in the campaign
      for (const email of campaign.emails) {
        // Check email conditions
        if (email.conditions && !this.checkConditions(email.conditions, data)) {
          continue;
        }

        // Schedule email with delay
        const delayMs = email.delay * 24 * 60 * 60 * 1000; // Convert days to milliseconds
        
        if (delayMs === 0) {
          await this.sendCampaignEmail(campaign, email, userId, data);
        } else {
          setTimeout(async () => {
            await this.sendCampaignEmail(campaign, email, userId, data);
          }, delayMs);
        }
      }
    } catch (error) {
      console.error('Failed to execute campaign trigger:', error);
    }
  }

  private async sendCampaignEmail(
    campaign: EmailCampaign,
    email: any,
    userId: string,
    data: Record<string, any>
  ): Promise<void> {
    try {
      // Get user data (in a real implementation, fetch from database)
      const userEmail = data.userEmail || `user${userId}@example.com`;
      const userName = data.userName || 'User';

      let messageId: string;

      // Send appropriate email based on campaign and email type
      switch (campaign.type) {
        case 'welcome_series':
          messageId = await this.sendWelcomeSeriesEmail(email.id, userEmail, userName, data);
          break;
        case 'engagement':
          messageId = await this.sendEngagementEmail(email.id, userEmail, userName, data);
          break;
        case 'retention':
          messageId = await this.sendRetentionEmail(email.id, userEmail, userName, data);
          break;
        default:
          messageId = await emailService.sendEmail({
            to: { email: userEmail, name: userName },
            subject: email.subject,
            html: `<p>Hello ${userName},</p><p>This is an automated email from ${campaign.name}.</p>`,
            categories: [campaign.type, email.id],
          });
      }

      // Update campaign analytics
      campaign.analytics.sent++;
      
      console.log(`Campaign email sent: ${campaign.name} - ${email.id} to ${userEmail}`);
    } catch (error) {
      console.error('Failed to send campaign email:', error);
    }
  }

  private async sendWelcomeSeriesEmail(
    emailId: string,
    userEmail: string,
    userName: string,
    data: Record<string, any>
  ): Promise<string> {
    switch (emailId) {
      case 'welcome_1':
        return emailService.sendWelcomeEmail(userEmail, userName);
      
      case 'welcome_2':
        return emailService.sendEmail({
          to: { email: userEmail, name: userName },
          subject: 'Your First Tahitian Lesson Awaits',
          html: this.getWelcome2Template(userName),
          text: this.getWelcome2Text(userName),
          categories: ['welcome-series', 'lesson-reminder'],
        });
      
      case 'welcome_3':
        return emailService.sendEmail({
          to: { email: userEmail, name: userName },
          subject: 'Discover Tahitian Culture Through Stories',
          html: this.getWelcome3Template(userName),
          text: this.getWelcome3Text(userName),
          categories: ['welcome-series', 'stories'],
        });
      
      case 'welcome_4':
        return emailService.sendEmail({
          to: { email: userEmail, name: userName },
          subject: 'Tips for Effective Language Learning',
          html: this.getWelcome4Template(userName),
          text: this.getWelcome4Text(userName),
          categories: ['welcome-series', 'tips'],
        });
      
      default:
        throw new Error(`Unknown welcome series email: ${emailId}`);
    }
  }

  private async sendEngagementEmail(
    emailId: string,
    userEmail: string,
    userName: string,
    data: Record<string, any>
  ): Promise<string> {
    switch (emailId) {
      case 'lesson_reminder':
        return emailService.sendEmail({
          to: { email: userEmail, name: userName },
          subject: 'Continue Your Tahitian Journey',
          html: this.getLessonReminderTemplate(userName),
          text: this.getLessonReminderText(userName),
          categories: ['engagement', 'lesson-reminder'],
        });
      
      case 'streak_motivation':
        return emailService.sendEmail({
          to: { email: userEmail, name: userName },
          subject: 'Keep Your Learning Streak Alive! 🔥',
          html: this.getStreakMotivationTemplate(userName, data.streakDays || 0),
          text: this.getStreakMotivationText(userName, data.streakDays || 0),
          categories: ['engagement', 'streak'],
        });
      
      case 'achievement_celebration':
        return emailService.sendEmail({
          to: { email: userEmail, name: userName },
          subject: 'Congratulations on Your Achievement! 🎉',
          html: this.getAchievementTemplate(userName, data.achievement || 'completing a lesson'),
          text: this.getAchievementText(userName, data.achievement || 'completing a lesson'),
          categories: ['engagement', 'achievement'],
        });
      
      default:
        throw new Error(`Unknown engagement email: ${emailId}`);
    }
  }

  private async sendRetentionEmail(
    emailId: string,
    userEmail: string,
    userName: string,
    data: Record<string, any>
  ): Promise<string> {
    switch (emailId) {
      case 'win_back_1':
        return emailService.sendEmail({
          to: { email: userEmail, name: userName },
          subject: 'We Miss You! Come Back to Your Tahitian Journey',
          html: this.getWinBack1Template(userName),
          text: this.getWinBack1Text(userName),
          categories: ['retention', 'win-back'],
        });
      
      case 'win_back_2':
        return emailService.sendEmail({
          to: { email: userEmail, name: userName },
          subject: 'Special Offer: Premium Access for Returning Learners',
          html: this.getWinBack2Template(userName),
          text: this.getWinBack2Text(userName),
          categories: ['retention', 'offer'],
        });
      
      case 'win_back_3':
        return emailService.sendEmail({
          to: { email: userEmail, name: userName },
          subject: 'Last Chance: Your Tahitian Progress is Waiting',
          html: this.getWinBack3Template(userName),
          text: this.getWinBack3Text(userName),
          categories: ['retention', 'final'],
        });
      
      default:
        throw new Error(`Unknown retention email: ${emailId}`);
    }
  }

  private async executeAction(action: AutomationAction, userId: string, data: Record<string, any>): Promise<void> {
    switch (action.type) {
      case 'send_email':
        // Implementation for sending custom emails
        break;
      case 'add_tag':
        // Implementation for adding user tags
        break;
      case 'update_user':
        // Implementation for updating user data
        break;
      case 'send_notification':
        // Implementation for sending notifications
        break;
    }
  }

  // Email templates for automation
  private getWelcome2Template(userName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Ready for Your First Lesson? 📚</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Ia ora na, ${userName}!</h2>
          
          <p>We noticed you haven't started your first lesson yet. Don't worry - we're here to guide you through your first steps in learning Tahitian!</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <h3 style="margin-top: 0; color: #667eea;">Your First Lesson Covers:</h3>
            <ul style="padding-left: 20px;">
              <li>Basic Tahitian greetings</li>
              <li>Essential pronunciation tips</li>
              <li>Common everyday phrases</li>
              <li>Cultural context and usage</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/lessons/1" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Start Your First Lesson</a>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getWelcome2Text(userName: string): string {
    return `
      Ready for Your First Lesson?

      Ia ora na, ${userName}!

      We noticed you haven't started your first lesson yet. Your first lesson covers:
      - Basic Tahitian greetings
      - Essential pronunciation tips
      - Common everyday phrases
      - Cultural context and usage

      Start your first lesson: ${process.env.NEXT_PUBLIC_APP_URL}/lessons/1
    `;
  }

  private getWelcome3Template(userName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Discover Tahitian Stories 📖</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Mauruuru, ${userName}!</h2>
          
          <p>Learning a language is more than just vocabulary and grammar - it's about understanding the culture and stories that bring it to life.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF6B6B;">
            <h3 style="margin-top: 0; color: #FF6B6B;">Our Interactive Stories Feature:</h3>
            <ul style="padding-left: 20px;">
              <li>Traditional Tahitian legends</li>
              <li>Modern everyday scenarios</li>
              <li>Interactive vocabulary learning</li>
              <li>Cultural insights and context</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/stories" style="background: #FF6B6B; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Explore Stories</a>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getWelcome3Text(userName: string): string {
    return `
      Discover Tahitian Stories

      Mauruuru, ${userName}!

      Learning a language is more than just vocabulary and grammar - it's about understanding the culture and stories.

      Our Interactive Stories Feature:
      - Traditional Tahitian legends
      - Modern everyday scenarios
      - Interactive vocabulary learning
      - Cultural insights and context

      Explore stories: ${process.env.NEXT_PUBLIC_APP_URL}/stories
    `;
  }

  private getWelcome4Template(userName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Language Learning Tips 💡</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Effective Learning Strategies, ${userName}</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50;">
            <h3 style="margin-top: 0; color: #4CAF50;">Top Tips for Success:</h3>
            <ul style="padding-left: 20px;">
              <li><strong>Consistency is key:</strong> Study a little every day</li>
              <li><strong>Practice speaking:</strong> Don't be afraid to make mistakes</li>
              <li><strong>Immerse yourself:</strong> Listen to Tahitian music and watch videos</li>
              <li><strong>Use it daily:</strong> Try to use new words in context</li>
              <li><strong>Be patient:</strong> Language learning is a journey, not a race</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Continue Learning</a>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getWelcome4Text(userName: string): string {
    return `
      Language Learning Tips

      Effective Learning Strategies, ${userName}

      Top Tips for Success:
      - Consistency is key: Study a little every day
      - Practice speaking: Don't be afraid to make mistakes
      - Immerse yourself: Listen to Tahitian music and watch videos
      - Use it daily: Try to use new words in context
      - Be patient: Language learning is a journey, not a race

      Continue learning: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard
    `;
  }

  private getLessonReminderTemplate(userName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Continue Your Journey 🌴</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Ia ora na, ${userName}!</h2>
          
          <p>We noticed you haven't been active lately. Your Tahitian learning journey is waiting for you!</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/lessons" style="background: #FF9800; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Continue Learning</a>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getLessonReminderText(userName: string): string {
    return `
      Continue Your Journey

      Ia ora na, ${userName}!

      We noticed you haven't been active lately. Your Tahitian learning journey is waiting for you!

      Continue learning: ${process.env.NEXT_PUBLIC_APP_URL}/lessons
    `;
  }

  private getStreakMotivationTemplate(userName: string, streakDays: number): string {
    return `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #FF5722 0%, #FF9800 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🔥 ${streakDays} Day Streak!</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Amazing work, ${userName}!</h2>
          
          <p>You've maintained a ${streakDays}-day learning streak! Keep the momentum going.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="background: #FF5722; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Keep It Going!</a>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getStreakMotivationText(userName: string, streakDays: number): string {
    return `
      ${streakDays} Day Streak!

      Amazing work, ${userName}!

      You've maintained a ${streakDays}-day learning streak! Keep the momentum going.

      Keep it going: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard
    `;
  }

  private getAchievementTemplate(userName: string, achievement: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #9C27B0 0%, #673AB7 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Achievement Unlocked!</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Congratulations, ${userName}!</h2>
          
          <p>You've achieved: <strong>${achievement}</strong></p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/achievements" style="background: #9C27B0; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View All Achievements</a>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getAchievementText(userName: string, achievement: string): string {
    return `
      Achievement Unlocked!

      Congratulations, ${userName}!

      You've achieved: ${achievement}

      View all achievements: ${process.env.NEXT_PUBLIC_APP_URL}/achievements
    `;
  }

  private getWinBack1Template(userName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #E91E63 0%, #9C27B0 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">We Miss You! 💔</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Come back, ${userName}!</h2>
          
          <p>Your Tahitian learning journey is waiting for you. We've added new lessons and features since you've been away.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="background: #E91E63; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Welcome Back</a>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getWinBack1Text(userName: string): string {
    return `
      We Miss You!

      Come back, ${userName}!

      Your Tahitian learning journey is waiting for you. We've added new lessons and features since you've been away.

      Welcome back: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard
    `;
  }

  private getWinBack2Template(userName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Special Offer! 🎁</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Welcome back, ${userName}!</h2>
          
          <p>We'd love to have you back! Enjoy 50% off Premium access for returning learners.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/premium?offer=comeback50" style="background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Claim Offer</a>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getWinBack2Text(userName: string): string {
    return `
      Special Offer!

      Welcome back, ${userName}!

      We'd love to have you back! Enjoy 50% off Premium access for returning learners.

      Claim offer: ${process.env.NEXT_PUBLIC_APP_URL}/premium?offer=comeback50
    `;
  }

  private getWinBack3Template(userName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #FF5722 0%, #795548 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Last Chance ⏰</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Don't lose your progress, ${userName}</h2>
          
          <p>Your Tahitian learning progress is still here, waiting for you. This is your last reminder - we'd hate to see you go!</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="background: #FF5722; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Resume Learning</a>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getWinBack3Text(userName: string): string {
    return `
      Last Chance

      Don't lose your progress, ${userName}

      Your Tahitian learning progress is still here, waiting for you. This is your last reminder - we'd hate to see you go!

      Resume learning: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard
    `;
  }

  // Campaign management methods
  getCampaign(campaignId: string): EmailCampaign | undefined {
    return this.campaigns.get(campaignId);
  }

  getAllCampaigns(): EmailCampaign[] {
    return Array.from(this.campaigns.values());
  }

  updateCampaignStatus(campaignId: string, status: EmailCampaign['status']): void {
    const campaign = this.campaigns.get(campaignId);
    if (campaign) {
      campaign.status = status;
    }
  }

  getCampaignAnalytics(campaignId: string): EmailCampaign['analytics'] | undefined {
    const campaign = this.campaigns.get(campaignId);
    return campaign?.analytics;
  }

  updateCampaignAnalytics(campaignId: string, event: keyof EmailCampaign['analytics']): void {
    const campaign = this.campaigns.get(campaignId);
    if (campaign) {
      campaign.analytics[event]++;
    }
  }
}

export const emailAutomation = new EmailAutomation();
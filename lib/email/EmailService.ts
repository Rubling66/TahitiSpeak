import sgMail from '@sendgrid/mail';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[];
}

export interface EmailRecipient {
  email: string;
  name?: string;
  substitutions?: Record<string, string>;
}

export interface EmailOptions {
  to: EmailRecipient | EmailRecipient[];
  from?: {
    email: string;
    name?: string;
  };
  subject?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
  html?: string;
  text?: string;
  attachments?: Array<{
    content: string;
    filename: string;
    type?: string;
    disposition?: string;
  }>;
  categories?: string[];
  customArgs?: Record<string, string>;
  sendAt?: number;
}

export interface EmailAnalytics {
  messageId: string;
  email: string;
  event: 'delivered' | 'opened' | 'clicked' | 'bounced' | 'dropped' | 'spam_report' | 'unsubscribe';
  timestamp: number;
  url?: string;
  userAgent?: string;
  ip?: string;
}

class EmailService {
  private isInitialized: boolean = false;
  private defaultFrom: { email: string; name: string };

  constructor() {
    this.defaultFrom = {
      email: process.env.SENDGRID_FROM_EMAIL || 'noreply@tahitispeak.com',
      name: process.env.SENDGRID_FROM_NAME || 'TahitiSpeak',
    };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      throw new Error('SENDGRID_API_KEY environment variable is required');
    }

    sgMail.setApiKey(apiKey);
    this.isInitialized = true;
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('EmailService not initialized. Call initialize() first.');
    }
  }

  async sendEmail(options: EmailOptions): Promise<string> {
    this.ensureInitialized();

    try {
      const msg: any = {
        to: Array.isArray(options.to) ? options.to : [options.to],
        from: options.from || this.defaultFrom,
        subject: options.subject,
        html: options.html,
        text: options.text,
        templateId: options.templateId,
        dynamicTemplateData: options.dynamicTemplateData,
        attachments: options.attachments,
        categories: options.categories,
        customArgs: options.customArgs,
        sendAt: options.sendAt,
      };

      // Remove undefined fields
      Object.keys(msg).forEach(key => {
        if (msg[key] === undefined) {
          delete msg[key];
        }
      });

      const [response] = await sgMail.send(msg);
      
      // Extract message ID from response headers
      const messageId = response.headers['x-message-id'] || 
                       response.headers['X-Message-Id'] || 
                       `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      return messageId as string;
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error(`Email sending failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async sendBulkEmails(emails: EmailOptions[]): Promise<string[]> {
    this.ensureInitialized();

    const messageIds: string[] = [];
    const batchSize = 1000; // SendGrid limit

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      
      try {
        const batchPromises = batch.map(email => this.sendEmail(email));
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            messageIds.push(result.value);
          } else {
            console.error(`Failed to send email ${i + index}:`, result.reason);
            messageIds.push(`failed_${i + index}`);
          }
        });
      } catch (error) {
        console.error(`Batch ${i / batchSize + 1} failed:`, error);
        // Add failed placeholders for this batch
        for (let j = 0; j < batch.length; j++) {
          messageIds.push(`failed_${i + j}`);
        }
      }
    }

    return messageIds;
  }

  // Template management
  async createTemplate(template: Omit<EmailTemplate, 'id'>): Promise<EmailTemplate> {
    this.ensureInitialized();

    try {
      const templateData = {
        name: template.name,
        generation: 'dynamic',
        versions: [{
          template_id: template.name.toLowerCase().replace(/\s+/g, '_'),
          active: 1,
          name: template.name,
          subject: template.subject,
          html_content: template.htmlContent,
          plain_content: template.textContent,
        }],
      };

      // Note: This is a simplified version. In a real implementation,
      // you would use SendGrid's template API
      const templateId = `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      return {
        id: templateId,
        ...template,
      };
    } catch (error) {
      console.error('Failed to create template:', error);
      throw new Error(`Template creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Predefined email templates
  async sendWelcomeEmail(userEmail: string, userName: string): Promise<string> {
    return this.sendEmail({
      to: { email: userEmail, name: userName },
      subject: 'Welcome to TahitiSpeak! 🌺',
      html: this.getWelcomeEmailTemplate(userName),
      text: this.getWelcomeEmailText(userName),
      categories: ['welcome', 'onboarding'],
    });
  }

  async sendPasswordResetEmail(userEmail: string, resetToken: string): Promise<string> {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;
    
    return this.sendEmail({
      to: { email: userEmail },
      subject: 'Reset Your TahitiSpeak Password',
      html: this.getPasswordResetTemplate(resetUrl),
      text: this.getPasswordResetText(resetUrl),
      categories: ['password-reset', 'security'],
    });
  }

  async sendLessonCompletionEmail(userEmail: string, userName: string, lessonTitle: string): Promise<string> {
    return this.sendEmail({
      to: { email: userEmail, name: userName },
      subject: `Congratulations! You completed "${lessonTitle}"`,
      html: this.getLessonCompletionTemplate(userName, lessonTitle),
      text: this.getLessonCompletionText(userName, lessonTitle),
      categories: ['lesson-completion', 'achievement'],
    });
  }

  async sendWeeklyProgressEmail(userEmail: string, userName: string, progressData: any): Promise<string> {
    return this.sendEmail({
      to: { email: userEmail, name: userName },
      subject: 'Your Weekly Tahitian Learning Progress 📊',
      html: this.getWeeklyProgressTemplate(userName, progressData),
      text: this.getWeeklyProgressText(userName, progressData),
      categories: ['weekly-progress', 'engagement'],
    });
  }

  async sendSubscriptionEmail(userEmail: string, userName: string, subscriptionType: string): Promise<string> {
    return this.sendEmail({
      to: { email: userEmail, name: userName },
      subject: `Welcome to TahitiSpeak ${subscriptionType}! 🎉`,
      html: this.getSubscriptionTemplate(userName, subscriptionType),
      text: this.getSubscriptionText(userName, subscriptionType),
      categories: ['subscription', 'premium'],
    });
  }

  // Email templates
  private getWelcomeEmailTemplate(userName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to TahitiSpeak</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to TahitiSpeak! 🌺</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Ia ora na, ${userName}!</h2>
          
          <p>We're thrilled to have you join our community of Tahitian language learners! You're about to embark on an amazing journey to discover the beautiful Tahitian language and culture.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <h3 style="margin-top: 0; color: #667eea;">What's Next?</h3>
            <ul style="padding-left: 20px;">
              <li>Complete your profile setup</li>
              <li>Take your first lesson</li>
              <li>Explore our interactive stories</li>
              <li>Join our community discussions</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Start Learning Now</a>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            If you have any questions, feel free to reach out to our support team. We're here to help you succeed!
          </p>
          
          <p style="color: #666; font-size: 14px;">
            Mauruuru (Thank you),<br>
            The TahitiSpeak Team
          </p>
        </div>
      </body>
      </html>
    `;
  }

  private getWelcomeEmailText(userName: string): string {
    return `
      Ia ora na, ${userName}!

      Welcome to TahitiSpeak! We're thrilled to have you join our community of Tahitian language learners.

      What's Next?
      - Complete your profile setup
      - Take your first lesson
      - Explore our interactive stories
      - Join our community discussions

      Start learning now: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard

      If you have any questions, feel free to reach out to our support team.

      Mauruuru (Thank you),
      The TahitiSpeak Team
    `;
  }

  private getPasswordResetTemplate(resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f44336; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset Request</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p>You requested a password reset for your TahitiSpeak account. Click the button below to reset your password:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: #f44336; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Reset Password</a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            This link will expire in 1 hour for security reasons. If you didn't request this reset, please ignore this email.
          </p>
          
          <p style="color: #666; font-size: 14px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${resetUrl}">${resetUrl}</a>
          </p>
        </div>
      </body>
      </html>
    `;
  }

  private getPasswordResetText(resetUrl: string): string {
    return `
      Password Reset Request

      You requested a password reset for your TahitiSpeak account.

      Reset your password: ${resetUrl}

      This link will expire in 1 hour for security reasons. If you didn't request this reset, please ignore this email.
    `;
  }

  private getLessonCompletionTemplate(userName: string, lessonTitle: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Lesson Completed!</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Congratulations!</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Great job, ${userName}!</h2>
          
          <p>You've successfully completed the lesson: <strong>"${lessonTitle}"</strong></p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50;">
            <h3 style="margin-top: 0; color: #4CAF50;">Keep the momentum going!</h3>
            <p>Continue your learning journey with the next lesson or explore more stories.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/lessons" style="background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Continue Learning</a>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getLessonCompletionText(userName: string, lessonTitle: string): string {
    return `
      Congratulations, ${userName}!

      You've successfully completed the lesson: "${lessonTitle}"

      Keep the momentum going! Continue your learning journey with the next lesson.

      Continue learning: ${process.env.NEXT_PUBLIC_APP_URL}/lessons
    `;
  }

  private getWeeklyProgressTemplate(userName: string, progressData: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Weekly Progress</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">📊 Your Weekly Progress</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Great work this week, ${userName}!</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #FF9800;">This Week's Achievements</h3>
            <ul style="padding-left: 20px;">
              <li>Lessons completed: ${progressData.lessonsCompleted || 0}</li>
              <li>Stories read: ${progressData.storiesRead || 0}</li>
              <li>Study time: ${progressData.studyTime || 0} minutes</li>
              <li>Streak: ${progressData.streak || 0} days</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="background: #FF9800; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Full Progress</a>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getWeeklyProgressText(userName: string, progressData: any): string {
    return `
      Your Weekly Progress

      Great work this week, ${userName}!

      This Week's Achievements:
      - Lessons completed: ${progressData.lessonsCompleted || 0}
      - Stories read: ${progressData.storiesRead || 0}
      - Study time: ${progressData.studyTime || 0} minutes
      - Streak: ${progressData.streak || 0} days

      View your full progress: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard
    `;
  }

  private getSubscriptionTemplate(userName: string, subscriptionType: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Premium!</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #9C27B0 0%, #673AB7 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Welcome to ${subscriptionType}!</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Thank you, ${userName}!</h2>
          
          <p>Your ${subscriptionType} subscription is now active. You now have access to all premium features!</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #9C27B0;">
            <h3 style="margin-top: 0; color: #9C27B0;">Premium Features Unlocked:</h3>
            <ul style="padding-left: 20px;">
              <li>Unlimited access to all lessons</li>
              <li>Advanced progress tracking</li>
              <li>Offline learning capabilities</li>
              <li>Priority customer support</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/premium" style="background: #9C27B0; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Explore Premium Features</a>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getSubscriptionText(userName: string, subscriptionType: string): string {
    return `
      Welcome to ${subscriptionType}!

      Thank you, ${userName}! Your ${subscriptionType} subscription is now active.

      Premium Features Unlocked:
      - Unlimited access to all lessons
      - Advanced progress tracking
      - Offline learning capabilities
      - Priority customer support

      Explore premium features: ${process.env.NEXT_PUBLIC_APP_URL}/premium
    `;
  }

  // Analytics and tracking
  async trackEmailEvent(analytics: EmailAnalytics): Promise<void> {
    try {
      // Store analytics in database or send to analytics service
      console.log('Email event tracked:', analytics);
      
      // In a real implementation, you would store this in your database
      // or send to an analytics service like Google Analytics or Mixpanel
    } catch (error) {
      console.error('Failed to track email event:', error);
    }
  }
}

export const emailService = new EmailService();
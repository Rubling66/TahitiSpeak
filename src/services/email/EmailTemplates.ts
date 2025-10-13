import { EmailTemplate } from '../EmailService';

// Predefined Email Templates
export const emailTemplates: Record<string, Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>> = {
  welcome: {
    name: 'welcome',
    subject: 'Welcome to French Tahitian Learning! 🌺',
    category: 'welcome',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <header style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 30px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Ia ora na! Welcome! 🌺</h1>
          <p style="color: #e0f2fe; margin: 10px 0 0 0; font-size: 16px;">Your journey to learn Tahitian starts here</p>
        </header>
        
        <main style="padding: 40px 30px;">
          <p style="font-size: 18px; color: #1e293b; margin-bottom: 20px;">Hi {{userName}},</p>
          
          <p style="color: #475569; line-height: 1.6; margin-bottom: 25px;">
            Welcome to our French Tahitian learning community! We're thrilled to have you join us on this exciting journey to master the beautiful Tahitian language.
          </p>
          
          <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
            <h3 style="margin: 0 0 15px 0; color: #0c4a6e;">🚀 Get Started</h3>
            <p style="margin: 0; color: #0369a1;">
              Your personalized dashboard is ready! Start with your first lesson and begin building your Tahitian vocabulary today.
            </p>
          </div>
          
          <div style="text-align: center; margin: 35px 0;">
            <a href="{{dashboardUrl}}" style="background: #0ea5e9; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(14, 165, 233, 0.3);">
              Start Learning Now
            </a>
          </div>
          
          <div style="background: #fefce8; border: 1px solid #fde047; border-radius: 8px; padding: 20px; margin: 30px 0;">
            <h4 style="margin: 0 0 10px 0; color: #a16207;">💡 Pro Tips for Success:</h4>
            <ul style="margin: 0; padding-left: 20px; color: #a16207;">
              <li>Practice daily for just 10-15 minutes</li>
              <li>Use the audio pronunciation guides</li>
              <li>Join our community discussions</li>
              <li>Set up lesson reminders</li>
            </ul>
          </div>
          
          <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
            Questions? Reply to this email or visit our help center. We're here to support your learning journey!
          </p>
        </main>
        
        <footer style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0 0 10px 0; color: #64748b; font-size: 14px;">
            French Tahitian Learning App
          </p>
          <p style="margin: 0; font-size: 12px; color: #94a3b8;">
            <a href="{{unsubscribeUrl}}" style="color: #64748b; text-decoration: none;">Unsubscribe</a> | 
            <a href="{{preferencesUrl}}" style="color: #64748b; text-decoration: none;">Email Preferences</a>
          </p>
        </footer>
      </div>
    `,
    textContent: `
      Ia ora na! Welcome to French Tahitian Learning!
      
      Hi {{userName}},
      
      Welcome to our French Tahitian learning community! We're thrilled to have you join us on this exciting journey to master the beautiful Tahitian language.
      
      Get Started:
      Your personalized dashboard is ready! Start with your first lesson and begin building your Tahitian vocabulary today.
      
      Visit your dashboard: {{dashboardUrl}}
      
      Pro Tips for Success:
      - Practice daily for just 10-15 minutes
      - Use the audio pronunciation guides
      - Join our community discussions
      - Set up lesson reminders
      
      Questions? Reply to this email or visit our help center. We're here to support your learning journey!
      
      Unsubscribe: {{unsubscribeUrl}}
      Email Preferences: {{preferencesUrl}}
    `,
    templateVariables: {
      userName: 'string',
      dashboardUrl: 'string',
      unsubscribeUrl: 'string',
      preferencesUrl: 'string'
    },
    isActive: true,
    version: 1
  },

  lessonReminder: {
    name: 'lesson_reminder',
    subject: "Don't forget your Tahitian lesson today! 🌺",
    category: 'engagement',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <header style="background: #0ea5e9; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Time for your Tahitian lesson!</h1>
        </header>
        
        <main style="padding: 30px 20px;">
          <p>Hi {{userName}},</p>
          
          <p>Your daily Tahitian lesson is waiting for you! You're doing great with your learning streak of {{streakDays}} days.</p>
          
          {{#if nextLesson}}
          <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 15px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0;">📚 Next Lesson: {{nextLesson.title}}</h3>
            <p style="margin: 0; color: #64748b;">{{nextLesson.description}}</p>
          </div>
          {{/if}}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{lessonUrl}}" style="background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Continue Learning
            </a>
          </div>
          
          <p style="font-size: 14px; color: #64748b;">
            💡 Tip: Consistent daily practice is the key to language mastery!
          </p>
        </main>
        
        <footer style="background: #f8fafc; padding: 15px; text-align: center; font-size: 12px; color: #94a3b8;">
          <a href="{{unsubscribeUrl}}" style="color: #64748b; text-decoration: none;">Unsubscribe</a> | 
          <a href="{{preferencesUrl}}" style="color: #64748b; text-decoration: none;">Email Preferences</a>
        </footer>
      </div>
    `,
    textContent: `
      Time for your Tahitian lesson!
      
      Hi {{userName}},
      
      Your daily Tahitian lesson is waiting for you! You're doing great with your learning streak of {{streakDays}} days.
      
      {{#if nextLesson}}
      Next Lesson: {{nextLesson.title}}
      {{nextLesson.description}}
      {{/if}}
      
      Continue Learning: {{lessonUrl}}
      
      💡 Tip: Consistent daily practice is the key to language mastery!
      
      Unsubscribe: {{unsubscribeUrl}}
      Email Preferences: {{preferencesUrl}}
    `,
    templateVariables: {
      userName: 'string',
      streakDays: 'number',
      nextLesson: 'object',
      lessonUrl: 'string'
    },
    isActive: true,
    version: 1
  },

  achievementUnlocked: {
    name: 'achievement_unlocked',
    subject: '🏆 Achievement Unlocked: {{achievementName}}',
    category: 'gamification',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <header style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">🏆 Achievement Unlocked!</h1>
        </header>
        
        <main style="padding: 30px 20px; text-align: center;">
          <div style="background: #fffbeb; border: 2px solid #f59e0b; border-radius: 12px; padding: 30px; margin: 20px 0;">
            <div style="font-size: 48px; margin-bottom: 15px;">{{achievementIcon}}</div>
            <h2 style="color: #d97706; margin: 0 0 10px 0;">{{achievementName}}</h2>
            <p style="color: #92400e; margin: 0;">{{achievementDescription}}</p>
          </div>
          
          <p>Congratulations, {{userName}}! You've earned {{achievementPoints}} points.</p>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>📊 Your Progress</h3>
            <p>Total Points: {{totalPoints}}</p>
            <p>Achievements Unlocked: {{totalAchievements}}</p>
            <p>Learning Streak: {{streakDays}} days</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{profileUrl}}" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View All Achievements
            </a>
          </div>
        </main>
        
        <footer style="background: #f8fafc; padding: 15px; text-align: center; font-size: 12px; color: #94a3b8;">
          <a href="{{unsubscribeUrl}}" style="color: #64748b; text-decoration: none;">Unsubscribe</a> | 
          <a href="{{preferencesUrl}}" style="color: #64748b; text-decoration: none;">Email Preferences</a>
        </footer>
      </div>
    `,
    textContent: `
      🏆 Achievement Unlocked!
      
      {{achievementIcon}} {{achievementName}}
      {{achievementDescription}}
      
      Congratulations, {{userName}}! You've earned {{achievementPoints}} points.
      
      Your Progress:
      - Total Points: {{totalPoints}}
      - Achievements Unlocked: {{totalAchievements}}
      - Learning Streak: {{streakDays}} days
      
      View All Achievements: {{profileUrl}}
      
      Unsubscribe: {{unsubscribeUrl}}
      Email Preferences: {{preferencesUrl}}
    `,
    templateVariables: {
      userName: 'string',
      achievementName: 'string',
      achievementDescription: 'string',
      achievementIcon: 'string',
      achievementPoints: 'number',
      totalPoints: 'number',
      totalAchievements: 'number',
      streakDays: 'number',
      profileUrl: 'string'
    },
    isActive: true,
    version: 1
  },

  progressUpdate: {
    name: 'progress_update',
    subject: '📈 Your Weekly Tahitian Progress Report',
    category: 'progress',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <header style="background: #10b981; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">📈 Your Weekly Progress</h1>
        </header>
        
        <main style="padding: 30px 20px;">
          <p>Hi {{userName}},</p>
          
          <p>Here's your learning progress for this week:</p>
          
          <div style="background: #f0fdf4; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #065f46;">📊 This Week's Stats</h3>
            <ul style="margin: 0; padding-left: 20px; color: #047857;">
              <li>Lessons Completed: {{lessonsCompleted}}</li>
              <li>Words Learned: {{wordsLearned}}</li>
              <li>Study Time: {{studyTime}} minutes</li>
              <li>Current Streak: {{streakDays}} days</li>
            </ul>
          </div>
          
          {{#if milestones}}
          <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #92400e;">🎯 Milestones Reached</h3>
            {{#each milestones}}
            <p style="margin: 5px 0; color: #a16207;">• {{this}}</p>
            {{/each}}
          </div>
          {{/if}}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{dashboardUrl}}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Continue Learning
            </a>
          </div>
          
          <p style="font-size: 14px; color: #64748b;">
            Keep up the great work! Consistency is the key to mastering Tahitian.
          </p>
        </main>
        
        <footer style="background: #f8fafc; padding: 15px; text-align: center; font-size: 12px; color: #94a3b8;">
          <a href="{{unsubscribeUrl}}" style="color: #64748b; text-decoration: none;">Unsubscribe</a> | 
          <a href="{{preferencesUrl}}" style="color: #64748b; text-decoration: none;">Email Preferences</a>
        </footer>
      </div>
    `,
    textContent: `
      📈 Your Weekly Progress
      
      Hi {{userName}},
      
      Here's your learning progress for this week:
      
      This Week's Stats:
      - Lessons Completed: {{lessonsCompleted}}
      - Words Learned: {{wordsLearned}}
      - Study Time: {{studyTime}} minutes
      - Current Streak: {{streakDays}} days
      
      {{#if milestones}}
      Milestones Reached:
      {{#each milestones}}
      • {{this}}
      {{/each}}
      {{/if}}
      
      Continue Learning: {{dashboardUrl}}
      
      Keep up the great work! Consistency is the key to mastering Tahitian.
      
      Unsubscribe: {{unsubscribeUrl}}
      Email Preferences: {{preferencesUrl}}
    `,
    templateVariables: {
      userName: 'string',
      lessonsCompleted: 'number',
      wordsLearned: 'number',
      studyTime: 'number',
      streakDays: 'number',
      milestones: 'array',
      dashboardUrl: 'string'
    },
    isActive: true,
    version: 1
  },

  weeklyDigest: {
    name: 'weekly_digest',
    subject: '🌺 Your Weekly Tahitian Learning Digest',
    category: 'digest',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <header style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">🌺 Weekly Digest</h1>
          <p style="color: #e9d5ff; margin: 10px 0 0 0;">Your Tahitian learning highlights</p>
        </header>
        
        <main style="padding: 30px 20px;">
          <p>Ia ora na {{userName}},</p>
          
          <p>Here's what's been happening in your Tahitian learning journey this week:</p>
          
          <div style="background: #faf5ff; border-left: 4px solid #8b5cf6; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #6b21a8;">📚 New Content This Week</h3>
            {{#if newLessons}}
            <p style="margin: 5px 0; color: #7c2d92;"><strong>New Lessons:</strong></p>
            {{#each newLessons}}
            <p style="margin: 5px 0 5px 20px; color: #8b5cf6;">• {{this}}</p>
            {{/each}}
            {{/if}}
            
            {{#if newWords}}
            <p style="margin: 15px 0 5px 0; color: #7c2d92;"><strong>Word of the Week:</strong></p>
            <p style="margin: 5px 0 5px 20px; color: #8b5cf6;">{{newWords}}</p>
            {{/if}}
          </div>
          
          <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #0c4a6e;">🏆 Community Highlights</h3>
            {{#if communityStats}}
            <p style="margin: 5px 0; color: #0369a1;">• {{communityStats.activeUsers}} learners were active this week</p>
            <p style="margin: 5px 0; color: #0369a1;">• {{communityStats.lessonsCompleted}} lessons completed community-wide</p>
            <p style="margin: 5px 0; color: #0369a1;">• Top achievement: {{communityStats.topAchievement}}</p>
            {{/if}}
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{dashboardUrl}}" style="background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Continue Your Journey
            </a>
          </div>
          
          <p style="font-size: 14px; color: #64748b;">
            Mauruuru (thank you) for being part of our learning community!
          </p>
        </main>
        
        <footer style="background: #f8fafc; padding: 15px; text-align: center; font-size: 12px; color: #94a3b8;">
          <a href="{{unsubscribeUrl}}" style="color: #64748b; text-decoration: none;">Unsubscribe</a> | 
          <a href="{{preferencesUrl}}" style="color: #64748b; text-decoration: none;">Email Preferences</a>
        </footer>
      </div>
    `,
    textContent: `
      🌺 Weekly Digest - Your Tahitian learning highlights
      
      Ia ora na {{userName}},
      
      Here's what's been happening in your Tahitian learning journey this week:
      
      📚 New Content This Week:
      {{#if newLessons}}
      New Lessons:
      {{#each newLessons}}
      • {{this}}
      {{/each}}
      {{/if}}
      
      {{#if newWords}}
      Word of the Week: {{newWords}}
      {{/if}}
      
      🏆 Community Highlights:
      {{#if communityStats}}
      • {{communityStats.activeUsers}} learners were active this week
      • {{communityStats.lessonsCompleted}} lessons completed community-wide
      • Top achievement: {{communityStats.topAchievement}}
      {{/if}}
      
      Continue Your Journey: {{dashboardUrl}}
      
      Mauruuru (thank you) for being part of our learning community!
      
      Unsubscribe: {{unsubscribeUrl}}
      Email Preferences: {{preferencesUrl}}
    `,
    templateVariables: {
      userName: 'string',
      newLessons: 'array',
      newWords: 'string',
      communityStats: 'object',
      dashboardUrl: 'string'
    },
    isActive: true,
    version: 1
  },

  passwordReset: {
    name: 'password_reset',
    subject: 'Reset Your Password - French Tahitian App',
    category: 'security',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <header style="background: #dc2626; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">🔐 Password Reset Request</h1>
        </header>
        
        <main style="padding: 30px 20px;">
          <p>Hi {{userName}},</p>
          
          <p>We received a request to reset your password for your French Tahitian Learning account.</p>
          
          <div style="background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0; color: #991b1b;">
              <strong>⚠️ Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{resetUrl}}" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <p style="font-size: 14px; color: #64748b;">
            This link will expire in {{expirationTime}} hours for security reasons.
          </p>
          
          <p style="font-size: 14px; color: #64748b;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            {{resetUrl}}
          </p>
        </main>
        
        <footer style="background: #f8fafc; padding: 15px; text-align: center; font-size: 12px; color: #94a3b8;">
          French Tahitian Learning App - Security Team
        </footer>
      </div>
    `,
    textContent: `
      🔐 Password Reset Request
      
      Hi {{userName}},
      
      We received a request to reset your password for your French Tahitian Learning account.
      
      ⚠️ Security Notice: If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
      
      Reset your password: {{resetUrl}}
      
      This link will expire in {{expirationTime}} hours for security reasons.
      
      French Tahitian Learning App - Security Team
    `,
    templateVariables: {
      userName: 'string',
      resetUrl: 'string',
      expirationTime: 'number'
    },
    isActive: true,
    version: 1
  }
};

// Template initialization function
export const initializeEmailTemplates = async (emailService: any): Promise<void> => {
  console.log('Initializing email templates...');
  
  for (const [templateName, template] of Object.entries(emailTemplates)) {
    try {
      const existing = await emailService.getTemplate(templateName);
      if (!existing) {
        await emailService.createTemplate(template);
        console.log(`✅ Created template: ${templateName}`);
      } else {
        console.log(`ℹ️ Template already exists: ${templateName}`);
      }
    } catch (error) {
      console.error(`❌ Failed to create template ${templateName}:`, error);
    }
  }
  
  console.log('Email templates initialization complete');
};

// Template helper functions
export const getTemplatePreview = (templateName: string, sampleData: Record<string, any> = {}): string => {
  const template = emailTemplates[templateName];
  if (!template) {
    throw new Error(`Template ${templateName} not found`);
  }
  
  // Default sample data
  const defaultData = {
    userName: 'John Doe',
    dashboardUrl: 'https://app.example.com/dashboard',
    unsubscribeUrl: 'https://app.example.com/unsubscribe?token=sample',
    preferencesUrl: 'https://app.example.com/preferences?token=sample',
    streakDays: 7,
    lessonsCompleted: 5,
    wordsLearned: 25,
    studyTime: 120,
    achievementName: 'First Week Complete',
    achievementDescription: 'Completed your first week of learning!',
    achievementIcon: '🎉',
    achievementPoints: 100,
    totalPoints: 500,
    totalAchievements: 3,
    profileUrl: 'https://app.example.com/profile',
    lessonUrl: 'https://app.example.com/lesson/next',
    nextLesson: {
      title: 'Basic Greetings',
      description: 'Learn how to say hello and goodbye in Tahitian'
    },
    milestones: ['Completed 5 lessons', 'Learned 25 new words'],
    newLessons: ['Colors in Tahitian', 'Family Members'],
    newWords: 'Fenua (land/country)',
    communityStats: {
      activeUsers: 1250,
      lessonsCompleted: 5680,
      topAchievement: 'Month-long Streak'
    },
    resetUrl: 'https://app.example.com/reset-password?token=sample',
    expirationTime: 24
  };
  
  const mergedData = { ...defaultData, ...sampleData };
  
  // Simple template compilation for preview
  let html = template.htmlContent;
  
  // Replace variables
  Object.entries(mergedData).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    html = html.replace(regex, String(value));
  });
  
  // Handle conditional blocks (simplified)
  html = html.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, content) => {
    return mergedData[condition] ? content : '';
  });
  
  // Handle each blocks (simplified)
  html = html.replace(/\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, arrayName, content) => {
    const array = mergedData[arrayName];
    if (Array.isArray(array)) {
      return array.map(item => content.replace(/\{\{this\}\}/g, String(item))).join('');
    }
    return '';
  });
  
  return html;
};

export const validateTemplateData = (templateName: string, data: Record<string, any>): { isValid: boolean; missingFields: string[] } => {
  const template = emailTemplates[templateName];
  if (!template) {
    return { isValid: false, missingFields: [`Template ${templateName} not found`] };
  }
  
  const requiredFields = Object.keys(template.templateVariables);
  const missingFields = requiredFields.filter(field => !(field in data));
  
  return {
    isValid: missingFields.length === 0,
    missingFields
  };
};
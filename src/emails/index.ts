// Email Templates Export
export { default as WelcomeEmail } from './WelcomeEmail';
export { default as LessonReminderEmail } from './LessonReminderEmail';
export { default as AchievementEmail } from './AchievementEmail';
export { default as PasswordResetEmail } from './PasswordResetEmail';
export { default as WeeklyDigestEmail } from './WeeklyDigestEmail';

// Email Template Types
export type { WelcomeEmailProps } from './WelcomeEmail';
export type { LessonReminderEmailProps } from './LessonReminderEmail';
export type { AchievementEmailProps } from './AchievementEmail';
export type { PasswordResetEmailProps } from './PasswordResetEmail';
export type { WeeklyDigestEmailProps } from './WeeklyDigestEmail';

// Email Template Registry for dynamic template selection
export const EMAIL_TEMPLATES = {
  welcome: 'WelcomeEmail',
  lessonReminder: 'LessonReminderEmail',
  achievement: 'AchievementEmail',
  passwordReset: 'PasswordResetEmail',
  weeklyDigest: 'WeeklyDigestEmail',
} as const;

export type EmailTemplateType = keyof typeof EMAIL_TEMPLATES;

// Template categories for organization
export const EMAIL_TEMPLATE_CATEGORIES = {
  authentication: ['welcome', 'passwordReset'],
  learning: ['lessonReminder', 'achievement'],
  engagement: ['weeklyDigest'],
} as const;
import sgMail from '@sendgrid/mail';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables?: string[];
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
  subject: string;
  html?: string;
  text?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
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

export interface BulkEmailOptions {
  templateId: string;
  from: {
    email: string;
    name?: string;
  };
  subject?: string;
  recipients: Array<{
    email: string;
    name?: string;
    dynamicTemplateData?: Record<string, any>;
  }>;
  categories?: string[];
  customArgs?: Record<string, string>;
  sendAt?: number;
}

export class EmailService {
  private defaultFrom = {
    email: process.env.SENDGRID_FROM_EMAIL || 'noreply@frenchlearning.app',
    name: process.env.SENDGRID_FROM_NAME || 'French Learning App'
  };

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (!process.env.SENDGRID_API_KEY) {
        console.error('SendGrid API key not configured');
        return false;
      }

      const recipients = Array.isArray(options.to) ? options.to : [options.to];
      
      const msg: any = {
        to: recipients.map(recipient => ({
          email: recipient.email,
          name: recipient.name
        })),
        from: options.from || this.defaultFrom,
        subject: options.subject,
        categories: options.categories || ['french-learning-app'],
        customArgs: options.customArgs || {},
      };

      // Add send time if specified
      if (options.sendAt) {
        msg.sendAt = options.sendAt;
      }

      // Use template or content
      if (options.templateId) {
        msg.templateId = options.templateId;
        msg.dynamicTemplateData = options.dynamicTemplateData || {};
      } else {
        if (options.html) {
          msg.html = options.html;
        }
        if (options.text) {
          msg.text = options.text;
        }
      }

      // Add attachments if provided
      if (options.attachments && options.attachments.length > 0) {
        msg.attachments = options.attachments;
      }

      await sgMail.send(msg);
      console.log('Email sent successfully');
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  async sendBulkEmail(options: BulkEmailOptions): Promise<boolean> {
    try {
      if (!process.env.SENDGRID_API_KEY) {
        console.error('SendGrid API key not configured');
        return false;
      }

      const personalizations = options.recipients.map(recipient => ({
        to: [{ email: recipient.email, name: recipient.name }],
        dynamicTemplateData: recipient.dynamicTemplateData || {}
      }));

      const msg: any = {
        from: options.from,
        templateId: options.templateId,
        personalizations,
        categories: options.categories || ['french-learning-app'],
        customArgs: options.customArgs || {},
      };

      // Add subject if provided (for non-template emails)
      if (options.subject) {
        msg.subject = options.subject;
      }

      // Add send time if specified
      if (options.sendAt) {
        msg.sendAt = options.sendAt;
      }

      await sgMail.sendMultiple(msg);
      console.log(`Bulk email sent to ${options.recipients.length} recipients`);
      return true;
    } catch (error) {
      console.error('Error sending bulk email:', error);
      return false;
    }
  }

  // Predefined email templates
  async sendWelcomeEmail(userEmail: string, userName: string): Promise<boolean> {
    return this.sendEmail({
      to: { email: userEmail, name: userName },
      subject: 'Bienvenue dans votre apprentissage du français !',
      html: this.getWelcomeEmailTemplate(userName),
      categories: ['welcome', 'onboarding']
    });
  }

  async sendPasswordResetEmail(userEmail: string, resetToken: string): Promise<boolean> {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;
    
    return this.sendEmail({
      to: { email: userEmail },
      subject: 'Réinitialisation de votre mot de passe',
      html: this.getPasswordResetTemplate(resetUrl),
      categories: ['password-reset', 'security']
    });
  }

  async sendLessonCompletionEmail(userEmail: string, userName: string, lessonTitle: string): Promise<boolean> {
    return this.sendEmail({
      to: { email: userEmail, name: userName },
      subject: `Félicitations ! Vous avez terminé "${lessonTitle}"`,
      html: this.getLessonCompletionTemplate(userName, lessonTitle),
      categories: ['lesson-completion', 'achievement']
    });
  }

  async sendWeeklyProgressEmail(userEmail: string, userName: string, progressData: any): Promise<boolean> {
    return this.sendEmail({
      to: { email: userEmail, name: userName },
      subject: 'Votre progrès de la semaine en français',
      html: this.getWeeklyProgressTemplate(userName, progressData),
      categories: ['weekly-progress', 'engagement']
    });
  }

  async sendSubscriptionEmail(userEmail: string, userName: string, planName: string, isUpgrade: boolean): Promise<boolean> {
    const subject = isUpgrade 
      ? `Merci pour votre mise à niveau vers ${planName}!`
      : `Bienvenue dans le plan ${planName}!`;

    return this.sendEmail({
      to: { email: userEmail, name: userName },
      subject,
      html: this.getSubscriptionTemplate(userName, planName, isUpgrade),
      categories: ['subscription', 'payment']
    });
  }

  // Email templates
  private getWelcomeEmailTemplate(userName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Bienvenue !</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Bienvenue dans votre apprentissage du français !</h1>
          </div>
          <div class="content">
            <h2>Bonjour ${userName} !</h2>
            <p>Nous sommes ravis de vous accueillir dans notre communauté d'apprentissage du français.</p>
            <p>Voici ce que vous pouvez faire maintenant :</p>
            <ul>
              <li>Commencer votre première leçon</li>
              <li>Personnaliser votre profil</li>
              <li>Définir vos objectifs d'apprentissage</li>
              <li>Explorer nos ressources interactives</li>
            </ul>
            <p style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">Commencer maintenant</a>
            </p>
            <p>Bonne chance dans votre apprentissage !</p>
            <p>L'équipe French Learning App</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getPasswordResetTemplate(resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Réinitialisation du mot de passe</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #DC2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; background: #DC2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; }
          .warning { background: #FEF3C7; border: 1px solid #F59E0B; padding: 10px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Réinitialisation de votre mot de passe</h1>
          </div>
          <div class="content">
            <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
            <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Réinitialiser le mot de passe</a>
            </p>
            <div class="warning">
              <strong>Important :</strong> Ce lien expirera dans 1 heure pour des raisons de sécurité.
            </div>
            <p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.</p>
            <p>L'équipe French Learning App</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getLessonCompletionTemplate(userName: string, lessonTitle: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Leçon terminée !</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10B981; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; }
          .achievement { background: #ECFDF5; border: 1px solid #10B981; padding: 15px; border-radius: 5px; text-align: center; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Félicitations ${userName} !</h1>
          </div>
          <div class="content">
            <div class="achievement">
              <h2>Leçon terminée avec succès !</h2>
              <p><strong>"${lessonTitle}"</strong></p>
            </div>
            <p>Excellent travail ! Vous venez de franchir une nouvelle étape dans votre apprentissage du français.</p>
            <p>Continuez sur votre lancée :</p>
            <ul>
              <li>Passez à la leçon suivante</li>
              <li>Révisez vos nouveaux mots de vocabulaire</li>
              <li>Pratiquez avec nos exercices interactifs</li>
            </ul>
            <p style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/lessons" class="button">Continuer l'apprentissage</a>
            </p>
            <p>Continuez comme ça !</p>
            <p>L'équipe French Learning App</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getWeeklyProgressTemplate(userName: string, progressData: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Votre progrès hebdomadaire</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #7C3AED; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; background: #7C3AED; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; }
          .stats { display: flex; justify-content: space-around; margin: 20px 0; }
          .stat { text-align: center; background: white; padding: 15px; border-radius: 5px; flex: 1; margin: 0 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Votre progrès de la semaine</h1>
          </div>
          <div class="content">
            <h2>Bonjour ${userName} !</h2>
            <p>Voici un résumé de vos accomplissements cette semaine :</p>
            <div class="stats">
              <div class="stat">
                <h3>${progressData.lessonsCompleted || 0}</h3>
                <p>Leçons terminées</p>
              </div>
              <div class="stat">
                <h3>${progressData.studyTime || 0}min</h3>
                <p>Temps d'étude</p>
              </div>
              <div class="stat">
                <h3>${progressData.wordsLearned || 0}</h3>
                <p>Nouveaux mots</p>
              </div>
            </div>
            <p>Continuez votre excellent travail ! Votre régularité est la clé du succès.</p>
            <p style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/progress" class="button">Voir les détails</a>
            </p>
            <p>À bientôt pour de nouveaux apprentissages !</p>
            <p>L'équipe French Learning App</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getSubscriptionTemplate(userName: string, planName: string, isUpgrade: boolean): string {
    const title = isUpgrade ? 'Mise à niveau réussie !' : 'Bienvenue dans votre nouveau plan !';
    const message = isUpgrade 
      ? `Merci d'avoir fait confiance à notre plateforme en passant au plan ${planName}.`
      : `Bienvenue dans le plan ${planName} ! Vous avez maintenant accès à toutes les fonctionnalités premium.`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #F59E0B; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; background: #F59E0B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; }
          .features { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✨ ${title}</h1>
          </div>
          <div class="content">
            <h2>Bonjour ${userName} !</h2>
            <p>${message}</p>
            <div class="features">
              <h3>Vos nouveaux avantages :</h3>
              <ul>
                <li>Accès illimité à toutes les leçons</li>
                <li>Exercices interactifs avancés</li>
                <li>Suivi détaillé des progrès</li>
                <li>Support prioritaire</li>
                <li>Contenu exclusif</li>
              </ul>
            </div>
            <p style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">Explorer vos nouveaux avantages</a>
            </p>
            <p>Merci de votre confiance !</p>
            <p>L'équipe French Learning App</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

// Singleton instance
let emailService: EmailService | null = null;

export const getEmailService = (): EmailService => {
  if (!emailService) {
    emailService = new EmailService();
  }
  return emailService;
};
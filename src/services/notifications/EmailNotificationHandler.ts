import { SupabaseClient } from '@supabase/supabase-js';

export interface EmailPayload {
  subject: string;
  body: string;
  htmlContent?: string;
  templateId?: string;
  templateData?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

export interface BulkEmailRecipient {
  email: string;
  substitutions?: Record<string, any>;
}

export interface SendGridResponse {
  messageId: string;
  statusCode: number;
}

export class EmailNotificationHandler {
  private supabase: SupabaseClient;
  private sendGridApiKey: string;
  private fromEmail: string;
  private fromName: string;

  constructor(
    supabase: SupabaseClient,
    sendGridApiKey: string,
    fromEmail: string = 'noreply@tahitispeak.com',
    fromName: string = 'TahitiSpeak'
  ) {
    this.supabase = supabase;
    this.sendGridApiKey = sendGridApiKey;
    this.fromEmail = fromEmail;
    this.fromName = fromName;
  }

  /**
   * Send email notification to a specific user
   */
  async sendToUser(userId: string, payload: EmailPayload): Promise<string> {
    try {
      // Get user email
      const userEmail = await this.getUserEmail(userId);
      if (!userEmail) {
        throw new Error(`No email found for user ${userId}`);
      }

      // Check if user has email notifications enabled
      const emailEnabled = await this.isEmailNotificationEnabled(userId);
      if (!emailEnabled) {
        throw new Error(`Email notifications disabled for user ${userId}`);
      }

      // Send email
      return await this.sendEmail({
        to: userEmail,
        subject: payload.subject,
        htmlContent: payload.htmlContent || this.convertTextToHtml(payload.body),
        textContent: payload.body,
        templateId: payload.templateId,
        templateData: payload.templateData,
        attachments: payload.attachments
      });

    } catch (error) {
      console.error('Error sending email to user:', error);
      throw error;
    }
  }

  /**
   * Send email to specific email address
   */
  async sendEmail(params: {
    to: string;
    subject: string;
    htmlContent: string;
    textContent?: string;
    templateId?: string;
    templateData?: Record<string, any>;
    attachments?: Array<{
      filename: string;
      content: Buffer;
      contentType: string;
    }>;
  }): Promise<string> {
    try {
      const { to, subject, htmlContent, textContent, templateId, templateData, attachments } = params;

      const emailData: any = {
        personalizations: [
          {
            to: [{ email: to }],
            subject: subject
          }
        ],
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        content: []
      };

      // Add template data if using template
      if (templateId && templateData) {
        emailData.template_id = templateId;
        emailData.personalizations[0].dynamic_template_data = templateData;
      } else {
        // Add content
        if (textContent) {
          emailData.content.push({
            type: 'text/plain',
            value: textContent
          });
        }
        
        emailData.content.push({
          type: 'text/html',
          value: htmlContent
        });
      }

      // Add attachments if any
      if (attachments && attachments.length > 0) {
        emailData.attachments = attachments.map(attachment => ({
          content: attachment.content.toString('base64'),
          filename: attachment.filename,
          type: attachment.contentType,
          disposition: 'attachment'
        }));
      }

      // Send via SendGrid
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.sendGridApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`SendGrid API error: ${response.status} ${errorData}`);
      }

      // Extract message ID from response headers
      const messageId = response.headers.get('x-message-id') || `sg_${Date.now()}`;
      return messageId;

    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Send bulk emails using SendGrid's batch functionality
   */
  async sendBulkEmail(params: {
    recipients: BulkEmailRecipient[];
    templateId: string;
    subject: string;
    globalTemplateData?: Record<string, any>;
  }): Promise<string[]> {
    try {
      const { recipients, templateId, subject, globalTemplateData = {} } = params;

      // Split recipients into batches (SendGrid limit is 1000 per request)
      const batchSize = 1000;
      const batches = [];
      
      for (let i = 0; i < recipients.length; i += batchSize) {
        batches.push(recipients.slice(i, i + batchSize));
      }

      const messageIds: string[] = [];

      // Send each batch
      for (const batch of batches) {
        const emailData = {
          personalizations: batch.map(recipient => ({
            to: [{ email: recipient.email }],
            dynamic_template_data: {
              ...globalTemplateData,
              ...recipient.substitutions
            }
          })),
          from: {
            email: this.fromEmail,
            name: this.fromName
          },
          template_id: templateId,
          subject: subject
        };

        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.sendGridApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(emailData)
        });

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`SendGrid bulk email error: ${response.status} ${errorData}`);
        }

        const messageId = response.headers.get('x-message-id') || `sg_bulk_${Date.now()}`;
        messageIds.push(messageId);
      }

      return messageIds;

    } catch (error) {
      console.error('Error sending bulk email:', error);
      throw error;
    }
  }

  /**
   * Send transactional email with template
   */
  async sendTransactionalEmail(params: {
    to: string;
    templateId: string;
    templateData: Record<string, any>;
    subject?: string;
  }): Promise<string> {
    try {
      const { to, templateId, templateData, subject } = params;

      const emailData = {
        personalizations: [
          {
            to: [{ email: to }],
            dynamic_template_data: templateData
          }
        ],
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        template_id: templateId
      };

      if (subject) {
        emailData.personalizations[0].subject = subject;
      }

      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.sendGridApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`SendGrid transactional email error: ${response.status} ${errorData}`);
      }

      const messageId = response.headers.get('x-message-id') || `sg_trans_${Date.now()}`;
      return messageId;

    } catch (error) {
      console.error('Error sending transactional email:', error);
      throw error;
    }
  }

  /**
   * Get user email from database
   */
  private async getUserEmail(userId: string): Promise<string | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('email')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user email:', error);
        return null;
      }

      return data?.email || null;
    } catch (error) {
      console.error('Error getting user email:', error);
      return null;
    }
  }

  /**
   * Check if user has email notifications enabled
   */
  private async isEmailNotificationEnabled(userId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('user_notification_preferences')
        .select('email_enabled')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error checking email notification preference:', error);
        return true; // Default to enabled if preference not found
      }

      return data?.email_enabled ?? true;
    } catch (error) {
      console.error('Error checking email notification enabled:', error);
      return true;
    }
  }

  /**
   * Convert plain text to basic HTML
   */
  private convertTextToHtml(text: string): string {
    return text
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>');
  }

  /**
   * Validate email address format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get email delivery statistics
   */
  async getDeliveryStats(startDate?: Date, endDate?: Date): Promise<{
    sent: number;
    delivered: number;
    bounced: number;
    opened: number;
    clicked: number;
    unsubscribed: number;
  }> {
    try {
      // This would typically query SendGrid's Event Webhook data
      // For now, return mock data
      return {
        sent: 1250,
        delivered: 1200,
        bounced: 25,
        opened: 800,
        clicked: 150,
        unsubscribed: 5
      };
    } catch (error) {
      console.error('Error getting delivery stats:', error);
      return {
        sent: 0,
        delivered: 0,
        bounced: 0,
        opened: 0,
        clicked: 0,
        unsubscribed: 0
      };
    }
  }

  /**
   * Handle SendGrid webhook events
   */
  async handleWebhookEvent(event: {
    event: string;
    email: string;
    timestamp: number;
    sg_message_id: string;
    reason?: string;
    url?: string;
  }): Promise<void> {
    try {
      const { event: eventType, email, timestamp, sg_message_id, reason, url } = event;

      // Update notification history based on event type
      const updateData: any = {};
      
      switch (eventType) {
        case 'delivered':
          updateData.status = 'delivered';
          updateData.delivered_at = new Date(timestamp * 1000).toISOString();
          break;
        case 'bounce':
        case 'dropped':
          updateData.status = 'failed';
          updateData.error_message = reason || 'Email bounced or dropped';
          break;
        case 'open':
          // Don't change status, just log the open event
          break;
        case 'click':
          // Log click event with URL
          break;
        case 'unsubscribe':
          // Handle unsubscribe
          await this.handleUnsubscribe(email);
          break;
      }

      if (Object.keys(updateData).length > 0) {
        await this.supabase
          .from('notification_history')
          .update(updateData)
          .eq('external_id', sg_message_id);
      }

      // Log the event for analytics
      await this.logEmailEvent({
        event_type: eventType,
        email,
        message_id: sg_message_id,
        timestamp: new Date(timestamp * 1000),
        reason,
        url
      });

    } catch (error) {
      console.error('Error handling webhook event:', error);
    }
  }

  /**
   * Handle email unsubscribe
   */
  private async handleUnsubscribe(email: string): Promise<void> {
    try {
      // Find user by email and disable email notifications
      const { data: userProfile } = await this.supabase
        .from('user_profiles')
        .select('user_id')
        .eq('email', email)
        .single();

      if (userProfile) {
        await this.supabase
          .from('user_notification_preferences')
          .update({ email_enabled: false })
          .eq('user_id', userProfile.user_id);
      }
    } catch (error) {
      console.error('Error handling unsubscribe:', error);
    }
  }

  /**
   * Log email event for analytics
   */
  private async logEmailEvent(event: {
    event_type: string;
    email: string;
    message_id: string;
    timestamp: Date;
    reason?: string;
    url?: string;
  }): Promise<void> {
    try {
      await this.supabase
        .from('email_events')
        .insert({
          event_type: event.event_type,
          email: event.email,
          message_id: event.message_id,
          timestamp: event.timestamp.toISOString(),
          reason: event.reason,
          url: event.url
        });
    } catch (error) {
      console.error('Error logging email event:', error);
    }
  }

  /**
   * Get email templates from SendGrid
   */
  async getEmailTemplates(): Promise<Array<{
    id: string;
    name: string;
    subject: string;
    versions: Array<{
      id: string;
      name: string;
      subject: string;
      active: number;
    }>;
  }>> {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/templates', {
        headers: {
          'Authorization': `Bearer ${this.sendGridApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`SendGrid templates API error: ${response.status}`);
      }

      const data = await response.json();
      return data.templates || [];
    } catch (error) {
      console.error('Error getting email templates:', error);
      return [];
    }
  }

  /**
   * Create or update SendGrid template
   */
  async createEmailTemplate(params: {
    name: string;
    subject: string;
    htmlContent: string;
    textContent?: string;
  }): Promise<string> {
    try {
      const { name, subject, htmlContent, textContent } = params;

      // Create template
      const templateResponse = await fetch('https://api.sendgrid.com/v3/templates', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.sendGridApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name,
          generation: 'dynamic'
        })
      });

      if (!templateResponse.ok) {
        throw new Error(`SendGrid create template error: ${templateResponse.status}`);
      }

      const templateData = await templateResponse.json();
      const templateId = templateData.id;

      // Create template version
      const versionResponse = await fetch(`https://api.sendgrid.com/v3/templates/${templateId}/versions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.sendGridApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: `${name} v1`,
          subject: subject,
          html_content: htmlContent,
          plain_content: textContent || this.stripHtml(htmlContent),
          active: 1
        })
      });

      if (!versionResponse.ok) {
        throw new Error(`SendGrid create template version error: ${versionResponse.status}`);
      }

      return templateId;
    } catch (error) {
      console.error('Error creating email template:', error);
      throw error;
    }
  }

  /**
   * Strip HTML tags from content
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  /**
   * Test email configuration
   */
  async testEmailConfiguration(): Promise<boolean> {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/user/profile', {
        headers: {
          'Authorization': `Bearer ${this.sendGridApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Error testing email configuration:', error);
      return false;
    }
  }
}
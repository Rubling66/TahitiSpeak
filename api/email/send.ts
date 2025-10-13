import { Request, Response } from 'express';
import { EmailService } from '../../src/services/email/EmailService';
import { EmailRequest, BulkEmailRequest } from '../../src/types/email';
import { supabase } from '../../src/lib/supabase';

const emailService = new EmailService(supabase);

/**
 * Send a single email
 * POST /api/email/send
 */
export async function sendEmail(req: Request, res: Response) {
  try {
    const emailRequest: EmailRequest = req.body;

    // Validate required fields
    if (!emailRequest.to || !emailRequest.subject || (!emailRequest.content && !emailRequest.templateId)) {
      return res.status(400).json({
        error: 'Missing required fields: to, subject, and either content or templateId'
      });
    }

    // Send email
    const result = await emailService.sendEmail(emailRequest);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Email sent successfully'
    });

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      error: 'Failed to send email',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Send bulk emails
 * POST /api/email/send/bulk
 */
export async function sendBulkEmails(req: Request, res: Response) {
  try {
    const bulkRequest: BulkEmailRequest = req.body;

    // Validate required fields
    if (!bulkRequest.emails || !Array.isArray(bulkRequest.emails) || bulkRequest.emails.length === 0) {
      return res.status(400).json({
        error: 'Missing or invalid emails array'
      });
    }

    // Validate each email in the bulk request
    for (const email of bulkRequest.emails) {
      if (!email.to || !email.subject || (!email.content && !email.templateId)) {
        return res.status(400).json({
          error: 'Each email must have to, subject, and either content or templateId'
        });
      }
    }

    // Send bulk emails
    const results = await emailService.sendBulkEmails(bulkRequest);

    res.status(200).json({
      success: true,
      data: results,
      message: `Bulk email operation completed. ${results.successful.length} sent, ${results.failed.length} failed`
    });

  } catch (error) {
    console.error('Error sending bulk emails:', error);
    res.status(500).json({
      error: 'Failed to send bulk emails',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Schedule an email
 * POST /api/email/schedule
 */
export async function scheduleEmail(req: Request, res: Response) {
  try {
    const { emailRequest, scheduledAt } = req.body;

    // Validate required fields
    if (!emailRequest || !scheduledAt) {
      return res.status(400).json({
        error: 'Missing required fields: emailRequest and scheduledAt'
      });
    }

    if (!emailRequest.to || !emailRequest.subject || (!emailRequest.content && !emailRequest.templateId)) {
      return res.status(400).json({
        error: 'Email request must have to, subject, and either content or templateId'
      });
    }

    // Validate scheduledAt is in the future
    const scheduleDate = new Date(scheduledAt);
    if (scheduleDate <= new Date()) {
      return res.status(400).json({
        error: 'Scheduled time must be in the future'
      });
    }

    // Schedule email
    const result = await emailService.scheduleEmail(emailRequest, scheduleDate);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Email scheduled successfully'
    });

  } catch (error) {
    console.error('Error scheduling email:', error);
    res.status(500).json({
      error: 'Failed to schedule email',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get email status
 * GET /api/email/status/:emailId
 */
export async function getEmailStatus(req: Request, res: Response) {
  try {
    const { emailId } = req.params;

    if (!emailId) {
      return res.status(400).json({
        error: 'Email ID is required'
      });
    }

    // Get email status from queue
    const status = await emailService.getQueueStatus();
    
    // Find specific email in queue or logs
    // This would need to be implemented based on your queue system
    
    res.status(200).json({
      success: true,
      data: { emailId, status: 'pending' }, // Placeholder
      message: 'Email status retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting email status:', error);
    res.status(500).json({
      error: 'Failed to get email status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Cancel scheduled email
 * DELETE /api/email/schedule/:emailId
 */
export async function cancelScheduledEmail(req: Request, res: Response) {
  try {
    const { emailId } = req.params;

    if (!emailId) {
      return res.status(400).json({
        error: 'Email ID is required'
      });
    }

    // Cancel scheduled email
    const result = await emailService.cancelQueuedEmail(emailId);

    if (!result) {
      return res.status(404).json({
        error: 'Scheduled email not found or cannot be cancelled'
      });
    }

    res.status(200).json({
      success: true,
      data: result,
      message: 'Scheduled email cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling scheduled email:', error);
    res.status(500).json({
      error: 'Failed to cancel scheduled email',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
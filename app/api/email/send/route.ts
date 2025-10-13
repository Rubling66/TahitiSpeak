import { NextRequest, NextResponse } from 'next/server';
import { emailService, EmailOptions } from '@/lib/email/EmailService';
import { emailAutomation } from '@/lib/email/EmailAutomation';
import jwt from 'jsonwebtoken';

interface SendEmailRequest {
  type: 'single' | 'bulk' | 'template' | 'automation';
  emails?: EmailOptions[];
  email?: EmailOptions;
  templateType?: 'welcome' | 'password_reset' | 'lesson_completion' | 'weekly_progress' | 'subscription';
  recipients?: Array<{
    email: string;
    name?: string;
    data?: Record<string, any>;
  }>;
  automationEvent?: {
    event: string;
    userId: string;
    data: Record<string, any>;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Verify JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return NextResponse.json({ error: 'JWT secret not configured' }, { status: 500 });
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, jwtSecret) as any;
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Initialize email service
    await emailService.initialize();

    const body: SendEmailRequest = await request.json();

    switch (body.type) {
      case 'single':
        return await handleSingleEmail(body.email!);

      case 'bulk':
        return await handleBulkEmails(body.emails!);

      case 'template':
        return await handleTemplateEmail(body.templateType!, body.recipients!);

      case 'automation':
        return await handleAutomationTrigger(body.automationEvent!);

      default:
        return NextResponse.json({ error: 'Invalid email type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json(
      { error: 'Failed to send email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function handleSingleEmail(emailOptions: EmailOptions) {
  try {
    const messageId = await emailService.sendEmail(emailOptions);
    
    return NextResponse.json({
      success: true,
      messageId,
      message: 'Email sent successfully',
    });
  } catch (error) {
    throw new Error(`Failed to send single email: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function handleBulkEmails(emails: EmailOptions[]) {
  try {
    if (!Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: 'No emails provided' }, { status: 400 });
    }

    if (emails.length > 1000) {
      return NextResponse.json({ error: 'Too many emails (max 1000)' }, { status: 400 });
    }

    const messageIds = await emailService.sendBulkEmails(emails);
    
    const successCount = messageIds.filter(id => !id.startsWith('failed_')).length;
    const failureCount = messageIds.length - successCount;

    return NextResponse.json({
      success: true,
      messageIds,
      summary: {
        total: emails.length,
        successful: successCount,
        failed: failureCount,
      },
      message: `Bulk email sending completed: ${successCount} successful, ${failureCount} failed`,
    });
  } catch (error) {
    throw new Error(`Failed to send bulk emails: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function handleTemplateEmail(
  templateType: string,
  recipients: Array<{ email: string; name?: string; data?: Record<string, any> }>
) {
  try {
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: 'No recipients provided' }, { status: 400 });
    }

    const results = [];

    for (const recipient of recipients) {
      try {
        let messageId: string;

        switch (templateType) {
          case 'welcome':
            messageId = await emailService.sendWelcomeEmail(
              recipient.email,
              recipient.name || 'User'
            );
            break;

          case 'password_reset':
            if (!recipient.data?.resetToken) {
              throw new Error('Reset token required for password reset email');
            }
            messageId = await emailService.sendPasswordResetEmail(
              recipient.email,
              recipient.data.resetToken
            );
            break;

          case 'lesson_completion':
            if (!recipient.data?.lessonTitle) {
              throw new Error('Lesson title required for lesson completion email');
            }
            messageId = await emailService.sendLessonCompletionEmail(
              recipient.email,
              recipient.name || 'User',
              recipient.data.lessonTitle
            );
            break;

          case 'weekly_progress':
            messageId = await emailService.sendWeeklyProgressEmail(
              recipient.email,
              recipient.name || 'User',
              recipient.data || {}
            );
            break;

          case 'subscription':
            if (!recipient.data?.subscriptionType) {
              throw new Error('Subscription type required for subscription email');
            }
            messageId = await emailService.sendSubscriptionEmail(
              recipient.email,
              recipient.name || 'User',
              recipient.data.subscriptionType
            );
            break;

          default:
            throw new Error(`Unknown template type: ${templateType}`);
        }

        results.push({
          email: recipient.email,
          success: true,
          messageId,
        });
      } catch (error) {
        results.push({
          email: recipient.email,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: recipients.length,
        successful: successCount,
        failed: failureCount,
      },
      message: `Template email sending completed: ${successCount} successful, ${failureCount} failed`,
    });
  } catch (error) {
    throw new Error(`Failed to send template emails: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function handleAutomationTrigger(automationEvent: {
  event: string;
  userId: string;
  data: Record<string, any>;
}) {
  try {
    await emailAutomation.triggerEvent(
      automationEvent.event,
      automationEvent.userId,
      automationEvent.data
    );

    return NextResponse.json({
      success: true,
      message: 'Automation triggered successfully',
      event: automationEvent.event,
      userId: automationEvent.userId,
    });
  } catch (error) {
    throw new Error(`Failed to trigger automation: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// GET endpoint for email templates and configuration
export async function GET(request: NextRequest) {
  try {
    // Verify JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return NextResponse.json({ error: 'JWT secret not configured' }, { status: 500 });
    }

    try {
      jwt.verify(token, jwtSecret);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'templates':
        return NextResponse.json({
          templates: [
            {
              id: 'welcome',
              name: 'Welcome Email',
              description: 'Welcome new users to TahitiSpeak',
              requiredData: [],
            },
            {
              id: 'password_reset',
              name: 'Password Reset',
              description: 'Send password reset instructions',
              requiredData: ['resetToken'],
            },
            {
              id: 'lesson_completion',
              name: 'Lesson Completion',
              description: 'Congratulate users on completing lessons',
              requiredData: ['lessonTitle'],
            },
            {
              id: 'weekly_progress',
              name: 'Weekly Progress',
              description: 'Send weekly learning progress summary',
              requiredData: ['lessonsCompleted', 'storiesRead', 'studyTime', 'streak'],
            },
            {
              id: 'subscription',
              name: 'Subscription Welcome',
              description: 'Welcome premium subscribers',
              requiredData: ['subscriptionType'],
            },
          ],
        });

      case 'campaigns':
        return NextResponse.json({
          campaigns: emailAutomation.getAllCampaigns().map(campaign => ({
            id: campaign.id,
            name: campaign.name,
            type: campaign.type,
            status: campaign.status,
            emailCount: campaign.emails.length,
            analytics: campaign.analytics,
          })),
        });

      case 'automation_events':
        return NextResponse.json({
          events: [
            {
              event: 'user.registered',
              description: 'User creates a new account',
              requiredData: ['userEmail', 'userName'],
            },
            {
              event: 'lesson.completed',
              description: 'User completes a lesson',
              requiredData: ['userEmail', 'userName', 'lessonTitle'],
            },
            {
              event: 'user.inactive',
              description: 'User has been inactive for specified days',
              requiredData: ['userEmail', 'userName', 'daysInactive'],
            },
            {
              event: 'streak.achieved',
              description: 'User achieves a learning streak milestone',
              requiredData: ['userEmail', 'userName', 'streakDays'],
            },
            {
              event: 'user.churned',
              description: 'User has been inactive for extended period',
              requiredData: ['userEmail', 'userName', 'daysInactive'],
            },
          ],
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Email GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email data' },
      { status: 500 }
    );
  }
}
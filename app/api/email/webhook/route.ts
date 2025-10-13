import { NextRequest, NextResponse } from 'next/server';
import { emailAutomation } from '@/lib/email/EmailAutomation';
import { emailService } from '@/lib/email/EmailService';

// SendGrid webhook signature verification
function verifyWebhookSignature(payload: string, signature: string, timestamp: string): boolean {
  const webhookSecret = process.env.SENDGRID_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.warn('SENDGRID_WEBHOOK_SECRET not configured');
    return true; // Allow in development
  }

  try {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(timestamp + payload)
      .digest('base64');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'base64'),
      Buffer.from(expectedSignature, 'base64')
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-twilio-email-event-webhook-signature') || '';
    const timestamp = request.headers.get('x-twilio-email-event-webhook-timestamp') || '';

    // Verify webhook signature in production
    if (process.env.NODE_ENV === 'production' && !verifyWebhookSignature(body, signature, timestamp)) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    const events = JSON.parse(body);

    for (const event of events) {
      await processEmailEvent(event);
    }

    return NextResponse.json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

async function processEmailEvent(event: any) {
  try {
    const {
      event: eventType,
      email,
      timestamp,
      sg_message_id: messageId,
      url,
      useragent,
      ip,
      category,
      asm_group_id,
      reason,
      status,
      response,
      attempt,
      type,
      bounce_classification,
      smtp_id,
    } = event;

    // Track email analytics
    await emailService.trackEmailEvent({
      messageId: messageId || `unknown_${timestamp}`,
      email,
      event: eventType,
      timestamp: parseInt(timestamp) * 1000, // Convert to milliseconds
      url,
      userAgent: useragent,
      ip,
    });

    // Update campaign analytics if category is present
    if (category && Array.isArray(category)) {
      for (const cat of category) {
        // Check if this is a campaign category
        const campaign = emailAutomation.getCampaign(cat);
        if (campaign) {
          updateCampaignAnalytics(cat, eventType);
        }
      }
    }

    // Handle specific event types
    switch (eventType) {
      case 'delivered':
        console.log(`Email delivered to ${email}`);
        break;

      case 'opened':
        console.log(`Email opened by ${email}`);
        // Trigger engagement tracking
        await handleEmailOpened(email, messageId, category);
        break;

      case 'clicked':
        console.log(`Email link clicked by ${email}: ${url}`);
        // Trigger click tracking
        await handleEmailClicked(email, messageId, url, category);
        break;

      case 'bounced':
        console.log(`Email bounced for ${email}: ${reason}`);
        await handleEmailBounced(email, messageId, reason, bounce_classification);
        break;

      case 'dropped':
        console.log(`Email dropped for ${email}: ${reason}`);
        await handleEmailDropped(email, messageId, reason);
        break;

      case 'spam_report':
        console.log(`Spam report from ${email}`);
        await handleSpamReport(email, messageId);
        break;

      case 'unsubscribe':
        console.log(`Unsubscribe from ${email}`);
        await handleUnsubscribe(email, messageId, asm_group_id);
        break;

      case 'group_unsubscribe':
        console.log(`Group unsubscribe from ${email} for group ${asm_group_id}`);
        await handleGroupUnsubscribe(email, messageId, asm_group_id);
        break;

      case 'group_resubscribe':
        console.log(`Group resubscribe from ${email} for group ${asm_group_id}`);
        await handleGroupResubscribe(email, messageId, asm_group_id);
        break;

      default:
        console.log(`Unhandled email event: ${eventType} for ${email}`);
    }
  } catch (error) {
    console.error('Error processing email event:', error);
  }
}

function updateCampaignAnalytics(campaignId: string, eventType: string) {
  switch (eventType) {
    case 'delivered':
      emailAutomation.updateCampaignAnalytics(campaignId, 'delivered');
      break;
    case 'opened':
      emailAutomation.updateCampaignAnalytics(campaignId, 'opened');
      break;
    case 'clicked':
      emailAutomation.updateCampaignAnalytics(campaignId, 'clicked');
      break;
    case 'unsubscribe':
    case 'group_unsubscribe':
      emailAutomation.updateCampaignAnalytics(campaignId, 'unsubscribed');
      break;
  }
}

async function handleEmailOpened(email: string, messageId: string, categories?: string[]) {
  try {
    // Store email open event in database
    // In a real implementation, you would save this to your database
    console.log(`Tracking email open: ${email} - ${messageId}`);

    // Trigger follow-up automation if needed
    if (categories?.includes('welcome-series')) {
      // User engaged with welcome email, maybe send next in series
      await emailAutomation.triggerEvent('email.opened', email, {
        messageId,
        categories,
        userEmail: email,
      });
    }
  } catch (error) {
    console.error('Error handling email opened:', error);
  }
}

async function handleEmailClicked(email: string, messageId: string, url: string, categories?: string[]) {
  try {
    // Store email click event in database
    console.log(`Tracking email click: ${email} - ${url}`);

    // Trigger engagement automation
    await emailAutomation.triggerEvent('email.clicked', email, {
      messageId,
      url,
      categories,
      userEmail: email,
    });
  } catch (error) {
    console.error('Error handling email clicked:', error);
  }
}

async function handleEmailBounced(email: string, messageId: string, reason: string, classification?: string) {
  try {
    console.log(`Email bounced: ${email} - ${reason} (${classification})`);

    // Handle different bounce types
    if (classification === 'Invalid' || classification === 'Reputation') {
      // Hard bounce - remove from mailing list
      await removeFromMailingList(email, 'hard_bounce');
    } else {
      // Soft bounce - retry later or flag for review
      await flagForReview(email, 'soft_bounce', reason);
    }
  } catch (error) {
    console.error('Error handling email bounced:', error);
  }
}

async function handleEmailDropped(email: string, messageId: string, reason: string) {
  try {
    console.log(`Email dropped: ${email} - ${reason}`);

    // Handle dropped emails based on reason
    if (reason.includes('Unsubscribed Address')) {
      await removeFromMailingList(email, 'unsubscribed');
    } else if (reason.includes('Bounced Address')) {
      await removeFromMailingList(email, 'bounced');
    } else {
      await flagForReview(email, 'dropped', reason);
    }
  } catch (error) {
    console.error('Error handling email dropped:', error);
  }
}

async function handleSpamReport(email: string, messageId: string) {
  try {
    console.log(`Spam report: ${email}`);

    // Immediately unsubscribe and flag
    await removeFromMailingList(email, 'spam_report');
    await flagForReview(email, 'spam_report', 'User reported email as spam');
  } catch (error) {
    console.error('Error handling spam report:', error);
  }
}

async function handleUnsubscribe(email: string, messageId: string, groupId?: number) {
  try {
    console.log(`Unsubscribe: ${email} from group ${groupId || 'all'}`);

    if (groupId) {
      await unsubscribeFromGroup(email, groupId);
    } else {
      await removeFromMailingList(email, 'unsubscribed');
    }
  } catch (error) {
    console.error('Error handling unsubscribe:', error);
  }
}

async function handleGroupUnsubscribe(email: string, messageId: string, groupId: number) {
  try {
    console.log(`Group unsubscribe: ${email} from group ${groupId}`);
    await unsubscribeFromGroup(email, groupId);
  } catch (error) {
    console.error('Error handling group unsubscribe:', error);
  }
}

async function handleGroupResubscribe(email: string, messageId: string, groupId: number) {
  try {
    console.log(`Group resubscribe: ${email} to group ${groupId}`);
    await resubscribeToGroup(email, groupId);
  } catch (error) {
    console.error('Error handling group resubscribe:', error);
  }
}

// Helper functions for database operations
async function removeFromMailingList(email: string, reason: string) {
  try {
    // In a real implementation, update user preferences in database
    console.log(`Removing ${email} from mailing list: ${reason}`);
    
    // Example database operation:
    // await supabase
    //   .from('user_email_preferences')
    //   .update({ 
    //     email_enabled: false, 
    //     unsubscribe_reason: reason,
    //     unsubscribed_at: new Date().toISOString()
    //   })
    //   .eq('email', email);
  } catch (error) {
    console.error('Error removing from mailing list:', error);
  }
}

async function flagForReview(email: string, type: string, reason: string) {
  try {
    console.log(`Flagging ${email} for review: ${type} - ${reason}`);
    
    // In a real implementation, create a review record
    // await supabase
    //   .from('email_review_queue')
    //   .insert({
    //     email,
    //     type,
    //     reason,
    //     created_at: new Date().toISOString()
    //   });
  } catch (error) {
    console.error('Error flagging for review:', error);
  }
}

async function unsubscribeFromGroup(email: string, groupId: number) {
  try {
    console.log(`Unsubscribing ${email} from group ${groupId}`);
    
    // In a real implementation, update group preferences
    // await supabase
    //   .from('user_email_groups')
    //   .update({ subscribed: false })
    //   .eq('email', email)
    //   .eq('group_id', groupId);
  } catch (error) {
    console.error('Error unsubscribing from group:', error);
  }
}

async function resubscribeToGroup(email: string, groupId: number) {
  try {
    console.log(`Resubscribing ${email} to group ${groupId}`);
    
    // In a real implementation, update group preferences
    // await supabase
    //   .from('user_email_groups')
    //   .upsert({ 
    //     email, 
    //     group_id: groupId, 
    //     subscribed: true,
    //     resubscribed_at: new Date().toISOString()
    //   });
  } catch (error) {
    console.error('Error resubscribing to group:', error);
  }
}
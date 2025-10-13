const express = require('express');
const router = express.Router();

// Mock email service for testing
const mockEmailService = {
  async sendEmail(data) {
    return {
      id: `email_${Date.now()}`,
      status: 'sent',
      sentAt: new Date().toISOString(),
      ...data
    };
  },

  async sendBulkEmail(emails) {
    return emails.map((email, index) => ({
      id: `email_${Date.now()}_${index}`,
      status: 'sent',
      sentAt: new Date().toISOString(),
      ...email
    }));
  },

  async scheduleEmail(data) {
    return {
      id: `scheduled_${Date.now()}`,
      status: 'scheduled',
      scheduledFor: data.scheduledFor,
      ...data
    };
  },

  async getEmailStatus(emailId) {
    return {
      id: emailId,
      status: 'delivered',
      sentAt: new Date(Date.now() - 60000).toISOString(),
      deliveredAt: new Date().toISOString(),
      events: [
        { type: 'sent', timestamp: new Date(Date.now() - 60000).toISOString() },
        { type: 'delivered', timestamp: new Date().toISOString() }
      ]
    };
  }
};

// Email sending routes
router.post('/send', async (req, res) => {
  try {
    const { to, subject, template, data, provider } = req.body;

    if (!to || !subject || !template) {
      return res.status(400).json({
        error: 'Missing required fields: to, subject, template'
      });
    }

    const result = await mockEmailService.sendEmail({
      to,
      subject,
      template,
      data,
      provider: provider || 'sendgrid'
    });

    res.status(200).json({
      success: true,
      data: result,
      message: 'Email sent successfully'
    });

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      error: 'Failed to send email',
      details: error.message
    });
  }
});

router.post('/send/bulk', async (req, res) => {
  try {
    const { emails, template, provider } = req.body;

    if (!Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({
        error: 'Emails array is required'
      });
    }

    const results = await mockEmailService.sendBulkEmail(
      emails.map(email => ({ ...email, template, provider: provider || 'sendgrid' }))
    );

    res.status(200).json({
      success: true,
      data: {
        sent: results.length,
        results
      },
      message: `Successfully sent ${results.length} emails`
    });

  } catch (error) {
    console.error('Error sending bulk emails:', error);
    res.status(500).json({
      error: 'Failed to send bulk emails',
      details: error.message
    });
  }
});

router.post('/send/schedule', async (req, res) => {
  try {
    const { to, subject, template, data, scheduledFor, provider } = req.body;

    if (!to || !subject || !template || !scheduledFor) {
      return res.status(400).json({
        error: 'Missing required fields: to, subject, template, scheduledFor'
      });
    }

    const result = await mockEmailService.scheduleEmail({
      to,
      subject,
      template,
      data,
      scheduledFor,
      provider: provider || 'sendgrid'
    });

    res.status(200).json({
      success: true,
      data: result,
      message: 'Email scheduled successfully'
    });

  } catch (error) {
    console.error('Error scheduling email:', error);
    res.status(500).json({
      error: 'Failed to schedule email',
      details: error.message
    });
  }
});

router.get('/send/:emailId/status', async (req, res) => {
  try {
    const { emailId } = req.params;

    const status = await mockEmailService.getEmailStatus(emailId);

    res.status(200).json({
      success: true,
      data: status,
      message: 'Email status retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting email status:', error);
    res.status(500).json({
      error: 'Failed to get email status',
      details: error.message
    });
  }
});

// Template management routes
router.get('/templates', (req, res) => {
  const templates = [
    {
      id: 'welcome',
      name: 'Welcome Email',
      subject: 'Welcome to TahitiSpeak!',
      category: 'onboarding',
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'lesson-reminder',
      name: 'Lesson Reminder',
      subject: 'Time for your Tahitian lesson!',
      category: 'engagement',
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'achievement',
      name: 'Achievement Unlocked',
      subject: 'Congratulations! You unlocked a new achievement',
      category: 'gamification',
      isActive: true,
      createdAt: new Date().toISOString()
    }
  ];

  res.status(200).json({
    success: true,
    data: templates,
    message: 'Templates retrieved successfully'
  });
});

router.get('/templates/:templateId', (req, res) => {
  const { templateId } = req.params;
  
  const template = {
    id: templateId,
    name: 'Welcome Email',
    subject: 'Welcome to TahitiSpeak!',
    category: 'onboarding',
    isActive: true,
    content: '<h1>Welcome!</h1><p>Thank you for joining TahitiSpeak.</p>',
    variables: ['firstName', 'lastName'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  res.status(200).json({
    success: true,
    data: template,
    message: 'Template retrieved successfully'
  });
});

// Analytics routes
router.get('/analytics/summary', (req, res) => {
  const summary = {
    totalSent: 1250,
    totalDelivered: 1180,
    totalOpened: 590,
    totalClicked: 118,
    totalBounced: 45,
    totalComplaints: 5,
    totalUnsubscribed: 25,
    deliveryRate: 94.4,
    openRate: 50.0,
    clickRate: 10.0,
    bounceRate: 3.6,
    complaintRate: 0.4,
    unsubscribeRate: 2.1
  };

  res.status(200).json({
    success: true,
    data: summary,
    message: 'Analytics summary retrieved successfully'
  });
});

router.get('/analytics/delivery', (req, res) => {
  const metrics = {
    totalSent: 1250,
    delivered: 1180,
    bounced: 45,
    failed: 25,
    deliveryRate: 94.4,
    bounceRate: 3.6,
    failureRate: 2.0,
    providerBreakdown: {
      sendgrid: { sent: 750, delivered: 710, bounced: 25, failed: 15 },
      resend: { sent: 500, delivered: 470, bounced: 20, failed: 10 }
    },
    timeline: [
      { date: '2024-01-01', sent: 100, delivered: 95, bounced: 3, failed: 2 },
      { date: '2024-01-02', sent: 120, delivered: 115, bounced: 3, failed: 2 },
      { date: '2024-01-03', sent: 110, delivered: 105, bounced: 4, failed: 1 }
    ]
  };

  res.status(200).json({
    success: true,
    data: metrics,
    message: 'Delivery metrics retrieved successfully'
  });
});

// Preferences routes
router.get('/preferences/:userId', (req, res) => {
  const { userId } = req.params;
  
  const preferences = {
    userId,
    isSubscribed: true,
    marketing: true,
    notifications: true,
    lessonReminders: true,
    achievementAlerts: true,
    weeklyDigest: false,
    frequency: 'daily',
    language: 'en',
    timezone: 'Pacific/Tahiti',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  res.status(200).json({
    success: true,
    data: preferences,
    message: 'User preferences retrieved successfully'
  });
});

router.put('/preferences/:userId', (req, res) => {
  const { userId } = req.params;
  const updates = req.body;

  const updatedPreferences = {
    userId,
    isSubscribed: true,
    marketing: true,
    notifications: true,
    lessonReminders: true,
    achievementAlerts: true,
    weeklyDigest: false,
    frequency: 'daily',
    language: 'en',
    timezone: 'Pacific/Tahiti',
    ...updates,
    updatedAt: new Date().toISOString()
  };

  res.status(200).json({
    success: true,
    data: updatedPreferences,
    message: 'User preferences updated successfully'
  });
});

router.post('/preferences/unsubscribe', (req, res) => {
  const { userId, email, reason, feedback } = req.body;

  const result = {
    userId: userId || 'user_from_email',
    unsubscribedAt: new Date().toISOString(),
    reason: reason || 'user_request',
    feedback: feedback || null,
    isSubscribed: false
  };

  res.status(200).json({
    success: true,
    data: result,
    message: 'Successfully unsubscribed from all emails'
  });
});

// Webhook routes
router.post('/webhooks/sendgrid', (req, res) => {
  const events = req.body;
  
  console.log('Received SendGrid webhook:', events);
  
  res.status(200).json({
    success: true,
    message: 'Webhook processed successfully',
    eventsProcessed: Array.isArray(events) ? events.length : 1
  });
});

router.post('/webhooks/resend', (req, res) => {
  const event = req.body;
  
  console.log('Received Resend webhook:', event);
  
  res.status(200).json({
    success: true,
    message: 'Webhook processed successfully'
  });
});

router.get('/webhooks/events', (req, res) => {
  const events = [
    {
      id: 'event_1',
      type: 'delivered',
      emailId: 'email_123',
      timestamp: new Date().toISOString(),
      provider: 'sendgrid',
      recipient: 'user@example.com'
    },
    {
      id: 'event_2',
      type: 'opened',
      emailId: 'email_123',
      timestamp: new Date(Date.now() - 30000).toISOString(),
      provider: 'sendgrid',
      recipient: 'user@example.com'
    }
  ];

  res.status(200).json({
    success: true,
    data: events,
    pagination: {
      page: 1,
      limit: 50,
      total: events.length,
      totalPages: 1
    },
    message: 'Events retrieved successfully'
  });
});

module.exports = router;
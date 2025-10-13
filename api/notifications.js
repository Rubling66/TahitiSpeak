const express = require('express');
const router = express.Router();

// Mock notification service
const mockNotificationService = {
  async sendNotification(params) {
    console.log('Sending notification:', params);
    return {
      id: `notif_${Date.now()}`,
      status: 'sent',
      timestamp: new Date().toISOString()
    };
  },

  async scheduleNotification(params) {
    console.log('Scheduling notification:', params);
    return {
      id: `scheduled_${Date.now()}`,
      status: 'scheduled',
      scheduledFor: params.scheduledFor,
      timestamp: new Date().toISOString()
    };
  },

  async cancelNotification(notificationId) {
    console.log('Canceling notification:', notificationId);
    return {
      id: notificationId,
      status: 'cancelled',
      timestamp: new Date().toISOString()
    };
  },

  async getNotificationHistory(userId, options = {}) {
    const { page = 1, limit = 20, type, read } = options;
    
    // Mock notification history
    const notifications = [
      {
        id: 'notif_1',
        type: 'lesson_reminder',
        title: 'Time for your Tahitian lesson!',
        message: 'Don\'t forget to practice your daily Tahitian lesson.',
        data: { lessonId: 'lesson_123' },
        read: false,
        created_at: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'notif_2',
        type: 'achievement',
        title: 'Congratulations!',
        message: 'You\'ve completed 7 days in a row!',
        data: { achievementId: 'streak_7' },
        read: true,
        created_at: new Date(Date.now() - 7200000).toISOString()
      },
      {
        id: 'notif_3',
        type: 'social',
        title: 'New friend request',
        message: 'Marie wants to be your learning partner.',
        data: { fromUserId: 'user_456' },
        read: false,
        created_at: new Date(Date.now() - 10800000).toISOString()
      }
    ];

    // Filter by type if specified
    let filtered = notifications;
    if (type) {
      filtered = filtered.filter(n => n.type === type);
    }
    if (read !== undefined) {
      filtered = filtered.filter(n => n.read === read);
    }

    // Paginate
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedNotifications = filtered.slice(start, end);

    return {
      notifications: paginatedNotifications,
      pagination: {
        page,
        limit,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / limit)
      }
    };
  },

  async markAsRead(notificationId, userId) {
    console.log(`Marking notification ${notificationId} as read for user ${userId}`);
    return {
      id: notificationId,
      read: true,
      readAt: new Date().toISOString()
    };
  },

  async markAllAsRead(userId) {
    console.log(`Marking all notifications as read for user ${userId}`);
    return {
      updated: 5,
      timestamp: new Date().toISOString()
    };
  },

  async getUnreadCount(userId) {
    // Mock unread count
    return {
      count: 3,
      byType: {
        lesson_reminder: 1,
        social: 2,
        achievement: 0,
        system: 0
      }
    };
  },

  async getNotificationTemplates() {
    return [
      {
        id: 'lesson_reminder',
        name: 'Lesson Reminder',
        subject: 'Time for your Tahitian lesson!',
        body: 'Don\'t forget to practice your daily Tahitian lesson.',
        variables: ['userName', 'lessonName']
      },
      {
        id: 'achievement_unlock',
        name: 'Achievement Unlocked',
        subject: 'Congratulations! New achievement unlocked',
        body: 'You\'ve unlocked the achievement: {{achievementName}}',
        variables: ['userName', 'achievementName', 'achievementDescription']
      },
      {
        id: 'friend_request',
        name: 'Friend Request',
        subject: 'New friend request',
        body: '{{senderName}} wants to be your learning partner.',
        variables: ['userName', 'senderName']
      }
    ];
  }
};

// Mock preferences service
const mockPreferencesService = {
  async getUserPreferences(userId) {
    return {
      push_enabled: true,
      email_enabled: true,
      sms_enabled: false,
      quiet_hours_enabled: true,
      quiet_hours_start: '22:00',
      quiet_hours_end: '08:00',
      timezone: 'Pacific/Tahiti',
      notification_types: {
        lesson_reminders: true,
        achievements: true,
        social: true,
        marketing: false,
        system: true
      },
      frequency: {
        lesson_reminders: 'daily',
        achievements: 'immediate',
        social: 'immediate',
        marketing: 'weekly',
        system: 'immediate'
      }
    };
  },

  async updateUserPreferences(userId, preferences) {
    console.log(`Updating preferences for user ${userId}:`, preferences);
    return {
      ...preferences,
      updated_at: new Date().toISOString()
    };
  }
};

// Mock device token service
const mockDeviceTokenService = {
  async registerDeviceToken(userId, tokenData) {
    console.log(`Registering device token for user ${userId}:`, tokenData);
    return {
      id: `token_${Date.now()}`,
      user_id: userId,
      token: tokenData.token,
      platform: tokenData.platform,
      device_id: tokenData.deviceId,
      registered_at: new Date().toISOString()
    };
  },

  async unregisterDeviceToken(userId, token) {
    console.log(`Unregistering device token for user ${userId}: ${token}`);
    return {
      success: true,
      unregistered_at: new Date().toISOString()
    };
  },

  async getUserDeviceTokens(userId) {
    return [
      {
        id: 'token_1',
        token: 'fcm_token_web_123',
        platform: 'web',
        device_id: 'browser_123',
        active: true,
        registered_at: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'token_2',
        token: 'fcm_token_android_456',
        platform: 'android',
        device_id: 'device_456',
        active: true,
        registered_at: new Date(Date.now() - 172800000).toISOString()
      }
    ];
  }
};

// Notification management endpoints
router.post('/send', async (req, res) => {
  try {
    const { userId, type, title, message, data, channels = ['push'] } = req.body;

    if (!userId || !type || !title || !message) {
      return res.status(400).json({
        error: 'Missing required fields: userId, type, title, message'
      });
    }

    const result = await mockNotificationService.sendNotification({
      userId,
      type,
      title,
      message,
      data,
      channels
    });

    res.json({
      success: true,
      notification: result
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({
      error: 'Failed to send notification',
      details: error.message
    });
  }
});

router.post('/send-bulk', async (req, res) => {
  try {
    const { userIds, type, title, message, data, channels = ['push'] } = req.body;

    if (!userIds || !Array.isArray(userIds) || !type || !title || !message) {
      return res.status(400).json({
        error: 'Missing required fields: userIds (array), type, title, message'
      });
    }

    const results = [];
    for (const userId of userIds) {
      const result = await mockNotificationService.sendNotification({
        userId,
        type,
        title,
        message,
        data,
        channels
      });
      results.push(result);
    }

    res.json({
      success: true,
      notifications: results,
      sent_count: results.length
    });
  } catch (error) {
    console.error('Error sending bulk notifications:', error);
    res.status(500).json({
      error: 'Failed to send bulk notifications',
      details: error.message
    });
  }
});

router.post('/schedule', async (req, res) => {
  try {
    const { userId, type, title, message, data, scheduledFor, channels = ['push'] } = req.body;

    if (!userId || !type || !title || !message || !scheduledFor) {
      return res.status(400).json({
        error: 'Missing required fields: userId, type, title, message, scheduledFor'
      });
    }

    const result = await mockNotificationService.scheduleNotification({
      userId,
      type,
      title,
      message,
      data,
      scheduledFor,
      channels
    });

    res.json({
      success: true,
      scheduled_notification: result
    });
  } catch (error) {
    console.error('Error scheduling notification:', error);
    res.status(500).json({
      error: 'Failed to schedule notification',
      details: error.message
    });
  }
});

router.delete('/:notificationId', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const result = await mockNotificationService.cancelNotification(notificationId);

    res.json({
      success: true,
      cancelled_notification: result
    });
  } catch (error) {
    console.error('Error canceling notification:', error);
    res.status(500).json({
      error: 'Failed to cancel notification',
      details: error.message
    });
  }
});

// Notification history endpoints
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page, limit, type, read } = req.query;

    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      type,
      read: read !== undefined ? read === 'true' : undefined
    };

    const result = await mockNotificationService.getNotificationHistory(userId, options);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error getting notification history:', error);
    res.status(500).json({
      error: 'Failed to get notification history',
      details: error.message
    });
  }
});

router.patch('/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: 'Missing required field: userId'
      });
    }

    const result = await mockNotificationService.markAsRead(notificationId, userId);

    res.json({
      success: true,
      notification: result
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      error: 'Failed to mark notification as read',
      details: error.message
    });
  }
});

router.patch('/read-all/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await mockNotificationService.markAllAsRead(userId);

    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      error: 'Failed to mark all notifications as read',
      details: error.message
    });
  }
});

router.get('/unread-count/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await mockNotificationService.getUnreadCount(userId);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      error: 'Failed to get unread count',
      details: error.message
    });
  }
});

// Notification templates endpoints
router.get('/templates', async (req, res) => {
  try {
    const templates = await mockNotificationService.getNotificationTemplates();

    res.json({
      success: true,
      templates
    });
  } catch (error) {
    console.error('Error getting notification templates:', error);
    res.status(500).json({
      error: 'Failed to get notification templates',
      details: error.message
    });
  }
});

// Notification preferences endpoints
router.get('/preferences/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const preferences = await mockPreferencesService.getUserPreferences(userId);

    res.json({
      success: true,
      preferences
    });
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    res.status(500).json({
      error: 'Failed to get notification preferences',
      details: error.message
    });
  }
});

router.put('/preferences/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const preferences = req.body;

    const result = await mockPreferencesService.updateUserPreferences(userId, preferences);

    res.json({
      success: true,
      preferences: result
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({
      error: 'Failed to update notification preferences',
      details: error.message
    });
  }
});

// Device token management endpoints
router.post('/device-tokens/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { token, platform, deviceId } = req.body;

    if (!token || !platform) {
      return res.status(400).json({
        error: 'Missing required fields: token, platform'
      });
    }

    const result = await mockDeviceTokenService.registerDeviceToken(userId, {
      token,
      platform,
      deviceId
    });

    res.json({
      success: true,
      device_token: result
    });
  } catch (error) {
    console.error('Error registering device token:', error);
    res.status(500).json({
      error: 'Failed to register device token',
      details: error.message
    });
  }
});

router.delete('/device-tokens/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'Missing required field: token'
      });
    }

    const result = await mockDeviceTokenService.unregisterDeviceToken(userId, token);

    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Error unregistering device token:', error);
    res.status(500).json({
      error: 'Failed to unregister device token',
      details: error.message
    });
  }
});

router.get('/device-tokens/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const tokens = await mockDeviceTokenService.getUserDeviceTokens(userId);

    res.json({
      success: true,
      device_tokens: tokens
    });
  } catch (error) {
    console.error('Error getting device tokens:', error);
    res.status(500).json({
      error: 'Failed to get device tokens',
      details: error.message
    });
  }
});

// Real-time notification status endpoint
router.get('/realtime/status', (req, res) => {
  res.json({
    success: true,
    websocket_enabled: true,
    connected_users: 42, // Mock data
    server_uptime: process.uptime(),
    last_notification_sent: new Date(Date.now() - 300000).toISOString()
  });
});

// Test notification endpoint
router.post('/test/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { type = 'test' } = req.body;

    const result = await mockNotificationService.sendNotification({
      userId,
      type,
      title: 'Test Notification',
      message: 'This is a test notification to verify the system is working.',
      data: { test: true },
      channels: ['push', 'websocket']
    });

    res.json({
      success: true,
      test_notification: result
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({
      error: 'Failed to send test notification',
      details: error.message
    });
  }
});

// Notification analytics endpoint
router.get('/analytics', (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;

    // Mock analytics data
    const analytics = {
      total_sent: 1250,
      total_delivered: 1180,
      total_read: 890,
      total_clicked: 156,
      delivery_rate: 94.4,
      read_rate: 75.4,
      click_rate: 17.5,
      by_type: {
        lesson_reminder: { sent: 500, delivered: 485, read: 380 },
        achievement: { sent: 300, delivered: 295, read: 250 },
        social: { sent: 250, delivered: 240, read: 180 },
        system: { sent: 200, delivered: 160, read: 80 }
      },
      by_channel: {
        push: { sent: 800, delivered: 750, read: 600 },
        email: { sent: 300, delivered: 280, read: 200 },
        websocket: { sent: 150, delivered: 150, read: 90 }
      },
      hourly_distribution: [
        { hour: 8, sent: 120 },
        { hour: 12, sent: 200 },
        { hour: 18, sent: 180 },
        { hour: 20, sent: 150 }
      ]
    };

    res.json({
      success: true,
      analytics,
      period: {
        start_date: startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: endDate || new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting notification analytics:', error);
    res.status(500).json({
      error: 'Failed to get notification analytics',
      details: error.message
    });
  }
});

module.exports = router;
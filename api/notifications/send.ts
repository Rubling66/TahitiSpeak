import { NextApiRequest, NextApiResponse } from 'next';
import { withMiddleware } from '../middleware';
import { notificationService } from '../../src/services/notificationService';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'POST':
        return await sendNotification(req, res);
      default:
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Send notification API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function sendNotification(req: NextApiRequest, res: NextApiResponse) {
  const {
    userIds,
    templateName,
    variables,
    scheduledFor,
    priority = 'normal',
    data
  } = req.body;

  // Validation
  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({
      error: 'userIds must be a non-empty array'
    });
  }

  if (!templateName || typeof templateName !== 'string') {
    return res.status(400).json({
      error: 'templateName is required and must be a string'
    });
  }

  if (priority && !['low', 'normal', 'high'].includes(priority)) {
    return res.status(400).json({
      error: 'priority must be one of: low, normal, high'
    });
  }

  if (scheduledFor && isNaN(Date.parse(scheduledFor))) {
    return res.status(400).json({
      error: 'scheduledFor must be a valid ISO date string'
    });
  }

  // Limit batch size
  if (userIds.length > 1000) {
    return res.status(400).json({
      error: 'Maximum 1000 users per batch'
    });
  }

  try {
    const notificationIds = await notificationService.sendNotification({
      userIds,
      templateName,
      variables: variables || {},
      scheduledFor,
      priority,
      data: data || {}
    });

    return res.status(200).json({
      success: true,
      data: {
        notificationIds,
        sent: notificationIds.length,
        requested: userIds.length
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Template') && error.message.includes('not found')) {
      return res.status(404).json({
        error: error.message
      });
    }
    throw error;
  }
}

export default withMiddleware(handler, {
  auth: { required: true, roles: ['admin', 'teacher'] },
  rateLimit: { type: 'general' },
  security: 'strict'
});
import { NextApiRequest, NextApiResponse } from 'next';
import { withMiddleware } from '../middleware';
import { notificationService } from '../../src/services/notificationService';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { user } = req as any; // Added by auth middleware

  try {
    switch (req.method) {
      case 'GET':
        return await getPreferences(req, res, user.id);
      case 'PUT':
        return await updatePreferences(req, res, user.id);
      default:
        res.setHeader('Allow', ['GET', 'PUT']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Preferences API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function getPreferences(req: NextApiRequest, res: NextApiResponse, userId: string) {
  const preferences = await notificationService.getUserPreferences(userId);
  
  return res.status(200).json({
    success: true,
    data: preferences
  });
}

async function updatePreferences(req: NextApiRequest, res: NextApiResponse, userId: string) {
  const updates = req.body;
  
  // Validate boolean fields
  const booleanFields = [
    'push_enabled',
    'email_enabled', 
    'in_app_enabled',
    'lesson_reminders',
    'achievement_notifications',
    'social_notifications',
    'marketing_emails',
    'weekly_progress'
  ];

  for (const field of booleanFields) {
    if (updates[field] !== undefined && typeof updates[field] !== 'boolean') {
      return res.status(400).json({
        error: `Field '${field}' must be a boolean`
      });
    }
  }

  // Validate time format for quiet hours
  if (updates.quiet_hours_start && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(updates.quiet_hours_start)) {
    return res.status(400).json({
      error: 'quiet_hours_start must be in HH:MM format'
    });
  }

  if (updates.quiet_hours_end && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(updates.quiet_hours_end)) {
    return res.status(400).json({
      error: 'quiet_hours_end must be in HH:MM format'
    });
  }

  // Remove fields that shouldn't be updated
  delete updates.id;
  delete updates.user_id;
  delete updates.created_at;
  delete updates.updated_at;

  const preferences = await notificationService.updateUserPreferences(userId, updates);
  
  return res.status(200).json({
    success: true,
    data: preferences
  });
}

export default withMiddleware(handler, {
  auth: { required: true },
  rateLimit: { type: 'general' },
  security: 'basic'
});
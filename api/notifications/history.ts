import { NextApiRequest, NextApiResponse } from 'next';
import { withMiddleware } from '../middleware';
import { notificationService } from '../../src/services/notificationService';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { user } = req as any; // Added by auth middleware

  try {
    switch (req.method) {
      case 'GET':
        return await getHistory(req, res, user.id);
      case 'PUT':
        return await markAsRead(req, res, user.id);
      case 'DELETE':
        return await deleteNotifications(req, res, user.id);
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('History API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function getHistory(req: NextApiRequest, res: NextApiResponse, userId: string) {
  const {
    page = '1',
    limit = '20',
    type,
    status,
    unreadOnly = 'false'
  } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);

  if (isNaN(pageNum) || pageNum < 1) {
    return res.status(400).json({ error: 'Invalid page number' });
  }

  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    return res.status(400).json({ error: 'Invalid limit (1-100)' });
  }

  const options = {
    page: pageNum,
    limit: limitNum,
    type: type as 'push' | 'email' | 'in_app' | undefined,
    status: status as string | undefined,
    unreadOnly: unreadOnly === 'true'
  };

  const result = await notificationService.getNotificationHistory(userId, options);
  
  return res.status(200).json({
    success: true,
    data: result.notifications,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: result.total,
      totalPages: Math.ceil(result.total / limitNum)
    }
  });
}

async function markAsRead(req: NextApiRequest, res: NextApiResponse, userId: string) {
  const { notificationIds, markAll = false } = req.body;

  if (markAll) {
    await notificationService.bulkMarkAsRead(userId);
  } else {
    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({
        error: 'notificationIds must be an array'
      });
    }

    if (notificationIds.length === 0) {
      return res.status(400).json({
        error: 'At least one notification ID is required'
      });
    }

    await notificationService.markNotificationsAsRead(notificationIds);
  }

  return res.status(200).json({
    success: true,
    message: 'Notifications marked as read'
  });
}

async function deleteNotifications(req: NextApiRequest, res: NextApiResponse, userId: string) {
  const { notificationIds } = req.body;

  if (!notificationIds || !Array.isArray(notificationIds)) {
    return res.status(400).json({
      error: 'notificationIds must be an array'
    });
  }

  if (notificationIds.length === 0) {
    return res.status(400).json({
      error: 'At least one notification ID is required'
    });
  }

  await notificationService.bulkDelete(userId, notificationIds);

  return res.status(200).json({
    success: true,
    message: 'Notifications deleted successfully'
  });
}

export default withMiddleware(handler, {
  auth: { required: true },
  rateLimit: { type: 'general' },
  security: 'basic'
});
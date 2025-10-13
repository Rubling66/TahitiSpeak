import { NextApiRequest, NextApiResponse } from 'next';
import { withMiddleware } from '../middleware';
import { notificationService } from '../../src/services/notificationService';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { user } = req as any; // Added by auth middleware

  try {
    switch (req.method) {
      case 'GET':
        return await getStats(req, res, user.id);
      default:
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Stats API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function getStats(req: NextApiRequest, res: NextApiResponse, userId: string) {
  const stats = await notificationService.getNotificationStats(userId);
  const unreadCount = await notificationService.getUnreadCount(userId);
  
  return res.status(200).json({
    success: true,
    data: {
      ...stats,
      unread: unreadCount
    }
  });
}

export default withMiddleware(handler, {
  auth: { required: true },
  rateLimit: { type: 'general' },
  security: 'basic'
});
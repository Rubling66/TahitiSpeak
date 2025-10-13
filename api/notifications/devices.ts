import { NextApiRequest, NextApiResponse } from 'next';
import { withMiddleware } from '../middleware';
import { notificationService } from '../../src/services/notificationService';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { user } = req as any; // Added by auth middleware

  try {
    switch (req.method) {
      case 'GET':
        return await getDeviceTokens(req, res, user.id);
      case 'POST':
        return await registerDeviceToken(req, res, user.id);
      case 'DELETE':
        return await removeDeviceToken(req, res, user.id);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Device tokens API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function getDeviceTokens(req: NextApiRequest, res: NextApiResponse, userId: string) {
  const tokens = await notificationService.getDeviceTokens(userId);
  
  // Remove sensitive token data from response
  const sanitizedTokens = tokens.map(token => ({
    id: token.id,
    platform: token.platform,
    device_info: token.device_info,
    is_active: token.is_active,
    last_used: token.last_used,
    created_at: token.created_at,
    token_preview: token.token.substring(0, 10) + '...'
  }));
  
  return res.status(200).json({
    success: true,
    data: sanitizedTokens
  });
}

async function registerDeviceToken(req: NextApiRequest, res: NextApiResponse, userId: string) {
  const { token, platform, deviceInfo } = req.body;

  // Validation
  if (!token || typeof token !== 'string') {
    return res.status(400).json({
      error: 'token is required and must be a string'
    });
  }

  if (!platform || !['web', 'ios', 'android'].includes(platform)) {
    return res.status(400).json({
      error: 'platform must be one of: web, ios, android'
    });
  }

  // Validate token format based on platform
  if (platform === 'web' && !token.startsWith('BK')) {
    return res.status(400).json({
      error: 'Invalid web push token format'
    });
  }

  if (platform === 'ios' && token.length !== 64) {
    return res.status(400).json({
      error: 'Invalid iOS token format'
    });
  }

  if (platform === 'android' && !token.includes(':')) {
    return res.status(400).json({
      error: 'Invalid Android token format'
    });
  }

  const deviceToken = await notificationService.registerDeviceToken(
    userId,
    token,
    platform,
    deviceInfo || {}
  );

  // Remove sensitive token from response
  const sanitizedToken = {
    ...deviceToken,
    token: deviceToken.token.substring(0, 10) + '...'
  };

  return res.status(201).json({
    success: true,
    data: sanitizedToken
  });
}

async function removeDeviceToken(req: NextApiRequest, res: NextApiResponse, userId: string) {
  const { token } = req.body;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({
      error: 'token is required and must be a string'
    });
  }

  await notificationService.removeDeviceToken(userId, token);

  return res.status(200).json({
    success: true,
    message: 'Device token removed successfully'
  });
}

export default withMiddleware(handler, {
  auth: { required: true },
  rateLimit: { type: 'general' },
  security: 'basic'
});
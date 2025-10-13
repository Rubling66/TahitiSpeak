import { NextApiRequest, NextApiResponse } from 'next';
import { withMiddleware } from '../middleware';
import { notificationService } from '../../src/services/notificationService';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getTemplates(req, res);
      case 'POST':
        return await createTemplate(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Templates API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function getTemplates(req: NextApiRequest, res: NextApiResponse) {
  const { type } = req.query;
  
  const templates = await notificationService.getTemplates(
    type as string | undefined
  );
  
  return res.status(200).json({
    success: true,
    data: templates
  });
}

async function createTemplate(req: NextApiRequest, res: NextApiResponse) {
  const {
    name,
    type,
    subject,
    title,
    body,
    html_body,
    variables
  } = req.body;

  // Validation
  if (!name || !type || !body) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['name', 'type', 'body']
    });
  }

  if (!['push', 'email', 'in_app'].includes(type)) {
    return res.status(400).json({
      error: 'Invalid type',
      allowed: ['push', 'email', 'in_app']
    });
  }

  const template = await notificationService.createTemplate({
    name,
    type,
    subject,
    title,
    body,
    html_body,
    variables: variables || [],
    is_active: true
  });

  return res.status(201).json({
    success: true,
    data: template
  });
}

export default withMiddleware(handler, {
  auth: { required: true, roles: ['admin'] },
  rateLimit: { type: 'general' },
  security: 'strict'
});
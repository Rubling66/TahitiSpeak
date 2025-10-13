import { NextApiRequest, NextApiResponse } from 'next';
import { withMiddleware } from '../../middleware';
import { notificationService } from '../../../src/services/notificationService';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Template ID is required' });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getTemplate(req, res, id);
      case 'PUT':
        return await updateTemplate(req, res, id);
      case 'DELETE':
        return await deleteTemplate(req, res, id);
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Template API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function getTemplate(req: NextApiRequest, res: NextApiResponse, id: string) {
  const template = await notificationService.getTemplate(id);
  
  if (!template) {
    return res.status(404).json({ error: 'Template not found' });
  }
  
  return res.status(200).json({
    success: true,
    data: template
  });
}

async function updateTemplate(req: NextApiRequest, res: NextApiResponse, id: string) {
  const updates = req.body;
  
  // Remove fields that shouldn't be updated
  delete updates.id;
  delete updates.created_at;
  delete updates.updated_at;

  const template = await notificationService.updateTemplate(id, updates);
  
  return res.status(200).json({
    success: true,
    data: template
  });
}

async function deleteTemplate(req: NextApiRequest, res: NextApiResponse, id: string) {
  await notificationService.deleteTemplate(id);
  
  return res.status(200).json({
    success: true,
    message: 'Template deleted successfully'
  });
}

export default withMiddleware(handler, {
  auth: { required: true, roles: ['admin'] },
  rateLimit: { type: 'general' },
  security: 'strict'
});
import { Request, Response } from 'express';
import { PreferenceService } from '../../src/services/email/PreferenceService';
import { UnsubscribeManager } from '../../src/services/email/UnsubscribeManager';
import { supabase } from '../../src/lib/supabase';

const preferenceService = new PreferenceService(supabase);
const unsubscribeManager = new UnsubscribeManager(supabase, preferenceService);

/**
 * Get user email preferences
 * GET /api/email/preferences/:userId
 */
export async function getUserPreferences(req: Request, res: Response) {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        error: 'User ID is required'
      });
    }

    const preferences = await preferenceService.getUserPreferences(userId);

    if (!preferences) {
      return res.status(404).json({
        error: 'User preferences not found'
      });
    }

    res.status(200).json({
      success: true,
      data: preferences,
      message: 'User preferences retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting user preferences:', error);
    res.status(500).json({
      error: 'Failed to get user preferences',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Update user email preferences
 * PUT /api/email/preferences/:userId
 */
export async function updateUserPreferences(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const updates = req.body;

    if (!userId) {
      return res.status(400).json({
        error: 'User ID is required'
      });
    }

    // Validate updates object
    const allowedFields = [
      'marketing',
      'notifications',
      'lessonReminders',
      'achievementAlerts',
      'weeklyDigest',
      'frequency',
      'language',
      'timezone',
      'isSubscribed'
    ];

    const invalidFields = Object.keys(updates).filter(
      field => !allowedFields.includes(field)
    );

    if (invalidFields.length > 0) {
      return res.status(400).json({
        error: `Invalid fields: ${invalidFields.join(', ')}`
      });
    }

    const updatedPreferences = await preferenceService.updateUserPreferences(
      userId,
      updates
    );

    res.status(200).json({
      success: true,
      data: updatedPreferences,
      message: 'User preferences updated successfully'
    });

  } catch (error) {
    console.error('Error updating user preferences:', error);
    res.status(500).json({
      error: 'Failed to update user preferences',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Bulk update user preferences
 * PUT /api/email/preferences/bulk
 */
export async function bulkUpdatePreferences(req: Request, res: Response) {
  try {
    const { userIds, updates } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        error: 'User IDs array is required'
      });
    }

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({
        error: 'Updates object is required'
      });
    }

    const results = await preferenceService.bulkUpdatePreferences(userIds, updates);

    res.status(200).json({
      success: true,
      data: {
        updated: results.length,
        results
      },
      message: `Successfully updated preferences for ${results.length} users`
    });

  } catch (error) {
    console.error('Error bulk updating preferences:', error);
    res.status(500).json({
      error: 'Failed to bulk update preferences',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get all user preferences with filtering
 * GET /api/email/preferences
 */
export async function getAllPreferences(req: Request, res: Response) {
  try {
    const {
      page = 1,
      limit = 50,
      isSubscribed,
      language,
      timezone,
      frequency
    } = req.query;

    const filters = {
      isSubscribed: isSubscribed ? isSubscribed === 'true' : undefined,
      language: language as string,
      timezone: timezone as string,
      frequency: frequency as string
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof typeof filters] === undefined) {
        delete filters[key as keyof typeof filters];
      }
    });

    const result = await preferenceService.listPreferences(
      filters,
      Number(page),
      Number(limit)
    );

    res.status(200).json({
      success: true,
      data: result.preferences,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: result.total,
        totalPages: Math.ceil(result.total / Number(limit))
      },
      message: 'Preferences retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting all preferences:', error);
    res.status(500).json({
      error: 'Failed to get preferences',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Unsubscribe user from all emails
 * POST /api/email/preferences/unsubscribe
 */
export async function unsubscribeUser(req: Request, res: Response) {
  try {
    const { userId, email, reason, feedback, token } = req.body;

    // If token is provided, validate it
    if (token) {
      const isValid = await unsubscribeManager.validateUnsubscribeToken(token);
      if (!isValid) {
        return res.status(400).json({
          error: 'Invalid or expired unsubscribe token'
        });
      }
    }

    if (!userId && !email) {
      return res.status(400).json({
        error: 'Either userId or email is required'
      });
    }

    const result = await unsubscribeManager.unsubscribeFromAll(
      userId || email,
      reason,
      feedback
    );

    res.status(200).json({
      success: true,
      data: result,
      message: 'Successfully unsubscribed from all emails'
    });

  } catch (error) {
    console.error('Error unsubscribing user:', error);
    res.status(500).json({
      error: 'Failed to unsubscribe user',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Unsubscribe user from specific category
 * POST /api/email/preferences/unsubscribe/category
 */
export async function unsubscribeFromCategory(req: Request, res: Response) {
  try {
    const { userId, email, category, reason, feedback } = req.body;

    if (!userId && !email) {
      return res.status(400).json({
        error: 'Either userId or email is required'
      });
    }

    if (!category) {
      return res.status(400).json({
        error: 'Category is required'
      });
    }

    const validCategories = [
      'marketing',
      'notifications',
      'lessonReminders',
      'achievementAlerts',
      'weeklyDigest'
    ];

    if (!validCategories.includes(category)) {
      return res.status(400).json({
        error: `Invalid category. Must be one of: ${validCategories.join(', ')}`
      });
    }

    const result = await unsubscribeManager.unsubscribeFromCategory(
      userId || email,
      category,
      reason,
      feedback
    );

    res.status(200).json({
      success: true,
      data: result,
      message: `Successfully unsubscribed from ${category} emails`
    });

  } catch (error) {
    console.error('Error unsubscribing from category:', error);
    res.status(500).json({
      error: 'Failed to unsubscribe from category',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Resubscribe user
 * POST /api/email/preferences/resubscribe
 */
export async function resubscribeUser(req: Request, res: Response) {
  try {
    const { userId, email, categories } = req.body;

    if (!userId && !email) {
      return res.status(400).json({
        error: 'Either userId or email is required'
      });
    }

    const result = await unsubscribeManager.resubscribe(
      userId || email,
      categories
    );

    res.status(200).json({
      success: true,
      data: result,
      message: 'Successfully resubscribed to emails'
    });

  } catch (error) {
    console.error('Error resubscribing user:', error);
    res.status(500).json({
      error: 'Failed to resubscribe user',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Generate unsubscribe link
 * POST /api/email/preferences/unsubscribe-link
 */
export async function generateUnsubscribeLink(req: Request, res: Response) {
  try {
    const { userId, email, emailType, campaignId } = req.body;

    if (!userId && !email) {
      return res.status(400).json({
        error: 'Either userId or email is required'
      });
    }

    const link = await unsubscribeManager.generateUnsubscribeLink(
      userId || email,
      emailType,
      campaignId
    );

    res.status(200).json({
      success: true,
      data: { unsubscribeLink: link },
      message: 'Unsubscribe link generated successfully'
    });

  } catch (error) {
    console.error('Error generating unsubscribe link:', error);
    res.status(500).json({
      error: 'Failed to generate unsubscribe link',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Generate preference center link
 * POST /api/email/preferences/preference-center-link
 */
export async function generatePreferenceCenterLink(req: Request, res: Response) {
  try {
    const { userId, email } = req.body;

    if (!userId && !email) {
      return res.status(400).json({
        error: 'Either userId or email is required'
      });
    }

    const link = await unsubscribeManager.generatePreferenceCenterLink(
      userId || email
    );

    res.status(200).json({
      success: true,
      data: { preferenceCenterLink: link },
      message: 'Preference center link generated successfully'
    });

  } catch (error) {
    console.error('Error generating preference center link:', error);
    res.status(500).json({
      error: 'Failed to generate preference center link',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get unsubscribe statistics
 * GET /api/email/preferences/unsubscribe/stats
 */
export async function getUnsubscribeStats(req: Request, res: Response) {
  try {
    const {
      startDate,
      endDate,
      groupBy = 'day'
    } = req.query;

    const dateRange = {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    };

    const stats = await preferenceService.getUnsubscribeStats(
      dateRange,
      groupBy as 'day' | 'week' | 'month'
    );

    res.status(200).json({
      success: true,
      data: stats,
      message: 'Unsubscribe statistics retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting unsubscribe stats:', error);
    res.status(500).json({
      error: 'Failed to get unsubscribe statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Export user preferences
 * GET /api/email/preferences/export
 */
export async function exportPreferences(req: Request, res: Response) {
  try {
    const {
      format = 'csv',
      isSubscribed,
      language,
      timezone
    } = req.query;

    if (!['csv', 'json'].includes(format as string)) {
      return res.status(400).json({
        error: 'Format must be either "csv" or "json"'
      });
    }

    const filters = {
      isSubscribed: isSubscribed ? isSubscribed === 'true' : undefined,
      language: language as string,
      timezone: timezone as string
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof typeof filters] === undefined) {
        delete filters[key as keyof typeof filters];
      }
    });

    const preferences = await preferenceService.exportPreferences(filters);

    // Set appropriate headers for download
    const filename = `email-preferences-${Date.now()}.${format}`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      // Convert to CSV format (simplified)
      const csv = JSON.stringify(preferences); // In real implementation, use proper CSV conversion
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.json({
        success: true,
        data: preferences,
        exportedAt: new Date().toISOString(),
        filename
      });
    }

  } catch (error) {
    console.error('Error exporting preferences:', error);
    res.status(500).json({
      error: 'Failed to export preferences',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
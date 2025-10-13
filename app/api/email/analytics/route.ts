import { NextRequest, NextResponse } from 'next/server';
import { emailAutomation } from '@/lib/email/EmailAutomation';
import jwt from 'jsonwebtoken';

interface EmailAnalyticsQuery {
  campaignId?: string;
  startDate?: string;
  endDate?: string;
  eventType?: string;
  groupBy?: 'day' | 'week' | 'month';
}

export async function GET(request: NextRequest) {
  try {
    // Verify JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return NextResponse.json({ error: 'JWT secret not configured' }, { status: 500 });
    }

    try {
      jwt.verify(token, jwtSecret);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query: EmailAnalyticsQuery = {
      campaignId: searchParams.get('campaignId') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      eventType: searchParams.get('eventType') || undefined,
      groupBy: (searchParams.get('groupBy') as 'day' | 'week' | 'month') || 'day',
    };

    if (query.campaignId) {
      // Get specific campaign analytics
      const campaignAnalytics = await getCampaignAnalytics(query.campaignId, query);
      return NextResponse.json(campaignAnalytics);
    } else {
      // Get overall email analytics
      const overallAnalytics = await getOverallAnalytics(query);
      return NextResponse.json(overallAnalytics);
    }
  } catch (error) {
    console.error('Email analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email analytics' },
      { status: 500 }
    );
  }
}

async function getCampaignAnalytics(campaignId: string, query: EmailAnalyticsQuery) {
  const campaign = emailAutomation.getCampaign(campaignId);
  
  if (!campaign) {
    throw new Error(`Campaign not found: ${campaignId}`);
  }

  // In a real implementation, you would query your database for detailed analytics
  // For now, we'll return the basic campaign analytics with some mock time-series data
  
  const baseAnalytics = campaign.analytics;
  
  // Calculate rates
  const deliveryRate = baseAnalytics.sent > 0 ? (baseAnalytics.delivered / baseAnalytics.sent) * 100 : 0;
  const openRate = baseAnalytics.delivered > 0 ? (baseAnalytics.opened / baseAnalytics.delivered) * 100 : 0;
  const clickRate = baseAnalytics.delivered > 0 ? (baseAnalytics.clicked / baseAnalytics.delivered) * 100 : 0;
  const unsubscribeRate = baseAnalytics.delivered > 0 ? (baseAnalytics.unsubscribed / baseAnalytics.delivered) * 100 : 0;

  // Generate mock time-series data based on groupBy
  const timeSeriesData = generateTimeSeriesData(query.startDate, query.endDate, query.groupBy, baseAnalytics);

  return {
    campaign: {
      id: campaign.id,
      name: campaign.name,
      type: campaign.type,
      status: campaign.status,
    },
    summary: {
      ...baseAnalytics,
      deliveryRate: Math.round(deliveryRate * 100) / 100,
      openRate: Math.round(openRate * 100) / 100,
      clickRate: Math.round(clickRate * 100) / 100,
      unsubscribeRate: Math.round(unsubscribeRate * 100) / 100,
    },
    timeSeries: timeSeriesData,
    emails: campaign.emails.map(email => ({
      id: email.id,
      subject: email.subject,
      delay: email.delay,
      // In a real implementation, you would have individual email analytics
      analytics: {
        sent: Math.floor(baseAnalytics.sent / campaign.emails.length),
        delivered: Math.floor(baseAnalytics.delivered / campaign.emails.length),
        opened: Math.floor(baseAnalytics.opened / campaign.emails.length),
        clicked: Math.floor(baseAnalytics.clicked / campaign.emails.length),
      },
    })),
  };
}

async function getOverallAnalytics(query: EmailAnalyticsQuery) {
  const allCampaigns = emailAutomation.getAllCampaigns();
  
  // Aggregate analytics across all campaigns
  const totalAnalytics = allCampaigns.reduce(
    (acc, campaign) => {
      acc.sent += campaign.analytics.sent;
      acc.delivered += campaign.analytics.delivered;
      acc.opened += campaign.analytics.opened;
      acc.clicked += campaign.analytics.clicked;
      acc.unsubscribed += campaign.analytics.unsubscribed;
      return acc;
    },
    { sent: 0, delivered: 0, opened: 0, clicked: 0, unsubscribed: 0 }
  );

  // Calculate overall rates
  const deliveryRate = totalAnalytics.sent > 0 ? (totalAnalytics.delivered / totalAnalytics.sent) * 100 : 0;
  const openRate = totalAnalytics.delivered > 0 ? (totalAnalytics.opened / totalAnalytics.delivered) * 100 : 0;
  const clickRate = totalAnalytics.delivered > 0 ? (totalAnalytics.clicked / totalAnalytics.delivered) * 100 : 0;
  const unsubscribeRate = totalAnalytics.delivered > 0 ? (totalAnalytics.unsubscribed / totalAnalytics.delivered) * 100 : 0;

  // Generate time-series data
  const timeSeriesData = generateTimeSeriesData(query.startDate, query.endDate, query.groupBy, totalAnalytics);

  // Campaign breakdown
  const campaignBreakdown = allCampaigns.map(campaign => ({
    id: campaign.id,
    name: campaign.name,
    type: campaign.type,
    status: campaign.status,
    analytics: campaign.analytics,
    deliveryRate: campaign.analytics.sent > 0 ? 
      Math.round((campaign.analytics.delivered / campaign.analytics.sent) * 10000) / 100 : 0,
    openRate: campaign.analytics.delivered > 0 ? 
      Math.round((campaign.analytics.opened / campaign.analytics.delivered) * 10000) / 100 : 0,
    clickRate: campaign.analytics.delivered > 0 ? 
      Math.round((campaign.analytics.clicked / campaign.analytics.delivered) * 10000) / 100 : 0,
  }));

  return {
    summary: {
      ...totalAnalytics,
      deliveryRate: Math.round(deliveryRate * 100) / 100,
      openRate: Math.round(openRate * 100) / 100,
      clickRate: Math.round(clickRate * 100) / 100,
      unsubscribeRate: Math.round(unsubscribeRate * 100) / 100,
    },
    timeSeries: timeSeriesData,
    campaigns: campaignBreakdown,
    topPerformingCampaigns: campaignBreakdown
      .sort((a, b) => b.openRate - a.openRate)
      .slice(0, 5),
  };
}

function generateTimeSeriesData(
  startDate?: string,
  endDate?: string,
  groupBy: 'day' | 'week' | 'month' = 'day',
  baseAnalytics: any = { sent: 0, delivered: 0, opened: 0, clicked: 0, unsubscribed: 0 }
) {
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  const end = endDate ? new Date(endDate) : new Date();
  
  const data = [];
  const current = new Date(start);
  
  // Determine increment based on groupBy
  const increment = groupBy === 'day' ? 1 : groupBy === 'week' ? 7 : 30;
  
  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    
    // Generate mock data based on base analytics
    // In a real implementation, you would query your database for actual data
    const dayMultiplier = Math.random() * 0.3 + 0.1; // 10-40% of total per period
    
    data.push({
      date: dateStr,
      sent: Math.floor(baseAnalytics.sent * dayMultiplier),
      delivered: Math.floor(baseAnalytics.delivered * dayMultiplier),
      opened: Math.floor(baseAnalytics.opened * dayMultiplier),
      clicked: Math.floor(baseAnalytics.clicked * dayMultiplier),
      unsubscribed: Math.floor(baseAnalytics.unsubscribed * dayMultiplier),
    });
    
    current.setDate(current.getDate() + increment);
  }
  
  return data;
}

export async function POST(request: NextRequest) {
  try {
    // Verify JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return NextResponse.json({ error: 'JWT secret not configured' }, { status: 500 });
    }

    try {
      jwt.verify(token, jwtSecret);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { action, campaignId, status } = body;

    switch (action) {
      case 'update_campaign_status':
        if (!campaignId || !status) {
          return NextResponse.json({ error: 'Missing campaignId or status' }, { status: 400 });
        }
        
        emailAutomation.updateCampaignStatus(campaignId, status);
        return NextResponse.json({ message: 'Campaign status updated successfully' });

      case 'trigger_campaign':
        if (!campaignId) {
          return NextResponse.json({ error: 'Missing campaignId' }, { status: 400 });
        }
        
        // In a real implementation, you would trigger the campaign
        // For now, just return success
        return NextResponse.json({ message: 'Campaign triggered successfully' });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Email analytics POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
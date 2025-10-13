import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useEmail, EmailCampaign, EmailAnalytics, EmailTemplate } from '@/hooks/useEmail';
import {
  Mail,
  Send,
  Users,
  TrendingUp,
  Eye,
  MousePointer,
  UserMinus,
  Calendar,
  BarChart3,
  Settings,
  Play,
  Pause,
  RefreshCw,
} from 'lucide-react';

export function EmailDashboard() {
  const {
    loading,
    error,
    getCampaigns,
    getAnalytics,
    getTemplates,
    updateCampaignStatus,
    triggerCampaign,
  } = useEmail();

  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [analytics, setAnalytics] = useState<EmailAnalytics | null>(null);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [selectedTimeRange]);

  const loadDashboardData = async () => {
    setRefreshing(true);
    try {
      const [campaignsData, analyticsData, templatesData] = await Promise.all([
        getCampaigns(),
        getAnalytics({
          startDate: getStartDate(selectedTimeRange),
          endDate: new Date().toISOString().split('T')[0],
          groupBy: selectedTimeRange === '7d' ? 'day' : selectedTimeRange === '30d' ? 'day' : 'week',
        }),
        getTemplates(),
      ]);

      setCampaigns(campaignsData);
      setAnalytics(analyticsData);
      setTemplates(templatesData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getStartDate = (range: string): string => {
    const date = new Date();
    switch (range) {
      case '7d':
        date.setDate(date.getDate() - 7);
        break;
      case '30d':
        date.setDate(date.getDate() - 30);
        break;
      case '90d':
        date.setDate(date.getDate() - 90);
        break;
    }
    return date.toISOString().split('T')[0];
  };

  const handleCampaignStatusChange = async (campaignId: string, newStatus: string) => {
    const success = await updateCampaignStatus(campaignId, newStatus);
    if (success) {
      setCampaigns(prev =>
        prev.map(campaign =>
          campaign.id === campaignId ? { ...campaign, status: newStatus } : campaign
        )
      );
    }
  };

  const handleTriggerCampaign = async (campaignId: string) => {
    const success = await triggerCampaign(campaignId);
    if (success) {
      // Refresh campaigns data
      const updatedCampaigns = await getCampaigns();
      setCampaigns(updatedCampaigns);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'paused':
        return 'bg-yellow-500';
      case 'draft':
        return 'bg-gray-500';
      case 'completed':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatPercentage = (num: number): string => {
    return `${num.toFixed(1)}%`;
  };

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading email dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Dashboard</h1>
          <p className="text-muted-foreground">
            Manage email campaigns, templates, and analytics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as '7d' | '30d' | '90d')}
            className="px-3 py-2 border rounded-md"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <Button
            onClick={loadDashboardData}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(analytics.summary.sent)}</div>
              <p className="text-xs text-muted-foreground">
                {formatPercentage(analytics.summary.deliveryRate)} delivery rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Opens</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(analytics.summary.opened)}</div>
              <p className="text-xs text-muted-foreground">
                {formatPercentage(analytics.summary.openRate)} open rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clicks</CardTitle>
              <MousePointer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(analytics.summary.clicked)}</div>
              <p className="text-xs text-muted-foreground">
                {formatPercentage(analytics.summary.clickRate)} click rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unsubscribes</CardTitle>
              <UserMinus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(analytics.summary.unsubscribed)}</div>
              <p className="text-xs text-muted-foreground">
                {formatPercentage(analytics.summary.unsubscribeRate)} unsubscribe rate
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Email Campaigns</h2>
            <Button>
              <Mail className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </div>

          <div className="grid gap-4">
            {campaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <span>{campaign.name}</span>
                        <Badge className={getStatusColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {campaign.type} • {campaign.emailCount} emails
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      {campaign.status === 'active' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCampaignStatusChange(campaign.id, 'paused')}
                        >
                          <Pause className="h-4 w-4 mr-1" />
                          Pause
                        </Button>
                      ) : campaign.status === 'paused' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCampaignStatusChange(campaign.id, 'active')}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Resume
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        onClick={() => handleTriggerCampaign(campaign.id)}
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Trigger
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Sent</p>
                      <p className="text-lg font-semibold">{formatNumber(campaign.analytics.sent)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Delivered</p>
                      <p className="text-lg font-semibold">{formatNumber(campaign.analytics.delivered)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Opened</p>
                      <p className="text-lg font-semibold">{formatNumber(campaign.analytics.opened)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Clicked</p>
                      <p className="text-lg font-semibold">{formatNumber(campaign.analytics.clicked)}</p>
                    </div>
                  </div>
                  
                  {campaign.analytics.delivered > 0 && (
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Open Rate</span>
                        <span>{formatPercentage((campaign.analytics.opened / campaign.analytics.delivered) * 100)}</span>
                      </div>
                      <Progress 
                        value={(campaign.analytics.opened / campaign.analytics.delivered) * 100} 
                        className="h-2"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Email Templates</h2>
            <Button>
              <Settings className="h-4 w-4 mr-2" />
              Manage Templates
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <CardTitle>{template.name}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {template.requiredData.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Required Data:</p>
                      <div className="flex flex-wrap gap-1">
                        {template.requiredData.map((field) => (
                          <Badge key={field} variant="secondary" className="text-xs">
                            {field}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mt-4 flex space-x-2">
                    <Button size="sm" variant="outline">
                      Preview
                    </Button>
                    <Button size="sm">
                      Use Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Email Analytics</h2>
            <Button variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>

          {analytics && (
            <div className="space-y-6">
              {/* Time Series Chart Placeholder */}
              <Card>
                <CardHeader>
                  <CardTitle>Email Performance Over Time</CardTitle>
                  <CardDescription>
                    Sent, delivered, opened, and clicked emails over the selected period
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center text-gray-500">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                      <p>Time series chart would be displayed here</p>
                      <p className="text-sm">Integration with charting library needed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Performing Campaigns */}
              {analytics.topPerformingCampaigns && analytics.topPerformingCampaigns.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Top Performing Campaigns</CardTitle>
                    <CardDescription>Campaigns with highest open rates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.topPerformingCampaigns.map((campaign, index) => (
                        <div key={campaign.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {index + 1}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{campaign.name}</p>
                              <p className="text-sm text-muted-foreground">{campaign.type}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {formatPercentage((campaign.analytics.opened / Math.max(campaign.analytics.delivered, 1)) * 100)}
                            </p>
                            <p className="text-sm text-muted-foreground">open rate</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
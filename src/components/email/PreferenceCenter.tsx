import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Mail, Settings, Shield, CheckCircle, XCircle } from 'lucide-react';
import { EmailPreferences, PreferenceUpdate } from '../../types/email';

interface PreferenceCenterProps {
  token?: string;
  userEmail?: string;
  onPreferencesUpdate?: (preferences: EmailPreferences) => void;
  onUnsubscribe?: (reason?: string) => void;
}

export const PreferenceCenter: React.FC<PreferenceCenterProps> = ({
  token,
  userEmail,
  onPreferencesUpdate,
  onUnsubscribe
}) => {
  const [preferences, setPreferences] = useState<EmailPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showUnsubscribe, setShowUnsubscribe] = useState(false);
  const [unsubscribeReason, setUnsubscribeReason] = useState('');
  const [unsubscribeFeedback, setUnsubscribeFeedback] = useState('');

  useEffect(() => {
    loadPreferences();
  }, [token, userEmail]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      setError(null);

      // In a real implementation, this would call your API
      // For now, we'll simulate loading preferences
      const response = await fetch('/api/email/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, userEmail }),
      });

      if (!response.ok) {
        throw new Error('Failed to load preferences');
      }

      const data = await response.json();
      setPreferences(data.preferences);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates: PreferenceUpdate) => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/email/preferences/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, userEmail, updates }),
      });

      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }

      const data = await response.json();
      setPreferences(data.preferences);
      setSuccess('Preferences updated successfully!');
      
      if (onPreferencesUpdate) {
        onPreferencesUpdate(data.preferences);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleUnsubscribe = async () => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch('/api/email/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          userEmail,
          type: 'all',
          reason: unsubscribeReason || 'user_request',
          feedback: unsubscribeFeedback,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to unsubscribe');
      }

      setSuccess('You have been successfully unsubscribed from all emails.');
      
      if (onUnsubscribe) {
        onUnsubscribe(unsubscribeReason);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unsubscribe');
    } finally {
      setSaving(false);
    }
  };

  const handleResubscribe = async () => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch('/api/email/resubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, userEmail }),
      });

      if (!response.ok) {
        throw new Error('Failed to resubscribe');
      }

      const data = await response.json();
      setPreferences(data.preferences);
      setSuccess('You have been successfully resubscribed to emails!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resubscribe');
    } finally {
      setSaving(false);
    }
  };

  const unsubscribeReasons = [
    { value: 'too_frequent', label: 'Too many emails' },
    { value: 'not_relevant', label: 'Content not relevant' },
    { value: 'never_signed_up', label: 'Never signed up' },
    { value: 'temporary', label: 'Temporary break' },
    { value: 'privacy_concerns', label: 'Privacy concerns' },
    { value: 'technical_issues', label: 'Technical issues' },
    { value: 'other', label: 'Other' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your preferences...</p>
        </div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Alert>
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            Unable to load your email preferences. Please check your link and try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <Mail className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h1 className="text-3xl font-bold">Email Preferences</h1>
        <p className="text-muted-foreground mt-2">
          Manage your email subscriptions and preferences
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {!preferences.isSubscribed ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Currently Unsubscribed
            </CardTitle>
            <CardDescription>
              You are currently unsubscribed from all emails.
              {preferences.unsubscribedAt && (
                <span className="block mt-1">
                  Unsubscribed on: {preferences.unsubscribedAt.toLocaleDateString()}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleResubscribe} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Resubscribe to Emails
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Subscription Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Subscription Status
              </CardTitle>
              <CardDescription>
                You are currently subscribed to receive emails from us.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="subscription-status">Email Subscription</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive emails from French Tahitian Learning
                  </p>
                </div>
                <Switch
                  id="subscription-status"
                  checked={preferences.isSubscribed}
                  onCheckedChange={(checked) =>
                    updatePreferences({ isSubscribed: checked })
                  }
                  disabled={saving}
                />
              </div>
            </CardContent>
          </Card>

          {/* Email Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Email Categories
              </CardTitle>
              <CardDescription>
                Choose which types of emails you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="marketing-emails">Marketing Emails</Label>
                  <p className="text-sm text-muted-foreground">
                    Product updates, tips, and promotional content
                  </p>
                </div>
                <Switch
                  id="marketing-emails"
                  checked={preferences.marketingEmails}
                  onCheckedChange={(checked) =>
                    updatePreferences({ marketingEmails: checked })
                  }
                  disabled={saving}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notification-emails">Notification Emails</Label>
                  <p className="text-sm text-muted-foreground">
                    Account updates and important notifications
                  </p>
                </div>
                <Switch
                  id="notification-emails"
                  checked={preferences.notificationEmails}
                  onCheckedChange={(checked) =>
                    updatePreferences({ notificationEmails: checked })
                  }
                  disabled={saving}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="lesson-reminders">Lesson Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Reminders for your scheduled lessons
                  </p>
                </div>
                <Switch
                  id="lesson-reminders"
                  checked={preferences.lessonReminders}
                  onCheckedChange={(checked) =>
                    updatePreferences({ lessonReminders: checked })
                  }
                  disabled={saving}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="achievement-alerts">Achievement Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Notifications when you complete milestones
                  </p>
                </div>
                <Switch
                  id="achievement-alerts"
                  checked={preferences.achievementAlerts}
                  onCheckedChange={(checked) =>
                    updatePreferences({ achievementAlerts: checked })
                  }
                  disabled={saving}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="weekly-digest">Weekly Digest</Label>
                  <p className="text-sm text-muted-foreground">
                    Weekly summary of your progress and new content
                  </p>
                </div>
                <Switch
                  id="weekly-digest"
                  checked={preferences.weeklyDigest}
                  onCheckedChange={(checked) =>
                    updatePreferences({ weeklyDigest: checked })
                  }
                  disabled={saving}
                />
              </div>
            </CardContent>
          </Card>

          {/* Email Frequency */}
          <Card>
            <CardHeader>
              <CardTitle>Email Frequency</CardTitle>
              <CardDescription>
                How often would you like to receive emails?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select
                  value={preferences.frequency}
                  onValueChange={(value) =>
                    updatePreferences({ frequency: value as any })
                  }
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="daily">Daily Digest</SelectItem>
                    <SelectItem value="weekly">Weekly Digest</SelectItem>
                    <SelectItem value="monthly">Monthly Summary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Language and Timezone */}
          <Card>
            <CardHeader>
              <CardTitle>Language &amp; Timezone</CardTitle>
              <CardDescription>
                Customize your email language and timezone preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={preferences.language}
                    onValueChange={(value) =>
                      updatePreferences({ language: value })
                    }
                    disabled={saving}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="ty">Tahitian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={preferences.timezone}
                    onValueChange={(value) =>
                      updatePreferences({ timezone: value })
                    }
                    disabled={saving}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="Pacific/Tahiti">Tahiti Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Unsubscribe Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Unsubscribe Options
              </CardTitle>
              <CardDescription>
                If you no longer wish to receive emails from us
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!showUnsubscribe ? (
                <Button
                  variant="outline"
                  onClick={() => setShowUnsubscribe(true)}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Unsubscribe from All Emails
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="unsubscribe-reason">
                      Why are you unsubscribing? (Optional)
                    </Label>
                    <Select
                      value={unsubscribeReason}
                      onValueChange={setUnsubscribeReason}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a reason" />
                      </SelectTrigger>
                      <SelectContent>
                        {unsubscribeReasons.map((reason) => (
                          <SelectItem key={reason.value} value={reason.value}>
                            {reason.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="feedback">
                      Additional feedback (Optional)
                    </Label>
                    <Textarea
                      id="feedback"
                      placeholder="Help us improve by sharing your feedback..."
                      value={unsubscribeFeedback}
                      onChange={(e) => setUnsubscribeFeedback(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      onClick={handleUnsubscribe}
                      disabled={saving}
                    >
                      {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Confirm Unsubscribe
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowUnsubscribe(false)}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          Questions about your email preferences?{' '}
          <a href="/contact" className="text-primary hover:underline">
            Contact us
          </a>
        </p>
      </div>
    </div>
  );
};
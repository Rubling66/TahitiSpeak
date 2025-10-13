import { useState, useEffect, useCallback } from 'react';

interface NotificationPreferences {
  push_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  timezone: string;
  notification_types: {
    lesson_reminders: boolean;
    achievements: boolean;
    social: boolean;
    marketing: boolean;
    system: boolean;
  };
  frequency: {
    lesson_reminders: 'immediate' | 'daily' | 'weekly';
    achievements: 'immediate' | 'daily' | 'weekly';
    social: 'immediate' | 'daily' | 'weekly';
    marketing: 'immediate' | 'daily' | 'weekly';
    system: 'immediate' | 'daily' | 'weekly';
  };
}

interface UseNotificationPreferencesReturn {
  preferences: NotificationPreferences | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  refreshPreferences: () => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

const defaultPreferences: NotificationPreferences = {
  push_enabled: true,
  email_enabled: true,
  sms_enabled: false,
  quiet_hours_enabled: true,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
  timezone: 'Pacific/Tahiti',
  notification_types: {
    lesson_reminders: true,
    achievements: true,
    social: true,
    marketing: false,
    system: true
  },
  frequency: {
    lesson_reminders: 'daily',
    achievements: 'immediate',
    social: 'immediate',
    marketing: 'weekly',
    system: 'immediate'
  }
};

export const useNotificationPreferences = (userId: string): UseNotificationPreferencesReturn => {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user preferences
  const fetchPreferences = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/notifications/preferences/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notification preferences');
      }

      const data = await response.json();
      
      if (data.success) {
        setPreferences(data.preferences);
      } else {
        throw new Error(data.error || 'Failed to fetch preferences');
      }
    } catch (err) {
      console.error('Error fetching notification preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch preferences');
      
      // Set default preferences if fetch fails
      setPreferences(defaultPreferences);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Update user preferences
  const updatePreferences = useCallback(async (newPreferences: Partial<NotificationPreferences>) => {
    if (!userId) return;

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/notifications/preferences/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newPreferences)
      });

      if (!response.ok) {
        throw new Error('Failed to update notification preferences');
      }

      const data = await response.json();
      
      if (data.success) {
        setPreferences(data.preferences);
        
        // Update device token registration based on push preference
        if ('push_enabled' in newPreferences) {
          await updateDeviceTokenStatus(newPreferences.push_enabled!);
        }
      } else {
        throw new Error(data.error || 'Failed to update preferences');
      }
    } catch (err) {
      console.error('Error updating notification preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to update preferences');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [userId]);

  // Update device token status based on push preference
  const updateDeviceTokenStatus = async (pushEnabled: boolean) => {
    try {
      const token = localStorage.getItem('fcm_token');
      if (!token) return;

      if (pushEnabled) {
        // Register device token
        await fetch(`/api/notifications/device-tokens/${userId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            token,
            platform: 'web',
            deviceId: navigator.userAgent
          })
        });
      } else {
        // Unregister device token
        await fetch(`/api/notifications/device-tokens/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ token })
        });
      }
    } catch (err) {
      console.error('Error updating device token status:', err);
    }
  };

  // Refresh preferences
  const refreshPreferences = useCallback(async () => {
    await fetchPreferences();
  }, [fetchPreferences]);

  // Reset to default preferences
  const resetToDefaults = useCallback(async () => {
    await updatePreferences(defaultPreferences);
  }, [updatePreferences]);

  // Initial fetch
  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return {
    preferences,
    loading,
    saving,
    error,
    updatePreferences,
    refreshPreferences,
    resetToDefaults
  };
};

// Hook for managing device tokens
export const useDeviceTokens = (userId: string) => {
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user device tokens
  const fetchTokens = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/notifications/device-tokens/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch device tokens');
      }

      const data = await response.json();
      
      if (data.success) {
        setTokens(data.device_tokens);
      } else {
        throw new Error(data.error || 'Failed to fetch device tokens');
      }
    } catch (err) {
      console.error('Error fetching device tokens:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch device tokens');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Register new device token
  const registerToken = useCallback(async (token: string, platform: string, deviceId?: string) => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/notifications/device-tokens/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          platform,
          deviceId: deviceId || navigator.userAgent
        })
      });

      if (!response.ok) {
        throw new Error('Failed to register device token');
      }

      const data = await response.json();
      
      if (data.success) {
        // Store token locally
        localStorage.setItem('fcm_token', token);
        
        // Refresh tokens list
        await fetchTokens();
        
        return data.device_token;
      } else {
        throw new Error(data.error || 'Failed to register device token');
      }
    } catch (err) {
      console.error('Error registering device token:', err);
      throw err;
    }
  }, [userId, fetchTokens]);

  // Unregister device token
  const unregisterToken = useCallback(async (token: string) => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/notifications/device-tokens/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      });

      if (!response.ok) {
        throw new Error('Failed to unregister device token');
      }

      const data = await response.json();
      
      if (data.success) {
        // Remove token from local storage if it matches
        const storedToken = localStorage.getItem('fcm_token');
        if (storedToken === token) {
          localStorage.removeItem('fcm_token');
        }
        
        // Refresh tokens list
        await fetchTokens();
      } else {
        throw new Error(data.error || 'Failed to unregister device token');
      }
    } catch (err) {
      console.error('Error unregistering device token:', err);
      throw err;
    }
  }, [userId, fetchTokens]);

  // Initial fetch
  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  return {
    tokens,
    loading,
    error,
    registerToken,
    unregisterToken,
    refreshTokens: fetchTokens
  };
};

// Hook for notification analytics
export const useNotificationAnalytics = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async (startDate?: string, endDate?: string, type?: string) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (type) params.append('type', type);

      const response = await fetch(`/api/notifications/analytics?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notification analytics');
      }

      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.analytics);
      } else {
        throw new Error(data.error || 'Failed to fetch analytics');
      }
    } catch (err) {
      console.error('Error fetching notification analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    analytics,
    loading,
    error,
    fetchAnalytics
  };
};

export default useNotificationPreferences;
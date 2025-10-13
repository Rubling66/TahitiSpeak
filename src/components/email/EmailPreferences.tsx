import React, { useState, useEffect } from 'react';
import { useEmailPreferences } from '../../hooks/useEmail';
import { EmailPreferences as EmailPreferencesType } from '../../services/EmailService';
import { 
  Bell, 
  Mail, 
  Settings, 
  Clock, 
  Globe, 
  Save, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

interface EmailPreferencesProps {
  className?: string;
  showHeader?: boolean;
  onSave?: (preferences: EmailPreferencesType) => void;
}

const EmailPreferences: React.FC<EmailPreferencesProps> = ({
  className = '',
  showHeader = true,
  onSave
}) => {
  const {
    preferences,
    isLoading,
    error,
    updatePreference,
    togglePreference,
    unsubscribeAll,
    resubscribe,
    clearError
  } = useEmailPreferences();

  const [localPreferences, setLocalPreferences] = useState<Partial<EmailPreferencesType>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Sync local state with loaded preferences
  useEffect(() => {
    if (preferences) {
      setLocalPreferences({
        welcomeEmails: preferences.welcomeEmails,
        lessonReminders: preferences.lessonReminders,
        progressUpdates: preferences.progressUpdates,
        achievementNotifications: preferences.achievementNotifications,
        weeklyDigest: preferences.weeklyDigest,
        marketingEmails: preferences.marketingEmails,
        frequency: preferences.frequency,
        timezone: preferences.timezone,
        preferredTime: preferences.preferredTime,
        isUnsubscribed: preferences.isUnsubscribed
      });
      setHasChanges(false);
    }
  }, [preferences]);

  const handlePreferenceChange = (key: keyof EmailPreferencesType, value: any) => {
    setLocalPreferences(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
    setSaveStatus('idle');
    clearError();
  };

  const handleSave = async () => {
    if (!hasChanges || !preferences) return;

    setSaveStatus('saving');
    
    try {
      // Update each changed preference
      for (const [key, value] of Object.entries(localPreferences)) {
        if (preferences[key as keyof EmailPreferencesType] !== value) {
          const success = await updatePreference(key as keyof EmailPreferencesType, value);
          if (!success) {
            throw new Error(`Failed to update ${key}`);
          }
        }
      }

      setSaveStatus('saved');
      setHasChanges(false);
      
      if (onSave && preferences) {
        onSave({ ...preferences, ...localPreferences });
      }

      // Reset save status after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      setSaveStatus('error');
      console.error('Failed to save preferences:', err);
    }
  };

  const handleUnsubscribeAll = async () => {
    const success = await unsubscribeAll();
    if (success) {
      setLocalPreferences(prev => ({ ...prev, isUnsubscribed: true }));
      setHasChanges(false);
    }
  };

  const handleResubscribe = async () => {
    const success = await resubscribe();
    if (success) {
      setLocalPreferences(prev => ({ ...prev, isUnsubscribed: false }));
      setHasChanges(false);
    }
  };

  if (isLoading && !preferences) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading preferences...</span>
      </div>
    );
  }

  if (error && !preferences) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">Failed to load email preferences</span>
          </div>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {showHeader && (
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center">
            <Mail className="w-6 h-6 text-blue-500 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Email Preferences</h2>
              <p className="text-gray-600 text-sm mt-1">
                Manage your email notifications and communication preferences
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 space-y-6">
        {/* Unsubscribe Status */}
        {localPreferences.isUnsubscribed && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Info className="w-5 h-5 text-yellow-500 mr-2" />
                <span className="text-yellow-800 font-medium">You are unsubscribed from all emails</span>
              </div>
              <button
                onClick={handleResubscribe}
                className="text-yellow-700 hover:text-yellow-800 font-medium text-sm underline"
              >
                Resubscribe
              </button>
            </div>
          </div>
        )}

        {/* Email Categories */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Email Categories
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Welcome Emails</h4>
                <p className="text-sm text-gray-600">Get started emails and onboarding messages</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localPreferences.welcomeEmails || false}
                  onChange={(e) => handlePreferenceChange('welcomeEmails', e.target.checked)}
                  disabled={localPreferences.isUnsubscribed}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Lesson Reminders</h4>
                <p className="text-sm text-gray-600">Daily reminders to continue your learning</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localPreferences.lessonReminders || false}
                  onChange={(e) => handlePreferenceChange('lessonReminders', e.target.checked)}
                  disabled={localPreferences.isUnsubscribed}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Progress Updates</h4>
                <p className="text-sm text-gray-600">Weekly summaries of your learning progress</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localPreferences.progressUpdates || false}
                  onChange={(e) => handlePreferenceChange('progressUpdates', e.target.checked)}
                  disabled={localPreferences.isUnsubscribed}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Achievement Notifications</h4>
                <p className="text-sm text-gray-600">Celebrate your milestones and achievements</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localPreferences.achievementNotifications || false}
                  onChange={(e) => handlePreferenceChange('achievementNotifications', e.target.checked)}
                  disabled={localPreferences.isUnsubscribed}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Weekly Digest</h4>
                <p className="text-sm text-gray-600">Community highlights and new content updates</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localPreferences.weeklyDigest || false}
                  onChange={(e) => handlePreferenceChange('weeklyDigest', e.target.checked)}
                  disabled={localPreferences.isUnsubscribed}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Marketing Emails</h4>
                <p className="text-sm text-gray-600">Product updates and promotional content</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localPreferences.marketingEmails || false}
                  onChange={(e) => handlePreferenceChange('marketingEmails', e.target.checked)}
                  disabled={localPreferences.isUnsubscribed}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Frequency Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Frequency &amp; Timing
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Frequency
              </label>
              <select
                value={localPreferences.frequency || 'immediate'}
                onChange={(e) => handlePreferenceChange('frequency', e.target.value)}
                disabled={localPreferences.isUnsubscribed}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="immediate">Immediate</option>
                <option value="daily">Daily Digest</option>
                <option value="weekly">Weekly Summary</option>
                <option value="never">Never</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Time
              </label>
              <input
                type="time"
                value={localPreferences.preferredTime || '09:00'}
                onChange={(e) => handlePreferenceChange('preferredTime', e.target.value)}
                disabled={localPreferences.isUnsubscribed}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Globe className="w-4 h-4 inline mr-1" />
              Timezone
            </label>
            <select
              value={localPreferences.timezone || 'UTC'}
              onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
              disabled={localPreferences.isUnsubscribed}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="Europe/London">London</option>
              <option value="Europe/Paris">Paris</option>
              <option value="Asia/Tokyo">Tokyo</option>
              <option value="Australia/Sydney">Sydney</option>
              <option value="Pacific/Tahiti">Tahiti</option>
            </select>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            onClick={handleUnsubscribeAll}
            disabled={localPreferences.isUnsubscribed}
            className="text-red-600 hover:text-red-700 font-medium text-sm disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            Unsubscribe from all emails
          </button>

          <div className="flex items-center space-x-3">
            {saveStatus === 'saved' && (
              <div className="flex items-center text-green-600">
                <CheckCircle className="w-4 h-4 mr-1" />
                <span className="text-sm">Saved</span>
              </div>
            )}

            {saveStatus === 'error' && (
              <div className="flex items-center text-red-600">
                <AlertCircle className="w-4 h-4 mr-1" />
                <span className="text-sm">Error saving</span>
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={!hasChanges || saveStatus === 'saving' || localPreferences.isUnsubscribed}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {saveStatus === 'saving' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailPreferences;
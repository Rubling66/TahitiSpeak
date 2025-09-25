import { useState, useEffect, useCallback } from 'react';
import SubscriptionService, { SubscriptionStatus, SubscriptionFeature } from '../services/SubscriptionService';

export interface UseSubscriptionReturn {
  // Subscription status
  subscriptionStatus: SubscriptionStatus | null;
  isLoading: boolean;
  error: string | null;
  
  // Subscription actions
  subscribe: (planId: string, planName: string) => Promise<void>;
  unsubscribe: () => Promise<void>;
  checkFeature: (featureId: string) => Promise<boolean>;
  shouldShowPaywall: (featureId: string) => Promise<boolean>;
  
  // Feature management
  availableFeatures: SubscriptionFeature[];
  premiumFeatures: SubscriptionFeature[];
  
  // TTS usage tracking
  ttsUsage: {
    used: number;
    limit: number;
    unlimited: boolean;
  } | null;
  incrementTTSUsage: () => Promise<void>;
  
  // Subscription info
  daysUntilExpiration: number | null;
  isSubscribed: boolean;
  isExpired: boolean;
  
  // Utility functions
  refreshSubscription: () => Promise<void>;
}

export function useSubscription(): UseSubscriptionReturn {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [availableFeatures, setAvailableFeatures] = useState<SubscriptionFeature[]>([]);
  const [premiumFeatures, setPremiumFeatures] = useState<SubscriptionFeature[]>([]);
  const [ttsUsage, setTTSUsage] = useState<{
    used: number;
    limit: number;
    unlimited: boolean;
  } | null>(null);
  const [daysUntilExpiration, setDaysUntilExpiration] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSubscriptionData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load subscription status
      const status = await SubscriptionService.getSubscriptionStatus();
      setSubscriptionStatus(status);

      // Load available features
      const features = await SubscriptionService.getAvailableFeatures();
      setAvailableFeatures(features);

      // Load premium features
      const premium = await SubscriptionService.getPremiumFeatures();
      setPremiumFeatures(premium);

      // Load TTS usage
      const usage = await SubscriptionService.getTTSUsageLimit();
      setTTSUsage(usage);

      // Load expiration info
      const days = await SubscriptionService.getDaysUntilExpiration();
      setDaysUntilExpiration(days);

    } catch (err) {
      console.error('Error loading subscription data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load subscription data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const subscribe = useCallback(async (planId: string, planName: string) => {
    try {
      setError(null);
      await SubscriptionService.subscribe(planId, planName);
      await loadSubscriptionData(); // Refresh data after subscription
    } catch (err) {
      console.error('Error subscribing:', err);
      setError(err instanceof Error ? err.message : 'Failed to subscribe');
      throw err;
    }
  }, [loadSubscriptionData]);

  const unsubscribe = useCallback(async () => {
    try {
      setError(null);
      await SubscriptionService.unsubscribe();
      await loadSubscriptionData(); // Refresh data after unsubscription
    } catch (err) {
      console.error('Error unsubscribing:', err);
      setError(err instanceof Error ? err.message : 'Failed to unsubscribe');
      throw err;
    }
  }, [loadSubscriptionData]);

  const checkFeature = useCallback(async (featureId: string): Promise<boolean> => {
    try {
      return await SubscriptionService.isFeatureAvailable(featureId);
    } catch (err) {
      console.error('Error checking feature:', err);
      return false;
    }
  }, []);

  const shouldShowPaywall = useCallback(async (featureId: string): Promise<boolean> => {
    try {
      return await SubscriptionService.shouldShowPaywall(featureId);
    } catch (err) {
      console.error('Error checking paywall:', err);
      return true; // Show paywall on error to be safe
    }
  }, []);

  const incrementTTSUsage = useCallback(async () => {
    try {
      await SubscriptionService.incrementTTSUsage();
      // Refresh TTS usage after increment
      const usage = await SubscriptionService.getTTSUsageLimit();
      setTTSUsage(usage);
    } catch (err) {
      console.error('Error incrementing TTS usage:', err);
    }
  }, []);

  const refreshSubscription = useCallback(async () => {
    await loadSubscriptionData();
  }, [loadSubscriptionData]);

  // Load data on mount
  useEffect(() => {
    loadSubscriptionData();
  }, [loadSubscriptionData]);

  // Check subscription validity periodically
  useEffect(() => {
    const checkValidity = async () => {
      try {
        const isValid = await SubscriptionService.checkSubscriptionValidity();
        if (!isValid && subscriptionStatus?.isSubscribed) {
          // Subscription expired, refresh data
          await loadSubscriptionData();
        }
      } catch (err) {
        console.error('Error checking subscription validity:', err);
      }
    };

    // Check validity every hour
    const interval = setInterval(checkValidity, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [subscriptionStatus?.isSubscribed, loadSubscriptionData]);

  // Computed values
  const isSubscribed = subscriptionStatus?.isSubscribed ?? false;
  const isExpired = subscriptionStatus?.expiresAt ? 
    subscriptionStatus.expiresAt < new Date() : false;

  return {
    // Subscription status
    subscriptionStatus,
    isLoading,
    error,
    
    // Subscription actions
    subscribe,
    unsubscribe,
    checkFeature,
    shouldShowPaywall,
    
    // Feature management
    availableFeatures,
    premiumFeatures,
    
    // TTS usage tracking
    ttsUsage,
    incrementTTSUsage,
    
    // Subscription info
    daysUntilExpiration,
    isSubscribed,
    isExpired,
    
    // Utility functions
    refreshSubscription,
  };
}

export default useSubscription;
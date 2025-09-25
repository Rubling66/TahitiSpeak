import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SubscriptionStatus {
  isSubscribed: boolean;
  planId: string | null;
  planName: string | null;
  expiresAt: Date | null;
  features: string[];
}

export interface SubscriptionFeature {
  id: string;
  name: string;
  description: string;
  isPremium: boolean;
}

const STORAGE_KEYS = {
  SUBSCRIPTION_STATUS: '@tahiti_tutor_subscription_status',
  SUBSCRIPTION_FEATURES: '@tahiti_tutor_subscription_features',
};

const FREE_FEATURES = [
  'basic_lessons',
  'basic_tts',
  'progress_tracking',
  'offline_content_limited'
];

const PREMIUM_FEATURES = [
  ...FREE_FEATURES,
  'unlimited_tts',
  'advanced_analytics',
  'cultural_content',
  'offline_download',
  'pronunciation_analysis',
  'personalized_learning',
  'priority_support',
  'family_sharing',
  'certificates',
  'ai_conversation'
];

const SUBSCRIPTION_FEATURES: SubscriptionFeature[] = [
  {
    id: 'basic_lessons',
    name: 'Basic Lessons',
    description: 'Access to 20 essential French-Polynesian lessons',
    isPremium: false
  },
  {
    id: 'basic_tts',
    name: 'Basic TTS',
    description: 'Limited text-to-speech generation (10 per day)',
    isPremium: false
  },
  {
    id: 'progress_tracking',
    name: 'Progress Tracking',
    description: 'Basic progress tracking and statistics',
    isPremium: false
  },
  {
    id: 'offline_content_limited',
    name: 'Limited Offline Content',
    description: 'Access to basic offline lessons',
    isPremium: false
  },
  {
    id: 'unlimited_tts',
    name: 'Unlimited TTS',
    description: 'Unlimited text-to-speech generation with premium voices',
    isPremium: true
  },
  {
    id: 'advanced_analytics',
    name: 'Advanced Analytics',
    description: 'Detailed progress insights and learning analytics',
    isPremium: true
  },
  {
    id: 'cultural_content',
    name: 'Cultural Content',
    description: 'Exclusive cultural videos and immersion content',
    isPremium: true
  },
  {
    id: 'offline_download',
    name: 'Offline Downloads',
    description: 'Download all lessons and content for offline use',
    isPremium: true
  },
  {
    id: 'pronunciation_analysis',
    name: 'Pronunciation Analysis',
    description: 'AI-powered pronunciation feedback and correction',
    isPremium: true
  },
  {
    id: 'personalized_learning',
    name: 'Personalized Learning',
    description: 'Adaptive learning path based on your progress',
    isPremium: true
  },
  {
    id: 'priority_support',
    name: 'Priority Support',
    description: '24/7 priority customer support',
    isPremium: true
  },
  {
    id: 'family_sharing',
    name: 'Family Sharing',
    description: 'Share subscription with up to 4 family members',
    isPremium: true
  },
  {
    id: 'certificates',
    name: 'Certificates',
    description: 'Official certificates of completion',
    isPremium: true
  },
  {
    id: 'ai_conversation',
    name: 'AI Conversation Partner',
    description: 'Practice conversations with AI tutor',
    isPremium: true
  }
];

export class SubscriptionService {
  private static instance: SubscriptionService;
  private subscriptionStatus: SubscriptionStatus | null = null;

  private constructor() {}

  static getInstance(): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService();
    }
    return SubscriptionService.instance;
  }

  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    if (this.subscriptionStatus) {
      return this.subscriptionStatus;
    }

    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.SUBSCRIPTION_STATUS);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.subscriptionStatus = {
          ...parsed,
          expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : null
        };
      } else {
        this.subscriptionStatus = this.getDefaultSubscriptionStatus();
      }
    } catch (error) {
      console.error('Error loading subscription status:', error);
      this.subscriptionStatus = this.getDefaultSubscriptionStatus();
    }

    return this.subscriptionStatus;
  }

  async subscribe(planId: string, planName: string): Promise<void> {
    const expiresAt = this.calculateExpirationDate(planId);
    
    this.subscriptionStatus = {
      isSubscribed: true,
      planId,
      planName,
      expiresAt,
      features: PREMIUM_FEATURES
    };

    await this.saveSubscriptionStatus();
  }

  async unsubscribe(): Promise<void> {
    this.subscriptionStatus = this.getDefaultSubscriptionStatus();
    await this.saveSubscriptionStatus();
  }

  async isFeatureAvailable(featureId: string): Promise<boolean> {
    const status = await this.getSubscriptionStatus();
    
    // Check if subscription is still valid
    if (status.isSubscribed && status.expiresAt && status.expiresAt < new Date()) {
      // Subscription expired, downgrade to free
      await this.unsubscribe();
      return FREE_FEATURES.includes(featureId);
    }

    return status.features.includes(featureId);
  }

  async getAvailableFeatures(): Promise<SubscriptionFeature[]> {
    const status = await this.getSubscriptionStatus();
    return SUBSCRIPTION_FEATURES.filter(feature => 
      status.features.includes(feature.id)
    );
  }

  async getPremiumFeatures(): Promise<SubscriptionFeature[]> {
    return SUBSCRIPTION_FEATURES.filter(feature => feature.isPremium);
  }

  async checkSubscriptionValidity(): Promise<boolean> {
    const status = await this.getSubscriptionStatus();
    
    if (!status.isSubscribed) {
      return false;
    }

    if (status.expiresAt && status.expiresAt < new Date()) {
      // Subscription expired
      await this.unsubscribe();
      return false;
    }

    return true;
  }

  async getDaysUntilExpiration(): Promise<number | null> {
    const status = await this.getSubscriptionStatus();
    
    if (!status.isSubscribed || !status.expiresAt) {
      return null;
    }

    const now = new Date();
    const diffTime = status.expiresAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }

  async shouldShowPaywall(featureId: string): Promise<boolean> {
    const isAvailable = await this.isFeatureAvailable(featureId);
    return !isAvailable;
  }

  async getTTSUsageLimit(): Promise<{ used: number; limit: number; unlimited: boolean }> {
    const status = await this.getSubscriptionStatus();
    
    if (status.isSubscribed) {
      return { used: 0, limit: -1, unlimited: true };
    }

    // For free users, implement daily TTS limit
    const today = new Date().toDateString();
    const usageKey = `@tahiti_tutor_tts_usage_${today}`;
    
    try {
      const stored = await AsyncStorage.getItem(usageKey);
      const used = stored ? parseInt(stored, 10) : 0;
      return { used, limit: 10, unlimited: false };
    } catch (error) {
      console.error('Error checking TTS usage:', error);
      return { used: 0, limit: 10, unlimited: false };
    }
  }

  async incrementTTSUsage(): Promise<void> {
    const status = await this.getSubscriptionStatus();
    
    if (status.isSubscribed) {
      return; // Unlimited for premium users
    }

    const today = new Date().toDateString();
    const usageKey = `@tahiti_tutor_tts_usage_${today}`;
    
    try {
      const stored = await AsyncStorage.getItem(usageKey);
      const used = stored ? parseInt(stored, 10) : 0;
      await AsyncStorage.setItem(usageKey, (used + 1).toString());
    } catch (error) {
      console.error('Error incrementing TTS usage:', error);
    }
  }

  private getDefaultSubscriptionStatus(): SubscriptionStatus {
    return {
      isSubscribed: false,
      planId: null,
      planName: null,
      expiresAt: null,
      features: FREE_FEATURES
    };
  }

  private calculateExpirationDate(planId: string): Date | null {
    const now = new Date();
    
    switch (planId) {
      case 'monthly':
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
      case 'yearly':
        return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 365 days
      case 'lifetime':
        return null; // No expiration
      default:
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // Default to monthly
    }
  }

  private async saveSubscriptionStatus(): Promise<void> {
    if (!this.subscriptionStatus) return;

    try {
      const toStore = {
        ...this.subscriptionStatus,
        expiresAt: this.subscriptionStatus.expiresAt?.toISOString() || null
      };
      await AsyncStorage.setItem(
        STORAGE_KEYS.SUBSCRIPTION_STATUS,
        JSON.stringify(toStore)
      );
    } catch (error) {
      console.error('Error saving subscription status:', error);
    }
  }
}

export default SubscriptionService.getInstance();
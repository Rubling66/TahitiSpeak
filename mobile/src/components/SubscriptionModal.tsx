import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  features: string[];
  popular?: boolean;
  savings?: string;
}

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubscribe?: (planId: string) => Promise<void>;
}

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: '$9.99',
    period: 'per month',
    features: [
      'Unlimited TTS usage',
      'Advanced pronunciation analysis',
      'Personalized learning path',
      'Offline content download',
      'Progress analytics',
      'Cultural immersion videos'
    ]
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: '$79.99',
    period: 'per year',
    popular: true,
    savings: 'Save 33%',
    features: [
      'Everything in Monthly',
      'Priority customer support',
      'Exclusive cultural content',
      'Advanced AI conversation partner',
      'Certificate of completion',
      'Family sharing (up to 4 members)'
    ]
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    price: '$199.99',
    period: 'one-time payment',
    savings: 'Best Value',
    features: [
      'Everything in Yearly',
      'Lifetime access to all content',
      'Future language additions',
      'VIP community access',
      'Personal tutor sessions (monthly)',
      'Custom learning materials'
    ]
  }
];

const PREMIUM_FEATURES = [
  {
    icon: 'flash' as const,
    title: 'Unlimited TTS',
    description: 'Generate unlimited audio with premium voices'
  },
  {
    icon: 'star' as const,
    title: 'Advanced Analytics',
    description: 'Detailed progress tracking and insights'
  },
  {
    icon: 'globe' as const,
    title: 'Cultural Content',
    description: 'Exclusive videos and cultural immersion'
  },
  {
    icon: 'download' as const,
    title: 'Offline Access',
    description: 'Download lessons for offline learning'
  }
];

export default function SubscriptionModal({ 
  visible, 
  onClose, 
  onSubscribe 
}: SubscriptionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>('yearly');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubscribe = async () => {
    if (!selectedPlan) return;
    
    setIsProcessing(true);
    
    try {
      // Simulate subscription process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Subscription Successful!',
        'Welcome to Tahiti French Tutor Premium! Your subscription is now active.',
        [
          {
            text: 'Get Started',
            onPress: async () => {
              await onSubscribe?.(selectedPlan);
              onClose();
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert(
        'Subscription Failed',
        'There was an error processing your subscription. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const PlanCard = ({ plan }: { plan: SubscriptionPlan }) => (
    <TouchableOpacity
      style={[
        styles.planCard,
        selectedPlan === plan.id && styles.selectedPlan,
        plan.popular && styles.popularPlan
      ]}
      onPress={() => setSelectedPlan(plan.id)}
    >
      {plan.popular && (
        <View style={styles.popularBadge}>
          <Ionicons name="star" size={12} color="#FFD700" />
          <Text style={styles.popularText}>Most Popular</Text>
        </View>
      )}
      
      {plan.savings && (
        <View style={styles.savingsBadge}>
          <Text style={styles.savingsText}>{plan.savings}</Text>
        </View>
      )}
      
      <View style={styles.planHeader}>
        <Text style={styles.planName}>{plan.name}</Text>
        <Text style={styles.planPrice}>{plan.price}</Text>
        <Text style={styles.planPeriod}>{plan.period}</Text>
      </View>
      
      <View style={styles.featuresContainer}>
        {plan.features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <Ionicons name="checkmark" size={16} color="#34C759" />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>
      
      {selectedPlan === plan.id && (
        <View style={styles.selectedIndicator}>
          <Ionicons name="checkmark" size={20} color="#007AFF" />
        </View>
      )}
    </TouchableOpacity>
  );

  const FeatureHighlight = ({ feature }: { feature: typeof PREMIUM_FEATURES[0] }) => (
    <View style={styles.featureHighlight}>
      <View style={styles.featureIcon}>
        <Ionicons name={feature.icon} size={24} color="#007AFF" />
      </View>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{feature.title}</Text>
        <Text style={styles.featureDescription}>{feature.description}</Text>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#8E8E93" />
          </TouchableOpacity>
          <Text style={styles.title}>Upgrade to Premium</Text>
          <View style={styles.placeholder} />
        </View>
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Premium Features */}
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>Unlock Premium Features</Text>
            {PREMIUM_FEATURES.map((feature, index) => (
              <FeatureHighlight key={index} feature={feature} />
            ))}
          </View>
          
          {/* Subscription Plans */}
          <View style={styles.plansSection}>
            <Text style={styles.sectionTitle}>Choose Your Plan</Text>
            {SUBSCRIPTION_PLANS.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </View>
          
          {/* Terms and Privacy */}
          <View style={styles.legalSection}>
            <Text style={styles.legalText}>
              By subscribing, you agree to our{' '}
              <Text style={styles.linkText}>Terms of Service</Text> and{' '}
              <Text style={styles.linkText}>Privacy Policy</Text>.
            </Text>
            <Text style={styles.legalText}>
              Subscription automatically renews unless cancelled 24 hours before renewal.
            </Text>
          </View>
        </ScrollView>
        
        {/* Subscribe Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.subscribeButton,
              (!selectedPlan || isProcessing) && styles.disabledButton
            ]}
            onPress={handleSubscribe}
            disabled={!selectedPlan || isProcessing}
          >
            <Text style={styles.subscribeButtonText}>
              {isProcessing ? 'Processing...' : 'Start Premium'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  featuresSection: {
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 16,
  },
  featureHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#8E8E93',
  },
  plansSection: {
    paddingVertical: 20,
  },
  planCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedPlan: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  popularPlan: {
    borderColor: '#FFD700',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    left: 20,
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  popularText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1D1D1F',
    marginLeft: 4,
  },
  savingsBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  planHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  planPeriod: {
    fontSize: 14,
    color: '#8E8E93',
  },
  featuresContainer: {
    marginTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#1D1D1F',
    marginLeft: 8,
    flex: 1,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  legalSection: {
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  legalText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 8,
  },
  linkText: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  subscribeButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  disabledButton: {
    backgroundColor: '#8E8E93',
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#8E8E93',
  },
});
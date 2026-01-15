interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  popular?: boolean;
}

interface Subscription {
  id: string;
  planId: string;
  status: 'active' | 'canceled' | 'past_due';
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
}

export class SubscriptionManager {
  private static instance: SubscriptionManager;
  
  static getInstance(): SubscriptionManager {
    if (!this.instance) {
      this.instance = new SubscriptionManager();
    }
    return this.instance;
  }

  getPlans(): SubscriptionPlan[] {
    return [
      {
        id: 'free',
        name: 'Free',
        price: 0,
        interval: 'month',
        features: [
          'Basic AI assistance',
          '5 voice commands per day',
          'Local storage only',
          'Standard themes'
        ]
      },
      {
        id: 'pro',
        name: 'Pro',
        price: 9.99,
        interval: 'month',
        popular: true,
        features: [
          'Advanced AI with Gemini',
          'Unlimited voice commands',
          'Cloud sync across devices',
          'Premium themes & customization',
          'Priority AI responses',
          'Advanced analytics',
          'Vision input (OCR)'
        ]
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        price: 29.99,
        interval: 'month',
        features: [
          'Everything in Pro',
          'Multi-user accounts',
          'Advanced security features',
          'Custom AI training',
          'API access',
          'Dedicated support',
          'White-label options'
        ]
      }
    ];
  }

  async createCheckoutSession(planId: string): Promise<{ success: boolean; sessionId?: string; error?: string }> {
    try {
      // Mock Stripe checkout session creation
      // In production, this would call your backend API
      const sessionId = 'cs_' + Math.random().toString(36).substr(2, 9);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return { success: true, sessionId };
    } catch (error) {
      console.error('Checkout session error:', error);
      return { success: false, error: 'Failed to create checkout session' };
    }
  }

  async cancelSubscription(): Promise<{ success: boolean; error?: string }> {
    try {
      // Mock subscription cancellation
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    } catch (error) {
      console.error('Cancellation error:', error);
      return { success: false, error: 'Failed to cancel subscription' };
    }
  }

  getCurrentSubscription(userId: string): Subscription | null {
    // Mock subscription data - in production, this would come from your database
    const mockSubscriptions: { [key: string]: Subscription } = {
      'user_demo123': {
        id: 'sub_123456',
        planId: 'pro',
        status: 'active',
        currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000,
        cancelAtPeriodEnd: false
      }
    };
    
    return mockSubscriptions[userId] || null;
  }

  isFeatureEnabled(feature: string, userTier: string): boolean {
    const featureMap: { [key: string]: { [tier: string]: boolean } } = {
      'voice_commands': { free: true, pro: true, enterprise: true },
      'cloud_sync': { free: false, pro: true, enterprise: true },
      'vision_input': { free: false, pro: true, enterprise: true },
      'advanced_analytics': { free: false, pro: true, enterprise: true },
      'multi_user': { free: false, pro: false, enterprise: true },
      'api_access': { free: false, pro: false, enterprise: true }
    };
    
    return featureMap[feature]?.[userTier] || false;
  }
}
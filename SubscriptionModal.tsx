import React, { useState } from 'react';
import { X, Check, Star, Crown, Zap, Loader2, CreditCard } from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: string;
  theme: any;
}

export function SubscriptionModal({ isOpen, onClose, currentTier, theme }: SubscriptionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      icon: Zap,
      color: 'text-gray-400',
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
      icon: Star,
      color: 'text-blue-400',
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
      icon: Crown,
      color: 'text-purple-400',
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

  const handleSubscribe = async (planId: string) => {
    if (planId === 'free') {
      onClose();
      return;
    }

    setIsProcessing(true);
    setSelectedPlan(planId);

    try {
      const { SubscriptionManager } = await import('../utils/SubscriptionManager');
      const subscriptionManager = SubscriptionManager.getInstance();
      
      const result = await subscriptionManager.createCheckoutSession(planId);
      
      if (result.success) {
        // In production, redirect to Stripe Checkout
        // window.location.href = `https://checkout.stripe.com/pay/${result.sessionId}`;
        
        // For demo, show success message
        setTimeout(() => {
          setIsProcessing(false);
          onClose();
        }, 2000);
      } else {
        console.error('Checkout failed:', result.error);
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Subscription error:', error);
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`w-full max-w-4xl rounded-2xl ${theme.card} border ${theme.border} p-6 max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className={`text-3xl font-bold ${theme.text} mb-2`}>Choose Your Plan</h2>
            <p className={`${theme.textMuted}`}>Unlock the full power of Aura AI</p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${theme.card} hover:bg-white/10`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = currentTier === plan.id;
            const isSelected = selectedPlan === plan.id;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-6 border-2 transition-all ${
                  plan.popular
                    ? 'border-blue-500/50 bg-blue-500/10'
                    : `${theme.border} ${theme.card}`
                } ${
                  isSelected ? 'ring-2 ring-blue-500' : ''
                } ${
                  isCurrentPlan ? 'opacity-75' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute -top-3 right-4">
                    <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                      Current Plan
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <Icon className={`w-12 h-12 ${plan.color} mx-auto mb-4`} />
                  <h3 className={`text-xl font-bold ${theme.text} mb-2`}>{plan.name}</h3>
                  <div className="flex items-baseline justify-center">
                    <span className={`text-3xl font-bold ${theme.text}`}>
                      ${plan.price}
                    </span>
                    <span className={`${theme.textMuted} ml-1`}>/month</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className={`text-sm ${theme.text}`}>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isProcessing || isCurrentPlan}
                  className={`w-full py-3 rounded-lg font-medium transition-all ${
                    isCurrentPlan
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : isProcessing && isSelected
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : plan.popular
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : `${theme.card} border ${theme.border} ${theme.text} hover:bg-white/10`
                  }`}
                >
                  {isProcessing && isSelected ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </div>
                  ) : isCurrentPlan ? (
                    'Current Plan'
                  ) : plan.id === 'free' ? (
                    'Downgrade'
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Upgrade to {plan.name}
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <div className={`mt-8 p-4 rounded-lg ${theme.card} border ${theme.border}`}>
          <p className={`text-sm ${theme.textMuted} text-center`}>
            All plans include 14-day free trial. Cancel anytime. 
            <a href="#" className="text-blue-400 hover:text-blue-300 ml-1">Terms & Conditions</a>
          </p>
        </div>
      </div>
    </div>
  );
}
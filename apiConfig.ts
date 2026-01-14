import { ENV_CONFIG } from './envConfig';

export const API_CONFIG = {
  GEMINI: {
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    visionEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent',
    temperature: 0.7,
    maxTokens: 1000,
    apiKey: ENV_CONFIG.GEMINI_API_KEY,
  },
  STRIPE: {
    publishableKey: ENV_CONFIG.STRIPE_PUBLISHABLE_KEY,
    priceId: {
      pro: 'price_1234567890', // Mock price ID for demo
      enterprise: 'price_0987654321', // Mock price ID for demo
    },
  },
};

export const isApiKeyConfigured = (): boolean => {
  return !!ENV_CONFIG.GEMINI_API_KEY && ENV_CONFIG.GEMINI_API_KEY.length > 0;
};

export const getApiKey = (): string => {
  if (!isApiKeyConfigured()) {
    throw new Error('Gemini API key not configured. Please set NEXT_PUBLIC_GEMINI_API_KEY in your environment variables.');
  }
  return ENV_CONFIG.GEMINI_API_KEY;
};
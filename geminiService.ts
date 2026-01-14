import { GEMINI_API_KEY, API_CONFIG } from '../config/apiConfig';
import { SecurityShield } from '../utils/SecurityShield';

export class GeminiService {
  private static instance: GeminiService;
  private securityShield: SecurityShield;

  static getInstance(): GeminiService {
    if (!this.instance) {
      this.instance = new GeminiService();
    }
    return this.instance;
  }

  constructor() {
    this.securityShield = SecurityShield.getInstance();
  }

  async generateResponse(prompt: string): Promise<string> {
    this.securityShield.logApiCall();
    
    try {
      const response = await fetch(`${API_CONFIG.GEMINI.endpoint}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `As Aura, an autonomous AI assistant, respond to: ${prompt}`
            }]
          }],
          generationConfig: {
            temperature: API_CONFIG.GEMINI.temperature,
            maxOutputTokens: API_CONFIG.GEMINI.maxTokens,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw error;
    }
  }

  async generateTaskSuggestion(tasks: string[]): Promise<string> {
    this.securityShield.logApiCall();
    
    const prompt = `Based on these tasks: ${tasks.join(', ')}, suggest 3 actionable next steps to maximize productivity. Be specific and encouraging.`;
    return this.generateResponse(prompt);
  }

  async generateFocusInsight(minutes: number): Promise<string> {
    this.securityShield.logApiCall();
    
    const prompt = `I just completed a ${minutes}-minute focus session. Provide an insightful analysis of this achievement and suggest how to maintain this momentum.`;
    return this.generateResponse(prompt);
  }

  async generateProactiveSuggestion(userStats: any): Promise<string> {
    this.securityShield.logApiCall();
    
    const prompt = `Based on my current activity (${userStats.tasksCompleted} tasks completed, ${userStats.focusTime} minutes focused, ${userStats.voiceCommands} voice commands), suggest one proactive productivity tip.`;
    return this.generateResponse(prompt);
  }

  async extractTextFromImage(base64Image: string): Promise<string> {
    this.securityShield.logApiCall();
    
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: "Extract all text from this image, focusing on any to-do lists, tasks, or action items. Preserve the original structure and formatting."
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: base64Image.split(',')[1]
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2000,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Vision API Error: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Gemini Vision API Error:', error);
      throw error;
    }
  }
}
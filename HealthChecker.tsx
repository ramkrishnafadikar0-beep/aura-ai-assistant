import { GeminiService } from '../services/geminiService';
import { SelfHealingLogger } from './SelfHealingLogger';
import { isApiKeyConfigured } from '../config/apiConfig';

export interface HealthStatus {
  isHealthy: boolean;
  lastCheck: number;
  responseTime: number;
  errorCount: number;
  mode: 'normal' | 'lite' | 'offline';
}

export class HealthChecker {
  private static instance: HealthChecker;
  private healthStatus: HealthStatus = {
    isHealthy: true,
    lastCheck: Date.now(),
    responseTime: 0,
    errorCount: 0,
    mode: 'normal'
  };
  private checkInterval: NodeJS.Timeout | null = null;
  private maxErrors = 3;
  private maxResponseTime = 5000; // 5 seconds

  static getInstance(): HealthChecker {
    if (!this.instance) {
      this.instance = new HealthChecker();
    }
    return this.instance;
  }

  start(): void {
    if (this.checkInterval) return;
    
    this.checkInterval = setInterval(() => {
      this.performHealthCheck();
    }, 5 * 60 * 1000); // Every 5 minutes
    
    // Initial check
    this.performHealthCheck();
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private async performHealthCheck(): Promise<void> {
    try {
      if (!isApiKeyConfigured()) {
        this.updateStatus(false, 0, 'offline');
        return;
      }

      const startTime = Date.now();
      const geminiService = GeminiService.getInstance();
      
      // Simple ping to Gemini
      await geminiService.generateResponse('Ping');
      
      const responseTime = Date.now() - startTime;
      
      if (responseTime > this.maxResponseTime) {
        this.handleSlowResponse(responseTime);
      } else {
        this.updateStatus(true, responseTime, 'normal');
        SelfHealingLogger.log('HEALTH_CHECK', 'API health check passed', 'Success', `Response time: ${responseTime}ms`);
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  private handleSlowResponse(responseTime: number): void {
    this.healthStatus.errorCount++;
    
    if (this.healthStatus.errorCount >= this.maxErrors) {
      this.switchToLiteMode();
      SelfHealingLogger.log('SLOW_RESPONSE', 'Switching to Lite Mode due to slow responses', 'Success', `Response time: ${responseTime}ms`);
    } else {
      this.updateStatus(false, responseTime, 'normal');
      SelfHealingLogger.log('SLOW_RESPONSE', 'Detected slow API response', 'Fail', `Response time: ${responseTime}ms`);
    }
  }

  private handleError(error: any): void {
    this.healthStatus.errorCount++;
    
    if (this.healthStatus.errorCount >= this.maxErrors) {
      this.switchToLiteMode();
      SelfHealingLogger.log('API_ERROR', 'Switching to Lite Mode due to API errors', 'Success', error);
    } else {
      this.updateStatus(false, 0, 'normal');
      SelfHealingLogger.log('API_ERROR', 'API error detected', 'Fail', error);
    }
  }

  private switchToLiteMode(): void {
    this.healthStatus.mode = 'lite';
    this.healthStatus.errorCount = 0;
    SelfHealingLogger.log('MODE_SWITCH', 'Switched to Local Lite Mode', 'Success');
  }

  private updateStatus(isHealthy: boolean, responseTime: number, mode: 'normal' | 'lite' | 'offline'): void {
    this.healthStatus = {
      ...this.healthStatus,
      isHealthy,
      lastCheck: Date.now(),
      responseTime,
      mode
    };
  }

  getStatus(): HealthStatus {
    return { ...this.healthStatus };
  }

  resetErrors(): void {
    this.healthStatus.errorCount = 0;
    if (this.healthStatus.mode === 'lite') {
      this.healthStatus.mode = 'normal';
      SelfHealingLogger.log('MODE_RECOVERY', 'Recovered from Lite Mode', 'Success');
    }
  }
}
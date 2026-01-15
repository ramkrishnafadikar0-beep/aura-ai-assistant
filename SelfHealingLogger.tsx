import { isApiKeyConfigured } from '../config/apiConfig';

interface HealingLog {
  errorId: string;
  rootCause: string;
  status: 'Success' | 'Fail';
  timestamp: number;
  details?: string;
}

export class SelfHealingLogger {
  private static logs: HealingLog[] = [];
  private static maxLogs = 50;

  static log(errorId: string, rootCause: string, status: 'Success' | 'Fail', details?: any): void {
    try {
      const log: HealingLog = {
        errorId,
        rootCause,
        status,
        timestamp: Date.now(),
        details: details ? String(details) : undefined
      };

      this.logs.unshift(log);
      
      // Keep only the last maxLogs entries
      if (this.logs.length > this.maxLogs) {
        this.logs = this.logs.slice(0, this.maxLogs);
      }

      // Save to localStorage
      this.saveLogs();
      
      console.log(`[Self-Healing] ${errorId}: ${rootCause} - ${status}`);
    } catch (error) {
      console.error('Failed to log healing event:', error);
    }
  }

  static getLogs(): HealingLog[] {
    try {
      this.loadLogs();
      return [...this.logs];
    } catch (error) {
      console.error('Failed to get healing logs:', error);
      return [];
    }
  }

  static clearLogs(): void {
    try {
      this.logs = [];
      this.saveLogs();
    } catch (error) {
      console.error('Failed to clear healing logs:', error);
    }
  }

  static checkApiKeyStatus(): void {
    try {
      if (!isApiKeyConfigured()) {
        this.log(
          'API_KEY_MISSING',
          'Gemini API key not configured - using placeholder',
          'Fail',
          'Please configure API key in src/config/apiConfig.ts'
        );
      } else {
        this.log(
          'API_KEY_CONFIGURED',
          'Gemini API key is properly configured',
          'Success'
        );
      }
    } catch (error) {
      this.log(
        'API_KEY_CHECK_ERROR',
        'Failed to check API key status',
        'Fail',
        error
      );
    }
  }

  private static saveLogs(): void {
    try {
      localStorage.setItem('aura-healing-logs', JSON.stringify(this.logs));
    } catch (error) {
      console.error('Failed to save healing logs:', error);
    }
  }

  private static loadLogs(): void {
    try {
      const saved = localStorage.getItem('aura-healing-logs');
      if (saved) {
        this.logs = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load healing logs:', error);
      this.logs = [];
    }
  }
}
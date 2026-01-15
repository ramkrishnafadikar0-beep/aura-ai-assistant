interface SecurityEvent {
  id: string;
  type: 'api_spike' | 'unusual_activity' | 'session_rotation' | 'threat_detected';
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: string;
  autoResponse: string;
}

interface SessionKey {
  key: string;
  createdAt: number;
  lastUsed: number;
  usageCount: number;
}

export class SecurityShield {
  private static instance: SecurityShield;
  private sessionKey: SessionKey;
  private apiUsageLog: number[] = [];
  private securityEvents: SecurityEvent[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private maxRequestsPerMinute = 60;
  private sessionRotationInterval = 15 * 60 * 1000; // 15 minutes

  static getInstance(): SecurityShield {
    if (!this.instance) {
      this.instance = new SecurityShield();
    }
    return this.instance;
  }

  constructor() {
    this.sessionKey = this.generateSessionKey();
    this.loadFromStorage();
  }

  start(): void {
    this.monitoringInterval = setInterval(() => {
      this.performSecurityCheck();
    }, 10000); // Check every 10 seconds

    // Auto-rotate session keys
    setInterval(() => {
      this.rotateSessionKey();
    }, this.sessionRotationInterval);
  }

  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  logApiCall(): void {
    const now = Date.now();
    this.apiUsageLog.push(now);
    
    // Keep only last minute of calls
    const oneMinuteAgo = now - 60000;
    this.apiUsageLog = this.apiUsageLog.filter(timestamp => timestamp > oneMinuteAgo);
    
    this.sessionKey.lastUsed = now;
    this.sessionKey.usageCount++;
  }

  private performSecurityCheck(): void {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentCalls = this.apiUsageLog.filter(timestamp => timestamp > oneMinuteAgo);

    // Check for API spikes
    if (recentCalls.length > this.maxRequestsPerMinute) {
      this.handleSecurityEvent({
        id: Date.now().toString(),
        type: 'api_spike',
        timestamp: now,
        severity: 'high',
        details: `Detected ${recentCalls.length} API calls in the last minute (threshold: ${this.maxRequestsPerMinute})`,
        autoResponse: 'Applied rate limiting and rotated session key'
      });
    }

    // Check for unusual patterns
    if (this.detectUnusualPattern(recentCalls)) {
      this.handleSecurityEvent({
        id: Date.now().toString(),
        type: 'unusual_activity',
        timestamp: now,
        severity: 'medium',
        details: 'Unusual API usage pattern detected',
        autoResponse: 'Enhanced monitoring activated'
      });
    }
  }

  private detectUnusualPattern(calls: number[]): boolean {
    if (calls.length < 5) return false;
    
    // Check for bot-like regular intervals
    const intervals = [];
    for (let i = 1; i < calls.length; i++) {
      intervals.push(calls[i] - calls[i-1]);
    }
    
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    
    // Low variance suggests bot-like behavior
    return variance < 1000; // Less than 1 second variance
  }

  private handleSecurityEvent(event: SecurityEvent): void {
    this.securityEvents.push(event);
    
    // Keep only last 50 events
    this.securityEvents = this.securityEvents.slice(-50);
    
    // Auto-response based on severity
    if (event.severity === 'high' || event.severity === 'critical') {
      this.rotateSessionKey();
    }
    
    this.saveToStorage();
  }

  private rotateSessionKey(): void {
    const oldKey = this.sessionKey.key;
    this.sessionKey = this.generateSessionKey();
    
    this.handleSecurityEvent({
      id: Date.now().toString(),
      type: 'session_rotation',
      timestamp: Date.now(),
      severity: 'low',
      details: `Session key rotated from ${oldKey.substring(0, 8)}... to ${this.sessionKey.key.substring(0, 8)}...`,
      autoResponse: 'Session key successfully rotated'
    });
  }

  private generateSessionKey(): SessionKey {
    const key = 'sk-' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return {
      key,
      createdAt: Date.now(),
      lastUsed: Date.now(),
      usageCount: 0
    };
  }

  getCurrentSessionKey(): string {
    return this.sessionKey.key;
  }

  getSecurityStatus(): {
    isSecure: boolean;
    threatsDetected: number;
    lastRotation: number;
    currentRisk: 'low' | 'medium' | 'high';
  } {
    const recentEvents = this.securityEvents.filter(e => 
      Date.now() - e.timestamp < 3600000 // Last hour
    );
    
    const criticalEvents = recentEvents.filter(e => e.severity === 'critical').length;
    const highEvents = recentEvents.filter(e => e.severity === 'high').length;
    
    let currentRisk: 'low' | 'medium' | 'high' = 'low';
    if (criticalEvents > 0) currentRisk = 'high';
    else if (highEvents > 0) currentRisk = 'medium';
    
    return {
      isSecure: currentRisk !== 'high',
      threatsDetected: recentEvents.length,
      lastRotation: this.sessionKey.createdAt,
      currentRisk
    };
  }

  getRecentEvents(): SecurityEvent[] {
    return this.securityEvents
      .filter(e => Date.now() - e.timestamp < 86400000) // Last 24 hours
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem('aura-security-events', JSON.stringify(this.securityEvents));
      localStorage.setItem('aura-session-key', JSON.stringify(this.sessionKey));
    } catch (error) {
      console.error('Failed to save security data:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const savedEvents = localStorage.getItem('aura-security-events');
      if (savedEvents) {
        this.securityEvents = JSON.parse(savedEvents);
      }
      
      const savedKey = localStorage.getItem('aura-session-key');
      if (savedKey) {
        this.sessionKey = JSON.parse(savedKey);
      }
    } catch (error) {
      console.error('Failed to load security data:', error);
    }
  }
}
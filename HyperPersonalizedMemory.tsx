interface FocusPattern {
  hour: number;
  dayOfWeek: number;
  duration: number;
  productivity: number;
  tasksCompleted: number;
  timestamp: number;
}

interface PersonalizedInsight {
  type: 'deep_work' | 'break_suggestion' | 'productivity_peak' | 'energy_management';
  message: string;
  confidence: number;
  action?: {
    type: 'enable_deep_work' | 'suggest_break' | 'optimize_schedule';
    params?: any;
  };
}

export class HyperPersonalizedMemory {
  private static instance: HyperPersonalizedMemory;
  private patterns: FocusPattern[] = [];
  private insights: PersonalizedInsight[] = [];
  private analysisInterval: NodeJS.Timeout | null = null;

  static getInstance(): HyperPersonalizedMemory {
    if (!this.instance) {
      this.instance = new HyperPersonalizedMemory();
    }
    return this.instance;
  }

  start(): void {
    this.loadFromStorage();
    this.analysisInterval = setInterval(() => {
      this.analyzePatterns();
    }, 60000); // Analyze every minute
  }

  stop(): void {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
  }

  recordFocusSession(duration: number, tasksCompleted: number): void {
    const now = new Date();
    const pattern: FocusPattern = {
      hour: now.getHours(),
      dayOfWeek: now.getDay(),
      duration,
      productivity: tasksCompleted / (duration / 60), // tasks per hour
      tasksCompleted,
      timestamp: Date.now()
    };

    this.patterns.push(pattern);
    
    // Keep only last 30 days of data
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    this.patterns = this.patterns.filter(p => p.timestamp > thirtyDaysAgo);
    
    this.saveToStorage();
  }

  private analyzePatterns(): void {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();
    
    // Find patterns for current time
    const relevantPatterns = this.patterns.filter(p => 
      Math.abs(p.hour - currentHour) <= 1 && p.dayOfWeek === currentDay
    );

    if (relevantPatterns.length >= 3) {
      const avgProductivity = relevantPatterns.reduce((sum, p) => sum + p.productivity, 0) / relevantPatterns.length;
      
      // Generate insights based on patterns
      if (avgProductivity > 2.5 && currentHour >= 9 && currentHour <= 11) {
        this.addInsight({
          type: 'deep_work',
          message: "You're most productive in the morning! Enable Deep Work Mode for maximum focus?",
          confidence: 0.85,
          action: {
            type: 'enable_deep_work',
            params: { duration: 120, silenceNotifications: true }
          }
        });
      }

      if (relevantPatterns.length > 5 && avgProductivity < 1.0) {
        this.addInsight({
          type: 'energy_management',
          message: "Your energy seems low at this time. Consider a 15-minute break to recharge?",
          confidence: 0.75,
          action: {
            type: 'suggest_break',
            params: { duration: 15 }
          }
        });
      }

      // Peak productivity detection
      const peakHour = this.findPeakProductivityHour();
      if (peakHour !== null && Math.abs(currentHour - peakHour) <= 1) {
        this.addInsight({
          type: 'productivity_peak',
          message: `You're entering your peak productivity window! Time for your most important tasks.`,
          confidence: 0.9
        });
      }
    }
  }

  private findPeakProductivityHour(): number | null {
    const hourlyProductivity = new Map<number, number[]>();
    
    this.patterns.forEach(pattern => {
      if (!hourlyProductivity.has(pattern.hour)) {
        hourlyProductivity.set(pattern.hour, []);
      }
      hourlyProductivity.get(pattern.hour)!.push(pattern.productivity);
    });

    let peakHour: number | null = null;
    let maxAvgProductivity = 0;

    for (const [hour, productivities] of hourlyProductivity.entries()) {
      if (productivities.length >= 3) {
        const avg = productivities.reduce((sum, p) => sum + p, 0) / productivities.length;
        if (avg > maxAvgProductivity) {
          maxAvgProductivity = avg;
          peakHour = hour;
        }
      }
    }

    return peakHour;
  }

  private addInsight(insight: PersonalizedInsight): void {
    // Avoid duplicate insights
    const exists = this.insights.some(i => 
      i.type === insight.type && 
      Math.abs(Date.now() - i.timestamp) < 300000 // 5 minutes
    );

    if (!exists) {
      (insight as any).timestamp = Date.now();
      this.insights.push(insight);
      
      // Keep only last 10 insights
      this.insights = this.insights.slice(-10);
    }
  }

  getInsights(): PersonalizedInsight[] {
    return this.insights.filter(i => 
      !i.timestamp || Date.now() - i.timestamp < 3600000 // 1 hour
    );
  }

  clearInsights(): void {
    this.insights = [];
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem('aura-focus-patterns', JSON.stringify(this.patterns));
    } catch (error) {
      console.error('Failed to save focus patterns:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem('aura-focus-patterns');
      if (saved) {
        this.patterns = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load focus patterns:', error);
      this.patterns = [];
    }
  }
}
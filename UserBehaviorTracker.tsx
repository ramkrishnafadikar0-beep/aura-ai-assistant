interface BehaviorStats {
  clicks: number;
  hovers: number;
  taskToggles: number;
  voiceCommands: number;
  focusSessions: number;
  lastActivity: number;
}

export class UserBehaviorTracker {
  private static instance: UserBehaviorTracker;
  private stats: BehaviorStats = {
    clicks: 0,
    hovers: 0,
    taskToggles: 0,
    voiceCommands: 0,
    focusSessions: 0,
    lastActivity: Date.now()
  };

  static init(): void {
    if (!this.instance) {
      this.instance = new UserBehaviorTracker();
      this.loadStats();
    }
  }

  static track(action: string): void {
    this.init();
    try {
      switch(action) {
        case 'click':
          this.instance.stats.clicks++;
          break;
        case 'hover':
          this.instance.stats.hovers++;
          break;
        case 'task_toggle':
          this.instance.stats.taskToggles++;
          break;
        case 'voice_command':
          this.instance.stats.voiceCommands++;
          break;
        case 'focus_session':
          this.instance.stats.focusSessions++;
          break;
      }
      this.instance.stats.lastActivity = Date.now();
      this.saveStats();
    } catch (error) {
      console.error('Error tracking behavior:', error);
    }
  }

  static getStats(): BehaviorStats | null {
    this.init();
    return { ...this.instance.stats };
  }

  static resetStats(): void {
    this.init();
    this.instance.stats = {
      clicks: 0,
      hovers: 0,
      taskToggles: 0,
      voiceCommands: 0,
      focusSessions: 0,
      lastActivity: Date.now()
    };
    this.saveStats();
  }

  private static saveStats(): void {
    try {
      localStorage.setItem('aura-behavior-stats', JSON.stringify(this.instance.stats));
    } catch (error) {
      console.error('Failed to save behavior stats:', error);
    }
  }

  private static loadStats(): void {
    try {
      const saved = localStorage.getItem('aura-behavior-stats');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.instance.stats = { ...this.instance.stats, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load behavior stats:', error);
    }
  }
}
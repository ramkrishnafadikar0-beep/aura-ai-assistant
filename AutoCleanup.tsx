export class AutoCleanup {
  private static instance: AutoCleanup;
  private lastCleanupSuggestion = 0;
  private cleanupThreshold = 5;
  private suggestionCooldown = 10 * 60 * 1000; // 10 minutes

  static getInstance(): AutoCleanup {
    if (!this.instance) {
      this.instance = new AutoCleanup();
    }
    return this.instance;
  }

  shouldSuggestCleanup(completedTasks: number): boolean {
    const now = Date.now();
    
    if (completedTasks >= this.cleanupThreshold && 
        now - this.lastCleanupSuggestion > this.suggestionCooldown) {
      this.lastCleanupSuggestion = now;
      return true;
    }
    
    return false;
  }

  generateCleanupMessage(): string {
    const messages = [
      "Your dashboard is getting crowded! Shall I clear completed tasks to keep things tidy? 🧹",
      "I see several completed tasks! Want me to clean them up for a fresh start? ✨",
      "Time for a quick cleanup! Should I remove completed tasks to minimize clutter? 📋",
      "Your task list is growing! Let me clear the finished ones for better focus! 🎯",
      "Dashboard optimization time! Clear completed tasks for a cleaner view? 🧼"
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
  }

  reset(): void {
    this.lastCleanupSuggestion = 0;
  }
}
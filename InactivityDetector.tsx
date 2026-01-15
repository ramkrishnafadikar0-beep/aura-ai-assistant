export class InactivityDetector {
  private timeout: NodeJS.Timeout | null = null;
  private callback: () => void;
  private delay: number;
  private isRunning = false;

  constructor(delay: number, callback: () => void) {
    this.delay = delay;
    this.callback = callback;
  }

  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.reset();
    
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      try {
        document.addEventListener(event, () => this.reset(), true);
      } catch (error) {
        console.error(`Error adding event listener for ${event}:`, error);
      }
    });
  }

  stop(): void {
    this.isRunning = false;
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }

  private reset(): void {
    if (!this.isRunning) return;
    
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    
    try {
      this.timeout = setTimeout(() => {
        this.callback();
      }, this.delay);
    } catch (error) {
      console.error('Error setting timeout:', error);
    }
  }
}
interface Interaction {
  id: string;
  type: 'voice_command' | 'task_action' | 'focus_session' | 'ai_suggestion';
  content: string;
  timestamp: number;
  context?: any;
}

export class ContextMemory {
  private static instance: ContextMemory;
  private interactions: Interaction[] = [];
  private maxInteractions = 10;

  static getInstance(): ContextMemory {
    if (!this.instance) {
      this.instance = new ContextMemory();
    }
    return this.instance;
  }

  addInteraction(type: Interaction['type'], content: string, context?: any): void {
    const interaction: Interaction = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: Date.now(),
      context
    };

    this.interactions.unshift(interaction);
    
    // Keep only the last maxInteractions
    if (this.interactions.length > this.maxInteractions) {
      this.interactions = this.interactions.slice(0, this.maxInteractions);
    }

    // Save to localStorage
    this.saveToStorage();
  }

  getInteractions(): Interaction[] {
    return [...this.interactions];
  }

  getRecentActivitySummary(): string {
    if (this.interactions.length === 0) {
      return "You haven't done anything yet. Ready to get started?";
    }

    const recent = this.interactions.slice(0, 5);
    const summary = recent.map(interaction => {
      const time = new Date(interaction.timestamp).toLocaleTimeString();
      switch (interaction.type) {
        case 'voice_command':
          return `At ${time}, you used voice command: "${interaction.content}"`;
        case 'task_action':
          return `At ${time}, you worked on tasks: ${interaction.content}`;
        case 'focus_session':
          return `At ${time}, you completed a focus session: ${interaction.content}`;
        case 'ai_suggestion':
          return `At ${time}, AI suggested: ${interaction.content}`;
        default:
          return `At ${time}, ${interaction.content}`;
      }
    }).join('. ');

    return `Here's what you were doing earlier: ${summary}`;
  }

  getTaskHistory(): string[] {
    return this.interactions
      .filter(i => i.type === 'task_action')
      .map(i => i.content);
  }

  getFocusHistory(): string[] {
    return this.interactions
      .filter(i => i.type === 'focus_session')
      .map(i => i.content);
  }

  clear(): void {
    this.interactions = [];
    this.saveToStorage();
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem('aura-context-memory', JSON.stringify(this.interactions));
    } catch (error) {
      console.error('Failed to save context memory:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem('aura-context-memory');
      if (saved) {
        this.interactions = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load context memory:', error);
      this.interactions = [];
    }
  }

  // Initialize on first use
  constructor() {
    this.loadFromStorage();
  }
}
interface TaskAesthetic {
  priority: 'low' | 'medium' | 'high';
  type: 'analytical' | 'creative' | 'administrative' | 'strategic';
  theme: {
    background: string;
    border: string;
    glow: string;
    text: string;
    textMuted: string;
  };
}

export class NeuralUIAdapter {
  private static instance: NeuralUIAdapter;
  private currentAesthetic: TaskAesthetic | null = null;

  static getInstance(): NeuralUIAdapter {
    if (!this.instance) {
      this.instance = new NeuralUIAdapter();
    }
    return this.instance;
  }

  analyzeTaskType(taskText: string): TaskAesthetic['type'] {
    const creativeKeywords = ['design', 'create', 'innovate', 'brainstorm', 'art', 'write', 'imagine'];
    const analyticalKeywords = ['analyze', 'review', 'data', 'report', 'research', 'calculate', 'measure'];
    const strategicKeywords = ['plan', 'strategy', 'goal', 'vision', 'roadmap', 'objective', 'mission'];
    
    const text = taskText.toLowerCase();
    
    if (creativeKeywords.some(keyword => text.includes(keyword))) {
      return 'creative';
    } else if (analyticalKeywords.some(keyword => text.includes(keyword))) {
      return 'analytical';
    } else if (strategicKeywords.some(keyword => text.includes(keyword))) {
      return 'strategic';
    } else {
      return 'administrative';
    }
  }

  generateAesthetic(priority: TaskAesthetic['priority'], type: TaskAesthetic['type']): TaskAesthetic['theme'] {
    const baseThemes = {
      high: {
        background: 'bg-red-500/10',
        border: 'border-red-500/30',
        glow: 'shadow-red-500/20',
        text: 'text-red-100',
        textMuted: 'text-red-200/70'
      },
      medium: {
        background: 'bg-yellow-500/10',
        border: 'border-yellow-500/30',
        glow: 'shadow-yellow-500/20',
        text: 'text-yellow-100',
        textMuted: 'text-yellow-200/70'
      },
      low: {
        background: 'bg-green-500/10',
        border: 'border-green-500/30',
        glow: 'shadow-green-500/20',
        text: 'text-green-100',
        textMuted: 'text-green-200/70'
      }
    };

    const typeModifiers = {
      creative: {
        background: 'bg-purple-500/15',
        border: 'border-purple-500/40',
        glow: 'shadow-purple-500/30',
        text: 'text-purple-100',
        textMuted: 'text-purple-200/70'
      },
      analytical: {
        background: 'bg-blue-500/15',
        border: 'border-blue-500/40',
        glow: 'shadow-blue-500/30',
        text: 'text-blue-100',
        textMuted: 'text-blue-200/70'
      },
      strategic: {
        background: 'bg-indigo-500/15',
        border: 'border-indigo-500/40',
        glow: 'shadow-indigo-500/30',
        text: 'text-indigo-100',
        textMuted: 'text-indigo-200/70'
      },
      administrative: {
        background: 'bg-gray-500/15',
        border: 'border-gray-500/40',
        glow: 'shadow-gray-500/30',
        text: 'text-gray-100',
        textMuted: 'text-gray-200/70'
      }
    };

    // For high priority tasks, use focus red regardless of type
    if (priority === 'high') {
      return {
        ...baseThemes.high,
        glow: 'shadow-red-500/40 animate-pulse'
      };
    }

    // Blend base priority theme with type modifier
    const base = baseThemes[priority];
    const modifier = typeModifiers[type];

    return {
      background: modifier.background,
      border: modifier.border,
      glow: modifier.glow,
      text: modifier.text,
      textMuted: modifier.textMuted
    };
  }

  getTaskAesthetic(taskText: string, priority: TaskAesthetic['priority']): TaskAesthetic {
    const type = this.analyzeTaskType(taskText);
    const theme = this.generateAesthetic(priority, type);

    return {
      priority,
      type,
      theme
    };
  }

  updateGlobalAesthetic(tasks: any[]): void {
    // Analyze overall task composition
    const highPriorityCount = tasks.filter(t => t.priority === 'high').length;
    const creativeCount = tasks.filter(t => this.analyzeTaskType(t.text) === 'creative').length;
    
    // Adjust global UI based on task composition
    if (highPriorityCount > 2) {
      // More urgent, focused theme
      document.documentElement.style.setProperty('--glow-color', '239 68 68'); // red
    } else if (creativeCount > 2) {
      // More creative, vibrant theme
      document.documentElement.style.setProperty('--glow-color', '168 85 247'); // purple
    } else {
      // Balanced, neutral theme
      document.documentElement.style.setProperty('--glow-color', '59 130 246'); // blue
    }
  }
}
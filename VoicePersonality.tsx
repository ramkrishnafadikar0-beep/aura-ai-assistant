export class VoicePersonality {
  private static responses = {
    taskCompleted: [
      "Great job! You're making excellent progress! 🎯",
      "Fantastic! Another task bites the dust! ✨",
      "Well done! You're on fire today! 🔥",
      "Awesome! Keep up the momentum! 💪",
      "Brilliant! You're crushing your goals! 🌟"
    ],
    focusSessionStart: [
      "Let's get into the zone! Deep work mode activated! 🧘",
      "Time to focus! You've got this! 💪",
      "Entering flow state! Let's make it count! ⚡",
      "Focus mode engaged! Ready to create magic! ✨",
      "Deep work time! Eliminate distractions! 🎯"
    ],
    focusSessionComplete: [
      "Incredible focus session! You should be proud! 🏆",
      "Amazing work! That was some serious deep focus! 🌟",
      "Fantastic! You've accomplished so much! 🎉",
      "Brilliant session! Your productivity is impressive! 💪",
      "Well done! That focus time was well spent! ✨"
    ],
    taskAdded: [
      "Got it! New task added to your list! 📝",
      "Perfect! Task captured and ready to go! ✅",
      "Excellent! I've added that to your tasks! 📋",
      "Great! Task noted and organized! 🎯",
      "Perfect! Your task is now in the system! 💫"
    ],
    error: [
      "Oops! Something went wrong, but I'm on it! 🛠️",
      "Hmm, let me try that again for you! 🔄",
      "Sorry about that! Let's fix this together! 🔧",
      "Technical hiccup! I'm working on it! ⚙️",
      "Let me handle that! One moment please! ⏳"
    ],
    suggestion: [
      "I have an idea that might help! 💡",
      "Here's a thought for you! 🤔",
      "I noticed something that could help! ✨",
      "Let me suggest something! 🎯",
      "I have a recommendation! 📊"
    ],
    greeting: [
      "Hello! Ready to be productive today? 😊",
      "Hi there! Let's make today amazing! 🌟",
      "Welcome! How can I help you succeed? 💪",
      "Good to see you! Let's accomplish great things! 🎯",
      "Hey! Ready to crush your goals? 🔥"
    ]
  };

  static getResponse(type: keyof typeof VoicePersonality.responses, context?: string): string {
    const responses = this.responses[type];
    const randomIndex = Math.floor(Math.random() * responses.length);
    return responses[randomIndex];
  }

  static getEmotionalResponse(action: string, success: boolean): string {
    if (success) {
      if (action.includes('focus')) {
        return this.getResponse('focusSessionComplete');
      } else if (action.includes('task')) {
        return this.getResponse('taskCompleted');
      } else {
        return this.getResponse('taskCompleted');
      }
    } else {
      return this.getResponse('error');
    }
  }

  static getContextualGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) {
      return "Good morning! Let's start this day strong! ☀️";
    } else if (hour < 17) {
      return "Good afternoon! Keep up the great work! 🌤️";
    } else {
      return "Good evening! Time to wrap up beautifully! 🌅";
    }
  }
}
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, MicOff, Brain, Clock, CheckCircle, Sparkles, Moon, Sun, Zap, Activity, AlertCircle, Settings, X, Key } from 'lucide-react';
import { VoiceInput } from './components/VoiceInput';
import { AmbientCard } from './components/AmbientCard';
import { AIStatusIndicator } from './components/AIStatusIndicator';
import { UserBehaviorTracker } from './utils/UserBehaviorTracker';
import { InactivityDetector } from './utils/InactivityDetector';
import { TimeBasedTheme } from './utils/TimeBasedTheme';
import { SelfHealingLogger } from './utils/SelfHealingLogger';
import { GeminiService } from './services/geminiService';
import { isApiKeyConfigured } from './config/apiConfig';

interface Task {
  id: string;
  text: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

interface Note {
  id: string;
  content: string;
  timestamp: number;
  type: 'suggestion' | 'actionable' | 'ai-generated';
  action?: {
    text: string;
    onAccept: () => void;
    onDecline: () => void;
  };
}

interface LayoutStats {
  taskToggles: number;
  voiceCommands: number;
  focusSessions: number;
  clicks: number;
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', text: 'Review dashboard analytics', completed: false, priority: 'high' },
    { id: '2', text: 'Update project documentation', completed: true, priority: 'medium' },
    { id: '3', text: 'Team sync at 3 PM', completed: false, priority: 'high' },
  ]);
  
  const [notes, setNotes] = useState<Note[]>([
    { 
      id: '1', 
      content: 'Based on your recent activity, I suggest optimizing your workflow for 23% efficiency gain. Should I auto-schedule your next deep work session for tomorrow at 10 AM?', 
      timestamp: Date.now() - 3600000,
      type: 'actionable',
      action: {
        text: 'Schedule deep work session',
        onAccept: () => {
          setNotes(prev => prev.map(note => 
            note.id === '1' 
              ? { ...note, content: 'Great! Deep work session scheduled for tomorrow at 10 AM.', type: 'suggestion' as const }
              : note
          ));
          SelfHealingLogger.log('SCHEDULE_SESSION', 'User accepted AI suggestion', 'Success');
        },
        onDecline: () => {
          setNotes(prev => prev.map(note => 
            note.id === '1' 
              ? { ...note, content: 'No problem! I\'ll suggest another time later.', type: 'suggestion' as const }
              : note
          ));
        }
      }
    },
    { id: '2', content: 'User engagement peaked during focus sessions', timestamp: Date.now() - 7200000, type: 'suggestion' },
  ]);
  
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [lastAIResponse, setLastAIResponse] = useState('Ready to assist');
  const [isInactive, setIsInactive] = useState(false);
  const [focusTime, setFocusTime] = useState(0);
  const [isFocusActive, setIsFocusActive] = useState(false);
  const [layoutStats, setLayoutStats] = useState<LayoutStats>({
    taskToggles: 0,
    voiceCommands: 0,
    focusSessions: 0,
    clicks: 0
  });
  const [layout, setLayout] = useState<'focus' | 'explorer' | 'quick'>('explorer');
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [debugClickCount, setDebugClickCount] = useState(0);
  const [healingLogs, setHealingLogs] = useState(SelfHealingLogger.getLogs());
  const [isApiKeyWarning, setIsApiKeyWarning] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const geminiService = GeminiService.getInstance();

  // Initialize behavior tracking and theme
  useEffect(() => {
    try {
      UserBehaviorTracker.init();
      const savedStats = UserBehaviorTracker.getStats();
      if (savedStats) {
        setLayoutStats(savedStats);
      }
      SelfHealingLogger.log('APP_INIT', 'Application initialized successfully', 'Success');
      
      // Check API key status
      SelfHealingLogger.checkApiKeyStatus();
      setIsApiKeyWarning(!isApiKeyConfigured());
    } catch (error) {
      console.error('Failed to initialize behavior tracker:', error);
      SelfHealingLogger.log('APP_INIT_ERROR', 'Failed to initialize behavior tracker', 'Fail', error);
    }
    
    const hour = new Date().getHours();
    setIsDarkMode(hour < 6 || hour > 18);
    
    const inactivityDetector = new InactivityDetector(5000, () => setIsInactive(true));
    inactivityDetector.start();
    
    return () => {
      try {
        inactivityDetector.stop();
      } catch (error) {
        console.error('Error stopping inactivity detector:', error);
        SelfHealingLogger.log('INACTIVITY_STOP_ERROR', 'Failed to stop inactivity detector', 'Fail', error);
      }
    };
  }, []);

  // Generate AI insights periodically
  useEffect(() => {
    if (!isApiKeyConfigured()) return;

    const interval = setInterval(async () => {
      try {
        setIsGeneratingAI(true);
        const userStats = {
          tasksCompleted: tasks.filter(t => t.completed).length,
          focusTime: Math.floor(focusTime / 60),
          voiceCommands: layoutStats.voiceCommands
        };
        
        const suggestion = await geminiService.generateProactiveSuggestion(userStats);
        
        const newNote: Note = {
          id: Date.now().toString(),
          content: suggestion,
          timestamp: Date.now(),
          type: 'ai-generated'
        };
        
        setNotes(prev => [newNote, ...prev.slice(0, 4)]);
        SelfHealingLogger.log('AI_INSIGHT_GENERATED', 'Successfully generated AI insight', 'Success');
      } catch (error) {
        console.error('Failed to generate AI insight:', error);
        SelfHealingLogger.log('AI_INSIGHT_ERROR', 'Failed to generate AI insight', 'Fail', error);
      } finally {
        setIsGeneratingAI(false);
      }
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [tasks, focusTime, layoutStats.voiceCommands]);

  // Debug panel activation (click logo 5 times)
  const handleLogoClick = useCallback(() => {
    setDebugClickCount(prev => {
      const newCount = prev + 1;
      if (newCount >= 5) {
        setShowDebugPanel(true);
        setHealingLogs(SelfHealingLogger.getLogs());
        return 0;
      }
      return newCount;
    });
  }, []);

  // Focus timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isFocusActive) {
      interval = setInterval(() => {
        setFocusTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isFocusActive]);

  // Layout adaptation based on behavior
  useEffect(() => {
    const interval = setInterval(() => {
      const stats = UserBehaviorTracker.getStats();
      if (stats) {
        setLayoutStats(stats);
        
        // Adapt layout based on usage patterns
        if (stats.taskToggles > 5) {
          setLayout('focus');
        } else if (stats.voiceCommands > 3) {
          setLayout('quick');
        } else {
          setLayout('explorer');
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const handleVoiceCommand = useCallback(async (command: string, action: string) => {
    try {
      setLastAIResponse(command);
      UserBehaviorTracker.track('voice_command');
      SelfHealingLogger.log('VOICE_COMMAND', `Processed command: ${command}`, 'Success');
      
      switch(action) {
        case 'toggleFocus':
          setIsFocusActive(!isFocusActive);
          if (!isFocusActive) {
            setFocusTime(0);
            UserBehaviorTracker.track('focus_session');
          }
          break;
        case 'addTask':
          const taskText = command.replace(/add task|create task/gi, '').trim() || 'New task from voice';
          const newTask: Task = {
            id: Date.now().toString(),
            text: taskText,
            completed: false,
            priority: 'medium'
          };
          setTasks(prev => [...prev, newTask]);
          
          // Generate AI suggestion for new task
          if (isApiKeyConfigured()) {
            try {
              const suggestion = await geminiService.generateTaskSuggestion([taskText]);
              const newNote: Note = {
                id: Date.now().toString(),
                content: suggestion,
                timestamp: Date.now(),
                type: 'ai-generated'
              };
              setNotes(prev => [newNote, ...prev.slice(0, 4)]);
            } catch (error) {
              console.error('Failed to generate task suggestion:', error);
            }
          }
          break;
        case 'completeTask':
          setTasks(prev => {
            const firstIncomplete = prev.find(t => !t.completed);
            if (firstIncomplete) {
              return prev.map(t => 
                t.id === firstIncomplete.id ? { ...t, completed: !t.completed } : t
              );
            }
            return prev;
          });
          break;
        case 'toggleTheme':
          setIsDarkMode(!isDarkMode);
          break;
        case 'clearCompleted':
          setTasks(prev => prev.filter(t => !t.completed));
          break;
      }
    } catch (error) {
      console.error('Error handling voice command:', error);
      setLastAIResponse('Error processing command');
      SelfHealingLogger.log('VOICE_COMMAND_ERROR', 'Failed to process voice command', 'Fail', error);
    }
  }, [isFocusActive, isDarkMode, isApiKeyConfigured]);

  const handleTaskToggle = useCallback((taskId: string) => {
    try {
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, completed: !task.completed } : task
      ));
      UserBehaviorTracker.track('task_toggle');
      SelfHealingLogger.log('TASK_TOGGLE', `Task ${taskId} toggled`, 'Success');
    } catch (error) {
      console.error('Error toggling task:', error);
      SelfHealingLogger.log('TASK_TOGGLE_ERROR', `Failed to toggle task ${taskId}`, 'Fail', error);
    }
  }, []);

  const handleFocusToggle = useCallback(async () => {
    try {
      // Haptic feedback for mobile
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      
      setIsFocusActive(!isFocusActive);
      if (!isFocusActive) {
        setFocusTime(0);
        UserBehaviorTracker.track('focus_session');
        SelfHealingLogger.log('FOCUS_START', 'Focus session started', 'Success');
      } else {
        // Generate AI insight when focus ends
        if (isApiKeyConfigured() && focusTime > 60) {
          try {
            const insight = await geminiService.generateFocusInsight(Math.floor(focusTime / 60));
            const newNote: Note = {
              id: Date.now().toString(),
              content: insight,
              timestamp: Date.now(),
              type: 'ai-generated'
            };
            setNotes(prev => [newNote, ...prev.slice(0, 4)]);
          } catch (error) {
            console.error('Failed to generate focus insight:', error);
          }
        }
        SelfHealingLogger.log('FOCUS_STOP', 'Focus session stopped', 'Success');
      }
    } catch (error) {
      console.error('Error toggling focus:', error);
      SelfHealingLogger.log('FOCUS_TOGGLE_ERROR', 'Failed to toggle focus', 'Fail', error);
    }
  }, [isFocusActive, focusTime, isApiKeyConfigured]);

  const theme = TimeBasedTheme.getTheme(isDarkMode);

  const getLayoutClass = () => {
    switch(layout) {
      case 'focus':
        return 'lg:grid-cols-2';
      case 'explorer':
        return 'lg:grid-cols-3';
      case 'quick':
        return 'lg:grid-cols-4';
      default:
        return 'lg:grid-cols-3';
    }
  };

  const getEmptyStateMessage = (section: string) => {
    switch(section) {
      case 'tasks':
        return {
          icon: <Zap className="w-8 h-8 mb-2" />,
          title: 'No tasks yet!',
          suggestion: 'Try saying "Add task: call John" to get started.'
        };
      case 'stats':
        return {
          icon: <Activity className="w-8 h-8 mb-2" />,
          title: 'Looks like you haven\'t started yet!',
          suggestion: 'Try clicking "Start Focus" or saying "Start focus" to begin!'
        };
      default:
        return null;
    }
  };

  return (
    <div 
      className={`min-h-screen transition-all duration-1000 ${theme.background} ${isInactive ? 'opacity-30' : 'opacity-100'}`}
      onMouseMove={() => setIsInactive(false)}
    >
      {/* Ambient Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* API Key Warning */}
      {isApiKeyWarning && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40 max-w-md">
          <div className="bg-yellow-500/20 border border-yellow-400/50 backdrop-blur-md rounded-lg p-4 flex items-center space-x-3">
            <Key className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-yellow-400 text-sm font-medium">AI Brain not connected</p>
              <p className="text-yellow-300/70 text-xs">Please add your API key in src/config/apiConfig.ts</p>
            </div>
            <button
              onClick={() => setIsApiKeyWarning(false)}
              className="text-yellow-400 hover:text-yellow-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header ref={headerRef} className="relative z-10 p-6 backdrop-blur-sm bg-white/5 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative cursor-pointer" onClick={handleLogoClick}>
              <Brain className={`w-8 h-8 ${theme.icon} animate-pulse`} />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping" />
              {!isApiKeyConfigured() && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full" />
              )}
            </div>
            <h1 className={`text-2xl font-bold ${theme.text}`}>Aura</h1>
            <span className={`text-sm ${theme.textMuted}`}>Autonomous AI Assistant</span>
            {isGeneratingAI && (
              <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
            )}
          </div>
          
          <div className="flex items-center space-x-6">
            <AIStatusIndicator lastResponse={lastAIResponse} theme={theme} />
            <button
              onClick={() => {
                setIsDarkMode(!isDarkMode);
                UserBehaviorTracker.track('click');
              }}
              className={`p-2 rounded-lg ${theme.card} border ${theme.border} hover:bg-white/10 transition-all`}
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-blue-400" />}
            </button>
          </div>
        </div>
      </header>

      {/* Debug Panel */}
      {showDebugPanel && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className={`${theme.card} rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto border ${theme.border}`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-2xl font-bold ${theme.text} flex items-center gap-2`}>
                <Settings className="w-6 h-6" />
                Self-Healing Debug Log
              </h2>
              <button
                onClick={() => setShowDebugPanel(false)}
                className={`p-2 rounded-lg ${theme.card} border ${theme.border} hover:bg-white/10`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              {healingLogs.length === 0 ? (
                <p className={`${theme.textMuted}`}>No healing events recorded yet.</p>
              ) : (
                healingLogs.map((log, index) => (
                  <div key={index} className={`p-4 rounded-lg ${theme.card} border ${theme.border}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs px-2 py-1 rounded ${
                            log.status === 'Success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {log.errorId}
                          </span>
                          <span className={`text-xs ${theme.textMuted}`}>
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className={`${theme.text} mb-1`}>{log.rootCause}</p>
                        <p className={`text-sm ${theme.textMuted}`}>Status: {log.status}</p>
                        {log.details && (
                          <p className={`text-xs ${theme.textMuted} mt-1`}>Details: {log.details}</p>
                        )}
                      </div>
                      {log.status === 'Success' ? (
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto p-6">
        <div className={`grid grid-cols-1 ${getLayoutClass()} gap-6 transition-all duration-500`}>
          
          {/* Voice Control Card */}
          <AmbientCard theme={theme} className="lg:col-span-1">
            <div className="flex flex-col items-center space-y-6">
              <div className="relative">
                <button
                  onClick={() => {
                    setIsListening(!isListening);
                    UserBehaviorTracker.track('click');
                  }}
                  className={`relative w-24 h-24 rounded-full ${isListening ? 'bg-red-500/20 border-red-400' : theme.card} border-2 ${theme.border} hover:scale-105 transition-all duration-300 flex items-center justify-center`}
                >
                  {isListening ? (
                    <MicOff className="w-10 h-10 text-red-400 animate-pulse" />
                  ) : (
                    <Mic className={`w-10 h-10 ${theme.icon}`} />
                  )}
                  {isListening && (
                    <>
                      <div className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping" />
                      {/* Dynamic wave animation */}
                      <div className="absolute inset-0 rounded-full border-2 border-red-300 animate-pulse" />
                      <div className="absolute inset-0 rounded-full border border-red-200 animate-ping" style={{ animationDelay: '0.5s' }} />
                    </>
                  )}
                </button>
              </div>
              
              <VoiceInput
                isListening={isListening}
                onCommand={handleVoiceCommand}
                theme={theme}
              />
              
              <div className={`text-center space-y-2 ${theme.textMuted}`}>
                <p className="text-sm">Try saying:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {['Start focus', 'Add task', 'Complete task', 'Toggle theme', 'Clear completed'].map(cmd => (
                    <span key={cmd} className={`px-2 py-1 rounded ${theme.card} text-xs`}>
                      {cmd}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </AmbientCard>

          {/* Tasks Card */}
          <AmbientCard theme={theme} className="lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${theme.text}`}>Tasks</h3>
              <CheckCircle className={`w-5 h-5 ${theme.iconMuted}`} />
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {tasks.length === 0 ? (
                <div className={`text-center py-8 ${theme.textMuted}`}>
                  {getEmptyStateMessage('tasks')?.icon}
                  <p className="font-medium mb-2">{getEmptyStateMessage('tasks')?.title}</p>
                  <p className="text-sm">{getEmptyStateMessage('tasks')?.suggestion}</p>
                </div>
              ) : (
                tasks.map(task => (
                  <div
                    key={task.id}
                    className={`p-3 rounded-lg ${theme.card} border ${theme.border} hover:bg-white/5 transition-all cursor-pointer`}
                    onClick={() => handleTaskToggle(task.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded border-2 ${task.completed ? 'bg-green-400 border-green-400' : theme.border} flex items-center justify-center`}>
                        {task.completed && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      <span className={`${task.completed ? 'line-through opacity-50' : ''} ${theme.text}`}>
                        {task.text}
                      </span>
                    </div>
                    <div className="mt-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                        task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </AmbientCard>

          {/* Focus Timer Card */}
          <AmbientCard theme={theme} className="lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${theme.text}`}>Focus Timer</h3>
              <Clock className={`w-5 h-5 ${theme.iconMuted}`} />
            </div>
            <div className="flex flex-col items-center space-y-4">
              <div className={`text-5xl font-mono font-bold ${theme.text} transition-all duration-300`}>
                {formatTime(focusTime)}
              </div>
              <button
                onClick={handleFocusToggle}
                className={`px-6 py-2 rounded-lg ${isFocusActive ? 'bg-red-500/20 text-red-400 border-red-400' : theme.card} border ${theme.border} hover:bg-white/10 transition-all transform active:scale-95`}
              >
                {isFocusActive ? 'Stop Focus' : 'Start Focus'}
              </button>
              <div className={`text-sm ${theme.textMuted} text-center`}>
                {isFocusActive ? 'Deep work in progress...' : 'Ready to focus'}
              </div>
            </div>
          </AmbientCard>

          {/* AI Insights Card */}
          <AmbientCard theme={theme} className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${theme.text}`}>AI Insights</h3>
              <div className="flex items-center space-x-2">
                {isGeneratingAI && (
                  <div className="flex items-center space-x-1">
                    <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
                    <span className="text-xs text-blue-400">Generating...</span>
                  </div>
                )}
                <Sparkles className={`w-5 h-5 ${theme.iconMuted} animate-pulse`} />
              </div>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {notes.map(note => (
                <div key={note.id} className={`p-3 rounded-lg ${theme.card} border ${theme.border}`}>
                  <div className="flex items-start justify-between mb-2">
                    <p className={`${theme.text} flex-1`}>{note.content}</p>
                    {note.type === 'ai-generated' && (
                      <Sparkles className="w-4 h-4 text-blue-400 ml-2 flex-shrink-0" />
                    )}
                  </div>
                  <p className={`text-xs ${theme.textMuted} mb-2`}>
                    {new Date(note.timestamp).toLocaleTimeString()}
                  </p>
                  {note.type === 'actionable' && note.action && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={note.action.onAccept}
                        className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30 transition-all"
                      >
                        Yes, please!
                      </button>
                      <button
                        onClick={note.action.onDecline}
                        className={`px-3 py-1 ${theme.card} border ${theme.border} rounded-lg text-sm hover:bg-white/10 transition-all`}
                      >
                        No, thanks.
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </AmbientCard>

          {/* Quick Stats Card */}
          <AmbientCard theme={theme} className="lg:col-span-1">
            <div className="space-y-4">
              <h3 className={`text-lg font-semibold ${theme.text}`}>Activity Stats</h3>
              {layoutStats.clicks === 0 && layoutStats.voiceCommands === 0 && layoutStats.focusSessions === 0 ? (
                <div className={`text-center py-4 ${theme.textMuted}`}>
                  {getEmptyStateMessage('stats')?.icon}
                  <p className="font-medium mb-2">{getEmptyStateMessage('stats')?.title}</p>
                  <p className="text-sm">{getEmptyStateMessage('stats')?.suggestion}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className={`${theme.textMuted}`}>Tasks Done</span>
                    <span className={`font-semibold ${theme.text}`}>
                      {tasks.filter(t => t.completed).length}/{tasks.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`${theme.textMuted}`}>Focus Time</span>
                    <span className={`font-semibold ${theme.text}`}>
                      {Math.floor(focusTime / 60)}m
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`${theme.textMuted}`}>Voice Cmds</span>
                    <span className={`font-semibold ${theme.text}`}>
                      {layoutStats.voiceCommands}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`${theme.textMuted}`}>Layout</span>
                    <span className={`font-semibold ${theme.text}`}>
                      {layout}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`${theme.textMuted}`}>AI Status</span>
                    <span className={`font-semibold ${isApiKeyConfigured() ? 'text-green-400' : 'text-yellow-400'}`}>
                      {isApiKeyConfigured() ? 'Connected' : 'Setup Needed'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </AmbientCard>
        </div>
      </main>
    </div>
  );
}
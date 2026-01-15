import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface VoiceInputProps {
  isListening: boolean;
  onCommand: (command: string, action: string) => void;
  theme: any;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ isListening, onCommand, theme }) => {
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    try {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.maxAlternatives = 1;

      recognitionRef.current.onresult = (event: any) => {
        try {
          const current = event.resultIndex;
          const transcript = event.results[current][0].transcript;
          setTranscript(transcript);
          setError(null);

          if (event.results[current].isFinal) {
            processCommand(transcript.toLowerCase());
          }
        } catch (err) {
          console.error('Speech recognition result error:', err);
          setError('Recognition error');
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setError(`Error: ${event.error}`);
        setIsSupported(false);
      };

      recognitionRef.current.onend = () => {
        setTranscript('');
      };

    } catch (err) {
      console.error('Failed to initialize speech recognition:', err);
      setIsSupported(false);
    }
  }, []);

  useEffect(() => {
    if (!recognitionRef.current) return;

    try {
      if (isListening) {
        recognitionRef.current.start();
      } else {
        recognitionRef.current.stop();
      }
    } catch (err) {
      console.error('Error controlling recognition:', err);
    }
  }, [isListening]);

  const processCommand = (command: string) => {
    try {
      // Enhanced command processing
      if (command.includes('focus') && (command.includes('start') || command.includes('begin'))) {
        onCommand('Focus session started', 'toggleFocus');
      } else if (command.includes('focus') && (command.includes('stop') || command.includes('end'))) {
        onCommand('Focus session stopped', 'toggleFocus');
      } else if (command.includes('task') && (command.includes('add') || command.includes('create'))) {
        const taskText = command.replace(/add|create|task/gi, '').trim();
        onCommand(taskText || 'New task added', 'addTask');
      } else if (command.includes('task') && (command.includes('complete') || command.includes('done') || command.includes('finish'))) {
        onCommand('Task marked as complete', 'completeTask');
      } else if (command.includes('clear') && command.includes('completed')) {
        onCommand('Completed tasks cleared', 'clearCompleted');
      } else if (command.includes('theme') || command.includes('dark') || command.includes('light')) {
        onCommand('Theme toggled', 'toggleTheme');
      } else if (command.includes('hello') || command.includes('hi')) {
        onCommand('Hello! How can I help you today?', 'greeting');
      } else {
        onCommand(`Command received: ${command}`, 'unknown');
      }
      
      setTimeout(() => setTranscript(''), 2000);
    } catch (err) {
      console.error('Error processing command:', err);
      onCommand('Error processing command', 'error');
    }
  };

  if (!isSupported) {
    return (
      <div className={`text-center ${theme.textMuted}`}>
        <VolumeX className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">
          {error || 'Voice commands not supported in this browser'}
        </p>
        <p className="text-xs mt-1">Try Chrome or Edge for best experience</p>
      </div>
    );
  }

  return (
    <div className="text-center space-y-2">
      {isListening && (
        <>
          <div className="flex items-center justify-center space-x-2">
            <Volume2 className={`w-5 h-5 ${theme.icon} animate-pulse`} />
            <span className={`text-sm ${theme.text}`}>Listening...</span>
          </div>
          {transcript && (
            <p className={`text-sm ${theme.textMuted} italic`}>"{transcript}"</p>
          )}
          {error && (
            <p className={`text-xs text-red-400`}>{error}</p>
          )}
        </>
      )}
    </div>
  );
};
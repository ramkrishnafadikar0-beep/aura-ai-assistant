import React from 'react';
import { Brain, Activity } from 'lucide-react';

interface AIStatusIndicatorProps {
  lastResponse: string;
  theme: any;
}

export const AIStatusIndicator: React.FC<AIStatusIndicatorProps> = ({ lastResponse, theme }) => {
  return (
    <div className="flex items-center space-x-3">
      <div className="relative">
        <Brain className={`w-6 h-6 ${theme.icon}`} />
        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
      </div>
      <div className="hidden sm:block">
        <p className={`text-sm ${theme.textMuted}`}>AI Status</p>
        <p className={`text-xs ${theme.text} font-medium truncate max-w-xs`}>{lastResponse}</p>
      </div>
      <Activity className={`w-4 h-4 ${theme.iconMuted} animate-pulse`} />
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { UserBehaviorTracker } from '../utils/UserBehaviorTracker';

interface LayoutAdaptorProps {
  children: React.ReactNode;
}

export const LayoutAdaptor: React.FC<LayoutAdaptorProps> = ({ children }) => {
  const [layout, setLayout] = useState<'focus' | 'explorer' | 'quick'>('explorer');

  useEffect(() => {
    // Analyze user behavior every 10 seconds
    const interval = setInterval(() => {
      const behavior = UserBehaviorTracker.getBehavior();
      
      // Simple heuristic to determine layout
      if (behavior.taskToggles > 5) {
        setLayout('focus');
      } else if (behavior.voiceCommands > 3) {
        setLayout('quick');
      } else {
        setLayout('explorer');
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

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

  return (
    <div className={`grid grid-cols-1 ${getLayoutClass()} gap-6 transition-all duration-500`}>
      {children}
    </div>
  );
};
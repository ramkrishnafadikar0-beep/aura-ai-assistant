import React from { ReactNode };

interface EnhancedAmbientCardProps {
  theme: any;
  className?: string;
  children: ReactNode;
  isGlowing?: boolean;
  isThinking?: boolean;
}

export function EnhancedAmbientCard({ 
  theme, 
  className = '', 
  children, 
  isGlowing = false,
  isThinking = false 
}: EnhancedAmbientCardProps) {
  return (
    <div 
      className={`
        relative p-6 rounded-2xl backdrop-blur-md transition-all duration-300
        ${theme.card} border ${theme.border}
        ${isGlowing ? 'ring-2 ring-yellow-400/50 ring-offset-2 ring-offset-transparent animate-pulse' : ''}
        ${isThinking ? 'animate-pulse' : ''}
        ${className}
      `}
    >
      {isThinking && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 animate-pulse" />
      )}
      {children}
    </div>
  );
}
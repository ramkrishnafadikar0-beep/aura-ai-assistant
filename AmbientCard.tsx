import React from 'react';

interface AmbientCardProps {
  children: React.ReactNode;
  theme: any;
  className?: string;
}

export const AmbientCard: React.FC<AmbientCardProps> = ({ children, theme, className = '' }) => {
  return (
    <div 
      className={`
        relative backdrop-blur-md bg-white/10 border border-white/20 
        rounded-2xl p-6 hover:bg-white/15 transition-all duration-300
        hover:scale-[1.02] hover:shadow-2xl
        ${className}
      `}
      style={{
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
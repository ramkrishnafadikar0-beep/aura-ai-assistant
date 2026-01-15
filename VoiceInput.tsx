import React from 'react';
import { Mic } from 'lucide-react';

export const VoiceInput = ({ onSpeechEnd, theme }: any) => (
  <button onClick={() => onSpeechEnd("Hello Aura")} className={`p-4 rounded-full ${theme.card} border ${theme.border}`}>
    <Mic className={theme.icon} />
  </button>
);

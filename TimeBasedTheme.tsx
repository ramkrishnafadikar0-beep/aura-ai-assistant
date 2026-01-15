export interface Theme {
  background: string;
  text: string;
  textMuted: string;
  icon: string;
  iconMuted: string;
  card: string;
  border: string;
}

export class TimeBasedTheme {
  static getTheme(isDarkMode: boolean): Theme {
    if (isDarkMode) {
      return {
        background: 'bg-slate-900',
        text: 'text-slate-100',
        textMuted: 'text-slate-400',
        icon: 'text-slate-300',
        iconMuted: 'text-slate-500',
        card: 'bg-slate-800/50',
        border: 'border-slate-700'
      };
    } else {
      return {
        background: 'bg-slate-50',
        text: 'text-slate-900',
        textMuted: 'text-slate-600',
        icon: 'text-slate-700',
        iconMuted: 'text-slate-400',
        card: 'bg-white/70',
        border: 'border-slate-200'
      };
    }
  }
}
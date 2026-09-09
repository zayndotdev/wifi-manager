import * as React from 'react';
import { ThemePalette, ThemeConfig } from '../types/theme';

export const THEME_CONFIGS: ThemeConfig[] = [
  {
    id: 'clean-slate',
    name: 'Clean Slate',
    description: 'Minimalist crisp light design inspired by theengine.dev',
    dotColor: '#2563EB',
  },
  {
    id: 'warm-neutral',
    name: 'Warm Neutral',
    description: 'Alabaster, stone borders and terracotta amber',
    dotColor: '#EA580C',
  },
  {
    id: 'nordic-sky',
    name: 'Nordic Sky',
    description: 'Cool ice white, slate frost and arctic azure',
    dotColor: '#0284C7',
  },
  {
    id: 'emerald-minimal',
    name: 'Emerald Minimal',
    description: 'Botanical sage with fresh mint and forest graphite',
    dotColor: '#059669',
  },
  {
    id: 'onyx-contrast',
    name: 'Onyx Contrast',
    description: 'Refined deep dark mode for low-light observation',
    dotColor: '#3B82F6',
    isDark: true,
  },
];

interface ThemeContextType {
  palette: ThemePalette;
  setPalette: (theme: ThemePalette) => void;
  isDark: boolean;
  themes: ThemeConfig[];
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [palette, setPaletteState] = React.useState<ThemePalette>(() => {
    const saved = localStorage.getItem('wifi_sentinel_theme');
    return (saved as ThemePalette) || 'clean-slate';
  });

  const setPalette = React.useCallback((theme: ThemePalette) => {
    setPaletteState(theme);
    localStorage.setItem('wifi_sentinel_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'onyx-contrast') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', palette);
    if (palette === 'onyx-contrast') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [palette]);

  const isDark = palette === 'onyx-contrast';

  return (
    <ThemeContext.Provider
      value={{
        palette,
        setPalette,
        isDark,
        themes: THEME_CONFIGS,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

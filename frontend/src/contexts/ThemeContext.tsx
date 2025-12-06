'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as Theme | null;
      return savedTheme || 'light';
    }
    return 'light';
  });
  const pathname = usePathname();

  useEffect(() => {
    // Save theme preference whenever it changes
    if (typeof window !== 'undefined' && theme !== 'system') {
      localStorage.setItem('theme', theme);
    }
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Always force light theme on the login page
    if (pathname === '/login') {
      // Set data-theme attribute for light mode
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.classList.remove('dark');
      return;
    }

    // Apply theme to document for all other pages
    if (theme === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', systemPrefersDark ? 'dark' : 'light');
      if (systemPrefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
      document.documentElement.setAttribute('data-theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [theme, pathname]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
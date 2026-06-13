'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';

// Two global, persisted UI concerns:
//  - theme: light | dark (dark mode 2.0), system-aware on first load
//  - proMode: when ON, screens reveal the crypto layer (USDC, tx hashes, explorer
//    links). Default OFF — the app reads as a clean fintech product (2026 best
//    practice: abstract for the mass market, transparency-on-demand for power users).

type Theme = 'light' | 'dark';

type UIState = {
  theme: Theme;
  toggleTheme: () => void;
  proMode: boolean;
  toggleProMode: () => void;
  setProMode: (v: boolean) => void;
};

const UIContext = createContext<UIState | null>(null);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [proMode, setProModeState] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Hydrate from localStorage / system preference once on mount.
  useEffect(() => {
    const storedTheme = localStorage.getItem('fid-theme') as Theme | null;
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(storedTheme ?? (systemDark ? 'dark' : 'light'));
    setProModeState(localStorage.getItem('fid-pro') === '1');
    setMounted(true);
  }, []);

  // Reflect theme onto <html> so CSS variables switch.
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('fid-theme', theme);
  }, [theme, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('fid-pro', proMode ? '1' : '0');
  }, [proMode, mounted]);

  const toggleTheme = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);
  const toggleProMode = useCallback(() => setProModeState((p) => !p), []);
  const setProMode = useCallback((v: boolean) => setProModeState(v), []);

  return (
    <UIContext.Provider value={{ theme, toggleTheme, proMode, toggleProMode, setProMode }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI(): UIState {
  const ctx = useContext(UIContext);
  if (!ctx) {
    // Safe fallback so a stray consumer never crashes (e.g. during SSR edge cases).
    return {
      theme: 'light',
      toggleTheme: () => {},
      proMode: false,
      toggleProMode: () => {},
      setProMode: () => {},
    };
  }
  return ctx;
}

// Convenience: render children only when Pro mode is on.
export function ProOnly({ children }: { children: React.ReactNode }) {
  const { proMode } = useUI();
  return proMode ? <>{children}</> : null;
}

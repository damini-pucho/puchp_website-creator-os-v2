// Theme — light / dark / follow the system. html[data-theme] is the one switch; index.html sets it before first paint
// (no light flash), the header toggle flips it and persists `pucho-theme` ('light' | 'dark'; absent = system).
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const KEY = 'pucho-theme';
const ThemeContext = createContext({ theme: 'light', mode: 'system', toggle: () => {} });
export const useTheme = () => useContext(ThemeContext);

const systemTheme = () => (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
const readMode = () => { try { const v = localStorage.getItem(KEY); return v === 'light' || v === 'dark' ? v : 'system'; } catch { return 'system'; } };

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(readMode);
  const [sys, setSys] = useState(systemTheme);
  const theme = mode === 'system' ? sys : mode;

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return undefined;
    const on = () => setSys(mq.matches ? 'dark' : 'light');
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#141413' : '#FFFFFF');
  }, [theme]);

  /** One click flips what you see; Shift-click goes back to following the system. */
  const toggle = useCallback((followSystem = false) => {
    const next = followSystem ? 'system' : theme === 'dark' ? 'light' : 'dark';
    setMode(next);
    try { if (next === 'system') localStorage.removeItem(KEY); else localStorage.setItem(KEY, next); } catch { /* private mode */ }
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, mode, toggle }}>{children}</ThemeContext.Provider>;
}

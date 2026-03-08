"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const THEME_KEY = "theme";

type ThemeContextValue = {
  dark: boolean;
  spinKey: number;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(true);
  const [spinKey, setSpinKey] = useState(0);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    queueMicrotask(() => setDark(isDark));
  }, []);

  const toggle = useCallback(() => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem(THEME_KEY, next ? "dark" : "light");
    setDark(next);
    setSpinKey((k) => k + 1);
  }, []);

  return (
    <ThemeContext.Provider value={{ dark, spinKey, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

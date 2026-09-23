import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
export type ColorTheme = "sand" | "ocean" | "forest" | "plum" | "sunset";

interface ThemeContextType {
  theme: Theme;
  toggleTheme?: () => void;
  switchable: boolean;
  colorTheme: ColorTheme;
  setColorTheme: (theme: ColorTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = false,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (switchable) {
      const stored = localStorage.getItem("theme");
      return (stored as Theme) || defaultTheme;
    }
    return defaultTheme;
  });
  const [colorTheme, setColorThemeState] = useState<ColorTheme>(() => {
    const stored = localStorage.getItem("color-theme") as ColorTheme | null;
    return stored || "sand";
  });

  const animateThemeChange = (change: () => void) => {
    document.documentElement.classList.add("theme-transitioning");
    change();
    window.setTimeout(() => document.documentElement.classList.remove("theme-transitioning"), 360);
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    if (switchable) {
      localStorage.setItem("theme", theme);
    }
  }, [theme, switchable]);

  useEffect(() => {
    document.documentElement.dataset.colorTheme = colorTheme;
    localStorage.setItem("color-theme", colorTheme);
  }, [colorTheme]);

  const toggleTheme = switchable
    ? () => animateThemeChange(() => setTheme(prev => (prev === "light" ? "dark" : "light")))
    : undefined;

  const setColorTheme = (nextTheme: ColorTheme) => {
    if (nextTheme === colorTheme) return;
    animateThemeChange(() => setColorThemeState(nextTheme));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, switchable, colorTheme, setColorTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

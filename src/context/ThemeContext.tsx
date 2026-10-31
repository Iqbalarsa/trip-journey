"use client";

import React, { createContext, useContext, useEffect } from "react";

export type ThemeMode = "light";
export type ThemeColor = "slate";

interface ThemeContextType {
  themeMode: "light";
  themeColor: "slate";
  resolvedMode: "light";
  setThemeMode: (mode: any) => void;
  setThemeColor: (color: any) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  themeMode: "light",
  themeColor: "slate",
  resolvedMode: "light",
  setThemeMode: () => {},
  setThemeColor: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Enforce light mode and Apple Blue (#007AFF)
    const root = document.documentElement;
    root.classList.remove("dark", "theme-amber", "theme-rose", "theme-custom1", "theme-custom2", "theme-custom3");
    root.classList.add("theme-slate");
    root.setAttribute("data-palette", "slate");

    // Clean up any old dark mode or custom theme preferences from localStorage
    try {
      localStorage.removeItem("app-theme-mode");
      localStorage.removeItem("app-theme-color");
      localStorage.removeItem("app-custom-1");
      localStorage.removeItem("app-custom-2");
      localStorage.removeItem("app-custom-3");
    } catch {}
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        themeMode: "light",
        themeColor: "slate",
        resolvedMode: "light",
        setThemeMode: () => {},
        setThemeColor: () => {},
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

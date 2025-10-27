"use client";

import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { CssBaseline, PaletteMode, ThemeProvider } from "@mui/material";

import { createAppTheme } from "@/theme";

type ThemeModeContextValue = {
  mode: PaletteMode;
  toggleMode: () => void;
};

const ThemeModeContext = createContext<ThemeModeContextValue | undefined>(undefined);

type ThemeModeProviderProps = {
  children: ReactNode;
};

export const ThemeModeProvider = ({ children }: ThemeModeProviderProps) => {
  const [mode, setMode] = useState<PaletteMode>(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("themeMode");
      if (stored === "light" || stored === "dark") {
        return stored;
      }
    }
    return "dark";
  });

  const toggleMode = useCallback(
    () => setMode((prev) => (prev === "light" ? "dark" : "light")),
    [],
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("themeMode", mode);
    }
  }, [mode]);

  const contextValue = useMemo(
    () => ({
      mode,
      toggleMode,
    }),
    [mode, toggleMode],
  );

  const theme = useMemo(() => createAppTheme(mode), [mode]);

  return (
    <ThemeModeContext.Provider value={contextValue}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
};

export const useThemeMode = () => {
  const context = useContext(ThemeModeContext);

  if (!context) {
    throw new Error("useThemeMode must be used within a ThemeModeProvider");
  }

  return context;
};

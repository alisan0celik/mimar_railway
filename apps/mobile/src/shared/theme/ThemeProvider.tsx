import type { ReactNode } from "react";
import { createContext, useContext, useMemo } from "react";
import { StatusBar } from "expo-status-bar";

import { useAppStore } from "../../store/appStore";
import type { AppColors, ThemeMode } from "./colors";
import { getPalette, isDarkThemeMode } from "./colors";

type ThemeContextValue = {
  mode: ThemeMode;
  colors: AppColors;
};

const ThemeContext = createContext<ThemeContextValue>({
  mode: "dark",
  colors: getPalette("dark"),
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const mode = useAppStore((s) => s.themeMode);
  const value = useMemo(() => ({ mode, colors: getPalette(mode) }), [mode]);

  return (
    <ThemeContext.Provider value={value}>
      <StatusBar style={isDarkThemeMode(mode) ? "light" : "dark"} />
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeColors(): AppColors {
  return useContext(ThemeContext).colors;
}

export function useThemeMode(): ThemeMode {
  return useContext(ThemeContext).mode;
}

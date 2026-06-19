import { darkColors } from "./colors.dark";
import { lightColors } from "./colors.light";

export type AppColors = { [K in keyof typeof darkColors]: string };
export type ColorToken = keyof AppColors;
export type ThemeMode = "dark" | "light";

export const palettes: Record<ThemeMode, AppColors> = {
  dark: { ...darkColors },
  light: { ...lightColors },
};

/** Varsayılan (koyu) — yeni kodda useThemeColors tercih edin */
export const colors: AppColors = { ...darkColors };

export function getPalette(mode: ThemeMode): AppColors {
  return palettes[mode];
}

export function themeModeLabel(mode: ThemeMode): string {
  return mode === "dark" ? "Koyu" : "Açık";
}

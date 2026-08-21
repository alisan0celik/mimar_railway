import { darkColors } from "./colors.dark";
import { kozmozColors } from "./colors.kozmoz";
import { lightColors } from "./colors.light";

export type AppColors = { [K in keyof typeof darkColors]: string };
export type ColorToken = keyof AppColors;
export type ThemeMode = "dark" | "light" | "kozmoz";

/** Koyu arka plan kullanan temalar — durum çubuğu ve benzeri kararlar için. */
export const DARK_THEME_MODES: ThemeMode[] = ["dark", "kozmoz"];

export const THEME_MODES: ThemeMode[] = ["dark", "light", "kozmoz"];

/** Kurulumdan sonraki ilk açılışta kullanılan tema. */
export const DEFAULT_THEME_MODE: ThemeMode = "kozmoz";

export const palettes: Record<ThemeMode, AppColors> = {
  dark: { ...darkColors },
  light: { ...lightColors },
  kozmoz: { ...kozmozColors },
};

/** Varsayılan (koyu) — yeni kodda useThemeColors tercih edin */
export const colors: AppColors = { ...darkColors };

export function getPalette(mode: ThemeMode): AppColors {
  return palettes[mode] ?? palettes[DEFAULT_THEME_MODE];
}

export function isDarkThemeMode(mode: ThemeMode): boolean {
  return DARK_THEME_MODES.includes(mode);
}

export function isThemeMode(value: unknown): value is ThemeMode {
  return typeof value === "string" && THEME_MODES.includes(value as ThemeMode);
}

export function themeModeLabel(mode: ThemeMode): string {
  if (mode === "kozmoz") return "Kozmoz";
  return mode === "dark" ? "Koyu" : "Açık";
}

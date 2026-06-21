import { useMemo } from "react";
import type { ImageStyle, TextStyle, ViewStyle } from "react-native";
import { StyleSheet } from "react-native";

import type { AppColors } from "./colors";
import { useThemeColors } from "./ThemeProvider";

type NamedStyles<T> = {
  [P in keyof T]: ViewStyle | TextStyle | ImageStyle;
};

export function useThemedStyles<T extends NamedStyles<T>>(
  factory: (colors: AppColors) => T,
): T {
  const colors = useThemeColors();
  return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
}

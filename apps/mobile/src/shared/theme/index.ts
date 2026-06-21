export * from "./colors";
export * from "./colors.dark";
export * from "./colors.light";
export * from "./radius";
export * from "./shadows";
export * from "./spacing";
export * from "./typography";
export * from "./ThemeProvider";
export * from "./useThemedStyles";

import { StyleSheet } from "react-native";

import { colors } from "./colors";
import { radius } from "./radius";
import { shadows } from "./shadows";
import { spacing } from "./spacing";
import { typography } from "./typography";

export const componentTokens = {
  screen: {
    horizontalPadding: spacing.lg,
    topPadding: spacing.md,
    bottomPadding: spacing.xl,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  button: {
    borderRadius: radius.lg,
    minHeights: {
      sm: 40,
      md: 48,
      lg: 54,
    },
  },
  input: {
    borderRadius: radius.md,
    minHeight: 50,
  },
  badge: {
    borderRadius: radius.full,
  },
} as const;

export const theme = {
  colors,
  spacing,
  radius,
  typography,
  shadows,
  components: componentTokens,
} as const;

export type Theme = typeof theme;

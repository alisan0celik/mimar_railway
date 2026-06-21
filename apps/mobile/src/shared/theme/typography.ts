import type { TextStyle } from "react-native";

import { colors } from "./colors";

export const typography = {
  display: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
    color: colors.text,
  },
  h1: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "700",
    color: colors.text,
  },
  h2: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
    color: colors.text,
  },
  h3: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "600",
    color: colors.text,
  },
  screenTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
    color: colors.text,
  },
  screenSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400",
    color: colors.textMuted,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "600",
    color: colors.text,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "400",
    color: colors.textSoft,
  },
  bodySmall: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400",
    color: colors.textMuted,
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
    color: colors.textSoft,
  },
  overline: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.textMuted,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400",
    color: colors.textMuted,
  },
  button: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "700",
    letterSpacing: 0.2,
    color: colors.white,
  },
  buttonSmall: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
    letterSpacing: 0.15,
    color: colors.white,
  },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;

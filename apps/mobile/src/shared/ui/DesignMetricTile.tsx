import { StyleSheet, Text, View, type ViewStyle } from "react-native";

import { radius, spacing, typography } from "../theme";
import type { AppColors } from "../theme/colors";
import { useThemeColors } from "../theme/ThemeProvider";
import { useThemedStyles } from "../theme/useThemedStyles";

type Tone = "green" | "blue" | "red" | "purple" | "orange" | "primary";

function toneStyles(colors: AppColors): Record<Tone, { bg: string; accent: string; border: string }> {
  return {
    green: { bg: colors.metricGreenBg, accent: colors.metricGreen, border: `${colors.metricGreen}40` },
    blue: { bg: colors.metricBlueBg, accent: colors.metricBlue, border: `${colors.metricBlue}40` },
    red: { bg: colors.metricRedBg, accent: colors.metricRed, border: `${colors.metricRed}40` },
    purple: { bg: colors.metricPurpleBg, accent: colors.metricPurple, border: `${colors.metricPurple}40` },
    orange: { bg: colors.metricOrangeBg, accent: colors.metricOrange, border: `${colors.metricOrange}40` },
    primary: { bg: colors.primarySoft, accent: colors.primaryLight, border: `${colors.primary}40` },
  };
}

type DesignMetricTileProps = {
  label: string;
  value: string;
  tone: Tone;
  style?: ViewStyle;
};

export function DesignMetricTile({ label, value, tone, style }: DesignMetricTileProps) {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const tonePalette = toneStyles(colors)[tone];

  return (
    <View style={[styles.tile, { backgroundColor: tonePalette.bg, borderColor: tonePalette.border }, style]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: tonePalette.accent }]}>{value}</Text>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    tile: {
      borderRadius: radius.lg,
      borderWidth: 1,
      padding: spacing.md,
      minHeight: 92,
      justifyContent: "space-between",
    },
    label: {
      ...typography.caption,
      color: colors.textMuted,
      fontWeight: "600",
    },
    value: {
      fontSize: 18,
      lineHeight: 24,
      fontWeight: "800",
    },
  });
}

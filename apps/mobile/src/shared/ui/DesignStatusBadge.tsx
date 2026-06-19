import { StyleSheet, Text, View } from "react-native";

import { radius, typography } from "../theme";
import type { AppColors } from "../theme/colors";
import { useThemeColors } from "../theme/ThemeProvider";
import { useThemedStyles } from "../theme/useThemedStyles";

type Variant = "success" | "warning" | "danger" | "info" | "neutral";

function variantStyles(colors: AppColors): Record<Variant, { bg: string; text: string; border: string }> {
  return {
    success: { bg: colors.successSoft, text: colors.success, border: `${colors.success}55` },
    warning: { bg: colors.warningSoft, text: colors.warning, border: `${colors.warning}55` },
    danger: { bg: colors.dangerSoft, text: colors.danger, border: `${colors.danger}55` },
    info: { bg: colors.infoSoft, text: colors.info, border: `${colors.info}55` },
    neutral: { bg: colors.cardSoft, text: colors.textMuted, border: colors.border },
  };
}

type DesignStatusBadgeProps = {
  label: string;
  variant?: Variant;
};

export function DesignStatusBadge({ label, variant = "neutral" }: DesignStatusBadgeProps) {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const v = variantStyles(colors)[variant];
  return (
    <View style={[styles.badge, { backgroundColor: v.bg, borderColor: v.border }]}>
      <Text style={[styles.text, { color: v.text }]}>{label}</Text>
    </View>
  );
}

function createStyles(_colors: AppColors) {
  return StyleSheet.create({
    badge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: radius.full,
      borderWidth: 1,
    },
    text: {
      ...typography.caption,
      fontWeight: "700",
    },
  });
}

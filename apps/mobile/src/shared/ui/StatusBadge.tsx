import { StyleSheet, Text, View } from "react-native";

import { radius, spacing, typography } from "../theme";
import { useThemedStyles, type AppColors } from "../theme";
import { useThemeColors } from "../theme/ThemeProvider";

export type StatusBadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

type StatusBadgeProps = {
  label: string;
  variant?: StatusBadgeVariant;
};

function getvariantStyles(colors: AppColors): Record<
  StatusBadgeVariant,
  { backgroundColor: string; borderColor: string; textColor: string }
> { return {
  success: {
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
    textColor: colors.success,
  },
  warning: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.warning,
    textColor: colors.warning,
  },
  danger: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
    textColor: colors.danger,
  },
  info: {
    backgroundColor: colors.infoSoft,
    borderColor: colors.info,
    textColor: colors.info,
  },
  neutral: {
    backgroundColor: colors.cardSoft,
    borderColor: colors.borderStrong,
    textColor: colors.textSoft,
  },
 }; }

export function StatusBadge({ label, variant = "neutral" }: StatusBadgeProps) {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const palette = getvariantStyles(colors)[variant];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
        },
      ]}
    >
      <Text style={[styles.label, { color: palette.textColor }]}>{label}</Text>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    minHeight: 22,
    justifyContent: "center",
  },
  label: {
    ...typography.caption,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});
}

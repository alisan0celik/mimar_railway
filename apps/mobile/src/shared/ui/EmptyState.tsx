import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps, ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTranslation } from "../i18n";
import { radius, spacing, typography } from "../theme";
import { useThemedStyles, type AppColors } from "../theme";
import { useThemeColors } from "../theme/ThemeProvider";

type EmptyStateProps = {
  title?: string;
  description?: string;
  icon?: ReactNode;
  iconName?: ComponentProps<typeof MaterialCommunityIcons>["name"];
  action?: ReactNode;
  compact?: boolean;
};

export function EmptyState({
  title,
  description,
  icon,
  iconName = "inbox-outline",
  action,
  compact = false,
}: EmptyStateProps) {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const { t } = useTranslation();

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <View style={styles.iconContainer}>
        {icon ?? <MaterialCommunityIcons color={colors.textMuted} name={iconName} size={28} />}
      </View>
      <Text style={styles.title}>{title ?? t("states.empty")}</Text>
      <Text style={styles.description}>{description ?? t("states.emptyDesc")}</Text>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container: {
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.cardSoft,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingVertical: spacing.xxl,
      paddingHorizontal: spacing.lg,
    },
    containerCompact: {
      paddingVertical: spacing.xl,
    },
    iconContainer: {
      width: 56,
      height: 56,
      borderRadius: radius.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.backgroundSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderLight,
      marginBottom: spacing.md,
    },
    title: {
      ...typography.sectionTitle,
      color: colors.text,
      textAlign: "center",
    },
    description: {
      ...typography.bodySmall,
      color: colors.textMuted,
      marginTop: spacing.sm,
      textAlign: "center",
    },
    action: {
      marginTop: spacing.lg,
    },
  });
}

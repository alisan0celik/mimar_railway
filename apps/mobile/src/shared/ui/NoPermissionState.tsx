import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTranslation } from "../i18n";
import { radius, spacing, typography } from "../theme";
import { useThemedStyles, type AppColors } from "../theme";
import { useThemeColors } from "../theme/ThemeProvider";
import { AppButton } from "./AppButton";

type NoPermissionStateProps = {
  title?: string;
  description?: string;
  actionLabel?: string;
  onRequestAccess?: () => void;
  action?: ReactNode;
};

export function NoPermissionState({
  title,
  description,
  actionLabel,
  onRequestAccess,
  action,
}: NoPermissionStateProps) {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const { t } = useTranslation();

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons color={colors.warning} name="shield-lock-outline" size={30} />
        </View>
        <Text style={styles.title}>{title ?? t("states.noPermission")}</Text>
        <Text style={styles.description}>
          {description ?? t("states.noPermissionContentDesc")}
        </Text>
        {action ? <View style={styles.actionWrap}>{action}</View> : null}
        {!action && onRequestAccess ? (
          <View style={styles.actionWrap}>
            <AppButton
              onPress={onRequestAccess}
              title={actionLabel ?? t("states.requestAccess")}
              variant="secondary"
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    wrapper: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      width: "100%",
    },
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
    iconWrap: {
      width: 56,
      height: 56,
      borderRadius: radius.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.warningSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.warning,
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
    actionWrap: {
      marginTop: spacing.lg,
      width: "100%",
      maxWidth: 240,
    },
  });
}

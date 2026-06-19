import { StyleSheet, Text, View } from "react-native";

import { useTranslation } from "../i18n";
import { radius, spacing, typography } from "../theme";
import { useThemedStyles, type AppColors } from "../theme";
import { AppButton } from "./AppButton";

type ErrorStateProps = {
  title?: string;
  message?: string;
  retryLabel?: string;
  onRetry?: () => void;
};

export function ErrorState({ title, message, retryLabel, onRetry }: ErrorStateProps) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>!</Text>
      </View>
      <Text style={styles.title}>{title ?? t("states.error")}</Text>
      <Text style={styles.message}>{message ?? t("states.errorDesc")}</Text>
      {onRetry ? (
        <View style={styles.buttonContainer}>
          <AppButton onPress={onRetry} title={retryLabel ?? t("states.retry")} variant="danger" />
        </View>
      ) : null}
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
    iconWrap: {
      width: 54,
      height: 54,
      borderRadius: radius.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.dangerSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.danger,
      marginBottom: spacing.sm,
    },
    icon: {
      ...typography.h2,
      color: colors.danger,
    },
    title: {
      ...typography.sectionTitle,
      color: colors.text,
      textAlign: "center",
    },
    message: {
      ...typography.bodySmall,
      color: colors.textMuted,
      marginTop: spacing.sm,
      textAlign: "center",
    },
    buttonContainer: {
      marginTop: spacing.lg,
      width: "100%",
      maxWidth: 220,
    },
  });
}

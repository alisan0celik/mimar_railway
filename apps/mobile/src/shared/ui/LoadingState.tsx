import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { useTranslation } from "../i18n";
import { radius, spacing, typography } from "../theme";
import { useThemedStyles, type AppColors } from "../theme";
import { useThemeColors } from "../theme/ThemeProvider";

type LoadingStateProps = {
  label?: string;
  compact?: boolean;
};

export function LoadingState({ label, compact = false }: LoadingStateProps) {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const { t } = useTranslation();

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.label}>{label ?? t("states.loading")}</Text>
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
    label: {
      ...typography.bodySmall,
      color: colors.textSoft,
      marginTop: spacing.md,
    },
  });
}

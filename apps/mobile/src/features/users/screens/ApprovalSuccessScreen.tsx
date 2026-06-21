import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useTranslation } from "../../../shared/i18n";
import { spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import { AppButton, Screen } from "../../../shared/ui";

export function ApprovalSuccessScreen() {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const router = useRouter();
  const { t } = useTranslation();

  const handleComplete = () => {
    router.replace("/(main)/(tabs)/profile");
  };

  return (
    <Screen scroll={false} contentContainerStyle={styles.content}>
      <View style={styles.centerContainer}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="check-circle" size={80} color={colors.success} />
        </View>
        <Text style={styles.title}>{t("users.approvalSuccess.title")}</Text>
        <Text style={styles.description}>{t("users.approvalSuccess.description")}</Text>
      </View>
      <View style={styles.bottomContainer}>
        <AppButton
          title={t("common.ok")}
          onPress={handleComplete}
          fullWidth
          style={styles.button}
        />
      </View>
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    content: {
      flex: 1,
      paddingHorizontal: spacing.xl,
    },
    centerContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    iconContainer: {
      marginBottom: spacing.xl,
    },
    title: {
      ...typography.h2,
      color: colors.text,
      fontWeight: "700",
      marginBottom: spacing.sm,
      textAlign: "center",
    },
    description: {
      ...typography.body,
      color: colors.textMuted,
      textAlign: "center",
      paddingHorizontal: spacing.md,
    },
    bottomContainer: {
      paddingVertical: spacing.xxl,
    },
    button: {
      minHeight: 52,
    },
  });
}

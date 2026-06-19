import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { useMembershipStatusWatcher } from "../../../hooks/useMembershipStatusWatcher";
import { useTranslation } from "../../../shared/i18n";
import { useAuthStore } from "../../../store/authStore";
import { spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import { AppButton, Screen } from "../../../shared/ui";

function pickFirst(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export function PendingApprovalScreen() {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ companyName?: string }>();
  const companyName = pickFirst(params.companyName) || t("companies.pending.defaultCompanyName");
  const user = useAuthStore((s) => s.user);

  useMembershipStatusWatcher(user?.approvalStatus === "pending");

  return (
    <Screen contentContainerStyle={styles.screenContent} edges={["top", "bottom"]}>
      <View style={styles.mainContent}>
        <Text style={styles.title}>{t("companies.approvalPending.title")}</Text>
        <Text style={styles.sentLabel}>{t("companies.approvalPending.sentLabel")}</Text>

        <View style={styles.illustrationWrap}>
          <LinearGradient
            colors={["rgba(192,132,252,0.45)", "rgba(99,102,241,0.15)"]}
            end={{ x: 1, y: 1 }}
            start={{ x: 0, y: 0 }}
            style={styles.illustrationGlow}
          />
          <View style={styles.hourglassInner}>
            <MaterialCommunityIcons color={colors.purple} name="timer-sand" size={72} />
          </View>
        </View>

        <Text style={styles.subtitle}>
          {t("companies.approvalPending.subtitle", { companyName })}
        </Text>
        <Text style={styles.hint}>{t("companies.approvalPending.pushHint")}</Text>
      </View>

      <AppButton
        fullWidth
        onPress={async () => {
          await useAuthStore.getState().logout();
          router.replace("/(auth)/login");
        }}
        size="lg"
        style={styles.primaryBtn}
        title={t("common.ok")}
      />
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    screenContent: {
      flexGrow: 1,
      justifyContent: "space-between",
      paddingBottom: spacing.xxl,
    },
    mainContent: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingTop: spacing.huge,
    },
    title: {
      fontSize: 26,
      fontWeight: "700",
      color: colors.text,
      textAlign: "center",
    },
    sentLabel: {
      ...typography.bodySmall,
      color: colors.textMuted,
      textAlign: "center",
      marginTop: spacing.xs,
      marginBottom: spacing.xxl,
    },
    illustrationWrap: {
      width: 160,
      height: 160,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.xxl,
    },
    illustrationGlow: {
      position: "absolute",
      width: 160,
      height: 160,
      borderRadius: 80,
    },
    hourglassInner: {
      alignItems: "center",
      justifyContent: "center",
    },
    subtitle: {
      ...typography.body,
      color: colors.textMuted,
      textAlign: "center",
      lineHeight: 24,
      paddingHorizontal: spacing.xl,
    },
    hint: {
      ...typography.caption,
      color: colors.textMuted,
      textAlign: "center",
      marginTop: spacing.md,
      paddingHorizontal: spacing.xl,
      lineHeight: 20,
    },
    primaryBtn: { alignSelf: "stretch" },
  });
}

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { useLocaleCode, useTranslation } from "../../../shared/i18n";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import { useAuthStore } from "../../../store/authStore";
import { AppButton, Screen, ScreenHeader } from "../../../shared/ui";

export function CompanyPendingScreen() {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const router = useRouter();
  const { t } = useTranslation();
  const locale = useLocaleCode();
  const user = useAuthStore((s) => s.user);

  const formatDate = (iso?: string): string => {
    if (!iso) return "-";
    return new Date(iso).toLocaleDateString(locale);
  };

  const isPending = user?.approvalStatus === "pending";
  const isRejected = user?.approvalStatus === "rejected";
  const hasApplication = Boolean(user?.companyId) && (isPending || isRejected);

  const pendingCount = isPending ? 1 : 0;
  const rejectedCount = isRejected ? 1 : 0;

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <ScreenHeader title={t("companies.pending.title")} />

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{pendingCount}</Text>
          <Text style={styles.statLabel}>{t("companies.pending.pending")}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.danger }]}>{rejectedCount}</Text>
          <Text style={styles.statLabel}>{t("companies.pending.rejected")}</Text>
        </View>
      </View>

      <View style={styles.list}>
        {!hasApplication ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>{t("companies.pending.emptyTitle")}</Text>
            <Text style={styles.emptyText}>{t("companies.pending.emptyDesc")}</Text>
          </View>
        ) : (
          <View style={styles.requestCard}>
            <View style={styles.requestTop}>
              <View style={styles.requestIconWrap}>
                <MaterialCommunityIcons
                  name="office-building-outline"
                  size={24}
                  color={isPending ? colors.warning : colors.danger}
                />
              </View>
              <View style={styles.requestInfo}>
                <Text style={styles.requestCompany}>
                  {user?.companyName ?? t("companies.pending.defaultCompanyName")}
                </Text>
                <Text style={styles.requestDate}>{formatDate(user?.createdAt)}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: isPending ? colors.warningSoft : colors.dangerSoft },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: isPending ? colors.warning : colors.danger },
                  ]}
                >
                  {isPending ? t("status.waitingShort") : t("status.rejected")}
                </Text>
              </View>
            </View>
            <Text style={styles.requestMessage}>
              {isPending
                ? t("companies.pending.waitingMessage")
                : t("companies.pending.rejectedMessage")}
            </Text>
            {isRejected && (
              <AppButton
                fullWidth
                onPress={() =>
                  router.push({
                    pathname: "/(main)/companies/join",
                    params: { companyName: user?.companyName ?? "" },
                  })
                }
                title={t("companies.pending.reapply")}
                variant="secondary"
                size="sm"
                style={styles.retryBtn}
              />
            )}
          </View>
        )}
      </View>

      <AppButton
        fullWidth
        onPress={() => router.push("/(main)/companies")}
        title={t("companies.pending.newApplication")}
        style={styles.newBtn}
      />
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    content: { paddingBottom: spacing.xxl },
    statsRow: {
      flexDirection: "row",
      gap: spacing.sm,
      marginBottom: spacing.xl,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      alignItems: "center",
    },
    statValue: {
      fontSize: 28,
      fontWeight: "800",
      color: colors.warning,
    },
    statLabel: {
      ...typography.caption,
      color: colors.textMuted,
      marginTop: 4,
    },
    list: { gap: spacing.sm },
    emptyCard: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.xl,
      alignItems: "center",
      gap: spacing.sm,
    },
    emptyTitle: {
      ...typography.body,
      color: colors.text,
      fontWeight: "600",
    },
    emptyText: {
      ...typography.bodySmall,
      color: colors.textMuted,
      textAlign: "center",
      lineHeight: 20,
    },
    requestCard: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
    },
    requestTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      marginBottom: spacing.sm,
    },
    requestIconWrap: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      backgroundColor: colors.cardSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    requestInfo: { flex: 1 },
    requestCompany: {
      ...typography.body,
      color: colors.text,
      fontWeight: "600",
    },
    requestDate: {
      ...typography.caption,
      color: colors.textMuted,
      marginTop: 2,
    },
    statusBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.full,
    },
    statusText: {
      ...typography.caption,
      fontWeight: "700",
      fontSize: 11,
    },
    requestMessage: {
      ...typography.bodySmall,
      color: colors.textMuted,
      lineHeight: 20,
    },
    retryBtn: { marginTop: spacing.md },
    newBtn: { marginTop: spacing.xl },
  });
}

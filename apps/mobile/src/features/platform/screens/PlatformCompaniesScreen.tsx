import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";

import {
  companiesApi,
  type PlatformCompanyLicenseDTO,
  type UpdateCompanySubscriptionInput,
} from "../../../services/api";
import { useAuthStore } from "../../../store/authStore";
import { useTranslation } from "../../../shared/i18n";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import { DesignBackHeader, EmptyState, Screen } from "../../../shared/ui";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addYears(date: Date, years: number) {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + years);
  return next;
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function nextBaseDate(company: PlatformCompanyLicenseDTO) {
  const currentEnd = company.subscriptionEndsAt ? new Date(company.subscriptionEndsAt) : null;
  const now = new Date();
  return currentEnd && currentEnd.getTime() > now.getTime() ? currentEnd : now;
}

export function PlatformCompaniesScreen() {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [companies, setCompanies] = useState<PlatformCompanyLicenseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const canUsePlatformPanel = Boolean(user?.isPlatformAdmin);

  const loadCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const response = await companiesApi.getPlatformLicenses();
      setCompanies(response.data);
    } catch {
      Alert.alert(t("common.error"), t("platformCompanies.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (!canUsePlatformPanel) {
      router.replace("/(main)/(tabs)/profile");
      return;
    }
    loadCompanies();
  }, [canUsePlatformPanel, loadCompanies]);

  const totals = useMemo(
    () => ({
      active: companies.filter((company) => company.subscriptionStatus !== "blocked").length,
      blocked: companies.filter((company) => company.subscriptionStatus === "blocked").length,
    }),
    [companies],
  );

  const updateCompany = async (
    company: PlatformCompanyLicenseDTO,
    data: UpdateCompanySubscriptionInput,
  ) => {
    setUpdatingId(company.id);
    try {
      const response = await companiesApi.updatePlatformLicense(company.id, data);
      setCompanies((items) =>
        items.map((item) => (item.id === company.id ? response.data : item)),
      );
    } catch {
      Alert.alert(t("common.error"), t("platformCompanies.updateError"));
    } finally {
      setUpdatingId(null);
    }
  };

  const extendCompanyByDays = (company: PlatformCompanyLicenseDTO, days: number) => {
    const endsAt = addDays(nextBaseDate(company), days).toISOString();
    updateCompany(company, {
      subscriptionStatus: "active",
      subscriptionEndsAt: endsAt,
      blockedReason: null,
    });
  };

  const extendCompany = (company: PlatformCompanyLicenseDTO, months: number) => {
    const endsAt = addMonths(nextBaseDate(company), months).toISOString();
    updateCompany(company, {
      subscriptionStatus: "active",
      subscriptionEndsAt: endsAt,
      blockedReason: null,
    });
  };

  const extendCompanyOneYear = (company: PlatformCompanyLicenseDTO) => {
    const endsAt = addYears(nextBaseDate(company), 1).toISOString();
    updateCompany(company, {
      subscriptionStatus: "active",
      subscriptionEndsAt: endsAt,
      blockedReason: null,
    });
  };

  const blockCompany = (company: PlatformCompanyLicenseDTO) => {
    updateCompany(company, {
      subscriptionStatus: "blocked",
      blockedReason: t("platformCompanies.blockReason"),
    });
  };

  const activateCompany = (company: PlatformCompanyLicenseDTO) => {
    const hasValidEnd =
      company.subscriptionEndsAt &&
      new Date(company.subscriptionEndsAt).getTime() > Date.now() + MS_PER_DAY;
    updateCompany(company, {
      subscriptionStatus: "active",
      subscriptionEndsAt: hasValidEnd
        ? company.subscriptionEndsAt
        : addMonths(new Date(), 1).toISOString(),
      blockedReason: null,
    });
  };

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <DesignBackHeader title={t("platformCompanies.title")} />

      <View style={styles.summaryBand}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{companies.length}</Text>
          <Text style={styles.summaryLabel}>{t("platformCompanies.total")}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{totals.active}</Text>
          <Text style={styles.summaryLabel}>{t("platformCompanies.active")}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{totals.blocked}</Text>
          <Text style={styles.summaryLabel}>{t("platformCompanies.blocked")}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : companies.length === 0 ? (
        <EmptyState
          description={t("platformCompanies.emptyDesc")}
          title={t("platformCompanies.emptyTitle")}
        />
      ) : (
        <View style={styles.list}>
          {companies.map((company) => {
            const isUpdating = updatingId === company.id;
            const blocked = company.subscriptionStatus === "blocked";
            const expired =
              company.daysRemaining !== null && company.daysRemaining < 0;
            const statusColor = blocked || expired ? colors.danger : colors.success;

            return (
              <View key={company.id} style={styles.companyRow}>
                <View style={styles.companyHeader}>
                  <View style={styles.companyTitleWrap}>
                    <Text style={styles.companyName}>{company.name}</Text>
                    <Text style={styles.ownerText}>
                      {company.owner?.fullName ?? "-"} · {company.owner?.email ?? "-"}
                    </Text>
                  </View>
                  <View style={[styles.statusChip, { backgroundColor: `${statusColor}18` }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>
                      {expired ? t("platformCompanies.expired") : company.subscriptionStatus}
                    </Text>
                  </View>
                </View>

                <View style={styles.metricsGrid}>
                  <Metric label={t("platformCompanies.used")} value={`${company.usedDays} gun`} />
                  <Metric
                    label={t("platformCompanies.remaining")}
                    value={
                      company.daysRemaining === null
                        ? t("platformCompanies.noEnd")
                        : `${company.daysRemaining} gun`
                    }
                  />
                  <Metric label={t("platformCompanies.members")} value={company.memberCount} />
                  <Metric label={t("platformCompanies.projects")} value={company.projectCount} />
                  <Metric
                    label={t("platformCompanies.expires")}
                    value={formatDate(company.subscriptionEndsAt)}
                  />
                  <Metric
                    label={t("platformCompanies.lastActivity")}
                    value={formatDate(company.lastActivityAt)}
                  />
                </View>

                {company.blockedReason ? (
                  <Text style={styles.blockReason}>{company.blockedReason}</Text>
                ) : null}

                <View style={styles.actions}>
                  <ActionChip
                    disabled={isUpdating}
                    icon="calendar-plus"
                    label={t("platformCompanies.extendDay")}
                    onPress={() => extendCompanyByDays(company, 1)}
                  />
                  <ActionChip
                    disabled={isUpdating}
                    icon="calendar-plus"
                    label={t("platformCompanies.extend1")}
                    onPress={() => extendCompany(company, 1)}
                  />
                  <ActionChip
                    disabled={isUpdating}
                    icon="calendar-plus"
                    label={t("platformCompanies.extend3")}
                    onPress={() => extendCompany(company, 3)}
                  />
                  <ActionChip
                    disabled={isUpdating}
                    icon="calendar-star"
                    label={t("platformCompanies.extend12")}
                    onPress={() => extendCompanyOneYear(company)}
                  />
                  {blocked ? (
                    <ActionChip
                      disabled={isUpdating}
                      icon="check-circle-outline"
                      label={t("platformCompanies.activate")}
                      onPress={() => activateCompany(company)}
                    />
                  ) : (
                    <ActionChip
                      danger
                      disabled={isUpdating}
                      icon="block-helper"
                      label={t("platformCompanies.block")}
                      onPress={() => blockCompany(company)}
                    />
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function ActionChip({
  label,
  icon,
  onPress,
  disabled,
  danger = false,
}: {
  label: string;
  icon: string;
  onPress: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const color = danger ? colors.danger : colors.primary;

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionChip,
        { borderColor: `${color}55`, backgroundColor: `${color}12` },
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <MaterialCommunityIcons color={color} name={icon as any} size={16} />
      <Text style={[styles.actionText, { color }]}>{label}</Text>
    </Pressable>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    content: {
      paddingBottom: 100,
      gap: spacing.md,
    },
    summaryBand: {
      flexDirection: "row",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      backgroundColor: colors.card,
      overflow: "hidden",
    },
    summaryItem: {
      flex: 1,
      padding: spacing.md,
      borderRightWidth: 1,
      borderRightColor: colors.border,
    },
    summaryValue: {
      ...typography.h3,
      color: colors.text,
      fontWeight: "800",
    },
    summaryLabel: {
      ...typography.caption,
      color: colors.textMuted,
      marginTop: 2,
    },
    loading: {
      minHeight: 240,
      alignItems: "center",
      justifyContent: "center",
    },
    list: {
      gap: spacing.md,
    },
    companyRow: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      backgroundColor: colors.card,
      padding: spacing.md,
      gap: spacing.md,
    },
    companyHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.md,
    },
    companyTitleWrap: {
      flex: 1,
      minWidth: 0,
    },
    companyName: {
      ...typography.body,
      color: colors.text,
      fontWeight: "800",
    },
    ownerText: {
      ...typography.caption,
      color: colors.textMuted,
      marginTop: 4,
    },
    statusChip: {
      borderRadius: radius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
    },
    statusText: {
      ...typography.caption,
      fontWeight: "800",
      textTransform: "uppercase",
    },
    metricsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    metric: {
      width: "31%",
      minWidth: 96,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      backgroundColor: colors.surfaceSoft,
      padding: spacing.sm,
    },
    metricValue: {
      ...typography.bodySmall,
      color: colors.text,
      fontWeight: "800",
    },
    metricLabel: {
      ...typography.caption,
      color: colors.textMuted,
      marginTop: 2,
    },
    blockReason: {
      ...typography.bodySmall,
      color: colors.danger,
      backgroundColor: colors.dangerSoft,
      borderRadius: radius.sm,
      padding: spacing.sm,
    },
    actions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    actionChip: {
      minHeight: 38,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderWidth: 1,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 8,
    },
    actionText: {
      ...typography.caption,
      fontWeight: "800",
    },
    pressed: {
      opacity: 0.75,
    },
    disabled: {
      opacity: 0.5,
    },
  });
}

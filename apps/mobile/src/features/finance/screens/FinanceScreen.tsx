import { useRouter, useFocusEffect } from "expo-router";
import { useMemo, useState, useCallback } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { hasFinanceActivity } from "../../../services/api/finance.api";
import { useTranslation } from "../../../shared/i18n";
import { PERMISSIONS, useCan } from "../../../shared/permissions";
import { spacing } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import { emptyGlobalSummary, useFinanceStore } from "../../../store/financeStore";
import { NoPermissionState, Screen, SearchInput } from "../../../shared/ui";
import { DesignSectionTitle } from "../../../shared/ui/DesignSectionTitle";
import { FinanceProjectCard } from "../components/FinanceProjectCard";
import { FinanceSummaryCard } from "../components/FinanceSummaryCard";

export function FinanceScreen() {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useThemeColors();
  const canViewFinance = useCan(PERMISSIONS.FINANCE_VIEW);
  const summaries = useFinanceStore((s) => s.summaries);
  const globalSummary = useFinanceStore((s) => s.globalSummary);
  const fetchSummaries = useFinanceStore((s) => s.fetchSummaries);
  const isLoading = useFinanceStore((s) => s.isLoading);
  const [searchValue, setSearchValue] = useState("");

  useFocusEffect(
    useCallback(() => {
      fetchSummaries({ silent: summaries.length > 0 });
    }, [fetchSummaries, summaries.length]),
  );

  const global = globalSummary ?? emptyGlobalSummary;

  const activeProjects = useMemo(
    () => summaries.filter(hasFinanceActivity),
    [summaries],
  );

  const filtered = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    if (!q) return activeProjects;
    return activeProjects.filter((item) =>
      `${item.projectName} ${item.customerName}`.toLowerCase().includes(q),
    );
  }, [activeProjects, searchValue]);

  if (!canViewFinance) {
    return (
      <Screen contentContainerStyle={styles.permissionContent}>
        <NoPermissionState
          description={t("finance.noAccessDesc")}
          title={t("finance.noAccessTitle")}
        />
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={styles.content} scroll>
      <Text style={styles.pageTitle}>{t("finance.title")}</Text>

      <SearchInput
        containerStyle={styles.search}
        onChangeText={setSearchValue}
        placeholder={t("finance.searchPlaceholder")}
        showClearButton={false}
        value={searchValue}
      />

      <FinanceSummaryCard
        onAddFinance={() => router.push("/(main)/finance/edit")}
        totalAgreedAmount={global.totalAgreedAmount}
        totalProfitAmount={global.totalProfitAmount}
        totalReceivedAmount={global.totalReceivedAmount}
        totalRemainingAmount={global.totalRemainingAmount}
      />

      <View style={styles.headerRow}>
        <DesignSectionTitle title={t("finance.projectsSection")} />
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{t("finance.noProjects")}</Text>
        </View>
      ) : (
        <View>
          {filtered.map((finance) => (
            <FinanceProjectCard
              key={finance.projectId}
              finance={finance}
              onPress={() =>
                router.push({
                  pathname: "/(main)/finance/[projectId]",
                  params: { projectId: finance.projectId },
                })
              }
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    content: { paddingBottom: 100 },
    permissionContent: { justifyContent: "center", paddingBottom: spacing.xxl },
    pageTitle: {
      fontSize: 28,
      lineHeight: 34,
      color: colors.text,
      fontWeight: "700",
      marginBottom: spacing.lg,
    },
    search: {
      borderRadius: 14,
      marginBottom: spacing.lg,
      backgroundColor: colors.surfaceMuted,
      borderColor: "transparent",
    },
    headerRow: {
      marginBottom: spacing.md,
    },
    loading: {
      padding: spacing.xl,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyState: {
      padding: spacing.xl,
      alignItems: "center",
    },
    emptyText: {
      color: colors.textMuted,
      textAlign: "center",
    },
  });
}

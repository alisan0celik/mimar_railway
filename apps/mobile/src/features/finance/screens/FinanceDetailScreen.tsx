import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import type { FinanceTransactionDTO } from "../../../services/api/finance.api";
import { financeApi } from "../../../services/api/finance.api";
import { formatCurrency } from "../../../shared/utils";
import { PERMISSIONS, useCan } from "../../../shared/permissions";
import { useTranslation } from "../../../shared/i18n";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import { useFinanceStore, useProjectFinanceSummary } from "../../../store/financeStore";
import {
  DesignBackHeader,
  NoPermissionState,
  Screen,
} from "../../../shared/ui";
import { TransactionCard } from "../components/TransactionCard";
import { syncFinanceSummaries } from "../utils/syncFinanceSummaries";

type FinanceDetailScreenProps = {
  projectId: string;
};

export function FinanceDetailScreen({ projectId }: FinanceDetailScreenProps) {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const { t } = useTranslation();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const canViewFinance = useCan(PERMISSIONS.FINANCE_VIEW);
  const finance = useProjectFinanceSummary(projectId);
  const fetchSummaries = useFinanceStore((s) => s.fetchSummaries);

  useFocusEffect(
    useCallback(() => {
      fetchSummaries({ silent: true });
    }, [fetchSummaries]),
  );

  const sortTransactions = useCallback((transactions: FinanceTransactionDTO[]) => {
    return [...transactions].sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return b.id.localeCompare(a.id);
    });
  }, []);

  const [localTransactions, setLocalTransactions] = useState<FinanceTransactionDTO[]>(
    () => sortTransactions(finance?.transactions || []),
  );

  useEffect(() => {
    if (finance) {
      setLocalTransactions(sortTransactions(finance.transactions));
    }
  }, [finance, sortTransactions]);

  const q = searchQuery.toLowerCase().trim();

  const filteredTransactions = useMemo<FinanceTransactionDTO[]>(() => {
    if (!q) return localTransactions;
    return localTransactions.filter(
      (t) =>
        t.description?.toLowerCase().includes(q) ||
        t.date?.includes(q) ||
        String(t.amount).includes(q),
    );
  }, [localTransactions, q]);

  const goToAddPayment = () =>
    router.push({
      pathname: "/(main)/finance/add-payment",
      params: { projectId: finance?.projectId || projectId },
    });

  const handleDeleteTransaction = useCallback(
    (transactionId: string) => {
      Alert.alert(
        t("finance.delete.title"),
        t("finance.delete.message"),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("common.delete"),
            style: "destructive",
            onPress: async () => {
              try {
                setLocalTransactions((prev) => prev.filter((txn) => txn.id !== transactionId));
                const { data } = await financeApi.deleteTransaction(transactionId);
                await syncFinanceSummaries(data.summary);
              } catch {
                await fetchSummaries({ silent: true });
                Alert.alert(t("common.error"), t("finance.delete.error"));
              }
            },
          },
        ],
      );
    },
    [fetchSummaries, t],
  );

  const handleEditTransaction = useCallback(
    (transaction: FinanceTransactionDTO) => {
      router.push({
        pathname: "/(main)/finance/add-payment",
        params: {
          projectId,
          transactionId: transaction.id,
        },
      });
    },
    [router, projectId],
  );

  const goToFinanceList = useCallback(() => {
    router.replace("/(main)/(tabs)/finance");
  }, [router]);

  const canCreate = useCan(PERMISSIONS.FINANCE_PAYMENT_CREATE);
  const canUpdate = useCan(PERMISSIONS.FINANCE_UPDATE);

  if (!canViewFinance) {
    return (
      <Screen contentContainerStyle={styles.permissionContent}>
        <NoPermissionState
          actionLabel={t("states.backHome")}
          description={t("states.noPermissionDesc")}
          onRequestAccess={() => router.replace("/(main)/(tabs)/dashboard")}
          title={t("states.noPermission")}
        />
      </Screen>
    );
  }

  if (!finance) {
    return (
      <Screen contentContainerStyle={styles.permissionContent}>
        <Text style={{ textAlign: "center", marginTop: 20 }}>{t("finance.detail.notFound")}</Text>
      </Screen>
    );
  }

  return (
    <View style={styles.wrapper}>
      <Screen contentContainerStyle={styles.content} scroll>
        <DesignBackHeader
          badge={{ label: t("status.active"), variant: "success" }}
          onBack={goToFinanceList}
          subtitle={finance.customerName}
          title={finance.projectName}
        />

        {/* Arama */}
        <View style={styles.searchBar}>
          <MaterialCommunityIcons color={colors.textMuted} name="magnify" size={20} />
          <TextInput
            onChangeText={setSearchQuery}
            placeholder={t("finance.detail.searchPlaceholder")}
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            value={searchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <MaterialCommunityIcons color={colors.textMuted} name="close-circle" size={18} />
            </Pressable>
          )}
        </View>

        {/* Özet Kartı */}
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>{t("finance.detail.title")}</Text>
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/(main)/finance/edit",
                params: { projectId: finance.projectId },
              })
            }
            style={styles.editSummaryBtn}
          >
            <MaterialCommunityIcons color={colors.primary} name="pencil-outline" size={16} />
            <Text style={styles.editSummaryText}>{t("common.edit")}</Text>
          </Pressable>
        </View>
        <View style={styles.summaryCard}>
          <MetricRow label={t("finance.detail.agreedAmount")} value={formatCurrency(finance.agreedAmount)} />
          <MetricRow
            label={t("finance.detail.receivedAmount")}
            value={formatCurrency(finance.receivedAmount)}
            valueStyle={styles.valuePositive}
          />
          <MetricRow
            label={t("finance.totalExpense")}
            value={formatCurrency(finance.expenseAmount)}
            valueStyle={styles.valueWarning}
          />
          <MetricRow
            label={t("finance.detail.remainingAmount")}
            value={formatCurrency(finance.remainingAmount)}
            valueStyle={styles.valueDanger}
          />
          <MetricRow
            label={t("finance.profit")}
            value={formatCurrency(finance.profitAmount)}
            valueStyle={finance.profitAmount >= 0 ? styles.valuePositive : styles.valueDanger}
          />
        </View>

        {finance.overpaymentAmount > 0 ? (
          <Text style={styles.overpaymentNotice}>
            {t("finance.overpaymentNotice", {
              amount: formatCurrency(finance.overpaymentAmount),
            })}
          </Text>
        ) : null}

        <Text style={styles.listCount}>
          {t("finance.transactionCount", { count: filteredTransactions.length })}
        </Text>
        {searchQuery.length > 0 && (
          <Text style={styles.searchResultLabel}>
            {t("finance.detail.resultsFound", { count: filteredTransactions.length })}
          </Text>
        )}
        {filteredTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons color={colors.textMuted} name="receipt-outline" size={40} />
            <Text style={styles.emptyText}>{t("finance.detail.noResults")}</Text>
          </View>
        ) : (
          filteredTransactions.map((transaction) => (
            <TransactionCard
              key={transaction.id}
              onDelete={canUpdate ? () => handleDeleteTransaction(transaction.id) : undefined}
              onEdit={canUpdate ? () => handleEditTransaction(transaction) : undefined}
              transaction={transaction}
            />
          ))
        )}
      </Screen>

      {/* FAB */}
      {canCreate && (
        <Pressable onPress={goToAddPayment} style={styles.fab}>
          <MaterialCommunityIcons color="#fff" name="plus" size={26} />
        </Pressable>
      )}
    </View>
  );
}

function MetricRow({
  label,
  value,
  valueStyle,
}: {
  label: string;
  value: string;
  valueStyle?: object;
}) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, valueStyle]}>{value}</Text>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  wrapper: { flex: 1 },
  content: { paddingBottom: 120 },
  permissionContent: { justifyContent: "center", paddingBottom: spacing.xxl },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.input,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: 0,
  },
  searchResultLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  summaryTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: "700",
  },
  editSummaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  editSummaryText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "700",
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  metricLabel: { ...typography.bodySmall, color: colors.textMuted, flex: 1 },
  metricValue: { ...typography.body, color: colors.text, fontWeight: "700" },
  valuePositive: { color: colors.success },
  valueWarning: { color: colors.warning },
  valueDanger: { color: colors.danger },
  overpaymentNotice: {
    ...typography.caption,
    color: colors.warning,
    marginBottom: spacing.md,
    fontWeight: "600",
  },
  listCount: { ...typography.bodySmall, color: colors.textMuted, fontWeight: "600", marginBottom: spacing.sm },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyText: { ...typography.body, color: colors.textMuted },
  fab: {
    position: "absolute",
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
}

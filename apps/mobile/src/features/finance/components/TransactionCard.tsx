import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTranslation, useLocaleCode } from "../../../shared/i18n";
import type { FinanceTransactionDTO } from "../../../services/api/finance.api";
import { spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import { AppCard, StatusBadge } from "../../../shared/ui";

type TransactionCardProps = {
  transaction: FinanceTransactionDTO;
  onEdit?: () => void;
  onDelete?: () => void;
};

function getTransactionLabel(
  type: FinanceTransactionDTO["type"],
  t: (key: string) => string,
): string {
  return type === "collection"
    ? t("finance.transactionTypes.collection")
    : t("finance.addPaymentForm.sent");
}

function formatCurrency(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getTransactionVariant(
  type: FinanceTransactionDTO["type"],
): "success" | "warning" | "danger" {
  return type === "collection" ? "success" : "warning";
}

function amountWithSign(transaction: FinanceTransactionDTO, locale: string): string {
  if (transaction.type === "collection") {
    return `+${formatCurrency(transaction.amount, locale)}`;
  }
  return `-${formatCurrency(transaction.amount, locale)}`;
}

export function TransactionCard({ transaction, onEdit, onDelete }: TransactionCardProps) {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const { t } = useTranslation();
  const locale = useLocaleCode();
  const isIncome = transaction.type === "collection";

  return (
    <AppCard style={styles.card} variant="soft">
      <View style={styles.header}>
        <Text style={styles.date}>{transaction.date}</Text>
        <View style={styles.headerRight}>
          <StatusBadge
            label={getTransactionLabel(transaction.type, t)}
            variant={getTransactionVariant(transaction.type)}
          />
          {onEdit ? (
            <Pressable hitSlop={8} onPress={onEdit} style={styles.actionBtn}>
              <MaterialCommunityIcons color={colors.textMuted} name="pencil-outline" size={16} />
            </Pressable>
          ) : null}
          {onDelete ? (
            <Pressable hitSlop={8} onPress={onDelete} style={styles.actionBtn}>
              <MaterialCommunityIcons color={colors.textMuted} name="delete-outline" size={16} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <Text style={[styles.amount, isIncome ? styles.amountPositive : styles.amountNegative]}>
        {amountWithSign(transaction, locale)}
      </Text>
      <Text style={styles.description}>{transaction.description}</Text>
    </AppCard>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  actionBtn: {
    padding: spacing.xs,
    minWidth: 28,
    minHeight: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  date: {
    ...typography.caption,
    color: colors.textMuted,
  },
  amount: {
    ...typography.body,
    fontWeight: "700",
  },
  amountPositive: {
    color: colors.success,
  },
  amountNegative: {
    color: colors.warning,
  },
  description: {
    ...typography.bodySmall,
    color: colors.textSoft,
    marginTop: spacing.xs,
  },
});
}

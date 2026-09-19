import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { FinanceItemDTO } from "../../../services/api/finance.api";
import { useTranslation } from "../../../shared/i18n";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import { formatCurrency } from "../../../shared/utils";

type FinanceItemsCardProps = {
  items: FinanceItemDTO[];
  /** Kalemler hakediş ekranında düzenleniyor; burası yalnızca listeler. */
  onEdit: () => void;
};

/**
 * Projenin imalat kalemleri ve ekstraları, finans detayında.
 *
 * Tutarlar hakediş ekranındakiyle aynı okunur: imalat kaleminde sağda
 * işverene bedel, altında taşeron maliyeti; ekstrada alacak yeşil, borç
 * kırmızı.
 */
export function FinanceItemsCard({ items, onEdit }: FinanceItemsCardProps) {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const { t } = useTranslation();

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("finance.itemsSection")}</Text>
        <Pressable hitSlop={8} onPress={onEdit} style={styles.editBtn}>
          <MaterialCommunityIcons color={colors.primary} name="pencil-outline" size={16} />
          <Text style={styles.editText}>{t("finance.itemsEdit")}</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        {items.map((item, index) => {
          const isExtra = item.kind === "extra";
          const payable = isExtra && item.costAmount > 0;
          const value = payable ? item.costAmount : item.amount;
          const showCost = !isExtra && item.costAmount > 0;

          return (
            <View
              key={item.id}
              style={[styles.row, index < items.length - 1 && styles.rowDivider]}
            >
              <View style={styles.rowBody}>
                <View style={styles.nameRow}>
                  <Text numberOfLines={2} style={styles.name}>
                    {item.name}
                  </Text>
                  {isExtra ? (
                    <Text style={styles.tag}>
                      {payable ? t("progress.extraPayable") : t("finance.itemExtra")}
                    </Text>
                  ) : null}
                </View>
                {showCost ? (
                  <Text style={styles.meta}>
                    {t("finance.itemCost", { amount: formatCurrency(item.costAmount) })}
                  </Text>
                ) : null}
              </View>

              {value > 0 ? (
                <Text
                  style={[
                    styles.amount,
                    isExtra && (payable ? styles.amountPayable : styles.amountReceivable),
                  ]}
                >
                  {formatCurrency(value)}
                </Text>
              ) : showCost ? null : (
                <Text style={styles.unpriced}>{t("finance.itemUnpriced")}</Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    wrapper: { marginBottom: spacing.lg },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.sm,
    },
    title: {
      ...typography.body,
      color: colors.text,
      fontWeight: "700",
    },
    editBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    editText: {
      ...typography.caption,
      color: colors.primary,
      fontWeight: "700",
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.lg,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      paddingVertical: spacing.md,
    },
    rowDivider: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    rowBody: { flex: 1, minWidth: 0 },
    nameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    name: {
      ...typography.bodySmall,
      color: colors.text,
      fontWeight: "600",
      flexShrink: 1,
    },
    tag: {
      ...typography.caption,
      color: colors.textMuted,
      fontWeight: "600",
    },
    meta: {
      ...typography.caption,
      color: colors.textMuted,
      marginTop: 2,
    },
    amount: {
      ...typography.bodySmall,
      color: colors.text,
      fontWeight: "700",
    },
    amountReceivable: { color: colors.success },
    amountPayable: { color: colors.danger },
    unpriced: {
      ...typography.caption,
      color: colors.warning,
      fontWeight: "600",
    },
  });
}

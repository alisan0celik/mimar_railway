import { Pressable, StyleSheet, Text, View } from "react-native";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useTranslation } from "../../../shared/i18n";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import { DesignMetricTile } from "../../../shared/ui/DesignMetricTile";
import { formatCurrency } from "../../../shared/utils";

type FinanceSummaryCardProps = {
  totalAgreedAmount: number;
  totalReceivedAmount: number;
  totalRemainingAmount: number;
  totalProfitAmount: number;
  onAddFinance: () => void;
};

export function FinanceSummaryCard({
  totalAgreedAmount,
  totalReceivedAmount,
  totalRemainingAmount,
  totalProfitAmount,
  onAddFinance,
}: FinanceSummaryCardProps) {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const { t } = useTranslation();
  const profitTone = totalProfitAmount >= 0 ? "green" : "red";

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>{t("finance.generalSummary")}</Text>
      <View style={styles.grid}>
        <DesignMetricTile
          label={t("finance.totalAgreement")}
          style={styles.tile}
          tone="green"
          value={formatCurrency(totalAgreedAmount)}
        />
        <DesignMetricTile
          label={t("finance.moneyReceived")}
          style={styles.tile}
          tone="blue"
          value={formatCurrency(totalReceivedAmount)}
        />
        <DesignMetricTile
          label={t("finance.remainingReceivable")}
          style={styles.tile}
          tone="red"
          value={formatCurrency(totalRemainingAmount)}
        />
        <DesignMetricTile
          label={t("finance.totalProfit")}
          style={styles.tile}
          tone={profitTone}
          value={formatCurrency(totalProfitAmount)}
        />
      </View>
      <Pressable onPress={onAddFinance} style={styles.addButton}>
        <MaterialCommunityIcons color={colors.primary} name="plus-circle-outline" size={22} />
        <Text style={styles.addButtonText}>{t("finance.createFinance")}</Text>
      </Pressable>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    wrap: {
      marginBottom: spacing.lg,
    },
    sectionTitle: {
      fontSize: 16,
      lineHeight: 22,
      color: colors.text,
      fontWeight: "700",
      marginBottom: spacing.md,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    tile: {
      width: "48%",
      flexGrow: 1,
      flexBasis: "47%",
    },
    addButton: {
      marginTop: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: `${colors.primary}40`,
      borderStyle: "dashed",
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    addButtonText: {
      ...typography.bodySmall,
      color: colors.primary,
      fontWeight: "600",
    },
  });
}

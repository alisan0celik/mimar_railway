import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTranslation } from "../../../shared/i18n";
import type { FinanceSummaryDTO } from "../../../services/api/finance.api";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import { formatCurrency } from "../../../shared/utils";

type FinanceProjectCardProps = {
  finance: FinanceSummaryDTO;
  onPress: () => void;
};

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function FinanceProjectCard({ finance, onPress }: FinanceProjectCardProps) {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const { t } = useTranslation();

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.thumb}>
        <Text style={styles.thumbText}>{initials(finance.projectName)}</Text>
      </View>
      <View style={styles.body}>
        <Text numberOfLines={1} style={styles.name}>
          {finance.projectName}
        </Text>
        <Text numberOfLines={1} style={styles.customer}>
          {finance.customerName}
        </Text>
        {!finance.hasFinanceSetup ? (
          <Text style={styles.notSetup}>{t("finance.notSetup")}</Text>
        ) : (
          <>
            <Text style={styles.meta}>
              {t("finance.received")}:{" "}
              <Text style={styles.metaValue}>{formatCurrency(finance.receivedAmount)}</Text>
            </Text>
            <Text style={styles.remaining}>
              {t("finance.remainingPrefix")}{" "}
              <Text style={styles.remainingValue}>{formatCurrency(finance.remainingAmount)}</Text>
            </Text>
          </>
        )}
      </View>
      <View style={styles.right}>
        {finance.hasFinanceSetup ? (
          <Text style={styles.total}>{formatCurrency(finance.agreedAmount)}</Text>
        ) : null}
        <Text
          style={[
            styles.profit,
            finance.profitAmount >= 0 ? styles.profitPositive : styles.profitNegative,
          ]}
        >
          {t("finance.profit")}: {formatCurrency(finance.profitAmount)}
        </Text>
        <MaterialCommunityIcons color={colors.textMuted} name="chevron-right" size={22} />
      </View>
    </Pressable>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.borderLight,
      padding: spacing.lg,
      marginBottom: spacing.md,
    },
    pressed: { opacity: 0.92 },
    thumb: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: colors.metricBlueBg,
      borderWidth: 1,
      borderColor: `${colors.metricBlue}33`,
      alignItems: "center",
      justifyContent: "center",
    },
    thumbText: {
      fontSize: 14,
      lineHeight: 18,
      color: colors.metricBlue,
      fontWeight: "800",
    },
    body: { flex: 1, minWidth: 0 },
    name: {
      fontSize: 16,
      lineHeight: 22,
      color: colors.text,
      fontWeight: "700",
    },
    customer: {
      ...typography.caption,
      color: colors.textMuted,
      marginTop: 2,
    },
    notSetup: {
      ...typography.caption,
      color: colors.warning,
      marginTop: spacing.xs,
      fontWeight: "600",
    },
    meta: {
      ...typography.caption,
      color: colors.textMuted,
      marginTop: spacing.xs,
    },
    metaValue: {
      color: colors.success,
      fontWeight: "700",
    },
    remaining: {
      ...typography.caption,
      color: colors.textMuted,
      marginTop: 2,
    },
    remainingValue: {
      color: colors.danger,
      fontWeight: "700",
    },
    right: {
      alignItems: "flex-end",
      justifyContent: "center",
      gap: spacing.xs,
      marginLeft: spacing.xs,
    },
    total: {
      fontSize: 15,
      lineHeight: 20,
      color: colors.text,
      fontWeight: "700",
    },
    profit: {
      ...typography.caption,
      fontWeight: "600",
    },
    profitPositive: {
      color: colors.success,
    },
    profitNegative: {
      color: colors.danger,
    },
  });
}

import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useMemo, useState, useEffect } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import type { FinanceTransactionDTO } from "../../../services/api/finance.api";
import { FINANCE_MAX_AMOUNT, financeApi } from "../../../services/api/finance.api";
import { useTranslation, useLocaleCode } from "../../../shared/i18n";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import { useFinanceStore, useProjectFinanceSummary } from "../../../store/financeStore";
import { syncFinanceSummaries } from "../utils/syncFinanceSummaries";
import {
  AppButton,
  AppInput,
  DesignBackHeader,
  Screen,
} from "../../../shared/ui";

type AddPaymentScreenProps = {
  projectId?: string;
  transactionId?: string;
  editingTransaction?: string;
};

type Direction = "received" | "sent";

function parseDate(dateStr: string): Date {
  const parts = dateStr.split(".");
  if (parts.length === 3) {
    const [d, m, y] = parts.map(Number);
    if (d && m && y) return new Date(y, m - 1, d);
  }
  return new Date();
}

function formatDate(date: Date): string {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}.${m}.${y}`;
}

function formatDateForApi(dateStr: string): string {
  const parts = dateStr.split(".");
  if (parts.length === 3) {
    const [d, m, y] = parts;
    return `${y}-${m}-${d}`;
  }
  return new Date().toISOString();
}

function formatDateFromApi(isoStr: string): string {
  if (!isoStr) return formatDate(new Date());
  const date = new Date(isoStr);
  return formatDate(date);
}

const isMobile = Platform.OS === "ios" || Platform.OS === "android";

export function AddPaymentScreen({ projectId, transactionId, editingTransaction }: AddPaymentScreenProps) {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const { t } = useTranslation();
  const locale = useLocaleCode();
  const router = useRouter();
  const fetchSummaries = useFinanceStore((s) => s.fetchSummaries);
  const isLoading = useFinanceStore((s) => s.isLoading);
  const project = useProjectFinanceSummary(projectId || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSummaries({ silent: true });
  }, [fetchSummaries]);

  const editTxn = useMemo<FinanceTransactionDTO | null>(() => {
    if (transactionId && project) {
      return project.transactions.find((t) => t.id === transactionId) ?? null;
    }
    if (editingTransaction) {
      try {
        return JSON.parse(editingTransaction) as FinanceTransactionDTO;
      } catch {
        return null;
      }
    }
    return null;
  }, [transactionId, project, editingTransaction]);

  const isEditing = editTxn !== null;

  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(formatDate(new Date()));
  const [description, setDescription] = useState("");
  const [direction, setDirection] = useState<Direction>("received");
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (!editTxn) return;
    setAmount(String(editTxn.amount));
    setDate(formatDateFromApi(editTxn.date));
    setDescription(editTxn.description);
    setDirection(editTxn.type !== "collection" ? "sent" : "received");
  }, [editTxn]);

  const handleDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDate(formatDate(selectedDate));
    }
  };

  const openDatePicker = () => {
    if (isMobile) {
      setShowDatePicker(true);
    }
  };

  const handleSave = async () => {
    if (!amount.trim()) {
      Alert.alert(t("finance.validation.missingInfo"), t("finance.validation.amountRequired"));
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount < 0) {
      Alert.alert(t("finance.validation.invalidAmount"), t("finance.validation.amountInvalid"));
      return;
    }
    if (parsedAmount > FINANCE_MAX_AMOUNT) {
      Alert.alert(
        t("finance.validation.invalidAmount"),
        t("finance.validation.amountMax", {
          max: FINANCE_MAX_AMOUNT.toLocaleString(locale),
        }),
      );
      return;
    }

    setLoading(true);
    try {
      const payload = {
        amount: parsedAmount,
        date: formatDateForApi(date),
        description,
        type: direction === "received" ? "collection" : "expense",
        projectId,
      };

      const response =
        isEditing && editTxn?.id
          ? await financeApi.updateTransaction(editTxn.id, payload as any)
          : await financeApi.createTransaction(payload as any);

      await syncFinanceSummaries(response.data.summary);

      const isCollection = direction === "received";
      router.replace({
        pathname: "/(main)/finance/success",
        params: {
          title: isEditing ? t("finance.success.paymentUpdated") : t("finance.success.paymentSaved"),
          subtitle: isEditing
            ? t("finance.success.paymentUpdatedDesc")
            : isCollection
            ? t("finance.success.collectionAdded")
            : t("finance.success.paymentRecorded"),
          backRoute: `/(main)/finance/${projectId}`,
        },
      });
    } catch (err) {
      Alert.alert(t("common.error"), t("finance.validation.saveError"));
    } finally {
      setLoading(false);
    }
  };

  if (isLoading && !project) {
    return (
      <Screen contentContainerStyle={[styles.content, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator size="large" />
      </Screen>
    );
  }

  if (!project) {
    return (
      <Screen contentContainerStyle={styles.content}>
        <Text style={{ textAlign: "center", marginTop: 20 }}>{t("finance.addPaymentForm.projectNotFound")}</Text>
      </Screen>
    );
  }

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <DesignBackHeader
        title={isEditing ? t("finance.addPaymentForm.editTitle") : t("finance.addPayment")}
        subtitle={project.projectName}
      />

      {/* Özet Kart */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons color={colors.primary} name="domain" size={18} />
          <Text style={styles.infoLabel}>{t("finance.addPaymentForm.project")}</Text>
          <Text style={styles.infoValue}>{project.projectName}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons color={colors.textMuted} name="account-outline" size={18} />
          <Text style={styles.infoLabel}>{t("finance.addPaymentForm.customer")}</Text>
          <Text style={styles.infoValue}>{project.customerName}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <MaterialCommunityIcons color={colors.warning} name="cash-clock" size={18} />
          <Text style={styles.infoLabel}>{t("finance.remainingReceivable")}</Text>
          <Text style={[styles.infoValue, styles.valueDanger]}>
            {new Intl.NumberFormat(locale, {
              style: "currency",
              currency: "TRY",
              maximumFractionDigits: 0,
            }).format(project.remainingAmount)}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>{t("finance.addPaymentForm.paymentInfo")}</Text>

      <AppInput
        keyboardType="numeric"
        label={t("finance.addPaymentForm.amount")}
        leftIcon={<Text style={styles.currency}>₺</Text>}
        onChangeText={setAmount}
        placeholder="0"
        value={amount}
      />

      <Pressable onPress={openDatePicker}>
        <View pointerEvents={isMobile ? "none" : "auto"}>
          <AppInput
            editable={!isMobile}
            label={t("finance.addPaymentForm.paymentDate")}
            onChangeText={setDate}
            rightIcon={
              <Pressable onPress={openDatePicker}>
                <MaterialCommunityIcons color={colors.textMuted} name="calendar-outline" size={22} />
              </Pressable>
            }
            value={date}
          />
        </View>
      </Pressable>

      {isMobile && showDatePicker && (
        <DateTimePicker
          maximumDate={new Date()}
          mode="date"
          onChange={handleDateChange}
          onError={(err) => console.warn(err)}
          value={parseDate(date)}
        />
      )}

      {/* Yön bar */}
      <View style={styles.directionBar}>
        <Pressable
          onPress={() => setDirection("received")}
          style={[styles.dirBtn, direction === "received" && styles.dirBtnActive]}
        >
          <MaterialCommunityIcons
            color={direction === "received" ? "#fff" : colors.textMuted}
            name="arrow-down-bold-circle-outline"
            size={18}
          />
          <Text style={[styles.dirBtnText, direction === "received" && styles.dirBtnTextActive]}>
            {t("finance.addPaymentForm.received")}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setDirection("sent")}
          style={[styles.dirBtn, direction === "sent" && styles.dirBtnActive]}
        >
          <MaterialCommunityIcons
            color={direction === "sent" ? "#fff" : colors.textMuted}
            name="arrow-up-bold-circle-outline"
            size={18}
          />
          <Text style={[styles.dirBtnText, direction === "sent" && styles.dirBtnTextActive]}>
            {t("finance.addPaymentForm.sent")}
          </Text>
        </Pressable>
      </View>

      <AppInput
        label={t("finance.addPaymentForm.description")}
        multiline
        onChangeText={setDescription}
        placeholder={t("finance.addPaymentForm.descriptionPlaceholder")}
        value={description}
      />

      <AppButton
        fullWidth
        onPress={handleSave}
        style={styles.saveBtn}
        title={isEditing ? t("common.update") : t("common.save")}
        loading={loading}
      />
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  content: { paddingBottom: 100 },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  infoLabel: { ...typography.bodySmall, color: colors.textMuted, flex: 1 },
  infoValue: { ...typography.bodySmall, color: colors.text, fontWeight: "600" },
  valueDanger: { color: colors.danger },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: spacing.md,
  },
  currency: { ...typography.body, color: colors.textMuted, fontWeight: "600" },
  directionBar: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  dirBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.cardSoft,
  },
  dirBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  dirBtnText: {
    ...typography.body,
    color: colors.textMuted,
    fontWeight: "600",
  },
  dirBtnTextActive: {
    color: "#fff",
  },
  saveBtn: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
});
}

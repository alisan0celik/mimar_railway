import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  projectApi,
  type ProgressPaymentDTO,
  type ProgressPaymentStatus,
  type ProgressSummaryDTO,
  type ProjectSectionDTO,
} from "../../../services/api/project.api";
import { useTranslation, useLocaleCode } from "../../../shared/i18n";
import { PERMISSIONS, useCan } from "../../../shared/permissions";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import { DesignBackHeader, Screen } from "../../../shared/ui";
import { formatCurrency } from "../../../shared/utils";

const PAYMENT_STATUSES: ProgressPaymentStatus[] = ["draft", "approved", "paid", "cancelled"];

/** Kullanıcının girdiği tutar metnini sayıya çevirir; boşsa 0. */
function parseAmount(text: string): number {
  const normalized = text.replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, "");
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : 0;
}

export function ProgressPaymentScreen({ projectId }: { projectId: string }) {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const { t } = useTranslation();
  const locale = useLocaleCode();

  const canEditItems = useCan(PERMISSIONS.PROJECT_UPDATE);
  const canSeeFinance = useCan(PERMISSIONS.FINANCE_VIEW);
  const canBill = useCan(PERMISSIONS.FINANCE_UPDATE);

  const [sections, setSections] = useState<ProjectSectionDTO[]>([]);
  const [summary, setSummary] = useState<ProgressSummaryDTO | null>(null);
  const [payments, setPayments] = useState<ProgressPaymentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemAmount, setNewItemAmount] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftAmount, setDraftAmount] = useState("");
  const [draftProgress, setDraftProgress] = useState("");

  const load = useCallback(async () => {
    try {
      // Finans yetkisi olmayan kullanıcı yalnızca kalem listesini görür;
      // özet ve hakediş uçları o kullanıcıda 403 döner.
      const [sectionList, summaryData, paymentList] = await Promise.all([
        projectApi.getSections(projectId),
        canSeeFinance ? projectApi.getProgressSummary(projectId) : Promise.resolve(null),
        canSeeFinance ? projectApi.getProgressPayments(projectId) : Promise.resolve([]),
      ]);
      setSections(sectionList);
      setSummary(summaryData);
      setPayments(paymentList);
    } catch {
      Alert.alert(t("common.error"), t("progress.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [projectId, canSeeFinance, t]);

  useEffect(() => {
    load();
  }, [load]);

  const overallProgress = summary?.progressPercent ?? 0;

  const statusLabel = useCallback(
    (status: string) => {
      const key = `progress.paymentStatus.${status}`;
      const translated = t(key);
      return translated === key ? status : translated;
    },
    [t],
  );

  const statusColor = useCallback(
    (status: string) => {
      switch (status) {
        case "approved":
          return colors.info;
        case "paid":
          return colors.success;
        case "cancelled":
          return colors.textMuted;
        default:
          return colors.warning;
      }
    },
    [colors],
  );

  const handleAddItem = async () => {
    const name = newItemName.trim();
    if (name.length < 2) {
      Alert.alert(t("common.error"), t("progress.nameTooShort"));
      return;
    }
    setBusy(true);
    try {
      await projectApi.createSection(projectId, { name, amount: parseAmount(newItemAmount) });
      setNewItemName("");
      setNewItemAmount("");
      await load();
    } catch {
      Alert.alert(t("common.error"), t("progress.saveFailed"));
    } finally {
      setBusy(false);
    }
  };

  const startEditing = (section: ProjectSectionDTO) => {
    setEditingId(section.id);
    setDraftAmount(section.amount != null ? String(section.amount) : "");
    setDraftProgress(String(section.progress ?? 0));
  };

  const handleSaveItem = async (sectionId: string) => {
    const progress = parseAmount(draftProgress);
    if (progress > 100) {
      Alert.alert(t("common.error"), t("progress.progressRange"));
      return;
    }
    setBusy(true);
    try {
      await projectApi.updateSection(projectId, sectionId, {
        progress,
        ...(canSeeFinance ? { amount: parseAmount(draftAmount) } : {}),
      });
      setEditingId(null);
      await load();
    } catch {
      Alert.alert(t("common.error"), t("progress.saveFailed"));
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteItem = (section: ProjectSectionDTO) => {
    Alert.alert(t("progress.deleteItemTitle"), t("progress.deleteItemMessage", { name: section.name }), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          setBusy(true);
          try {
            await projectApi.deleteSection(projectId, section.id);
            await load();
          } catch {
            Alert.alert(t("common.error"), t("progress.saveFailed"));
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  const handleCreatePayment = () => {
    if (!summary) return;
    Alert.alert(
      t("progress.newPayment"),
      t("progress.newPaymentConfirm", { amount: formatCurrency(summary.billableAmount) }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("progress.issue"),
          onPress: async () => {
            setBusy(true);
            try {
              await projectApi.createProgressPayment(projectId);
              await load();
            } catch (e: any) {
              Alert.alert(t("common.error"), e?.response?.data?.message || t("progress.saveFailed"));
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  };

  const handleChangePaymentStatus = (payment: ProgressPaymentDTO) => {
    Alert.alert(
      t("progress.statusTitle", { number: payment.number }),
      undefined,
      [
        ...PAYMENT_STATUSES.filter((status) => status !== payment.status).map((status) => ({
          text: statusLabel(status),
          onPress: async () => {
            setBusy(true);
            try {
              await projectApi.updateProgressPayment(projectId, payment.id, { status });
              await load();
            } catch {
              Alert.alert(t("common.error"), t("progress.saveFailed"));
            } finally {
              setBusy(false);
            }
          },
        })),
        { text: t("common.cancel"), style: "cancel" as const },
      ],
    );
  };

  const itemsTotal = useMemo(
    () => sections.reduce((sum, section) => sum + (section.amount ?? 0), 0),
    [sections],
  );

  if (loading) {
    return (
      <Screen contentContainerStyle={styles.content}>
        <DesignBackHeader title={t("progress.title")} />
        <ActivityIndicator color={colors.primary} size="large" style={styles.loader} />
      </Screen>
    );
  }

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <DesignBackHeader title={t("progress.title")} />

      {summary ? (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{t("progress.earned")}</Text>
          <Text style={styles.summaryValue}>{formatCurrency(summary.earnedAmount)}</Text>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.min(overallProgress, 100)}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {t("progress.ofContract", {
              percent: overallProgress.toFixed(1),
              total: formatCurrency(summary.contractTotal),
            })}
          </Text>

          <View style={styles.summaryGrid}>
            <View style={styles.summaryCell}>
              <Text style={styles.cellLabel}>{t("progress.billed")}</Text>
              <Text style={styles.cellValue}>{formatCurrency(summary.billedAmount)}</Text>
            </View>
            <View style={styles.summaryCell}>
              <Text style={styles.cellLabel}>{t("progress.billable")}</Text>
              <Text style={[styles.cellValue, { color: colors.warning }]}>
                {formatCurrency(summary.billableAmount)}
              </Text>
            </View>
            <View style={styles.summaryCell}>
              <Text style={styles.cellLabel}>{t("progress.collected")}</Text>
              <Text style={[styles.cellValue, { color: colors.success }]}>
                {formatCurrency(summary.collectedAmount)}
              </Text>
            </View>
            <View style={styles.summaryCell}>
              <Text style={styles.cellLabel}>{t("progress.outstanding")}</Text>
              <Text style={[styles.cellValue, { color: colors.danger }]}>
                {formatCurrency(summary.outstandingAmount)}
              </Text>
            </View>
          </View>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>{t("progress.items")}</Text>

      {sections.length === 0 ? (
        <Text style={styles.empty}>{t("progress.noItems")}</Text>
      ) : (
        sections.map((section) => {
          const editing = editingId === section.id;
          const earned = (section.amount ?? 0) * ((section.progress ?? 0) / 100);
          return (
            <View key={section.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{section.name}</Text>
                <Text style={styles.itemPercent}>{`%${(section.progress ?? 0).toFixed(0)}`}</Text>
              </View>

              <View style={styles.progressTrackSmall}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(section.progress ?? 0, 100)}%` },
                  ]}
                />
              </View>

              {canSeeFinance ? (
                <Text style={styles.itemMeta}>
                  {`${formatCurrency(earned)} / ${formatCurrency(section.amount ?? 0)}`}
                </Text>
              ) : null}

              {editing ? (
                <View style={styles.editBlock}>
                  <View style={styles.editFields}>
                    {canSeeFinance ? (
                      <View style={styles.editField}>
                        <Text style={styles.fieldLabel}>{t("progress.amountLabel")}</Text>
                        <TextInput
                          keyboardType="numeric"
                          onChangeText={setDraftAmount}
                          placeholder="0"
                          placeholderTextColor={colors.textMuted}
                          style={styles.input}
                          value={draftAmount}
                        />
                      </View>
                    ) : null}
                    <View style={styles.editField}>
                      <Text style={styles.fieldLabel}>{t("progress.progressLabel")}</Text>
                      <TextInput
                        keyboardType="numeric"
                        onChangeText={setDraftProgress}
                        placeholder="0"
                        placeholderTextColor={colors.textMuted}
                        style={styles.input}
                        value={draftProgress}
                      />
                    </View>
                  </View>

                  <View style={styles.editActions}>
                    <Pressable onPress={() => setEditingId(null)} style={styles.cancelBtn}>
                      <Text style={styles.cancelBtnText}>{t("common.cancel")}</Text>
                    </Pressable>
                    <Pressable
                      disabled={busy}
                      onPress={() => handleSaveItem(section.id)}
                      style={styles.saveBtn}
                    >
                      <MaterialCommunityIcons color={colors.white} name="check" size={16} />
                      <Text style={styles.saveBtnText}>{t("common.save")}</Text>
                    </Pressable>
                  </View>
                </View>
              ) : canEditItems ? (
                <View style={styles.itemActions}>
                  <Pressable onPress={() => startEditing(section)} style={styles.linkBtn}>
                    <MaterialCommunityIcons color={colors.primary} name="pencil-outline" size={16} />
                    <Text style={styles.linkText}>{t("common.edit")}</Text>
                  </Pressable>
                  <Pressable onPress={() => handleDeleteItem(section)} style={styles.linkBtn}>
                    <MaterialCommunityIcons color={colors.danger} name="trash-can-outline" size={16} />
                    <Text style={[styles.linkText, { color: colors.danger }]}>
                      {t("common.delete")}
                    </Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          );
        })
      )}

      {canEditItems ? (
        <View style={styles.addCard}>
          <Text style={styles.fieldLabel}>{t("progress.itemNameLabel")}</Text>
          <TextInput
            onChangeText={setNewItemName}
            placeholder={t("progress.itemNamePlaceholder")}
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            value={newItemName}
          />
          {canSeeFinance ? (
            <>
              <Text style={styles.fieldLabel}>{t("progress.amountLabel")}</Text>
              <TextInput
                keyboardType="numeric"
                onChangeText={setNewItemAmount}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                value={newItemAmount}
              />
            </>
          ) : null}
          <Pressable disabled={busy} onPress={handleAddItem} style={styles.addBtn}>
            <Text style={styles.addBtnText}>{t("progress.addItem")}</Text>
          </Pressable>
        </View>
      ) : null}

      {canSeeFinance && summary && itemsTotal > 0 ? (
        <>
          <View style={styles.paymentsHeader}>
            <Text style={styles.sectionTitle}>{t("progress.payments")}</Text>
            {canBill ? (
              <Pressable
                disabled={busy || summary.billableAmount <= 0}
                onPress={handleCreatePayment}
                style={[styles.issueBtn, summary.billableAmount <= 0 && styles.issueBtnDisabled]}
              >
                <MaterialCommunityIcons color={colors.white} name="file-document-plus-outline" size={16} />
                <Text style={styles.issueBtnText}>{t("progress.newPayment")}</Text>
              </Pressable>
            ) : null}
          </View>

          {payments.length === 0 ? (
            <Text style={styles.empty}>{t("progress.noPayments")}</Text>
          ) : (
            payments.map((payment) => (
              <Pressable
                key={payment.id}
                disabled={!canBill}
                onPress={() => handleChangePaymentStatus(payment)}
                style={styles.paymentCard}
              >
                <View style={styles.paymentTop}>
                  <Text style={styles.paymentNumber}>
                    {t("progress.paymentNumber", { number: payment.number })}
                  </Text>
                  <View
                    style={[styles.badge, { backgroundColor: `${statusColor(payment.status)}22` }]}
                  >
                    <Text style={[styles.badgeText, { color: statusColor(payment.status) }]}>
                      {statusLabel(payment.status)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
                <Text style={styles.paymentMeta}>
                  {`${new Date(payment.issueDate).toLocaleDateString(locale)} · %${payment.progressPercent.toFixed(1)} · ${payment.createdBy.fullName}`}
                </Text>
              </Pressable>
            ))
          )}
        </>
      ) : null}
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    content: { paddingBottom: 100 },
    loader: { marginTop: spacing.xxl },
    summaryCard: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      borderTopWidth: 3,
      borderTopColor: colors.primary,
      padding: spacing.lg,
      marginBottom: spacing.lg,
    },
    summaryLabel: { ...typography.caption, color: colors.textMuted },
    summaryValue: {
      ...typography.h2,
      color: colors.text,
      fontWeight: "700",
      marginTop: 2,
    },
    progressTrack: {
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.progressTrack,
      overflow: "hidden",
      marginTop: spacing.md,
    },
    progressTrackSmall: {
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.progressTrack,
      overflow: "hidden",
      marginTop: spacing.sm,
    },
    progressFill: { height: "100%", backgroundColor: colors.progressFill },
    progressText: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
    summaryGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: spacing.md,
    },
    summaryCell: { width: "50%", marginBottom: spacing.sm },
    cellLabel: { ...typography.caption, color: colors.textMuted },
    cellValue: { ...typography.bodySmall, color: colors.text, fontWeight: "700", marginTop: 2 },
    sectionTitle: {
      ...typography.body,
      color: colors.text,
      fontWeight: "700",
      marginBottom: spacing.sm,
    },
    empty: {
      ...typography.bodySmall,
      color: colors.textMuted,
      marginBottom: spacing.md,
    },
    itemCard: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    itemHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    itemName: { ...typography.bodySmall, color: colors.text, fontWeight: "600", flex: 1 },
    itemPercent: { ...typography.bodySmall, color: colors.primary, fontWeight: "700" },
    itemMeta: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
    itemActions: { flexDirection: "row", gap: spacing.lg, marginTop: spacing.sm },
    linkBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
    linkText: { ...typography.caption, color: colors.primary, fontWeight: "600" },
    editBlock: { marginTop: spacing.md, gap: spacing.sm },
    editFields: { flexDirection: "row", gap: spacing.sm },
    editField: { flex: 1 },
    fieldLabel: {
      ...typography.caption,
      color: colors.textMuted,
      marginBottom: 4,
    },
    editActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: spacing.sm,
    },
    input: {
      flex: 1,
      ...typography.bodySmall,
      color: colors.text,
      backgroundColor: colors.input,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    saveBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      borderRadius: radius.md,
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
    },
    saveBtnText: { ...typography.caption, color: colors.white, fontWeight: "700" },
    cancelBtn: {
      borderRadius: radius.md,
      backgroundColor: colors.surfaceMuted,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      justifyContent: "center",
    },
    cancelBtnText: { ...typography.caption, color: colors.textMuted, fontWeight: "600" },
    addCard: {
      backgroundColor: colors.cardSoft,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: "dashed",
      padding: spacing.md,
      gap: spacing.sm,
      marginBottom: spacing.xl,
    },
    addBtn: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: spacing.sm,
      alignItems: "center",
    },
    addBtnText: { ...typography.bodySmall, color: colors.white, fontWeight: "700" },
    paymentsHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.sm,
    },
    issueBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      marginBottom: spacing.sm,
    },
    issueBtnDisabled: { opacity: 0.45 },
    issueBtnText: { ...typography.caption, color: colors.white, fontWeight: "700" },
    paymentCard: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    paymentTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    paymentNumber: { ...typography.bodySmall, color: colors.text, fontWeight: "700" },
    badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
    badgeText: { ...typography.caption, fontWeight: "600" },
    paymentAmount: {
      ...typography.body,
      color: colors.text,
      fontWeight: "700",
      marginTop: spacing.xs,
    },
    paymentMeta: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  });
}

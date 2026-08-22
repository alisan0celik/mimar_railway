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
  type CompanyWorkItemDTO,
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
import { ConfirmDialog, DesignBackHeader, Screen } from "../../../shared/ui";
import { formatCurrency } from "../../../shared/utils";

const PAYMENT_STATUSES: ProgressPaymentStatus[] = ["draft", "paid", "cancelled"];

/** Türkçe "İ" düz toLowerCase ile bozulduğu için ad karşılaştırması yerel ayarla yapılır. */
function normaliseName(value: string): string {
  return value.trim().toLocaleLowerCase("tr");
}

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
  const [favourites, setFavourites] = useState<CompanyWorkItemDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemAmount, setNewItemAmount] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftAmount, setDraftAmount] = useState("");
  const [draftProgress, setDraftProgress] = useState("");
  // Yerli Alert kutuları uygulamanın dışından gelmiş gibi duruyordu;
  // onaylar uygulamanın kendi diyaloguyla soruluyor.
  const [confirm, setConfirm] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    destructive?: boolean;
    onConfirm: () => Promise<void>;
  } | null>(null);

  const load = useCallback(async () => {
    try {
      // Finans yetkisi olmayan kullanıcı yalnızca kalem listesini görür;
      // özet ve hakediş uçları o kullanıcıda 403 döner.
      const [sectionList, favouriteList, summaryData, paymentList] = await Promise.all([
        projectApi.getSections(projectId),
        projectApi.getFavouriteItems(),
        canSeeFinance ? projectApi.getProgressSummary(projectId) : Promise.resolve(null),
        canSeeFinance ? projectApi.getProgressPayments(projectId) : Promise.resolve([]),
      ]);
      setSections(sectionList);
      setFavourites(favouriteList);
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

  const favouriteNames = useMemo(
    () => new Set(favourites.map((item) => normaliseName(item.name))),
    [favourites],
  );

  const handleToggleFavourite = async (section: ProjectSectionDTO) => {
    const isFavourite = favouriteNames.has(normaliseName(section.name));
    setBusy(true);
    try {
      if (isFavourite) {
        await projectApi.removeFavouriteItem(section.name);
      } else {
        await projectApi.addFavouriteItem(section.name);
      }
      setFavourites(await projectApi.getFavouriteItems());
    } catch {
      Alert.alert(t("common.error"), t("progress.saveFailed"));
    } finally {
      setBusy(false);
    }
  };

  const handleApplyFavourites = async () => {
    setBusy(true);
    try {
      await projectApi.applyFavouriteItems(projectId);
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
    setConfirm({
      title: t("progress.deleteItemTitle"),
      message: t("progress.deleteItemMessage", { name: section.name }),
      confirmLabel: t("common.delete"),
      destructive: true,
      onConfirm: async () => {
        await projectApi.deleteSection(projectId, section.id);
        await load();
      },
    });
  };

  /** Kalemin hak edilmiş ama henüz hakedişe bağlanmamış tutarı. */
  const billableOf = useCallback(
    (section: ProjectSectionDTO) => {
      const earned = (section.amount ?? 0) * ((section.progress ?? 0) / 100);
      const billed = payments
        .filter((payment) => payment.sectionId === section.id && payment.status !== "cancelled")
        .reduce((sum, payment) => sum + payment.amount, 0);
      return Math.max(Math.round((earned - billed) * 100) / 100, 0);
    },
    [payments],
  );

  const handleCreatePayment = (section: ProjectSectionDTO) => {
    setConfirm({
      title: t("progress.newPayment"),
      message: t("progress.newPaymentConfirm", {
        item: section.name,
        amount: formatCurrency(billableOf(section)),
      }),
      confirmLabel: t("progress.issue"),
      onConfirm: async () => {
        await projectApi.createProgressPayment(projectId, { sectionId: section.id });
        await load();
      },
    });
  };

  const handleChangePaymentStatus = async (
    payment: ProgressPaymentDTO,
    status: ProgressPaymentStatus,
  ) => {
    if (payment.status === status) return;
    setBusy(true);
    try {
      await projectApi.updateProgressPayment(projectId, payment.id, { status });
      await load();
    } catch {
      Alert.alert(t("common.error"), t("progress.saveFailed"));
    } finally {
      setBusy(false);
    }
  };

  const itemsTotal = useMemo(
    () => sections.reduce((sum, section) => sum + (section.amount ?? 0), 0),
    [sections],
  );

  if (loading) {
    return (
      <Screen contentContainerStyle={styles.content}>
        <DesignBackHeader title={canSeeFinance ? t("progress.title") : t("progress.titleNoFinance")} />
        <ActivityIndicator color={colors.primary} size="large" style={styles.loader} />
      </Screen>
    );
  }

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <DesignBackHeader title={canSeeFinance ? t("progress.title") : t("progress.titleNoFinance")} />

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
        <View style={styles.emptyCard}>
          <MaterialCommunityIcons color={colors.primary} name="format-list-checks" size={32} />
          <Text style={styles.emptyTitle}>{t("progress.emptyTitle")}</Text>
          <Text style={styles.emptyDesc}>{t("progress.emptyDesc")}</Text>
          {favourites.length > 0 && canEditItems ? (
            <>
              <Text style={styles.emptyHint}>
                {t("progress.emptyFavouriteHint", { count: String(favourites.length) })}
              </Text>
              <Pressable disabled={busy} onPress={handleApplyFavourites} style={styles.applyBtn}>
                <MaterialCommunityIcons color={colors.white} name="star" size={16} />
                <Text style={styles.applyBtnText}>{t("progress.applyFavourites")}</Text>
              </Pressable>
            </>
          ) : null}
        </View>
      ) : (
        sections.map((section) => {
          const editing = editingId === section.id;
          const earned = (section.amount ?? 0) * ((section.progress ?? 0) / 100);
          return (
            <View key={section.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                {canEditItems ? (
                  <Pressable
                    disabled={busy}
                    hitSlop={8}
                    onPress={() => handleToggleFavourite(section)}
                  >
                    <MaterialCommunityIcons
                      color={
                        favouriteNames.has(normaliseName(section.name))
                          ? colors.warning
                          : colors.textDisabled
                      }
                      name={
                        favouriteNames.has(normaliseName(section.name))
                          ? "star"
                          : "star-outline"
                      }
                      size={20}
                    />
                  </Pressable>
                ) : null}
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
              ) : (
                <View style={styles.itemActions}>
                  {canEditItems ? (
                    <>
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
                    </>
                  ) : null}
                  {canBill && billableOf(section) > 0 ? (
                    <Pressable
                      disabled={busy}
                      onPress={() => handleCreatePayment(section)}
                      style={styles.linkBtn}
                    >
                      <MaterialCommunityIcons
                        color={colors.warning}
                        name="file-document-plus-outline"
                        size={16}
                      />
                      <Text style={[styles.linkText, { color: colors.warning }]}>
                        {t("progress.newPayment")}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              )}
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
          <Text style={styles.sectionTitle}>{t("progress.payments")}</Text>

          {payments.length === 0 ? (
            <Text style={styles.empty}>{t("progress.noPayments")}</Text>
          ) : (
            payments.map((payment) => (
              <View key={payment.id} style={styles.paymentCard}>
                <View style={styles.paymentTop}>
                  <Text style={styles.paymentNumber}>
                    {payment.section
                      ? t("progress.paymentNumberWithItem", {
                          item: payment.section.name,
                          number: payment.number,
                        })
                      : t("progress.paymentNumber", { number: payment.number })}
                  </Text>
                  {!canBill ? (
                    <View
                      style={[styles.badge, { backgroundColor: `${statusColor(payment.status)}22` }]}
                    >
                      <Text style={[styles.badgeText, { color: statusColor(payment.status) }]}>
                        {statusLabel(payment.status)}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
                <Text style={styles.paymentMeta}>
                  {`${new Date(payment.issueDate).toLocaleDateString(locale)} · %${payment.progressPercent.toFixed(1)} · ${payment.createdBy.fullName}`}
                </Text>

                {canBill ? (
                  <View style={styles.statusRow}>
                    {PAYMENT_STATUSES.map((status) => {
                      const active = payment.status === status;
                      return (
                        <Pressable
                          key={status}
                          disabled={busy}
                          onPress={() => handleChangePaymentStatus(payment, status)}
                          style={[
                            styles.statusChip,
                            active && {
                              backgroundColor: statusColor(status),
                              borderColor: statusColor(status),
                            },
                          ]}
                        >
                          <Text
                            style={[styles.statusChipText, active && styles.statusChipTextActive]}
                          >
                            {statusLabel(status)}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            ))
          )}
        </>
      ) : null}

      <ConfirmDialog
        confirmDestructive={confirm?.destructive}
        confirmLabel={confirm?.confirmLabel}
        loading={busy}
        message={confirm?.message ?? ""}
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          const action = confirm?.onConfirm;
          setConfirm(null);
          if (!action) return;
          setBusy(true);
          try {
            await action();
          } catch (e: any) {
            Alert.alert(t("common.error"), e?.response?.data?.message || t("progress.saveFailed"));
          } finally {
            setBusy(false);
          }
        }}
        title={confirm?.title ?? ""}
        visible={confirm !== null}
      />
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
    emptyCard: {
      alignItems: "center",
      gap: spacing.sm,
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.xl,
      marginBottom: spacing.md,
    },
    emptyTitle: {
      ...typography.body,
      color: colors.text,
      fontWeight: "700",
      textAlign: "center",
    },
    emptyDesc: {
      ...typography.bodySmall,
      color: colors.textMuted,
      textAlign: "center",
      lineHeight: 20,
    },
    emptyHint: {
      ...typography.caption,
      color: colors.textMuted,
      textAlign: "center",
      marginTop: spacing.sm,
    },
    applyBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
    },
    applyBtnText: { ...typography.bodySmall, color: colors.white, fontWeight: "700" },
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
    statusRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
      marginTop: spacing.sm,
    },
    statusChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.full,
      backgroundColor: colors.surfaceMuted,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statusChipText: { ...typography.caption, color: colors.textMuted, fontWeight: "600" },
    statusChipTextActive: { color: colors.white },
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

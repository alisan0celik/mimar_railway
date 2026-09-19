import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import {
  projectApi,
  type CompanyWorkItemDTO,
  type ProgressPaymentDirection,
  type ProgressPaymentDTO,
  type ProgressSummaryDTO,
  type ProjectSectionDTO,
} from "../../../services/api/project.api";
import { useTranslation, useLocaleCode } from "../../../shared/i18n";
import { PERMISSIONS, useCan } from "../../../shared/permissions";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import { ConfirmDialog, DesignBackHeader, Screen, showAppAlert } from "../../../shared/ui";
import { formatCurrency } from "../../../shared/utils";
import { normaliseName } from "../../../shared/utils/normaliseName";

/** Kullanıcının girdiği tutar metnini sayıya çevirir; boşsa 0. */
function parseAmount(text: string): number {
  const normalized = text.replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, "");
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : 0;
}

/**
 * Tutarı giriş alanına yazılacak biçime çevirir. `parseAmount` noktayı binlik
 * ayracı saydığı için ondalık virgülle yazılır; "1234.56" geri okununca
 * 123456 olurdu.
 */
function toInputAmount(value: number): string {
  return String(Math.round(value * 100) / 100).replace(".", ",");
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
  const [newExtraName, setNewExtraName] = useState("");
  const [newExtraAmount, setNewExtraAmount] = useState("");
  const [newExtraIsPayable, setNewExtraIsPayable] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftAmount, setDraftAmount] = useState("");
  const [draftCost, setDraftCost] = useState("");
  // Açık hakediş tutarı alanı: hangi kalem, hangi yön.
  const [paying, setPaying] = useState<{
    sectionId: string;
    direction: ProgressPaymentDirection;
  } | null>(null);
  const [payAmount, setPayAmount] = useState("");
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
      showAppAlert(t("common.error"), t("progress.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [projectId, canSeeFinance, t]);

  useEffect(() => {
    load();
  }, [load]);

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
      showAppAlert(t("common.error"), t("progress.nameTooShort"));
      return;
    }
    setBusy(true);
    try {
      await projectApi.createSection(projectId, { name, amount: parseAmount(newItemAmount) });
      setNewItemName("");
      setNewItemAmount("");
      await load();
    } catch {
      showAppAlert(t("common.error"), t("progress.saveFailed"));
    } finally {
      setBusy(false);
    }
  };

  /** İmalat kalemleri ve imalata bağlı olmayan alacak/borçlar ayrı listelenir. */
  const workItems = useMemo(
    () => sections.filter((section) => (section.kind ?? "work") === "work"),
    [sections],
  );
  const extraItems = useMemo(
    () => sections.filter((section) => section.kind === "extra"),
    [sections],
  );

  const handleAddExtra = async () => {
    const name = newExtraName.trim();
    if (name.length < 2) {
      showAppAlert(t("common.error"), t("progress.nameTooShort"));
      return;
    }
    setBusy(true);
    try {
      const value = parseAmount(newExtraAmount);
      await projectApi.createSection(projectId, {
        name,
        kind: "extra",
        // Borç olarak işaretlenmişse tutar maliyet tarafına yazılır.
        amount: newExtraIsPayable ? 0 : value,
        costAmount: newExtraIsPayable ? value : 0,
      });
      setNewExtraName("");
      setNewExtraAmount("");
      await load();
    } catch {
      showAppAlert(t("common.error"), t("progress.saveFailed"));
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
      showAppAlert(t("common.error"), t("progress.saveFailed"));
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
      showAppAlert(t("common.error"), t("progress.saveFailed"));
    } finally {
      setBusy(false);
    }
  };

  const startEditing = (section: ProjectSectionDTO) => {
    setPaying(null);
    setEditingId(section.id);
    setDraftAmount(section.amount != null ? toInputAmount(section.amount) : "");
    setDraftCost(section.costAmount != null ? toInputAmount(section.costAmount) : "");
  };

  const handleSaveItem = async (sectionId: string) => {
    setBusy(true);
    try {
      await projectApi.updateSection(projectId, sectionId, {
        amount: parseAmount(draftAmount),
        costAmount: parseAmount(draftCost),
      });
      setEditingId(null);
      await load();
    } catch {
      showAppAlert(t("common.error"), t("progress.saveFailed"));
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

  /** Kalemin ilgili yönde iptal edilmemiş hakedişlerinin toplamı. */
  const billedOf = useCallback(
    (section: ProjectSectionDTO, direction: ProgressPaymentDirection) =>
      payments
        .filter(
          (payment) =>
            payment.sectionId === section.id &&
            payment.direction === direction &&
            payment.status !== "cancelled",
        )
        .reduce((sum, payment) => sum + payment.amount, 0),
    [payments],
  );

  /**
   * Kalemin ilgili yönde henüz hakedişe bağlanmamış bedeli: işveren tarafı
   * satış bedelinden, taşeron tarafı maliyetten; faturalananlar düşülür.
   * Sunucu da aynı sınırı uyguluyor, bu yalnızca kullanıcıyı önceden uyarmak için.
   */
  const remainingOf = useCallback(
    (section: ProjectSectionDTO, direction: ProgressPaymentDirection) => {
      const base = direction === "outgoing" ? (section.costAmount ?? 0) : (section.amount ?? 0);
      return Math.max(Math.round((base - billedOf(section, direction)) * 100) / 100, 0);
    },
    [billedOf],
  );

  /** Tutar alanını açar; kalan bedelle dolu gelir, kısmi hakediş için değiştirilir. */
  const startPaying = (section: ProjectSectionDTO, direction: ProgressPaymentDirection) => {
    setEditingId(null);
    setPaying({ sectionId: section.id, direction });
    setPayAmount(toInputAmount(remainingOf(section, direction)));
  };

  const handlePay = async (section: ProjectSectionDTO) => {
    if (!paying) return;

    const remaining = remainingOf(section, paying.direction);
    const amount = Math.round(parseAmount(payAmount) * 100) / 100;
    if (amount <= 0) {
      showAppAlert(t("common.error"), t("progress.payInvalid"));
      return;
    }
    if (amount > remaining) {
      showAppAlert(
        t("common.error"),
        t("progress.payTooMuch", { amount: formatCurrency(remaining) }),
      );
      return;
    }

    setBusy(true);
    try {
      await projectApi.createProgressPayment(projectId, {
        sectionId: section.id,
        direction: paying.direction,
        amount,
        status: "paid",
      });
      setPaying(null);
      setPayAmount("");
      await load();
    } catch {
      showAppAlert(t("common.error"), t("progress.paymentFailed"));
    } finally {
      setBusy(false);
    }
  };

  /**
   * Hakediş tek dokunuşla ödendiği için durum düzenlemesi yok; yanlışlıkla
   * düzenlenen kayıt silinerek geri alınır. Sunucu yalnızca kalemin son
   * hakedişinin silinmesine izin verir ve bağlı finans kaydını da temizler.
   */
  const handleDeletePayment = (payment: ProgressPaymentDTO) => {
    setConfirm({
      title: t("progress.deletePaymentTitle"),
      message: t("progress.deletePaymentMessage", {
        label: payment.section
          ? t(
              payment.direction === "outgoing"
                ? "progress.paymentNumberWithItemCost"
                : "progress.paymentNumberWithItem",
              { item: payment.section.name, number: payment.number },
            )
          : t("progress.paymentNumber", { number: payment.number }),
      }),
      confirmLabel: t("common.delete"),
      destructive: true,
      onConfirm: async () => {
        await projectApi.deleteProgressPayment(projectId, payment.id);
        await load();
      },
    });
  };

  /** Seçili kalemin altında açılan hakediş tutarı alanı. */
  const renderPayPanel = (section: ProjectSectionDTO) => {
    if (!paying || paying.sectionId !== section.id) return null;
    const outgoing = paying.direction === "outgoing";

    return (
      <View style={styles.editBlock}>
        <Text style={styles.fieldLabel}>
          {outgoing ? t("progress.payAmountCostLabel") : t("progress.payAmountLabel")}
        </Text>
        <TextInput
          autoFocus
          keyboardType="numeric"
          onChangeText={setPayAmount}
          placeholder="0"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          value={payAmount}
        />
        <Text style={styles.payHint}>
          {t("progress.payRemainingHint", {
            amount: formatCurrency(remainingOf(section, paying.direction)),
          })}
        </Text>

        <View style={styles.editActions}>
          <Pressable onPress={() => setPaying(null)} style={styles.cancelBtn}>
            <Text style={styles.cancelBtnText}>{t("common.cancel")}</Text>
          </Pressable>
          <Pressable disabled={busy} onPress={() => handlePay(section)} style={styles.saveBtn}>
            <MaterialCommunityIcons color={colors.white} name="cash-check" size={16} />
            <Text style={styles.saveBtnText}>{t("progress.pay")}</Text>
          </Pressable>
        </View>
      </View>
    );
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
          <Text style={styles.summaryLabel}>{t("progress.contractTotal")}</Text>
          <Text style={styles.summaryValue}>{formatCurrency(summary.contractTotal)}</Text>

          <View style={styles.summaryGrid}>
            <View style={styles.summaryCell}>
              <Text style={styles.cellLabel}>{t("progress.billed")}</Text>
              <Text style={styles.cellValue}>{formatCurrency(summary.billedAmount)}</Text>
            </View>
            <View style={styles.summaryCell}>
              <Text style={styles.cellLabel}>{t("progress.remaining")}</Text>
              <Text style={[styles.cellValue, { color: colors.warning }]}>
                {formatCurrency(summary.remainingAmount)}
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
            {summary.costTotal > 0 ? (
              <>
                <View style={styles.summaryCell}>
                  <Text style={styles.cellLabel}>{t("progress.costPaid")}</Text>
                  <Text style={[styles.cellValue, { color: colors.info }]}>
                    {formatCurrency(summary.costBilledAmount)}
                  </Text>
                </View>
                <View style={styles.summaryCell}>
                  <Text style={styles.cellLabel}>{t("progress.margin")}</Text>
                  <Text
                    style={[
                      styles.cellValue,
                      { color: summary.billedMarginAmount < 0 ? colors.danger : colors.success },
                    ]}
                  >
                    {formatCurrency(summary.billedMarginAmount)}
                  </Text>
                </View>
              </>
            ) : null}
          </View>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>{t("progress.items")}</Text>

      {workItems.length === 0 ? (
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
        workItems.map((section) => {
          const editing = editingId === section.id;
          const payingHere = paying?.sectionId === section.id;
          const cost = section.costAmount ?? 0;
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
                {canSeeFinance ? (
                  <Text style={styles.itemAmount}>{formatCurrency(section.amount ?? 0)}</Text>
                ) : null}
              </View>

              {canSeeFinance ? (
                <>
                  {(section.amount ?? 0) > 0 ? (
                    <Text style={styles.itemMeta}>
                      {t("progress.billedMeta", {
                        billed: formatCurrency(billedOf(section, "incoming")),
                        remaining: formatCurrency(remainingOf(section, "incoming")),
                      })}
                    </Text>
                  ) : (
                    <Text style={styles.itemMeta}>{t("progress.noValueHint")}</Text>
                  )}
                  {cost > 0 ? (
                    <>
                      <Text style={styles.itemMeta}>
                        {t("progress.costMeta", {
                          paid: formatCurrency(billedOf(section, "outgoing")),
                          remaining: formatCurrency(remainingOf(section, "outgoing")),
                        })}
                      </Text>
                      <Text style={styles.itemMeta}>
                        {t("progress.itemCostMeta", {
                          cost: formatCurrency(cost),
                          margin: formatCurrency((section.amount ?? 0) - cost),
                        })}
                      </Text>
                    </>
                  ) : null}
                </>
              ) : null}

              {payingHere ? renderPayPanel(section) : null}

              {editing ? (
                <View style={styles.editBlock}>
                  <View style={styles.editFields}>
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
                    <View style={styles.editField}>
                      <Text style={styles.fieldLabel}>{t("progress.costLabel")}</Text>
                      <TextInput
                        keyboardType="numeric"
                        onChangeText={setDraftCost}
                        placeholder="0"
                        placeholderTextColor={colors.textMuted}
                        style={styles.input}
                        value={draftCost}
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
              ) : payingHere ? null : (
                <View style={styles.itemActions}>
                  {canEditItems && canSeeFinance ? (
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
                  {canBill && remainingOf(section, "incoming") > 0 ? (
                    <Pressable
                      disabled={busy}
                      onPress={() => startPaying(section, "incoming")}
                      style={styles.linkBtn}
                    >
                      <MaterialCommunityIcons
                        color={colors.warning}
                        name="file-document-plus-outline"
                        size={16}
                      />
                      <Text style={[styles.linkText, { color: colors.warning }]}>
                        {t("progress.payIncoming")}
                      </Text>
                    </Pressable>
                  ) : null}
                  {canBill && remainingOf(section, "outgoing") > 0 ? (
                    <Pressable
                      disabled={busy}
                      onPress={() => startPaying(section, "outgoing")}
                      style={styles.linkBtn}
                    >
                      <MaterialCommunityIcons
                        color={colors.info}
                        name="account-hard-hat-outline"
                        size={16}
                      />
                      <Text style={[styles.linkText, { color: colors.info }]}>
                        {t("progress.payOutgoing")}
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

      {canSeeFinance ? (
        <>
          <Text style={styles.sectionTitle}>{t("progress.extras")}</Text>
          <Text style={styles.extrasHint}>{t("progress.extrasHint")}</Text>

          {extraItems.length === 0 ? (
            <Text style={styles.empty}>{t("progress.noExtras")}</Text>
          ) : (
            extraItems.map((extra) => {
              const payable = (extra.costAmount ?? 0) > 0;
              const value = payable ? (extra.costAmount ?? 0) : (extra.amount ?? 0);
              const direction: ProgressPaymentDirection = payable ? "outgoing" : "incoming";
              const remaining = remainingOf(extra, direction);
              const payingHere = paying?.sectionId === extra.id;

              return (
                <View key={extra.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <MaterialCommunityIcons
                      color={payable ? colors.danger : colors.success}
                      name={payable ? "arrow-up-circle-outline" : "arrow-down-circle-outline"}
                      size={18}
                    />
                    <Text style={styles.itemName}>{extra.name}</Text>
                    <Text
                      style={[
                        styles.itemPercent,
                        { color: payable ? colors.danger : colors.success },
                      ]}
                    >
                      {formatCurrency(value)}
                    </Text>
                  </View>

                  <Text style={styles.itemMeta}>
                    {remaining > 0
                      ? t("progress.extraRemaining", { amount: formatCurrency(remaining) })
                      : t("progress.extraSettled")}
                  </Text>

                  {payingHere ? renderPayPanel(extra) : null}

                  <View style={[styles.itemActions, payingHere && styles.hidden]}>
                    {canEditItems ? (
                      <Pressable onPress={() => handleDeleteItem(extra)} style={styles.linkBtn}>
                        <MaterialCommunityIcons
                          color={colors.danger}
                          name="trash-can-outline"
                          size={16}
                        />
                        <Text style={[styles.linkText, { color: colors.danger }]}>
                          {t("common.delete")}
                        </Text>
                      </Pressable>
                    ) : null}
                    {canBill && remaining > 0 ? (
                      <Pressable
                        disabled={busy}
                        onPress={() => startPaying(extra, direction)}
                        style={styles.linkBtn}
                      >
                        <MaterialCommunityIcons
                          color={payable ? colors.info : colors.warning}
                          name="cash-check"
                          size={16}
                        />
                        <Text
                          style={[
                            styles.linkText,
                            { color: payable ? colors.info : colors.warning },
                          ]}
                        >
                          {payable ? t("progress.payOutgoing") : t("progress.payIncoming")}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              );
            })
          )}

          {canEditItems ? (
            <View style={styles.addCard}>
              <Text style={styles.fieldLabel}>{t("progress.extraNameLabel")}</Text>
              <TextInput
                onChangeText={setNewExtraName}
                placeholder={t("progress.extraNamePlaceholder")}
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                value={newExtraName}
              />

              <View style={styles.directionRow}>
                <Pressable
                  onPress={() => setNewExtraIsPayable(false)}
                  style={[styles.directionChip, !newExtraIsPayable && styles.directionChipActive]}
                >
                  <Text
                    style={[
                      styles.directionChipText,
                      !newExtraIsPayable && styles.directionChipTextActive,
                    ]}
                  >
                    {t("progress.extraReceivable")}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setNewExtraIsPayable(true)}
                  style={[styles.directionChip, newExtraIsPayable && styles.directionChipActive]}
                >
                  <Text
                    style={[
                      styles.directionChipText,
                      newExtraIsPayable && styles.directionChipTextActive,
                    ]}
                  >
                    {t("progress.extraPayable")}
                  </Text>
                </Pressable>
              </View>

              <Text style={styles.fieldLabel}>{t("progress.amountLabel")}</Text>
              <TextInput
                keyboardType="numeric"
                onChangeText={setNewExtraAmount}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                value={newExtraAmount}
              />

              <Pressable disabled={busy} onPress={handleAddExtra} style={styles.addBtn}>
                <Text style={styles.addBtnText}>{t("progress.addExtra")}</Text>
              </Pressable>
            </View>
          ) : null}
        </>
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
                  <Text
                    style={[
                      styles.paymentNumber,
                      payment.direction === "outgoing" && { color: colors.info },
                    ]}
                  >
                    {payment.section
                      ? t(
                          payment.direction === "outgoing"
                            ? "progress.paymentNumberWithItemCost"
                            : "progress.paymentNumberWithItem",
                          { item: payment.section.name, number: payment.number },
                        )
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
                  {`${new Date(payment.issueDate).toLocaleDateString(locale)} · ${payment.createdBy.fullName}`}
                </Text>

                {canBill ? (
                  <Pressable
                    disabled={busy}
                    onPress={() => handleDeletePayment(payment)}
                    style={styles.paymentDelete}
                  >
                    <MaterialCommunityIcons
                      color={colors.danger}
                      name="trash-can-outline"
                      size={15}
                    />
                    <Text style={styles.paymentDeleteText}>{t("common.delete")}</Text>
                  </Pressable>
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
            showAppAlert(t("common.error"), e?.response?.data?.message || t("progress.saveFailed"));
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
    /** Kalemin sözleşme bedeli; eskiden burada ilerleme yüzdesi duruyordu. */
    itemAmount: { ...typography.bodySmall, color: colors.text, fontWeight: "700" },
    itemMeta: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
    payHint: { ...typography.caption, color: colors.textMuted },
    hidden: { display: "none" },
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
    extrasHint: {
      ...typography.caption,
      color: colors.textMuted,
      marginBottom: spacing.sm,
      lineHeight: 16,
    },
    directionRow: { flexDirection: "row", gap: spacing.sm },
    directionChip: {
      flex: 1,
      alignItems: "center",
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceMuted,
    },
    directionChipActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
    directionChipText: { ...typography.caption, color: colors.textMuted, fontWeight: "600" },
    directionChipTextActive: { color: colors.primary },
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
    paymentDelete: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      gap: 4,
      marginTop: spacing.sm,
    },
    paymentDeleteText: { ...typography.caption, color: colors.danger, fontWeight: "600" },
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

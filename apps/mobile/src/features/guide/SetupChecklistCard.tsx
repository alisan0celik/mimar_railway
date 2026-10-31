import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { getCachedProjects } from "../../offline/cache/project-cache";
import { fetchWithReadCache, getReadCache } from "../../offline/cache/read-cache";
import {
  hasFinanceActivity,
  type FinanceSummariesResponseDTO,
} from "../../services/api/finance.api";
import { usersApi } from "../../services/api/users.api";
import { useTranslation } from "../../shared/i18n";
import { radius, spacing } from "../../shared/theme";
import { useThemedStyles, type AppColors } from "../../shared/theme";
import { useThemeColors } from "../../shared/theme/ThemeProvider";
import { AppProgressBar } from "../../shared/ui";
import { useAuthStore } from "../../store/authStore";
import { useFinanceStore } from "../../store/financeStore";
import { useProjectStore } from "../../store/projectStore";
import { armTour, dismissChecklist, useGuideStore } from "./guide-store";
import { isCompanyOwner } from "./tour-filter";
import { SETUP_CHECKLIST } from "./tours";
import type { ChecklistItem, ChecklistItemId } from "./types";

type SetupChecklistCardProps = {
  /** Ana sayfanın zaten yüklediği şirket kaydından; ek istek atılmaz. */
  hasLogo: boolean;
};

type DerivedProgress = {
  hasProject: boolean;
  hasFinance: boolean;
  hasApprovedMember: boolean;
};

const EMPTY_PROGRESS: DerivedProgress = {
  hasProject: false,
  hasFinance: false,
  hasApprovedMember: false,
};

/**
 * Yalnızca şirket sahibine gösterilen kurulum listesi. Maddeler mümkün olduğunca
 * cihazdaki önbellekten türetilir; çevrimdışında sessizce eldeki veriyle kalır.
 */
export function SetupChecklistCard({ hasLogo }: SetupChecklistCardProps) {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const router = useRouter();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const hydrated = useGuideStore((s) => s.hydrated);
  const dismissed = useGuideStore((s) => s.data.checklistDismissed);
  const checklistDone = useGuideStore((s) => s.data.checklistDone);
  const projectCount = useProjectStore((s) => s.projects.length);
  const financeSummaries = useFinanceStore((s) => s.summaries);
  const [derived, setDerived] = useState<DerivedProgress>(EMPTY_PROGRESS);

  const isOwner = isCompanyOwner(user);
  const companyId = user?.companyId ?? null;
  const permissions = user?.permissions ?? [];
  const visible = hydrated && isOwner && !dismissed && Boolean(companyId);

  const items = useMemo(
    () => SETUP_CHECKLIST.filter((item) => permissions.includes(item.requires)),
    [permissions],
  );

  useFocusEffect(
    useCallback(() => {
      if (!visible || !companyId) return undefined;
      let cancelled = false;

      const load = async () => {
        const [cachedProjects, cachedFinance] = await Promise.all([
          getCachedProjects(companyId).catch(() => []),
          getReadCache<FinanceSummariesResponseDTO>("finance:summaries").catch(() => null),
        ]);
        if (cancelled) return;
        setDerived((prev) => ({
          ...prev,
          hasProject: cachedProjects.length > 0,
          hasFinance: cachedFinance?.projects?.some(hasFinanceActivity) ?? false,
        }));

        if (checklistDone.approve) return;
        try {
          // Tek kayıtlık sayfa; sadece toplam sayı için.
          const page = await fetchWithReadCache(`guide:approved-members:${companyId}`, async () =>
            (await usersApi.getAll({ limit: 1, status: "approved" })).data,
          );
          if (!cancelled) {
            setDerived((prev) => ({ ...prev, hasApprovedMember: (page.meta?.total ?? 0) > 1 }));
          }
        } catch {
          // Çevrimdışı ya da yetki yok: madde, onay ekranı tamamlanınca işaretlenir.
        }
      };

      void load();
      return () => {
        cancelled = true;
      };
    }, [visible, companyId, checklistDone.approve]),
  );

  if (!visible || items.length === 0) return null;

  const isDone = (id: ChecklistItemId): boolean => {
    if (checklistDone[id]) return true;
    switch (id) {
      case "logo":
        return hasLogo;
      case "project":
        return projectCount > 0 || derived.hasProject;
      case "finance":
        return financeSummaries.some(hasFinanceActivity) || derived.hasFinance;
      case "approve":
        return derived.hasApprovedMember;
      default:
        return false;
    }
  };

  const doneCount = items.filter((item) => isDone(item.id)).length;
  if (doneCount === items.length) return null;

  const openItem = (item: ChecklistItem) => {
    if (item.tourId) armTour(item.tourId);
    router.push(item.route);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>
            {t("guide.checklist.title", { done: doneCount, total: items.length })}
          </Text>
          <Text style={styles.subtitle}>{t("guide.checklist.subtitle")}</Text>
        </View>
        <Pressable
          accessibilityLabel={t("guide.checklist.dismiss")}
          accessibilityRole="button"
          hitSlop={10}
          onPress={dismissChecklist}
          style={styles.closeBtn}
        >
          <MaterialCommunityIcons color={colors.white} name="close" size={18} />
        </Pressable>
      </View>

      <AppProgressBar color={colors.success} max={items.length} trackColor="rgba(255,255,255,0.18)" value={doneCount} />

      <View style={styles.list}>
        {items.map((item) => {
          const done = isDone(item.id);
          return (
            <Pressable
              accessibilityRole="button"
              key={item.id}
              onPress={() => openItem(item)}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            >
              <MaterialCommunityIcons
                color={done ? colors.success : "rgba(255,255,255,0.6)"}
                name={done ? "check-circle" : "checkbox-blank-circle-outline"}
                size={22}
              />
              <Text style={[styles.rowText, done && styles.rowTextDone]}>{t(item.titleKey)}</Text>
              <MaterialCommunityIcons color="rgba(255,255,255,0.7)" name="chevron-right" size={18} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: "rgba(7,11,20,0.78)",
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.22)",
      padding: spacing.lg,
      marginBottom: spacing.lg,
      gap: spacing.md,
    },
    header: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
    headerText: { flex: 1 },
    title: { color: colors.white, fontSize: 16, fontWeight: "800" },
    subtitle: { color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 2, lineHeight: 18 },
    closeBtn: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: "rgba(255,255,255,0.12)",
      alignItems: "center",
      justifyContent: "center",
    },
    list: { gap: 2 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
    },
    rowPressed: { backgroundColor: "rgba(255,255,255,0.08)" },
    rowText: { flex: 1, color: colors.white, fontSize: 14, fontWeight: "600" },
    rowTextDone: { color: "rgba(255,255,255,0.6)", textDecorationLine: "line-through" },
  });
}

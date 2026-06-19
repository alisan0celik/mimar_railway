import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { companiesApi, type CompanyDTO } from "../../../services/api/companies.api";
import { useTranslation } from "../../../shared/i18n";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import { useAuthStore } from "../../../store/authStore";
import { SearchInput } from "../../../shared/ui";

type TabFilter = "all" | "member" | "pending";

type CompanyStatus = "member" | "pending" | "available";

function resolveStatus(
  company: CompanyDTO,
  userCompanyId?: string | null,
  approvalStatus?: string,
): CompanyStatus {
  if (userCompanyId !== company.id) return "available";
  if (approvalStatus === "pending") return "pending";
  return "member";
}

function statusConfig(
  status: CompanyStatus,
  colors: AppColors,
  t: (key: string) => string,
): { label: string; color: string; bg: string } {
  switch (status) {
    case "member":
      return { label: t("companies.status.member"), color: colors.success, bg: colors.successSoft };
    case "pending":
      return { label: t("companies.status.pending"), color: colors.warning, bg: colors.warningSoft };
    default:
      return { label: t("companies.status.join"), color: colors.primary, bg: colors.primarySoft };
  }
}

export function CompaniesScreen() {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const router = useRouter();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<TabFilter>("all");
  const [companies, setCompanies] = useState<CompanyDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tabOptions = useMemo(
    (): { key: TabFilter; label: string }[] => [
      { key: "all", label: t("common.all") },
      { key: "member", label: t("companies.tabs.member") },
      { key: "pending", label: t("companies.tabs.pending") },
    ],
    [t],
  );

  const loadCompanies = useCallback(async () => {
    try {
      setError(null);
      const response = await companiesApi.getAll();
      setCompanies(response.data);
    } catch {
      setError(t("companies.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const activeCompany = companies.find((c) => c.id === user?.companyId);
  const primaryRole = user?.roles?.[0]?.name ?? "";

  const enriched = companies.map((company) => ({
    ...company,
    status: resolveStatus(company, user?.companyId, user?.approvalStatus),
  }));

  const filtered = enriched.filter((c) => {
    if (tab === "member" && c.status !== "member") return false;
    if (tab === "pending" && c.status !== "pending") return false;
    if (search.trim()) {
      return c.name.toLowerCase().includes(search.trim().toLowerCase());
    }
    return true;
  });

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <View style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>{t("companies.title")}</Text>
            <View style={styles.headerActions}>
              <Pressable onPress={() => router.push("/(main)/companies/create")} style={styles.addBtn}>
                <MaterialCommunityIcons name="plus" size={20} color={colors.primary} />
              </Pressable>
            </View>
          </View>

          <SearchInput onChangeText={setSearch} placeholder={t("companies.searchPlaceholder")} value={search} />

          <ScrollView
            horizontal
            contentContainerStyle={styles.tabScroll}
            showsHorizontalScrollIndicator={false}
          >
            {tabOptions.map((option) => {
              const active = option.key === tab;
              return (
                <Pressable
                  key={option.key}
                  onPress={() => setTab(option.key)}
                  style={[styles.tabChip, active && styles.tabChipActive]}
                >
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {activeCompany && user?.approvalStatus === "approved" ? (
            <View style={styles.activeSection}>
              <Text style={styles.sectionLabel}>{t("companies.activeCompany")}</Text>
              <Pressable
                onPress={() => router.push("/(main)/(tabs)/dashboard")}
                style={[styles.companyCard, styles.activeCard]}
              >
                <View style={styles.companyIconWrap}>
                  <Text style={styles.initials}>{activeCompany.logoInitials ?? activeCompany.name.slice(0, 2)}</Text>
                </View>
                <View style={styles.companyInfo}>
                  <Text style={styles.companyName}>{activeCompany.name}</Text>
                  <View style={styles.companyMeta}>
                    <MaterialCommunityIcons name="account-group-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.metaText}>
                      {t("common.members", { count: activeCompany.memberCount ?? 0 })}
                    </Text>
                    {primaryRole ? (
                      <>
                        <Text style={styles.metaDot}>·</Text>
                        <Text style={styles.roleText}>{primaryRole}</Text>
                      </>
                    ) : null}
                  </View>
                </View>
                <MaterialCommunityIcons name="check-circle" size={20} color={colors.success} />
              </Pressable>
            </View>
          ) : null}

          <Text style={styles.sectionLabel}>{t("companies.allCompanies")}</Text>

          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          ) : error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable onPress={loadCompanies}>
                <Text style={styles.retryLink}>{t("common.retry")}</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.list}>
              {filtered.map((company) => {
                const config = statusConfig(company.status, colors, t);
                return (
                  <Pressable
                    key={company.id}
                    onPress={() => {
                      if (company.status === "available") {
                        router.push({
                          pathname: "/(main)/companies/join",
                          params: { companyId: company.id, companyName: company.name },
                        });
                      } else if (company.status === "pending") {
                        router.push("/(main)/companies/pending");
                      }
                    }}
                    style={({ pressed }) => [styles.companyCard, pressed && styles.cardPressed]}
                  >
                    <View style={styles.companyIconWrap}>
                      <Text style={styles.initials}>{company.logoInitials ?? company.name.slice(0, 2)}</Text>
                    </View>
                    <View style={styles.companyInfo}>
                      <Text style={styles.companyName}>{company.name}</Text>
                      <View style={styles.companyMeta}>
                        <MaterialCommunityIcons name="account-group-outline" size={14} color={colors.textMuted} />
                        <Text style={styles.metaText}>
                          {t("common.members", { count: company.memberCount ?? 0 })}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
                      <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>

        <Pressable
          onPress={() => router.push("/(main)/companies/join")}
          style={styles.fab}
        >
          <MaterialCommunityIcons name="domain-plus" size={22} color={colors.white} />
          <Text style={styles.fabText}>{t("companies.join")}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: 120,
      paddingTop: spacing.sm,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.md,
    },
    title: { ...typography.screenTitle, color: colors.text },
    headerActions: { flexDirection: "row", gap: spacing.sm },
    addBtn: {
      width: 40,
      height: 40,
      borderRadius: radius.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tabScroll: { gap: spacing.sm, paddingVertical: spacing.md },
    tabChip: {
      borderRadius: radius.full,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: spacing.sm,
    },
    tabChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    tabText: { ...typography.bodySmall, color: colors.textMuted, fontWeight: "600" },
    tabTextActive: { color: colors.white },
    activeSection: { marginBottom: spacing.lg },
    sectionLabel: {
      ...typography.sectionTitle,
      color: colors.text,
      marginBottom: spacing.md,
      fontSize: 16,
    },
    list: { gap: spacing.sm },
    loader: { marginVertical: spacing.xl },
    errorBox: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      alignItems: "center",
      gap: spacing.sm,
    },
    errorText: { ...typography.bodySmall, color: colors.danger },
    retryLink: { ...typography.bodySmall, color: colors.primary, fontWeight: "600" },
    companyCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      gap: spacing.md,
    },
    activeCard: { borderColor: colors.primary, borderWidth: 1.5 },
    cardPressed: { opacity: 0.85, borderColor: colors.primary },
    companyIconWrap: {
      width: 52,
      height: 52,
      borderRadius: radius.md,
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    initials: { ...typography.body, color: colors.primary, fontWeight: "700" },
    companyInfo: { flex: 1 },
    companyName: { ...typography.body, color: colors.text, fontWeight: "600" },
    companyMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
    metaText: { ...typography.caption, color: colors.textMuted },
    metaDot: { ...typography.caption, color: colors.textMuted },
    roleText: { ...typography.caption, color: colors.primaryLight, fontWeight: "500" },
    statusBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.full,
    },
    statusText: { ...typography.caption, fontWeight: "700", fontSize: 11 },
    fab: {
      position: "absolute",
      left: spacing.lg,
      right: spacing.lg,
      bottom: spacing.xl,
      height: 52,
      borderRadius: radius.lg,
      backgroundColor: colors.primary,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      elevation: 8,
      shadowColor: colors.primary,
      shadowOpacity: 0.4,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
    },
    fabText: { ...typography.button, color: colors.white, fontWeight: "700" },
  });
}

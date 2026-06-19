import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { useTranslation } from "../../../shared/i18n";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import { AppButton, DesignBackHeader, Screen, SearchInput } from "../../../shared/ui";
import { companiesApi } from "../../../services/api";
import type { CompanyDTO } from "../../../services/api";
import { useAuthStore } from "../../../store/authStore";

function companyInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

export function SelectCompanyScreen() {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [companies, setCompanies] = useState<CompanyDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    companiesApi.getAll()
      .then((res) => setCompanies(res.data))
      .catch(() => setCompanies([]))
      .finally(() => setLoading(false));
  }, []);

  const selectedCompany = useMemo(
    () => companies.find((c) => c.id === selectedId) ?? null,
    [selectedId, companies],
  );

  const filtered = companies.filter((c) => {
    if (!search.trim()) return true;
    return `${c.name} ${c.city || ""}`.toLowerCase().includes(search.trim().toLowerCase());
  });

  const handleBack = useCallback(async () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    await logout();
    router.replace("/(auth)/login");
  }, [logout, router]);

  return (
    <Screen contentContainerStyle={styles.content} scroll>
      <DesignBackHeader
        fallbackRoute="/(auth)/login"
        onBack={handleBack}
        subtitle={t("companies.select.subtitle")}
        title={t("companies.select.title")}
      />

      <SearchInput onChangeText={setSearch} placeholder={t("companies.searchPlaceholder")} value={search} />

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
      <View style={styles.list}>
        {filtered.map((company) => {
          const isSelected = company.id === selectedId;
          return (
            <Pressable
              key={company.id}
              onPress={() => setSelectedId(company.id)}
              style={[styles.row, isSelected && styles.rowSelected]}
            >
              <View style={[styles.avatar, isSelected && styles.avatarSelected]}>
                <Text style={[styles.avatarText, isSelected && styles.avatarTextSelected]}>
                  {companyInitial(company.name)}
                </Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{company.name}</Text>
                <Text style={styles.city}>{company.city}</Text>
              </View>
              {isSelected ? (
                <View style={styles.checkmark}>
                  <MaterialCommunityIcons color="#fff" name="check" size={16} />
                </View>
              ) : (
                <View style={styles.checkmarkEmpty} />
              )}
            </Pressable>
          );
        })}
      </View>
      )}

      <AppButton
        disabled={!selectedCompany}
        fullWidth
        onPress={() =>
          router.push({
            pathname: "/(auth)/join-request",
            params: {
              companyId: selectedCompany?.id ?? "",
              companyName: selectedCompany?.name ?? "",
            },
          })
        }
        style={styles.continueBtn}
        title={t("common.continue")}
      />

      <Pressable onPress={() => router.push("/(auth)/create-company")} style={styles.createLink}>
        <Text style={styles.createLinkText}>{t("companies.select.createLink")}</Text>
      </Pressable>
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  content: { paddingBottom: spacing.xxl },
  list: { gap: spacing.sm, marginTop: spacing.md, marginBottom: spacing.xl },
  loadingWrap: { paddingVertical: spacing.xxxl, alignItems: "center" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  rowSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.cardSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarSelected: { backgroundColor: colors.primary },
  avatarText: { fontSize: 18, fontWeight: "700", color: colors.primary },
  avatarTextSelected: { color: colors.white },
  info: { flex: 1 },
  name: { ...typography.body, color: colors.text, fontWeight: "600" },
  city: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmarkEmpty: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  continueBtn: { marginBottom: spacing.md },
  createLink: { alignItems: "center", paddingVertical: spacing.md },
  createLinkText: { ...typography.body, color: colors.primaryLight, fontWeight: "600" },
});
}

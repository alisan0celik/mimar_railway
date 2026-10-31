import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { resolveApiAssetUrl } from "../../../shared/utils";
import { useTranslation } from "../../../shared/i18n";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import { AppButton, DesignBackHeader, Screen, SearchInput } from "../../../shared/ui";
import { companiesApi } from "../../../services/api";
import type { CompanyDTO } from "../../../services/api";

/** Sabit alt butonun altında liste içeriği kalmasın diye bırakılan boşluk. */
const FOOTER_SPACE = 112;

function companyInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

export function SelectCompanyScreen() {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  // Yol ayrımı ekranından gelinir; yığın boşsa (eski bağlantı) oraya dönülür.
  // Çıkış seçeneği yol ayrımı ekranında.
  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(auth)/company-choice");
  }, [router]);

  // Oluşturma ekranından geri basınca listeye değil yol ayrımına dönülsün.
  const openCreate = useCallback(() => {
    router.replace("/(auth)/create-company");
  }, [router]);

  return (
    <View style={styles.wrapper}>
      <Screen contentContainerStyle={[styles.content, { paddingBottom: FOOTER_SPACE + insets.bottom }]} scroll>
        <DesignBackHeader
          onBack={handleBack}
          subtitle={t("companies.select.subtitle")}
          title={t("companies.select.title")}
        />

        <Pressable accessibilityRole="button" onPress={openCreate} style={styles.createBanner}>
          <MaterialCommunityIcons color={colors.primary} name="domain-plus" size={22} />
          <View style={styles.createBannerBody}>
            <Text style={styles.createBannerTitle}>{t("companies.select.notListedTitle")}</Text>
            <Text style={styles.createBannerDesc}>{t("companies.select.notListedDesc")}</Text>
          </View>
          <MaterialCommunityIcons color={colors.primary} name="chevron-right" size={22} />
        </Pressable>

        <SearchInput onChangeText={setSearch} placeholder={t("companies.searchPlaceholder")} value={search} />

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyWrap}>
            <MaterialCommunityIcons color={colors.textMuted} name="magnify-close" size={32} />
            <Text style={styles.emptyText}>{t("companies.select.empty")}</Text>
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
                  {company.logoUrl ? (
                    <Image
                      source={{ uri: resolveApiAssetUrl(company.logoUrl) ?? undefined }}
                      style={[styles.avatar, isSelected && styles.avatarSelected]}
                    />
                  ) : (
                    <View style={[styles.avatar, isSelected && styles.avatarSelected]}>
                      <Text style={[styles.avatarText, isSelected && styles.avatarTextSelected]}>
                        {company.logoInitials || companyInitial(company.name)}
                      </Text>
                    </View>
                  )}
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
      </Screen>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        {selectedCompany ? (
          <Text numberOfLines={1} style={styles.footerHint}>
            {t("companies.select.selectedHint", { companyName: selectedCompany.name })}
          </Text>
        ) : null}
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
          title={t("common.continue")}
        />
      </View>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xxl },
  createBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: `${colors.primary}55`,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  createBannerBody: { flex: 1 },
  createBannerTitle: { ...typography.body, color: colors.text, fontWeight: "700" },
  createBannerDesc: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  list: { gap: spacing.sm, marginTop: spacing.md, marginBottom: spacing.xl },
  loadingWrap: { paddingVertical: spacing.xxxl, alignItems: "center" },
  emptyWrap: { paddingVertical: spacing.xxl, alignItems: "center", gap: spacing.sm },
  emptyText: { ...typography.bodySmall, color: colors.textMuted, textAlign: "center" },
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
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.xs,
  },
  footerHint: { ...typography.caption, color: colors.textMuted, textAlign: "center" },
});
}

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { useCallback } from "react";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTranslation } from "../../../shared/i18n";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import { DesignBackHeader, Screen } from "../../../shared/ui";
import { useAuthStore } from "../../../store/authStore";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

type ChoiceOption = {
  id: "join" | "create";
  icon: IconName;
  route: Href;
};

const OPTIONS: ChoiceOption[] = [
  { id: "join", icon: "account-group-outline", route: "/(auth)/company-select" },
  { id: "create", icon: "domain-plus", route: "/(auth)/create-company" },
];

/** Şirketi olmayan kullanıcının ilk durağı: katılmak mı, kurmak mı. */
export function CompanyChoiceScreen() {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const router = useRouter();
  const { t } = useTranslation();
  const logout = useAuthStore((s) => s.logout);

  const signOut = useCallback(async () => {
    await logout();
    router.replace("/(auth)/login");
  }, [logout, router]);

  const handleBack = useCallback(async () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    await signOut();
  }, [router, signOut]);

  return (
    <Screen contentContainerStyle={styles.content} scroll>
      <DesignBackHeader
        onBack={handleBack}
        subtitle={t("companies.choice.subtitle")}
        title={t("companies.choice.title")}
      />

      <View style={styles.options}>
        {OPTIONS.map((option) => (
          <Pressable
            accessibilityRole="button"
            key={option.id}
            onPress={() => router.push(option.route)}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.iconWrap}>
                <MaterialCommunityIcons color={colors.primary} name={option.icon} size={28} />
              </View>
              <View style={styles.cardTitleWrap}>
                <Text style={styles.cardTitle}>{t(`companies.choice.${option.id}.title`)}</Text>
                <Text style={styles.cardDesc}>{t(`companies.choice.${option.id}.desc`)}</Text>
              </View>
              <MaterialCommunityIcons color={colors.textMuted} name="chevron-right" size={24} />
            </View>
            <View style={styles.nextBox}>
              <Text style={styles.nextLabel}>{t("companies.choice.nextLabel")}</Text>
              <Text style={styles.nextText}>{t(`companies.choice.${option.id}.next`)}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      <Pressable accessibilityRole="button" onPress={signOut} style={styles.signOut}>
        <Text style={styles.signOutText}>{t("companies.choice.otherAccount")}</Text>
      </Pressable>
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    content: { paddingBottom: spacing.xxl },
    options: { gap: spacing.md, marginTop: spacing.sm },
    card: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      gap: spacing.md,
    },
    cardPressed: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
    cardHeader: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    iconWrap: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    cardTitleWrap: { flex: 1 },
    cardTitle: { ...typography.sectionTitle, color: colors.text, fontWeight: "700" },
    cardDesc: { ...typography.bodySmall, color: colors.textMuted, marginTop: 2 },
    nextBox: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: radius.md,
      padding: spacing.md,
    },
    nextLabel: { ...typography.caption, color: colors.primaryLight, fontWeight: "700" },
    nextText: { ...typography.bodySmall, color: colors.textSoft, marginTop: 2, lineHeight: 20 },
    signOut: { alignItems: "center", paddingVertical: spacing.xl },
    signOutText: { ...typography.bodySmall, color: colors.textMuted, fontWeight: "600" },
  });
}

import Constants from "expo-constants";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import { Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { SUPPORT_CONTACT_EMAIL } from "../constants/support.constants";
import { useTranslation } from "../../../shared/i18n";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import { DesignBackHeader, Screen } from "../../../shared/ui";

export function SupportScreen() {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const router = useRouter();
  const { t } = useTranslation();

  const appVersion = useMemo(() => {
    const version = Constants.expoConfig?.version ?? "1.0.0";
    const build =
      Constants.expoConfig?.ios?.buildNumber ??
      Constants.expoConfig?.android?.versionCode?.toString() ??
      "";
    return build ? `${version} (${build})` : version;
  }, []);

  const links = useMemo(
    () => [
      { id: "faq", icon: "help-circle-outline", label: t("support.faqTitle"), route: "/(main)/settings/faq" as const },
      {
        id: "manual",
        icon: "book-open-outline",
        label: t("support.manual"),
        route: "/(main)/settings/user-guide" as const,
      },
      {
        id: "tickets",
        icon: "ticket-confirmation-outline",
        label: t("support.tickets"),
        desc: t("support.ticketsDesc"),
        route: "/(main)/settings/support-tickets" as const,
      },
      {
        id: "contact",
        icon: "email-outline",
        label: t("support.contact"),
        desc: SUPPORT_CONTACT_EMAIL,
        action: "email" as const,
      },
      {
        id: "hours",
        icon: "clock-outline",
        label: t("support.hoursTitle"),
        desc: t("support.liveHours"),
        action: "info" as const,
      },
    ],
    [t],
  );

  const openEmail = async () => {
    const url = `mailto:${SUPPORT_CONTACT_EMAIL}?subject=${encodeURIComponent(t("support.emailSubject"))}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return;
    }
    Alert.alert(t("support.contact"), SUPPORT_CONTACT_EMAIL);
  };

  const handlePress = (item: (typeof links)[number]) => {
    if (item.action === "email") {
      openEmail();
      return;
    }
    if (item.route) {
      router.push(item.route);
    }
  };

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(main)/(tabs)/profile");
  }, [router]);

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <DesignBackHeader
        fallbackRoute="/(main)/(tabs)/profile"
        onBack={handleBack}
        title={t("support.title")}
      />

      <View style={styles.infoCard}>
        <MaterialCommunityIcons color={colors.primary} name="lifebuoy" size={28} />
        <Text style={styles.infoTitle}>{t("support.hubTitle")}</Text>
        <Text style={styles.infoDesc}>{t("support.hubDesc")}</Text>
      </View>

      <View style={styles.list}>
        {links.map((item, idx) => (
          <Pressable
            key={item.id}
            onPress={() => handlePress(item)}
            style={[styles.row, idx < links.length - 1 && styles.rowBorder]}
          >
            <MaterialCommunityIcons color={colors.primary} name={item.icon as any} size={22} />
            <View style={styles.body}>
              <Text style={styles.label}>{item.label}</Text>
              {item.desc ? <Text style={styles.desc}>{item.desc}</Text> : null}
            </View>
            {item.route || item.action === "email" ? (
              <MaterialCommunityIcons color={colors.textMuted} name="chevron-right" size={22} />
            ) : null}
          </Pressable>
        ))}
      </View>

      <Text style={styles.version}>{t("support.versionLabel", { version: appVersion })}</Text>
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    content: { paddingBottom: 100 },
    infoCard: {
      backgroundColor: colors.primarySoft,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: `${colors.primary}33`,
      padding: spacing.lg,
      alignItems: "center",
      marginBottom: spacing.lg,
      gap: spacing.sm,
    },
    infoTitle: {
      ...typography.body,
      color: colors.text,
      fontWeight: "700",
      textAlign: "center",
    },
    infoDesc: {
      ...typography.bodySmall,
      color: colors.textMuted,
      textAlign: "center",
      lineHeight: 20,
    },
    list: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
      marginBottom: spacing.xxl,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      padding: spacing.lg,
    },
    rowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    body: { flex: 1 },
    label: { ...typography.body, color: colors.text, fontWeight: "600" },
    desc: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
    version: {
      ...typography.caption,
      color: colors.textDisabled,
      textAlign: "center",
    },
  });
}

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import type { ComponentProps } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { companiesApi } from "../../../services/api/companies.api";
import { useTranslation } from "../../../shared/i18n";
import { PERMISSIONS, PermissionGate } from "../../../shared/permissions";
import { radius, spacing } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import { resolveApiAssetUrl } from "../../../shared/utils";
import { useAuthStore } from "../../../store/authStore";
import { ParallaxBackground, Screen } from "../../../shared/ui";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

export function DashboardScreen() {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const { t } = useTranslation();

  const quickActions = useMemo(
    (): Array<{
      id: string;
      title: string;
      icon: IconName;
      color: string;
      route: Href;
      permission?: (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
    }> => [
      { id: "new", title: t("dashboard.newProject"), icon: "plus-circle-outline", color: colors.shortcutProjects, route: "/(main)/projects/create", permission: PERMISSIONS.PROJECT_CREATE },
      { id: "projects", title: t("tabs.projects"), icon: "folder-outline", color: colors.shortcutProjects, route: "/(main)/(tabs)/projects", permission: PERMISSIONS.PROJECT_VIEW },
      { id: "finance", title: t("tabs.finance"), icon: "wallet-outline", color: colors.shortcutFinance, route: "/(main)/(tabs)/finance", permission: PERMISSIONS.FINANCE_VIEW },
      { id: "pending", title: t("dashboard.pending"), icon: "account-clock-outline", color: colors.shortcutSearch, route: "/(main)/users/pending", permission: PERMISSIONS.USER_APPROVE },
      { id: "roles", title: t("dashboard.roles"), icon: "shield-account-outline", color: colors.shortcutCompleted, route: "/(main)/roles", permission: PERMISSIONS.ROLE_VIEW },
      { id: "notif", title: t("dashboard.notifications"), icon: "bell-outline", color: colors.shortcutNotifications, route: "/(main)/dashboard/notifications", permission: PERMISSIONS.NOTIFICATION_VIEW },
    ],
    [colors, t],
  );
  const router = useRouter();
  const companyId = useAuthStore((s) => s.user?.companyId);
  const companyName = useAuthStore((s) => s.user?.companyName);
  const [pressedId, setPressedId] = useState<string | null>(null);
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);
  const [companyInitials, setCompanyInitials] = useState<string | null>(null);
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);

  const loadCompanyLogo = useCallback(async () => {
    if (!companyId) {
      setCompanyLogoUrl(null);
      setCompanyInitials(null);
      setLogoLoadFailed(false);
      return;
    }

    try {
      const { data } = await companiesApi.getById(companyId);
      setCompanyLogoUrl(resolveApiAssetUrl(data.logoUrl));
      setCompanyInitials(data.logoInitials ?? data.name.slice(0, 2).toUpperCase());
      setLogoLoadFailed(false);
    } catch {
      setCompanyLogoUrl(null);
      setCompanyInitials(companyName?.slice(0, 2).toUpperCase() ?? null);
      setLogoLoadFailed(false);
    }
  }, [companyId, companyName]);

  useFocusEffect(
    useCallback(() => {
      loadCompanyLogo();
    }, [loadCompanyLogo]),
  );

  const showCompanyLogo = companyLogoUrl && !logoLoadFailed;
  const fallbackInitials =
    companyInitials ?? companyName?.slice(0, 2).toUpperCase() ?? "MO";

  return (
    <View style={styles.wrapper}>
      <ParallaxBackground />
      <View pointerEvents="none" style={styles.overlay} />
      <Screen contentContainerStyle={styles.content} scroll style={styles.screenTransparent}>
        <View style={styles.headerRow}>
          {showCompanyLogo ? (
            <Image
              onError={() => setLogoLoadFailed(true)}
              resizeMode="cover"
              source={{ uri: companyLogoUrl }}
              style={styles.logo}
            />
          ) : (
            <View style={[styles.logo, styles.logoFallback]}>
              <Text style={styles.logoInitials}>{fallbackInitials}</Text>
            </View>
          )}
          <View style={styles.headerSpacer} />
          <Pressable
            onPress={() => router.push("/(main)/dashboard/notifications")}
            style={styles.bellBtn}
          >
            <MaterialCommunityIcons color={colors.white} name="bell-outline" size={22} />
          </Pressable>
        </View>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>{t("dashboard.quickActions")}</Text>
        </View>
        <View style={styles.quickGrid}>
          {quickActions.map((action) => {
            const isPressed = pressedId === action.id;
            const cell = (
              <Pressable
                key={action.id}
                onPress={() => router.push(action.route)}
                onPressIn={() => setPressedId(action.id)}
                onPressOut={() => setPressedId(null)}
                style={({ pressed }) => [
                  styles.quickCell,
                  { borderColor: isPressed ? action.color : "rgba(255,255,255,0.2)" },
                  pressed && styles.pressed,
                ]}
              >
                <View
                  style={[
                    styles.quickIconWrap,
                    {
                      backgroundColor: action.color,
                      borderColor: isPressed ? colors.white : action.color,
                    },
                  ]}
                >
                  <MaterialCommunityIcons color={colors.white} name={action.icon} size={24} />
                </View>
                <Text numberOfLines={2} style={styles.quickLabel}>
                  {action.title}
                </Text>
                <MaterialCommunityIcons
                  color={colors.white}
                  name="arrow-right"
                  size={14}
                  style={styles.quickArrow}
                />
              </Pressable>
            );
            if (!action.permission) return cell;
            return (
              <PermissionGate key={action.id} permission={action.permission}>
                {cell}
              </PermissionGate>
            );
          })}
        </View>
        <Text style={styles.quickMotto}>
          Her işin sırrı inanç ve çalışmaktır.
        </Text>
      </Screen>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: colors.background },
  screenTransparent: { backgroundColor: "transparent" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(7,11,20,0.35)",
    zIndex: 1,
  },
  content: { paddingBottom: 100, backgroundColor: "transparent" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  logoFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  logoInitials: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  headerSpacer: { flex: 1 },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionRow: {
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  quickMotto: {
    color: "#FFFFFF",
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "900",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.55)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  quickCell: {
    width: "48.5%",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: "rgba(7,11,20,0.72)",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  pressed: {
    backgroundColor: "rgba(7,11,20,0.88)",
    borderColor: "rgba(255,255,255,0.35)",
  },
  quickIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  quickLabel: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
    color: "#FFFFFF",
    fontWeight: "800",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  quickArrow: {
    alignSelf: "flex-end",
    opacity: 1,
  },
});
}

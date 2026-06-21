import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTranslation } from "../../../shared/i18n";
import { PERMISSIONS, useCan } from "../../../shared/permissions";
import { useAuthStore } from "../../../store";
import { useAppStore } from "../../../store/appStore";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import { DesignBackHeader, Screen } from "../../../shared/ui";
import { initials } from "../../../shared/utils/initials";

type MenuItem = {
  id: string;
  icon: string;
  label: string;
  route?: Href;
  value?: string;
  color: string;
};

export function ProfileScreen() {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const { t, languageLabel } = useTranslation();
  const themeMode = useAppStore((s) => s.themeMode);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const roleLabel = user?.roles?.[0]?.name ?? t("profile.defaultRole");
  const canManageTeam = useCan(PERMISSIONS.USER_ROLE_ASSIGN);
  const canViewRoles = useCan(PERMISSIONS.ROLE_VIEW);
  const canApproveUsers = useCan(PERMISSIONS.USER_APPROVE);

  const menuItems = useMemo((): MenuItem[] => {
    const allItems: MenuItem[] = [
      {
        id: "profile",
        icon: "account-outline",
        label: t("profile.profileInfo"),
        route: "/(main)/profile/account",
        color: colors.primary,
      },
      {
        id: "team",
        icon: "account-group-outline",
        label: t("profile.team"),
        route: "/(main)/team",
        color: "#0EA5E9",
      },
      {
        id: "pending",
        icon: "account-clock-outline",
        label: t("profile.pendingUsers"),
        route: "/(main)/users/pending",
        color: colors.warning,
      },
      {
        id: "roles",
        icon: "shield-account-outline",
        label: t("profile.rolesPermissions"),
        route: "/(main)/roles",
        color: "#8B5CF6",
      },
      {
        id: "calendar",
        icon: "calendar-month-outline",
        label: t("profile.calendar"),
        route: "/(main)/dashboard/calendar",
        color: "#06B6D4",
      },
      {
        id: "platformCompanies",
        icon: "office-building-cog-outline",
        label: t("profile.platformCompanies"),
        route: "/(main)/platform/companies",
        color: "#14B8A6",
      },
      {
        id: "notif",
        icon: "bell-outline",
        label: t("profile.notifications"),
        route: "/(main)/dashboard/notifications",
        color: "#F59E0B",
      },
      {
        id: "notif-pref",
        icon: "bell-ring-outline",
        label: t("profile.notificationPrefs"),
        route: "/(main)/settings/notification-preferences",
        color: "#EC4899",
      },
      {
        id: "help",
        icon: "help-circle-outline",
        label: t("profile.support"),
        route: "/(main)/settings/help-support",
        color: "#10B981",
      },
      {
        id: "lang",
        icon: "translate",
        label: t("profile.language"),
        route: "/(main)/settings/language",
        color: "#3B82F6",
      },
      {
        id: "theme",
        icon: "theme-light-dark",
        label: t("profile.theme"),
        route: "/(main)/settings/theme",
        color: "#7C3AED",
      },
    ];

    return allItems.filter((item) => {
      if (item.id === "team") return canManageTeam;
      if (item.id === "pending") return canApproveUsers;
      if (item.id === "roles") return canViewRoles;
      if (item.id === "platformCompanies") return Boolean(user?.isPlatformAdmin);
      return true;
    });
  }, [t, colors, canManageTeam, canViewRoles, canApproveUsers, user?.isPlatformAdmin]);

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      {router.canGoBack() ? <DesignBackHeader title={t("profile.title")} /> : (
        <Text style={styles.pageTitle}>{t("profile.title")}</Text>
      )}

      <View style={styles.headerCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(user?.fullName ?? "?")}</Text>
        </View>
        <Text style={styles.name}>{user?.fullName ?? "—"}</Text>
        <Text style={styles.email}>{user?.email ?? "—"}</Text>
        <View style={styles.roleChip}>
          <Text style={styles.roleText}>{roleLabel}</Text>
        </View>
      </View>

      <View style={styles.menu}>
        {menuItems.map((item) => {
          const displayValue =
            item.id === "theme"
              ? t(`theme.${themeMode}`)
              : item.id === "lang"
                ? languageLabel
                : item.value;
          return (
            <Pressable
              key={item.id}
              onPress={() => item.route && router.push(item.route)}
              style={({ pressed }) => [styles.menuRow, pressed && styles.menuPressed]}
            >
              <View style={[styles.iconWrap, { backgroundColor: `${item.color}22` }]}>
                <MaterialCommunityIcons color={item.color} name={item.icon as any} size={20} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <View style={styles.menuRight}>
                {displayValue ? <Text style={styles.menuValue}>{displayValue}</Text> : null}
                {item.route ? (
                  <MaterialCommunityIcons color={colors.textMuted} name="chevron-right" size={20} />
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={() => {
          logout();
          router.replace("/(auth)/login");
        }}
        style={styles.logoutBtn}
      >
        <Text style={styles.logoutText}>{t("profile.logout")}</Text>
      </Pressable>
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    content: { paddingBottom: 100 },
    pageTitle: {
      ...typography.h2,
      color: colors.text,
      fontWeight: "700",
      marginBottom: spacing.lg,
    },
  headerCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: `${colors.primary}44`,
    borderTopWidth: 3,
    borderTopColor: colors.primary,
      padding: spacing.xl,
      alignItems: "center",
      marginBottom: spacing.lg,
    },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primarySoft,
    borderWidth: 3,
    borderColor: colors.primaryLight,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.md,
    },
    avatarText: { fontSize: 24, fontWeight: "700", color: colors.primary },
    name: { ...typography.h3, color: colors.text },
    email: { ...typography.bodySmall, color: colors.textMuted, marginTop: 4 },
    roleChip: {
      marginTop: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.full,
      backgroundColor: colors.primarySoft,
    },
    roleText: { ...typography.caption, color: colors.primaryLight, fontWeight: "600" },
    menu: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    menuRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    menuPressed: { backgroundColor: colors.surfaceSoft },
    iconWrap: {
      width: 38,
      height: 38,
      borderRadius: radius.md,
      alignItems: "center",
      justifyContent: "center",
    },
    menuLabel: { ...typography.body, color: colors.text, flex: 1, fontWeight: "500" },
    menuRight: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
    menuValue: { ...typography.bodySmall, color: colors.textMuted },
    logoutBtn: {
      marginTop: spacing.xl,
      alignItems: "center",
      paddingVertical: spacing.lg,
      backgroundColor: colors.dangerSoft,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.danger,
    },
    logoutText: {
      ...typography.body,
      color: colors.dangerLogout,
      fontWeight: "700",
    },
  });
}

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";

import { useAppStore } from "../../../store";
import { usersApi } from "../../../services/api/users.api";
import { useTranslation } from "../../../shared/i18n";
import { PERMISSIONS } from "../../../shared/permissions";
import { useCan } from "../../../shared/permissions/useCan";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import { DesignBackHeader, Screen } from "../../../shared/ui";

type NotifItem = {
  key: string;
  labelKey: string;
  descriptionKey: string;
  icon: string;
  color: string;
  storeKey: "projects" | "finance" | "system" | null;
};

function buildNotifGroups(): {
  titleKey: string;
  groupId: "project" | "finance" | "system";
  items: NotifItem[];
}[] {
  return [
    {
      titleKey: "notifications.prefs.groups.project",
      groupId: "project",
      items: [
        {
          key: "project-notif",
          labelKey: "notifications.prefs.items.projectNotif.label",
          descriptionKey: "notifications.prefs.items.projectNotif.description",
          icon: "briefcase-outline",
          color: "#3B82F6",
          storeKey: "projects",
        },
        {
          key: "project-updates",
          labelKey: "notifications.prefs.items.projectUpdates.label",
          descriptionKey: "notifications.prefs.items.projectUpdates.description",
          icon: "refresh-circle-outline",
          color: "#06B6D4",
          storeKey: "projects",
        },
        {
          key: "section-updates",
          labelKey: "notifications.prefs.items.sectionUpdates.label",
          descriptionKey: "notifications.prefs.items.sectionUpdates.description",
          icon: "view-grid-outline",
          color: "#8B5CF6",
          storeKey: "projects",
        },
        {
          key: "comments",
          labelKey: "notifications.prefs.items.comments.label",
          descriptionKey: "notifications.prefs.items.comments.description",
          icon: "comment-outline",
          color: "#10B981",
          storeKey: "projects",
        },
      ],
    },
    {
      titleKey: "notifications.prefs.groups.finance",
      groupId: "finance",
      items: [
        {
          key: "finance-notif",
          labelKey: "notifications.prefs.items.financeNotif.label",
          descriptionKey: "notifications.prefs.items.financeNotif.description",
          icon: "cash-multiple",
          color: "#F59E0B",
          storeKey: "finance",
        },
        {
          key: "payment-reminder",
          labelKey: "notifications.prefs.items.paymentReminder.label",
          descriptionKey: "notifications.prefs.items.paymentReminder.description",
          icon: "bell-ring-outline",
          color: "#EC4899",
          storeKey: "finance",
        },
      ],
    },
    {
      titleKey: "notifications.prefs.groups.system",
      groupId: "system",
      items: [
        {
          key: "system",
          labelKey: "notifications.prefs.items.system.label",
          descriptionKey: "notifications.prefs.items.system.description",
          icon: "information-outline",
          color: "#6B7280",
          storeKey: "system",
        },
      ],
    },
  ];
}

export function NotificationPreferencesScreen() {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const { t } = useTranslation();
  const { notificationPrefs, setNotificationPref } = useAppStore();
  const canViewFinance = useCan(PERMISSIONS.FINANCE_VIEW);
  const notifGroups = useMemo(() => buildNotifGroups(), []);

  const visibleGroups = notifGroups.filter((g) => {
    if (g.groupId === "finance" && !canViewFinance) return false;
    return true;
  });

  const allOn =
    notificationPrefs.projects &&
    notificationPrefs.system &&
    (canViewFinance ? notificationPrefs.finance : true);

  const [localState, setLocalState] = useState({
    "project-notif": notificationPrefs.projects,
    "project-updates": notificationPrefs.projects,
    "section-updates": notificationPrefs.projects,
    comments: notificationPrefs.projects,
    "finance-notif": notificationPrefs.finance,
    "payment-reminder": notificationPrefs.finance,
    system: notificationPrefs.system,
  });

  async function toggle(item: NotifItem, value: boolean) {
    setLocalState((prev) => ({ ...prev, [item.key]: value }));
    if (item.storeKey) {
      setNotificationPref(item.storeKey, value);
      try {
        await usersApi.updateNotificationPrefs({ ...notificationPrefs, [item.storeKey]: value });
      } catch (e) {
        console.error(e);
      }
    }
  }

  async function toggleAll(value: boolean) {
    setLocalState((prev) => ({
      ...prev,
      "project-notif": value,
      "project-updates": value,
      "section-updates": value,
      comments: value,
      ...(canViewFinance
        ? { "finance-notif": value, "payment-reminder": value }
        : {}),
      system: value,
    }));
    setNotificationPref("projects", value);
    if (canViewFinance) {
      setNotificationPref("finance", value);
    }
    setNotificationPref("system", value);
    try {
      await usersApi.updateNotificationPrefs({
        projects: value,
        ...(canViewFinance ? { finance: value } : {}),
        system: value,
      });
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <DesignBackHeader title={t("notifications.prefs.title")} />

      <View style={styles.masterCard}>
        <View style={[styles.masterIconWrap, { backgroundColor: `${colors.primary}22` }]}>
          <MaterialCommunityIcons name="bell-outline" size={24} color={colors.primary} />
        </View>
        <View style={styles.masterText}>
          <Text style={styles.masterLabel}>{t("notifications.prefs.masterLabel")}</Text>
          <Text style={styles.masterDesc}>{t("notifications.prefs.masterDesc")}</Text>
        </View>
        <Switch
          value={allOn}
          onValueChange={toggleAll}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={allOn ? "#fff" : colors.textMuted}
        />
      </View>

      {visibleGroups.map((group) => (
        <View key={group.groupId} style={styles.group}>
          <Text style={styles.groupTitle}>{t(group.titleKey)}</Text>
          <View style={styles.card}>
            {group.items.map((item, idx) => (
              <View
                key={item.key}
                style={[styles.row, idx < group.items.length - 1 && styles.rowBorder]}
              >
                <View style={[styles.iconWrap, { backgroundColor: `${item.color}22` }]}>
                  <MaterialCommunityIcons name={item.icon as any} size={20} color={item.color} />
                </View>
                <View style={styles.textBlock}>
                  <Text style={styles.label}>{t(item.labelKey)}</Text>
                  <Text style={styles.desc}>{t(item.descriptionKey)}</Text>
                </View>
                <Switch
                  value={localState[item.key as keyof typeof localState] ?? false}
                  onValueChange={(v) => toggle(item, v)}
                  trackColor={{ false: colors.border, true: item.color }}
                  thumbColor="#fff"
                />
              </View>
            ))}
          </View>
        </View>
      ))}
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    content: { paddingBottom: 100 },
    masterCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: `${colors.primary}44`,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
      padding: spacing.lg,
      gap: spacing.md,
      marginBottom: spacing.xl,
    },
    masterIconWrap: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      alignItems: "center",
      justifyContent: "center",
    },
    masterText: { flex: 1 },
    masterLabel: { ...typography.body, color: colors.text, fontWeight: "700" },
    masterDesc: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
    group: { marginBottom: spacing.lg },
    groupTitle: {
      ...typography.caption,
      color: colors.textMuted,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: spacing.sm,
      paddingHorizontal: spacing.xs,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      padding: spacing.md,
    },
    rowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      alignItems: "center",
      justifyContent: "center",
    },
    textBlock: { flex: 1 },
    label: { ...typography.body, color: colors.text, fontWeight: "600" },
    desc: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  });
}

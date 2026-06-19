import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState, useEffect } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { useTranslation, useLocaleCode } from "../../../shared/i18n";
import { notificationsApi } from "../../../services/api/notifications.api";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import { DesignBackHeader, DesignEqualFilterBar, Screen } from "../../../shared/ui";

function gettypeConfig(colors: AppColors): Record<string, { icon: string; color: string; bg: string }> { return {
  info: { icon: "information-outline", color: colors.primary, bg: colors.primarySoft },
  success: { icon: "check-circle-outline", color: colors.success, bg: colors.successSoft },
  warning: { icon: "alert-outline", color: colors.warning, bg: colors.warningSoft },
  danger: { icon: "alert-circle-outline", color: colors.danger, bg: colors.dangerSoft },
 }; }

type FilterKey = "all" | "unread" | "read";

function timeAgo(dateStr: string, locale: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "always" });
  if (minutes < 60) return rtf.format(-minutes, "minute");
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  return rtf.format(-Math.floor(hours / 24), "day");
}

export function NotificationsScreen() {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const { t } = useTranslation();
  const locale = useLocaleCode();
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await notificationsApi.getAll();
      setItems(res.data?.data || []);
    } catch {
      setError(t("notifications.errors.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = items.filter((n) => !n.isRead).length;
  const readCount = items.filter((n) => n.isRead).length;

  const filtered = useMemo(() => {
    if (activeFilter === "unread") return items.filter((n) => !n.isRead);
    if (activeFilter === "read") return items.filter((n) => n.isRead);
    return items;
  }, [activeFilter, items]);

  const markAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setItems(items.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const handlePress = async (id: string, isRead: boolean) => {
    if (!isRead) {
      try {
        await notificationsApi.markAsRead(id);
        setItems(items.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <DesignBackHeader title={t("notifications.title")} />

      <DesignEqualFilterBar
        activeKey={activeFilter}
        onChange={(key) => setActiveFilter(key as FilterKey)}
        tabs={[
          { key: "all", label: t("common.all") },
          { key: "unread", label: t("filters.unread"), count: unreadCount },
          { key: "read", label: t("filters.read"), count: readCount },
        ]}
      />

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: spacing.xl }} />
      ) : error ? (
        <View style={styles.stateBox}>
          <Text style={styles.stateText}>{error}</Text>
          <Pressable onPress={fetchNotifications}>
            <Text style={styles.retryLink}>{t("common.retry")}</Text>
          </Pressable>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.stateBox}>
          <MaterialCommunityIcons name="bell-off-outline" size={40} color={colors.textMuted} />
          <Text style={styles.stateText}>{t("notifications.empty")}</Text>
        </View>
      ) : (
      <View style={styles.list}>
        {filtered.map((notif) => {
          const config = gettypeConfig(colors)[notif.type] ?? gettypeConfig(colors).info;
          return (
            <Pressable
              key={notif.id}
              onPress={() => handlePress(notif.id, notif.isRead)}
              style={[styles.notifCard, !notif.isRead && styles.notifCardUnread]}
            >
              <View style={[styles.iconWrap, { backgroundColor: config.bg }]}>
                <MaterialCommunityIcons color={config.color} name={config.icon as any} size={22} />
              </View>
              <View style={styles.notifInfo}>
                <View style={styles.titleRow}>
                  <Text style={styles.notifTitle}>{notif.title}</Text>
                  {!notif.isRead ? <View style={styles.unreadDot} /> : null}
                </View>
                <Text style={styles.notifMessage}>{notif.message}</Text>
                <Text style={styles.notifTime}>{timeAgo(notif.createdAt, locale)}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      )}

      {!loading && !error && items.some((n) => !n.isRead) ? (
      <Pressable onPress={markAllRead}>
        <Text style={styles.markAll}>{t("notifications.markAllRead")}</Text>
      </Pressable>
      ) : null}
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  content: { paddingBottom: 100 },
  list: { gap: spacing.sm, marginBottom: spacing.lg },
  notifCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notifCardUnread: {
    borderColor: colors.primary,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  notifInfo: { flex: 1 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  notifTitle: { ...typography.body, color: colors.text, fontWeight: "600", flex: 1 },
  notifMessage: { ...typography.bodySmall, color: colors.textMuted, marginTop: 4 },
  notifTime: { ...typography.caption, color: colors.textDisabled, marginTop: spacing.xs },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.info,
  },
  markAll: {
    ...typography.body,
    color: colors.primary,
    fontWeight: "600",
    textAlign: "center",
  },
  stateBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  stateText: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: "center",
  },
  retryLink: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: "600",
  },
});
}

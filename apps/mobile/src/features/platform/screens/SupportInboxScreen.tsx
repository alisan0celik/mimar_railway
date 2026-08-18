import { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import { supportApi, type SupportTicketDetailDTO } from "../../../services/api/support.api";
import { useTranslation, useLocaleCode } from "../../../shared/i18n";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import { DesignBackHeader, Screen } from "../../../shared/ui";

const STATUS_FILTERS = ["all", "open", "in_progress", "waiting_user", "resolved", "closed"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

export function SupportInboxScreen() {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const router = useRouter();
  const { t } = useTranslation();
  const locale = useLocaleCode();

  const [tickets, setTickets] = useState<SupportTicketDetailDTO[]>([]);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const fetchInbox = useCallback(
    async (filter: StatusFilter) => {
      setError(false);
      try {
        const response = await supportApi.getInbox(
          filter === "all" ? { limit: 50 } : { status: filter, limit: 50 },
        );
        setTickets(Array.isArray(response?.data) ? response.data : []);
      } catch {
        setTickets([]);
        setError(true);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      fetchInbox(status);
    }, [fetchInbox, status]),
  );

  const statusColor = (value: string) => {
    switch (value) {
      case "open":
        return colors.primary;
      case "in_progress":
        return colors.info;
      case "waiting_user":
        return colors.warning;
      case "resolved":
        return colors.success;
      default:
        return colors.textMuted;
    }
  };

  const label = (prefix: string, value: string) => {
    const key = `support.${prefix}.${value}`;
    const translated = t(key);
    return translated === key ? value : translated;
  };

  return (
    <Screen contentContainerStyle={styles.content}>
      <DesignBackHeader
        fallbackRoute="/(main)/(tabs)/profile"
        title={t("support.inbox.title")}
      />

      <View style={styles.filterRow}>
        {STATUS_FILTERS.map((item) => (
          <Pressable
            key={item}
            onPress={() => {
              setStatus(item);
              setLoading(true);
            }}
            style={[styles.filterChip, status === item && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, status === item && styles.filterTextActive]}>
              {item === "all" ? t("common.all") : label("status", item)}
            </Text>
          </Pressable>
        ))}
      </View>

      {error ? (
        <Text style={styles.emptyText}>{t("support.loadTicketsFailed")}</Text>
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={tickets}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            !loading ? <Text style={styles.emptyText}>{t("support.inbox.empty")}</Text> : null
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchInbox(status);
              }}
            />
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/(main)/platform/support/[ticketId]",
                  params: { ticketId: item.id },
                })
              }
              style={styles.card}
            >
              <View style={styles.cardHeader}>
                <Text numberOfLines={1} style={styles.subject}>
                  {item.subject}
                </Text>
                <View style={[styles.badge, { backgroundColor: `${statusColor(item.status)}22` }]}>
                  <Text style={[styles.badgeText, { color: statusColor(item.status) }]}>
                    {label("status", item.status)}
                  </Text>
                </View>
              </View>

              <Text style={styles.meta}>
                {item.user?.fullName ?? "—"}
                {item.company?.name ? ` · ${item.company.name}` : ""}
              </Text>

              {item.lastMessagePreview ? (
                <Text numberOfLines={2} style={styles.preview}>
                  {item.lastMessagePreview}
                </Text>
              ) : null}

              <View style={styles.cardFooter}>
                <Text style={styles.category}>{label("categories", item.category)}</Text>
                <Text style={styles.date}>
                  {new Date(item.lastMessageAt).toLocaleDateString(locale)}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    content: { flex: 1 },
    filterRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
      marginBottom: spacing.md,
    },
    filterChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.full,
      backgroundColor: colors.cardSoft,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterText: { ...typography.caption, color: colors.textMuted, fontWeight: "600" },
    filterTextActive: { color: colors.white },
    list: { paddingBottom: spacing.xxl },
    emptyText: {
      ...typography.body,
      color: colors.textMuted,
      textAlign: "center",
      marginTop: spacing.xxl,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
      marginBottom: spacing.xs,
    },
    subject: { ...typography.body, color: colors.text, fontWeight: "600", flex: 1 },
    badge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.full,
    },
    badgeText: { ...typography.caption, fontWeight: "600" },
    meta: { ...typography.caption, color: colors.primaryLight, marginBottom: spacing.xs },
    preview: { ...typography.bodySmall, color: colors.textMuted, marginBottom: spacing.sm },
    cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    category: { ...typography.caption, color: colors.primary },
    date: { ...typography.caption, color: colors.textDisabled },
  });
}

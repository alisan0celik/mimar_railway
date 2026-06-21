import { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "expo-router";

import { supportApi, SupportTicketSummaryDTO } from "../../../services/api/support.api";
import { useTranslation, useLocaleCode } from "../../../shared/i18n";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import { DesignBackHeader, Screen, AppButton } from "../../../shared/ui";

export function SupportTicketsScreen() {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const router = useRouter();
  const { t } = useTranslation();
  const locale = useLocaleCode();
  const [tickets, setTickets] = useState<SupportTicketSummaryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const fetchTickets = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(false);
    try {
      const tickets = await supportApi.getTickets();
      setTickets(Array.isArray(tickets) ? tickets : []);
    } catch {
      setTickets([]);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTickets(true);
    }, [fetchTickets]),
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return colors.primary;
      case "in_progress":
        return colors.info;
      case "waiting_user":
        return colors.warning;
      case "resolved":
        return colors.success;
      case "closed":
        return colors.textMuted;
      default:
        return colors.textMuted;
    }
  };

  const getStatusLabel = (status: string) => {
    const key = `support.status.${status}` as const;
    const translated = t(key);
    return translated === key ? status : translated;
  };

  const getCategoryLabel = (category: string) => {
    const key = `support.categories.${category}` as const;
    const translated = t(key);
    return translated === key ? category : translated;
  };

  return (
    <Screen contentContainerStyle={styles.content}>
      <DesignBackHeader title={t("support.tickets")} />

      {error ? (
        <Text style={styles.emptyText}>{t("support.loadTicketsFailed")}</Text>
      ) : (
        <FlatList
          contentContainerStyle={styles.listContainer}
          data={tickets}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            !loading ? <Text style={styles.emptyText}>{t("support.emptyTickets")}</Text> : null
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchTickets(true);
              }}
            />
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/(main)/settings/support-tickets/[ticketId]",
                  params: { ticketId: item.id },
                })
              }
              style={styles.ticketCard}
            >
              <View style={styles.ticketHeader}>
                <Text style={styles.ticketSubject}>{item.subject}</Text>
                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}22` }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                    {getStatusLabel(item.status)}
                  </Text>
                </View>
              </View>
              <Text style={styles.category}>{getCategoryLabel(item.category)}</Text>
              {item.lastMessagePreview ? (
                <Text numberOfLines={2} style={styles.ticketMessage}>
                  {item.lastMessagePreview}
                </Text>
              ) : null}
              <Text style={styles.ticketDate}>
                {new Date(item.lastMessageAt).toLocaleDateString(locale)}
              </Text>
            </Pressable>
          )}
        />
      )}

      <AppButton
        onPress={() => router.push("/(main)/settings/create-ticket")}
        style={styles.fabButton}
        title={t("support.createTicket")}
      />
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    content: { flex: 1 },
    listContainer: { paddingBottom: 100 },
    emptyText: {
      ...typography.body,
      color: colors.textMuted,
      textAlign: "center",
      marginTop: spacing.xxl,
    },
    ticketCard: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    ticketHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.xs,
    },
    ticketSubject: {
      ...typography.body,
      color: colors.text,
      fontWeight: "600",
      flex: 1,
      marginRight: spacing.sm,
    },
    statusBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.full,
    },
    statusText: {
      ...typography.caption,
      fontWeight: "600",
    },
    category: {
      ...typography.caption,
      color: colors.primary,
      marginBottom: spacing.xs,
    },
    ticketMessage: {
      ...typography.bodySmall,
      color: colors.textMuted,
      marginBottom: spacing.sm,
    },
    ticketDate: {
      ...typography.caption,
      color: colors.textDisabled,
    },
    fabButton: {
      position: "absolute",
      bottom: spacing.xxl,
      left: spacing.lg,
      right: spacing.lg,
    },
  });
}

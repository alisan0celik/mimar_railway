import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { supportApi, type SupportTicketDetailDTO } from "../../../services/api/support.api";
import { useTranslation, useLocaleCode } from "../../../shared/i18n";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import { DesignBackHeader, Screen } from "../../../shared/ui";

const STATUS_OPTIONS = ["open", "in_progress", "waiting_user", "resolved", "closed"] as const;

export function SupportInboxDetailScreen({ ticketId }: { ticketId: string }) {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const { t } = useTranslation();
  const locale = useLocaleCode();
  const insets = useSafeAreaInsets();

  const [ticket, setTicket] = useState<SupportTicketDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [reply, setReply] = useState("");
  const [error, setError] = useState(false);

  const fetchTicket = useCallback(async () => {
    if (!ticketId) return;
    setError(false);
    try {
      setTicket(await supportApi.getInboxTicket(ticketId));
    } catch {
      setTicket(null);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

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

  const handleReply = async () => {
    const body = reply.trim();
    if (!body || !ticket) return;
    setSending(true);
    try {
      setTicket(await supportApi.replyInbox(ticket.id, body));
      setReply("");
    } catch (e: any) {
      Alert.alert(t("common.error"), e?.response?.data?.message || t("support.sendFailed"));
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!ticket || ticket.status === status) return;
    setUpdatingStatus(true);
    try {
      setTicket(await supportApi.updateInboxStatus(ticket.id, status));
    } catch (e: any) {
      Alert.alert(t("common.error"), e?.response?.data?.message || t("support.sendFailed"));
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <Screen contentContainerStyle={styles.content}>
        <DesignBackHeader title={t("support.ticketDetail")} />
        <ActivityIndicator color={colors.primary} size="large" style={styles.loader} />
      </Screen>
    );
  }

  if (error || !ticket) {
    return (
      <Screen contentContainerStyle={styles.content}>
        <DesignBackHeader title={t("support.ticketDetail")} />
        <Text style={styles.emptyText}>{t("support.loadTicketFailed")}</Text>
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={styles.content}>
      <DesignBackHeader title={t("support.ticketDetail")} />

      <View style={styles.headerCard}>
        <Text style={styles.subject}>{ticket.subject}</Text>
        <Text style={styles.meta}>
          {ticket.user?.fullName ?? "—"}
          {ticket.user?.email ? ` · ${ticket.user.email}` : ""}
        </Text>
        {ticket.company?.name ? <Text style={styles.meta}>{ticket.company.name}</Text> : null}
        <Text style={styles.category}>{label("categories", ticket.category)}</Text>
      </View>

      <View style={styles.statusRow}>
        {STATUS_OPTIONS.map((option) => {
          const active = ticket.status === option;
          return (
            <Pressable
              key={option}
              disabled={updatingStatus}
              onPress={() => handleStatusChange(option)}
              style={[
                styles.statusChip,
                active && { backgroundColor: statusColor(option), borderColor: statusColor(option) },
              ]}
            >
              <Text style={[styles.statusChipText, active && styles.statusChipTextActive]}>
                {label("status", option)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <FlatList
          contentContainerStyle={styles.messages}
          data={ticket.messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              style={[
                styles.messageRow,
                item.isStaffReply ? styles.messageRowMine : styles.messageRowOther,
              ]}
            >
              <Text style={styles.messageAuthor}>
                {item.isStaffReply ? t("support.supportTeam") : item.author.fullName}
              </Text>
              <View
                style={[styles.bubble, item.isStaffReply ? styles.bubbleMine : styles.bubbleOther]}
              >
                <Text style={styles.messageBody}>{item.body}</Text>
              </View>
              <Text style={styles.messageTime}>
                {new Date(item.createdAt).toLocaleString(locale)}
              </Text>
            </View>
          )}
        />

        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
          <TextInput
            multiline
            onChangeText={setReply}
            placeholder={t("support.replyPlaceholder")}
            placeholderTextColor={colors.textMuted}
            style={styles.composerInput}
            value={reply}
          />
          <Pressable
            disabled={!reply.trim() || sending}
            onPress={handleReply}
            style={[styles.sendBtn, (!reply.trim() || sending) && styles.sendBtnDisabled]}
          >
            <Text style={styles.sendBtnText}>
              {sending ? t("common.loading") : t("support.sendReply")}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    content: { flex: 1, paddingBottom: spacing.md },
    flex: { flex: 1 },
    loader: { marginTop: spacing.xxl },
    emptyText: {
      ...typography.body,
      color: colors.textMuted,
      textAlign: "center",
      marginTop: spacing.xxl,
    },
    headerCard: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    subject: { ...typography.body, color: colors.text, fontWeight: "700" },
    meta: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
    category: { ...typography.caption, color: colors.primary, marginTop: spacing.xs },
    statusRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
      marginBottom: spacing.sm,
    },
    statusChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.full,
      backgroundColor: colors.cardSoft,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statusChipText: { ...typography.caption, color: colors.textMuted, fontWeight: "600" },
    statusChipTextActive: { color: colors.white },
    messages: { paddingBottom: spacing.md },
    messageRow: { marginBottom: spacing.md, maxWidth: "85%" },
    messageRowMine: { alignSelf: "flex-end", alignItems: "flex-end" },
    messageRowOther: { alignSelf: "flex-start" },
    messageAuthor: { ...typography.caption, color: colors.textMuted, marginBottom: 2 },
    bubble: {
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    bubbleMine: { backgroundColor: `${colors.primary}22`, borderTopRightRadius: 2 },
    bubbleOther: { backgroundColor: colors.cardSoft, borderTopLeftRadius: 2 },
    messageBody: { ...typography.bodySmall, color: colors.text, lineHeight: 20 },
    messageTime: { ...typography.caption, color: colors.textDisabled, marginTop: 2 },
    composer: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: spacing.sm,
      paddingTop: spacing.sm,
    },
    composerInput: {
      flex: 1,
      ...typography.bodySmall,
      color: colors.text,
      backgroundColor: colors.input,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      maxHeight: 120,
    },
    sendBtn: {
      backgroundColor: colors.primary,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm + 2,
    },
    sendBtnDisabled: { opacity: 0.5 },
    sendBtnText: { ...typography.bodySmall, color: colors.white, fontWeight: "700" },
  });
}

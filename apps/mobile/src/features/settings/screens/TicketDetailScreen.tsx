import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  supportApi,
  type SupportTicketDetailDTO,
} from "../../../services/api/support.api";
import { CLOSED_TICKET_STATUSES } from "../constants/support.constants";
import { useTranslation, useLocaleCode } from "../../../shared/i18n";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import { DesignBackHeader, Screen } from "../../../shared/ui";
import { useAuthStore } from "../../../store/authStore";

export function TicketDetailScreen({ ticketId }: { ticketId: string }) {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const { t } = useTranslation();
  const locale = useLocaleCode();
  const userId = useAuthStore((s) => s.user?.id);

  const [ticket, setTicket] = useState<SupportTicketDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  const fetchTicket = useCallback(async () => {
    if (!ticketId) return;
    setError(false);
    try {
      const ticket = await supportApi.getTicket(ticketId);
      setTicket(ticket);
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

  const isClosed = ticket ? CLOSED_TICKET_STATUSES.includes(ticket.status as "resolved" | "closed") : false;

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

  const handleSend = async () => {
    const body = message.trim();
    if (!body || !ticket || isClosed) return;
    setSending(true);
    try {
      const updated = await supportApi.addMessage(ticket.id, body);
      setTicket(updated);
      setMessage("");
    } catch {
    } finally {
      setSending(false);
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
        <Text style={styles.errorText}>{t("support.loadTicketFailed")}</Text>
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={styles.content}>
      <DesignBackHeader title={t("support.ticketDetail")} />

      <View style={styles.headerCard}>
        <Text style={styles.subject}>{ticket.subject}</Text>
        <View style={styles.metaRow}>
          <View style={[styles.badge, { backgroundColor: `${getStatusColor(ticket.status)}22` }]}>
            <Text style={[styles.badgeText, { color: getStatusColor(ticket.status) }]}>
              {getStatusLabel(ticket.status)}
            </Text>
          </View>
          <Text style={styles.category}>{getCategoryLabel(ticket.category)}</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <FlatList
          contentContainerStyle={styles.messagesContent}
          data={ticket.messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isMine = item.author.id === userId && !item.isStaffReply;
            return (
              <View style={[styles.messageRow, isMine ? styles.messageRowMine : styles.messageRowOther]}>
                <Text style={styles.messageAuthor}>
                  {item.isStaffReply ? t("support.supportTeam") : item.author.fullName}
                </Text>
                <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
                  <Text style={[styles.messageBody, isMine && styles.messageBodyMine]}>{item.body}</Text>
                </View>
                <Text style={styles.messageTime}>
                  {new Date(item.createdAt).toLocaleString(locale)}
                </Text>
              </View>
            );
          }}
        />

        {isClosed ? (
          <Text style={styles.closedHint}>{t("support.ticketClosedHint")}</Text>
        ) : (
          <View style={styles.composer}>
            <TextInput
              multiline
              onChangeText={setMessage}
              placeholder={t("support.replyPlaceholder")}
              placeholderTextColor={colors.textMuted}
              style={styles.composerInput}
              value={message}
            />
            <Pressable
              disabled={!message.trim() || sending}
              onPress={handleSend}
              style={[styles.sendBtn, (!message.trim() || sending) && styles.sendBtnDisabled]}
            >
              <Text style={styles.sendBtnText}>
                {sending ? t("common.loading") : t("support.sendReply")}
              </Text>
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    content: { flex: 1, paddingBottom: spacing.md },
    flex: { flex: 1 },
    loader: { marginTop: spacing.xxl },
    errorText: {
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
      padding: spacing.lg,
      marginBottom: spacing.md,
    },
    subject: { ...typography.body, color: colors.text, fontWeight: "700" },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    badge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.full,
    },
    badgeText: { ...typography.caption, fontWeight: "600" },
    category: { ...typography.caption, color: colors.textMuted },
    messagesContent: { paddingBottom: spacing.md, gap: spacing.md },
    messageRow: { marginBottom: spacing.sm },
    messageRowMine: { alignItems: "flex-end" },
    messageRowOther: { alignItems: "flex-start" },
    messageAuthor: { ...typography.caption, color: colors.textMuted, marginBottom: 4 },
    bubble: {
      maxWidth: "85%",
      borderRadius: radius.lg,
      padding: spacing.md,
    },
    bubbleMine: { backgroundColor: colors.primary },
    bubbleOther: { backgroundColor: colors.cardSoft, borderWidth: 1, borderColor: colors.border },
    messageBody: { ...typography.bodySmall, color: colors.text, lineHeight: 20 },
    messageBodyMine: { color: colors.white },
    messageTime: { ...typography.caption, color: colors.textDisabled, marginTop: 4 },
    closedHint: {
      ...typography.caption,
      color: colors.textMuted,
      textAlign: "center",
      padding: spacing.md,
    },
    composer: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: spacing.md,
      gap: spacing.sm,
    },
    composerInput: {
      minHeight: 80,
      backgroundColor: colors.input,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      padding: spacing.md,
      ...typography.body,
      color: colors.text,
      textAlignVertical: "top",
    },
    sendBtn: {
      alignSelf: "flex-end",
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
    },
    sendBtnDisabled: { opacity: 0.5 },
    sendBtnText: { ...typography.bodySmall, color: colors.white, fontWeight: "700" },
  });
}

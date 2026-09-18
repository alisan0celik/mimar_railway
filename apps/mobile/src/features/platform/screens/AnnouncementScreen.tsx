import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import {
  announcementsApi,
  type AnnouncementAudienceDTO,
} from "../../../services/api/announcements.api";
import { useTranslation, useLocaleCode } from "../../../shared/i18n";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import {
  AppButton,
  AppInput,
  ConfirmDialog,
  DesignBackHeader,
  NoPermissionState,
  Screen,
  showAppAlert,
} from "../../../shared/ui";
import { useAuthStore } from "../../../store/authStore";

// Sunucudaki sınırlarla aynı (CreateAnnouncementDto).
const TITLE_MIN = 3;
const TITLE_MAX = 80;
const MESSAGE_MIN = 5;
const MESSAGE_MAX = 500;

/** Şablonda doldurulması gereken "[saat aralığı]" gibi alanlar. */
const PLACEHOLDER_PATTERN = /\[[^\]]+\]/;

const APP_ICON = require("../../../../assets/icon.png");

function tomorrowLabel(locale: string): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long" }).format(tomorrow);
}

/**
 * Platform yöneticisinin bütün kullanıcılara duyurusu (planlı bakım, kesinti).
 *
 * Bildirim her şirketin her kullanıcısına gidiyor ve geri alınamıyor; bu
 * yüzden kaç kişiye ulaşacağı baştan gösteriliyor, gönderim onay istiyor ve
 * şablondaki doldurulmamış alanlarla gönderilemiyor.
 */
export function AnnouncementScreen() {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const { t } = useTranslation();
  const locale = useLocaleCode();
  const isPlatformAdmin = useAuthStore((state) => Boolean(state.user?.isPlatformAdmin));

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState<AnnouncementAudienceDTO | null>(null);
  const [audienceFailed, setAudienceFailed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!isPlatformAdmin) return;
    announcementsApi
      .getAudience()
      .then((data) => {
        setAudience(data);
        setAudienceFailed(false);
      })
      .catch(() => setAudienceFailed(true));
  }, [isPlatformAdmin]);

  if (!isPlatformAdmin) {
    return (
      <Screen>
        <DesignBackHeader title={t("announcement.title")} />
        <NoPermissionState />
      </Screen>
    );
  }

  const trimmedTitle = title.trim();
  const trimmedMessage = message.trim();
  const hasPlaceholder = PLACEHOLDER_PATTERN.test(`${trimmedTitle} ${trimmedMessage}`);
  const canSend =
    trimmedTitle.length >= TITLE_MIN &&
    trimmedMessage.length >= MESSAGE_MIN &&
    !hasPlaceholder &&
    !sending;

  const applyTemplate = () => {
    setTitle(t("announcement.template.title"));
    setMessage(t("announcement.template.message", { date: tomorrowLabel(locale) }));
  };

  const handleSend = async () => {
    setSending(true);
    try {
      const { recipients } = await announcementsApi.send(trimmedTitle, trimmedMessage);
      setConfirming(false);
      setTitle("");
      setMessage("");
      showAppAlert(t("announcement.sentTitle"), t("announcement.sentBody", { count: String(recipients) }));
    } catch (error) {
      setConfirming(false);
      const status = (error as { response?: { status?: number } } | null)?.response?.status;
      showAppAlert(
        t("common.error"),
        status === 409 ? t("announcement.duplicate") : t("announcement.sendError"),
      );
    } finally {
      setSending(false);
    }
  };

  const audienceText = audience
    ? t("announcement.audience", {
        recipients: String(audience.recipients),
        push: String(audience.reachableByPush),
      })
    : audienceFailed
      ? t("announcement.audienceUnavailable")
      : t("announcement.audienceLoading");

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <DesignBackHeader title={t("announcement.title")} subtitle={t("announcement.subtitle")} />

      <View style={styles.audienceCard}>
        <MaterialCommunityIcons color={colors.primary} name="account-group-outline" size={22} />
        <Text style={styles.audienceText}>{audienceText}</Text>
      </View>

      <Text style={styles.hint}>{t("announcement.hint")}</Text>

      <Pressable
        accessibilityRole="button"
        onPress={applyTemplate}
        style={({ pressed }) => [styles.templateChip, pressed && styles.pressed]}
      >
        <MaterialCommunityIcons color={colors.primary} name="wrench-clock" size={18} />
        <Text style={styles.templateChipText}>{t("announcement.useMaintenanceTemplate")}</Text>
      </Pressable>

      <View style={styles.form}>
        <AppInput
          helperText={`${title.length}/${TITLE_MAX}`}
          label={t("announcement.titleLabel")}
          onChangeText={(value) => setTitle(value.slice(0, TITLE_MAX))}
          placeholder={t("announcement.titlePlaceholder")}
          value={title}
        />
        <AppInput
          error={hasPlaceholder ? t("announcement.placeholderLeft") : undefined}
          helperText={`${message.length}/${MESSAGE_MAX}`}
          label={t("announcement.messageLabel")}
          multiline
          onChangeText={(value) => setMessage(value.slice(0, MESSAGE_MAX))}
          placeholder={t("announcement.messagePlaceholder")}
          value={message}
        />
      </View>

      <Text style={styles.previewLabel}>{t("announcement.preview")}</Text>
      <View style={styles.previewCard}>
        <Image source={APP_ICON} style={styles.previewIcon} />
        <View style={styles.previewBody}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewApp}>PLANOVA</Text>
            <Text style={styles.previewTime}>{t("announcement.previewNow")}</Text>
          </View>
          <Text numberOfLines={1} style={styles.previewTitle}>
            {trimmedTitle || t("announcement.titlePlaceholder")}
          </Text>
          <Text numberOfLines={4} style={styles.previewMessage}>
            {trimmedMessage || t("announcement.messagePlaceholder")}
          </Text>
        </View>
      </View>

      <AppButton
        disabled={!canSend}
        fullWidth
        onPress={() => setConfirming(true)}
        title={t("announcement.send")}
      />

      <ConfirmDialog
        confirmDestructive
        confirmLabel={t("announcement.confirmSend")}
        loading={sending}
        message={t("announcement.confirmBody", {
          count: audience ? String(audience.recipients) : "?",
        })}
        onCancel={() => {
          if (!sending) setConfirming(false);
        }}
        onConfirm={handleSend}
        title={t("announcement.confirmTitle")}
        visible={confirming}
      />
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    content: { paddingBottom: 100, gap: spacing.md },
    audienceCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      backgroundColor: colors.primarySoft,
      borderRadius: radius.md,
      padding: spacing.md,
    },
    audienceText: {
      ...typography.body,
      color: colors.text,
      flex: 1,
      fontWeight: "600",
    },
    hint: {
      ...typography.caption,
      color: colors.textMuted,
      lineHeight: 18,
    },
    templateChip: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      gap: spacing.xs,
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    templateChipText: {
      ...typography.caption,
      color: colors.primary,
      fontWeight: "600",
    },
    pressed: { opacity: 0.75 },
    form: { gap: spacing.md },
    previewLabel: {
      ...typography.caption,
      color: colors.textMuted,
      fontWeight: "600",
      marginTop: spacing.sm,
    },
    previewCard: {
      flexDirection: "row",
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: spacing.md,
    },
    previewIcon: { width: 36, height: 36, borderRadius: 8 },
    previewBody: { flex: 1, gap: 2 },
    previewHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    previewApp: {
      ...typography.caption,
      color: colors.textMuted,
      fontWeight: "600",
      letterSpacing: 0.5,
    },
    previewTime: { ...typography.caption, color: colors.textMuted },
    previewTitle: { ...typography.body, color: colors.text, fontWeight: "700" },
    previewMessage: { ...typography.caption, color: colors.text, lineHeight: 18 },
  });
}

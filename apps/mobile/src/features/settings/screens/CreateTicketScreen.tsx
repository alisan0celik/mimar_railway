import type { Href } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { getApiErrorMessage } from "../../../services/api/api-error";
import { supportApi } from "../../../services/api/support.api";
import { SUPPORT_CATEGORIES, type SupportCategory } from "../constants/support.constants";
import { useTranslation } from "../../../shared/i18n";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { DesignBackHeader, Screen, AppButton, AppInput } from "../../../shared/ui";

const MIN_SUBJECT_LENGTH = 3;
const MIN_MESSAGE_LENGTH = 10;

export function CreateTicketScreen() {
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const { t } = useTranslation();

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<SupportCategory>("other");
  const [showCategories, setShowCategories] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subjectError, setSubjectError] = useState<string>();
  const [messageError, setMessageError] = useState<string>();
  const [formError, setFormError] = useState<string>();

  const categoryLabel = useMemo(() => t(`support.categories.${category}`), [category, t]);

  const trimmedSubject = subject.trim();
  const trimmedMessage = message.trim();
  const canSubmit =
    trimmedSubject.length >= MIN_SUBJECT_LENGTH &&
    trimmedMessage.length >= MIN_MESSAGE_LENGTH &&
    !loading;

  const detailRoute = (ticketId: string): Href => ({
    pathname: "/(main)/settings/support-tickets/[ticketId]",
    params: { ticketId },
  });

  const validateForm = () => {
    let valid = true;
    setSubjectError(undefined);
    setMessageError(undefined);
    setFormError(undefined);

    if (trimmedSubject.length < MIN_SUBJECT_LENGTH) {
      setSubjectError(t("support.alerts.subjectMin"));
      valid = false;
    }

    if (trimmedMessage.length < MIN_MESSAGE_LENGTH) {
      setMessageError(t("support.alerts.messageMin"));
      valid = false;
    }

    return valid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const ticket = await supportApi.createTicket({
        subject: trimmedSubject,
        category,
        message: trimmedMessage,
      });

      if (!ticket?.id) {
        throw new Error("Missing ticket id");
      }

      router.replace(detailRoute(ticket.id));
    } catch (error) {
      setFormError(getApiErrorMessage(error, t("support.alerts.createError")));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <DesignBackHeader title={t("support.createTicketTitle")} />

      <View style={styles.form}>
        <Text style={styles.label}>{t("support.category")}</Text>
        <Pressable onPress={() => setShowCategories((v) => !v)} style={styles.categoryField}>
          <Text style={styles.categoryValue}>{categoryLabel}</Text>
        </Pressable>
        {showCategories ? (
          <View style={styles.categoryList}>
            {SUPPORT_CATEGORIES.map((item) => (
              <Pressable
                key={item}
                onPress={() => {
                  setCategory(item);
                  setShowCategories(false);
                }}
                style={[styles.categoryItem, category === item && styles.categoryItemActive]}
              >
                <Text style={[styles.categoryItemText, category === item && styles.categoryItemTextActive]}>
                  {t(`support.categories.${item}`)}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <AppInput
          error={subjectError}
          label={t("support.subject")}
          onChangeText={(value) => {
            setSubject(value);
            if (subjectError) setSubjectError(undefined);
            if (formError) setFormError(undefined);
          }}
          placeholder={t("support.subjectPlaceholder")}
          value={subject}
        />

        <AppInput
          error={messageError}
          helperText={t("support.messageHelper")}
          label={t("support.message")}
          multiline
          onChangeText={(value) => {
            setMessage(value);
            if (messageError) setMessageError(undefined);
            if (formError) setFormError(undefined);
          }}
          placeholder={t("support.messagePlaceholder")}
          value={message}
        />

        {formError ? <Text style={styles.formError}>{formError}</Text> : null}

        <AppButton
          disabled={!canSubmit}
          loading={loading}
          onPress={handleSubmit}
          style={styles.submitBtn}
          title={t("support.submit")}
        />
      </View>
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    content: { flex: 1 },
    form: {
      paddingHorizontal: spacing.lg,
      marginTop: spacing.md,
      gap: spacing.md,
    },
    label: {
      ...typography.caption,
      color: colors.textMuted,
      fontWeight: "600",
    },
    categoryField: {
      backgroundColor: colors.input,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      marginBottom: spacing.sm,
    },
    categoryValue: { ...typography.body, color: colors.text },
    categoryList: {
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
      marginBottom: spacing.sm,
    },
    categoryItem: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.cardSoft,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    categoryItemActive: { backgroundColor: colors.primarySoft },
    categoryItemText: { ...typography.body, color: colors.text },
    categoryItemTextActive: { color: colors.primary, fontWeight: "700" },
    formError: {
      ...typography.caption,
      color: colors.danger,
    },
    submitBtn: {
      marginTop: spacing.lg,
    },
  });
}

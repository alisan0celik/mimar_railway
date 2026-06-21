import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import { authApi } from "../../../services/api/auth.api";
import { maskEmail } from "../utils/mask-email";
import { useTranslation } from "../../../shared/i18n";
import {
  AppButton,
  AppInput,
  AuthBrandHeader,
  AuthFormCard,
  AuthScreenShell,
  SuccessStateLayout,
} from "../../../shared/ui";

export function ForgotPasswordScreen() {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [emailError, setEmailError] = useState<string>();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const canSubmit = email.trim().length > 0 && emailRegex.test(email.trim());

  const onEmailBlur = () => {
    if (email.trim().length > 0 && !emailRegex.test(email.trim())) {
      setEmailError(t("auth.errors.invalidEmail"));
    } else {
      setEmailError(undefined);
    }
  };

  if (sent) {
    return (
      <AuthScreenShell scroll={false}>
        <AuthBrandHeader variant="compact" />
        <SuccessStateLayout
          tone="auth"
          icon={
            <View style={styles.successIconWrap}>
              <MaterialCommunityIcons name="email-check-outline" size={48} color={colors.primaryLight} />
            </View>
          }
          title={t("auth.forgotPasswordForm.successTitle")}
          description={t("auth.forgotPasswordForm.successDescription", {
            email: maskEmail(email),
          })}
          contentContainerStyle={styles.successContent}
          action={
            <AppButton
              fullWidth
              onPress={() => router.replace("/(auth)/login")}
              title={t("auth.forgotPasswordForm.backToLogin")}
            />
          }
          secondaryAction={
            <Pressable onPress={() => setSent(false)} style={styles.secondaryLink}>
              <Text style={styles.secondaryLinkText}>
                {t("auth.forgotPasswordForm.tryAnotherEmail")}
              </Text>
            </Pressable>
          }
        >
          <View style={styles.infoBox}>
            <Text style={styles.infoItem}>• {t("auth.forgotPasswordForm.tips.inbox")}</Text>
            <Text style={styles.infoItem}>• {t("auth.forgotPasswordForm.tips.spam")}</Text>
            <Text style={styles.infoItem}>• {t("auth.forgotPasswordForm.tips.expiry")}</Text>
          </View>
        </SuccessStateLayout>
      </AuthScreenShell>
    );
  }

  return (
    <AuthScreenShell contentContainerStyle={styles.content}>
      <AuthBrandHeader variant="compact" />

      <AuthFormCard>
        <Text style={styles.formTitle}>{t("auth.forgotPasswordForm.title")}</Text>
        <Text style={styles.formSubtitle}>{t("auth.forgotPasswordForm.subtitle")}</Text>

        <View style={styles.infoSection}>
          <MaterialCommunityIcons name="lock-reset" size={32} color={colors.primaryLight} />
        </View>

        <AppInput
          label={t("auth.email")}
          onChangeText={(val) => {
            setEmail(val);
            setEmailError(undefined);
          }}
          onBlur={onEmailBlur}
          placeholder={t("auth.emailPlaceholderShort")}
          value={email}
          error={emailError}
          keyboardType="email-address"
          autoCapitalize="none"
          helperText={t("auth.forgotPasswordForm.helper")}
          leftIcon={
            <MaterialCommunityIcons name="email-outline" size={20} color={colors.textMuted} />
          }
        />

        <AppButton
          disabled={!canSubmit || submitting}
          fullWidth
          loading={submitting}
          onPress={async () => {
            setSubmitting(true);
            try {
              await authApi.forgotPassword(email.trim());
              setSent(true);
            } catch (err: any) {
              const msg = err?.response?.data?.message || t("auth.errors.forgotPasswordFailed");
              setEmailError(msg);
            } finally {
              setSubmitting(false);
            }
          }}
          title={t("auth.forgotPasswordForm.sendLink")}
          style={styles.sendBtn}
        />
      </AuthFormCard>
    </AuthScreenShell>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    content: {
      paddingBottom: spacing.xxl,
    },
    formTitle: {
      ...typography.h3,
      color: "#FFFFFF",
    },
    formSubtitle: {
      ...typography.bodySmall,
      color: "rgba(255,255,255,0.55)",
      lineHeight: 22,
    },
    infoSection: {
      alignItems: "center",
      marginVertical: spacing.xs,
    },
    sendBtn: {
      marginTop: spacing.sm,
    },
    successContent: {
      paddingHorizontal: spacing.lg,
    },
    successIconWrap: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: "rgba(99,102,241,0.22)",
      alignItems: "center",
      justifyContent: "center",
    },
    infoBox: {
      marginTop: spacing.lg,
      backgroundColor: "rgba(15,23,42,0.55)",
      borderRadius: radius.md,
      padding: spacing.lg,
      gap: spacing.sm,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
      width: "100%",
    },
    infoItem: {
      ...typography.bodySmall,
      color: "rgba(255,255,255,0.7)",
      lineHeight: 22,
    },
    secondaryLink: {
      alignItems: "center",
      paddingVertical: spacing.sm,
    },
    secondaryLinkText: {
      ...typography.body,
      color: colors.primaryLight,
      fontWeight: "600",
    },
  });
}

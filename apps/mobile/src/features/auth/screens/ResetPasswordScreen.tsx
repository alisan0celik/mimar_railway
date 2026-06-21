import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { authApi } from "../../../services/api/auth.api";
import { useTranslation } from "../../../shared/i18n";
import { spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import {
  AppButton,
  AppInput,
  AuthBrandHeader,
  AuthFormCard,
  AuthScreenShell,
  SuccessStateLayout,
} from "../../../shared/ui";

export function ResetPasswordScreen() {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const token = useMemo(() => {
    const value = params.token;
    return Array.isArray(value) ? value[0] : value;
  }, [params.token]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  const canSubmit =
    Boolean(token) &&
    password.length >= 6 &&
    confirmPassword.length >= 6 &&
    password === confirmPassword;

  if (completed) {
    return (
      <AuthScreenShell scroll={false}>
        <AuthBrandHeader variant="compact" />
        <SuccessStateLayout
          tone="auth"
          icon={
            <View style={styles.successIconWrap}>
              <MaterialCommunityIcons name="lock-check-outline" size={48} color={colors.primaryLight} />
            </View>
          }
          title={t("auth.resetPasswordForm.successTitle")}
          description={t("auth.resetPasswordForm.successDescription")}
          contentContainerStyle={styles.successContent}
          action={
            <AppButton
              fullWidth
              onPress={() => router.replace("/(auth)/login")}
              title={t("auth.resetPasswordForm.backToLogin")}
            />
          }
        />
      </AuthScreenShell>
    );
  }

  return (
    <AuthScreenShell contentContainerStyle={styles.content}>
      <AuthBrandHeader variant="compact" />

      <AuthFormCard>
        <Text style={styles.formTitle}>{t("auth.resetPasswordForm.title")}</Text>
        <Text style={styles.formSubtitle}>{t("auth.resetPasswordForm.subtitle")}</Text>

        {!token ? (
          <View style={styles.warningBox}>
            <MaterialCommunityIcons name="alert-circle-outline" size={22} color={colors.danger} />
            <Text style={styles.warningText}>{t("auth.resetPasswordForm.missingToken")}</Text>
          </View>
        ) : null}

        <AppInput
          label={t("auth.resetPasswordForm.newPassword")}
          onChangeText={(value) => {
            setPassword(value);
            setError(undefined);
          }}
          placeholder={t("auth.passwordPlaceholder")}
          value={password}
          secureTextEntry
          autoCapitalize="none"
          helperText={t("auth.resetPasswordForm.helper")}
          leftIcon={<MaterialCommunityIcons name="lock-outline" size={20} color={colors.textMuted} />}
        />

        <AppInput
          label={t("auth.resetPasswordForm.confirmPassword")}
          onChangeText={(value) => {
            setConfirmPassword(value);
            setError(undefined);
          }}
          placeholder={t("auth.passwordPlaceholder")}
          value={confirmPassword}
          secureTextEntry
          autoCapitalize="none"
          error={error}
          leftIcon={<MaterialCommunityIcons name="lock-check-outline" size={20} color={colors.textMuted} />}
        />

        <AppButton
          disabled={!canSubmit || submitting}
          fullWidth
          loading={submitting}
          onPress={async () => {
            if (!token) {
              setError(t("auth.resetPasswordForm.missingToken"));
              return;
            }
            if (password !== confirmPassword) {
              setError(t("auth.errors.passwordsMismatch"));
              return;
            }

            setSubmitting(true);
            try {
              await authApi.resetPassword({ token, newPassword: password });
              setCompleted(true);
            } catch (err: any) {
              setError(err?.response?.data?.message || t("auth.errors.resetPasswordFailed"));
            } finally {
              setSubmitting(false);
            }
          }}
          title={t("auth.resetPasswordForm.savePassword")}
          style={styles.submitBtn}
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
    submitBtn: {
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
    warningBox: {
      flexDirection: "row",
      gap: spacing.sm,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.danger,
      backgroundColor: "rgba(239,68,68,0.12)",
      padding: spacing.md,
      borderRadius: 8,
    },
    warningText: {
      ...typography.bodySmall,
      color: colors.text,
      flex: 1,
      lineHeight: 20,
    },
  });
}

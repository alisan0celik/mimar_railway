import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAuthStore } from "../../../store/authStore";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import { getPostAuthRoute } from "../utils/post-auth-route";
import { authApi } from "../../../services/api/auth.api";
import { useTranslation } from "../../../shared/i18n";
import {
  AppButton,
  AppInput,
  AuthBrandHeader,
  AuthFormCard,
  AuthScreenShell,
} from "../../../shared/ui";

export function RegisterScreen() {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const { t } = useTranslation();
  const router = useRouter();
  const { register } = useAuthStore();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const [fullNameError, setFullNameError] = useState<string>();
  const [emailError, setEmailError] = useState<string>();
  const [passwordError, setPasswordError] = useState<string>();
  const [apiError, setApiError] = useState<string>();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const passwordsMatch =
    password.length > 0 && passwordRepeat.length > 0 && password === passwordRepeat;

  const isFullNameValid = fullName.trim().length > 2;
  const isEmailValid = email.trim().length > 0 && emailRegex.test(email.trim());

  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isPasswordValid = hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSymbol;

  const isValid = isFullNameValid && isEmailValid && isPasswordValid && passwordsMatch && agreed;

  const onFullNameBlur = () => {
    if (fullName.trim().length > 0 && fullName.trim().length <= 2) {
      setFullNameError(t("auth.errors.fullNameMinLength"));
    } else {
      setFullNameError(undefined);
    }
  };

  const onEmailBlur = async () => {
    const trimmedEmail = email.trim();
    if (trimmedEmail.length > 0 && !emailRegex.test(trimmedEmail)) {
      setEmailError(t("auth.errors.invalidEmail"));
      return;
    }

    if (trimmedEmail.length > 0) {
      try {
        const response = await authApi.checkEmail(trimmedEmail);
        if (response.data.exists) {
          setEmailError("Bu e-posta adresi zaten kayıtlı");
        } else {
          setEmailError(undefined);
        }
      } catch (err) {
        console.error("Email uniqueness check failed:", err);
      }
    } else {
      setEmailError(undefined);
    }
  };

  const onPasswordBlur = () => {
    if (password.length > 0 && !isPasswordValid) {
      setPasswordError(t("auth.errors.passwordRules"));
    } else {
      setPasswordError(undefined);
    }
  };

  return (
    <AuthScreenShell contentContainerStyle={styles.screenContent}>
      <AuthBrandHeader variant="compact" />

      <AuthFormCard>
        <Text style={styles.formTitle}>{t("auth.registerTitle")}</Text>

        {apiError ? (
          <View style={styles.errorBanner}>
            <MaterialCommunityIcons name="alert-circle-outline" size={20} color={colors.danger} />
            <Text style={styles.errorBannerText}>{apiError}</Text>
          </View>
        ) : null}

        <View style={styles.formGroup}>
          <AppInput
            label={t("auth.fullName")}
            onChangeText={(val) => {
              setFullName(val);
              setFullNameError(undefined);
              setApiError(undefined);
            }}
            onBlur={onFullNameBlur}
            placeholder={t("auth.fullNamePlaceholder")}
            value={fullName}
            error={fullNameError}
            helperText={t("auth.fullNameHelper")}
            leftIcon={
              <MaterialCommunityIcons name="account-outline" size={20} color={colors.textMuted} />
            }
          />
          <AppInput
            keyboardType="email-address"
            label={t("auth.email")}
            onChangeText={(val) => {
              setEmail(val);
              setEmailError(undefined);
              setApiError(undefined);
            }}
            onBlur={onEmailBlur}
            placeholder={t("auth.emailPlaceholderShort")}
            value={email}
            error={emailError}
            autoCapitalize="none"
            leftIcon={
              <MaterialCommunityIcons name="email-outline" size={20} color={colors.textMuted} />
            }
          />
          <AppInput
            label={t("auth.password")}
            onChangeText={(val) => {
              setPassword(val);
              setPasswordError(undefined);
              setApiError(undefined);
            }}
            onBlur={onPasswordBlur}
            placeholder={t("auth.passwordPlaceholder")}
            secureTextEntry
            value={password}
            error={passwordError}
            leftIcon={
              <MaterialCommunityIcons name="lock-outline" size={20} color={colors.textMuted} />
            }
          />
          <View style={styles.passwordRequirements}>
            <View style={styles.requirementItem}>
              <MaterialCommunityIcons
                name={hasMinLength ? "check-circle" : "circle-outline"}
                size={16}
                color={hasMinLength ? colors.success : colors.textMuted}
              />
              <Text style={[styles.requirementText, hasMinLength && styles.requirementTextMet]}>
                {t("auth.passwordRules.minLength")}
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <MaterialCommunityIcons
                name={hasUpperCase && hasLowerCase ? "check-circle" : "circle-outline"}
                size={16}
                color={hasUpperCase && hasLowerCase ? colors.success : colors.textMuted}
              />
              <Text
                style={[
                  styles.requirementText,
                  hasUpperCase && hasLowerCase && styles.requirementTextMet,
                ]}
              >
                {t("auth.passwordRules.upperLower")}
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <MaterialCommunityIcons
                name={hasNumber ? "check-circle" : "circle-outline"}
                size={16}
                color={hasNumber ? colors.success : colors.textMuted}
              />
              <Text style={[styles.requirementText, hasNumber && styles.requirementTextMet]}>
                {t("auth.passwordRules.number")}
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <MaterialCommunityIcons
                name={hasSymbol ? "check-circle" : "circle-outline"}
                size={16}
                color={hasSymbol ? colors.success : colors.textMuted}
              />
              <Text style={[styles.requirementText, hasSymbol && styles.requirementTextMet]}>
                {t("auth.passwordRules.symbol")}
              </Text>
            </View>
          </View>
          <AppInput
            label={t("auth.passwordRepeat")}
            onChangeText={(val) => {
              setPasswordRepeat(val);
              setApiError(undefined);
            }}
            placeholder={t("auth.passwordPlaceholder")}
            secureTextEntry
            value={passwordRepeat}
            error={
              passwordRepeat.length > 0 && !passwordsMatch
                ? t("auth.errors.passwordsMismatch")
                : undefined
            }
            leftIcon={
              <MaterialCommunityIcons name="lock-check-outline" size={20} color={colors.textMuted} />
            }
          />
        </View>

        <Pressable onPress={() => setAgreed((v) => !v)} style={styles.checkboxRow}>
          <MaterialCommunityIcons
            name={agreed ? "checkbox-marked" : "checkbox-blank-outline"}
            size={22}
            color={agreed ? colors.primaryLight : "rgba(255,255,255,0.45)"}
          />
          <Text style={styles.checkboxText}>{t("auth.terms")}</Text>
        </Pressable>

        <AppButton
          disabled={!isValid}
          fullWidth
          loading={loading}
          onPress={async () => {
            setLoading(true);
            setApiError(undefined);
            try {
              const user = await register({
                email: email.trim(),
                password,
                fullName: fullName.trim(),
              });
              router.replace(getPostAuthRoute(user));
            } catch (error: any) {
              const responseMsg = error?.response?.data?.message;
              if (responseMsg === "Bu e-posta adresi zaten kayıtlı") {
                setEmailError(responseMsg);
              } else {
                let msg = t("auth.errors.registerFailed");
                if (Array.isArray(responseMsg)) {
                  msg = responseMsg.join("\n");
                } else if (typeof responseMsg === "string") {
                  msg = responseMsg;
                }
                setApiError(msg);
              }
            } finally {
              setLoading(false);
            }
          }}
          style={styles.submitButton}
          title={t("auth.register")}
        />
      </AuthFormCard>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{t("auth.hasAccount")} </Text>
        <Pressable onPress={() => router.push("/(auth)/login")}>
          <Text style={styles.footerLink}>{t("auth.login")}</Text>
        </Pressable>
      </View>
    </AuthScreenShell>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    screenContent: {
      paddingBottom: spacing.xxl,
    },
    formTitle: {
      ...typography.h3,
      color: "#FFFFFF",
      marginBottom: spacing.xs,
    },
    errorBanner: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.dangerSoft,
      padding: spacing.md,
      borderRadius: radius.md,
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: colors.danger + "40",
    },
    errorBannerText: {
      ...typography.bodySmall,
      color: colors.danger,
      flex: 1,
    },
    formGroup: {
      gap: spacing.md,
    },
    passwordRequirements: {
      backgroundColor: "rgba(15,23,42,0.5)",
      padding: spacing.md,
      borderRadius: radius.md,
      marginTop: -spacing.xs,
      gap: spacing.xs,
      borderWidth: 1,
      borderColor: "rgba(148,163,184,0.12)",
    },
    requirementItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    requirementText: {
      ...typography.caption,
      color: "rgba(255,255,255,0.45)",
    },
    requirementTextMet: {
      color: colors.success,
    },
    checkboxRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    checkboxText: {
      ...typography.bodySmall,
      color: "rgba(255,255,255,0.7)",
      flex: 1,
    },
    submitButton: {
      marginTop: spacing.sm,
    },
    footer: {
      marginTop: spacing.lg,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
    },
    footerText: {
      ...typography.bodySmall,
      color: "rgba(255,255,255,0.45)",
    },
    footerLink: {
      ...typography.body,
      color: colors.primaryLight,
      fontWeight: "700",
    },
  });
}

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAuthStore } from "../../../store";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import { getLoginErrorMessage } from "../utils/auth-errors";
import { getPostAuthRoute } from "../utils/post-auth-route";
import { signInWithSocial } from "../utils/social-sign-in";
import { useTranslation } from "../../../shared/i18n";
import {
  AppButton,
  AppInput,
  AuthBrandHeader,
  AuthFormCard,
  AuthScreenShell,
} from "../../../shared/ui";

export function LoginScreen() {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const { t } = useTranslation();
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string>();
  const [passwordError, setPasswordError] = useState<string>();
  const [apiError, setApiError] = useState<string>();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleSocialLogin = async (provider: "GOOGLE" | "APPLE") => {
    setLoading(true);
    try {
      const signedIn = await signInWithSocial(provider, t);
      if (!signedIn) return;
      router.replace(getPostAuthRoute(useAuthStore.getState().user));
    } finally {
      setLoading(false);
    }
  };

  const isEmailValid = email.trim().length > 0 && emailRegex.test(email.trim());
  const isPasswordValid = password.trim().length > 0;
  const isValid = isEmailValid && isPasswordValid;

  const onEmailBlur = () => {
    if (email.trim().length > 0 && !emailRegex.test(email.trim())) {
      setEmailError(t("auth.errors.invalidEmail"));
    } else {
      setEmailError(undefined);
    }
  };

  const onPasswordBlur = () => {
    if (password.length > 0 && password.length < 6) {
      setPasswordError(t("auth.errors.passwordMinLength"));
    } else {
      setPasswordError(undefined);
    }
  };

  return (
    <AuthScreenShell contentContainerStyle={styles.screenContent}>
      <AuthBrandHeader variant="hero" />

      <AuthFormCard>
        <Text style={styles.formTitle}>{t("auth.loginTitle")}</Text>

        {apiError ? (
          <View style={styles.errorBanner}>
            <MaterialCommunityIcons name="alert-circle-outline" size={20} color={colors.danger} />
            <Text style={styles.errorBannerText}>{apiError}</Text>
          </View>
        ) : null}

        <View style={styles.formFields}>
          <AppInput
            autoCapitalize="none"
            keyboardType="email-address"
            label={t("auth.email")}
            onChangeText={(val) => {
              setEmail(val);
              setEmailError(undefined);
              setApiError(undefined);
            }}
            onBlur={onEmailBlur}
            placeholder={t("auth.emailPlaceholder")}
            value={email}
            error={emailError}
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
            secureTextEntry={!showPassword}
            value={password}
            error={passwordError}
            rightIcon={
              <Pressable onPress={() => setShowPassword((v) => !v)}>
                <MaterialCommunityIcons
                  color={colors.textMuted}
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                />
              </Pressable>
            }
          />
          <Pressable onPress={() => router.push("/(auth)/forgot-password")} style={styles.forgotRow}>
            <Text style={styles.forgotLink}>{t("auth.forgotPassword")}</Text>
          </Pressable>
          <AppButton
            disabled={!isValid}
            fullWidth
            loading={loading}
            onPress={async () => {
              setLoading(true);
              setApiError(undefined);
              try {
                await login(email.trim(), password);
                const user = useAuthStore.getState().user;
                router.replace(getPostAuthRoute(user));
              } catch (error: any) {
                setApiError(getLoginErrorMessage(error, t));
              } finally {
                setLoading(false);
              }
            }}
            title={t("auth.login")}
          />
        </View>
      </AuthFormCard>

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>{t("common.or")}</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.socialRow}>
        <Pressable style={styles.socialBtn} onPress={() => handleSocialLogin("GOOGLE")}>
          <MaterialCommunityIcons color="#FFFFFF" name="google" size={22} />
        </Pressable>
        <Pressable style={styles.socialBtn} onPress={() => handleSocialLogin("APPLE")}>
          <MaterialCommunityIcons color="#FFFFFF" name="apple" size={22} />
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{t("auth.noAccount")} </Text>
        <Pressable onPress={() => router.push("/(auth)/register")}>
          <Text style={styles.footerLink}>{t("auth.register")}</Text>
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
    formFields: {
      gap: spacing.md,
    },
    forgotRow: {
      alignSelf: "flex-end",
    },
    forgotLink: {
      ...typography.bodySmall,
      color: colors.primaryLight,
      fontWeight: "600",
    },
    dividerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      marginVertical: spacing.lg,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: "rgba(255,255,255,0.15)",
    },
    dividerText: {
      ...typography.caption,
      color: "rgba(255,255,255,0.45)",
    },
    socialRow: {
      flexDirection: "row",
      justifyContent: "center",
      gap: spacing.md,
      marginBottom: spacing.xl,
    },
    socialBtn: {
      width: 52,
      height: 52,
      borderRadius: radius.lg,
      backgroundColor: "rgba(255,255,255,0.06)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.12)",
      alignItems: "center",
      justifyContent: "center",
    },
    footer: {
      flexDirection: "row",
      justifyContent: "center",
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

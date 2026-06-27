import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { Pressable, StyleSheet, Text, View, Platform, Alert } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

import { useAuthStore } from "../../../store";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import { getPostAuthRoute } from "../utils/post-auth-route";
import { useTranslation } from "../../../shared/i18n";
import {
  AppButton,
  AppInput,
  AuthBrandHeader,
  AuthFormCard,
  AuthScreenShell,
} from "../../../shared/ui";

const SUBSCRIPTION_BLOCK_CODES = new Set([
  "COMPANY_SUBSCRIPTION_EXPIRED",
  "COMPANY_SUBSCRIPTION_BLOCKED",
  "COMPANY_INACTIVE",
]);

function getLoginErrorMessage(
  error: any,
  t: (key: string, params?: Record<string, string | number>) => string,
) {
  const code = error?.response?.data?.code;
  if ((code && SUBSCRIPTION_BLOCK_CODES.has(code)) || error?.response?.status === 403) {
    return t("auth.errors.subscriptionRenewRequired");
  }
  return error?.response?.data?.message || t("auth.errors.invalidCredentials");
}

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

  useEffect(() => {
    if (Platform.OS !== "web") {
      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "",
      });
    }
  }, []);

  const handleAppleLogin = async () => {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.alert) {
        window.alert(t("auth.social.appleMobileOnly"));
      } else {
        Alert.alert(t("common.info"), t("auth.social.appleMobileOnly"));
      }
      return;
    }
    try {
      setLoading(true);
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(t("common.info"), t("auth.social.appleMobileOnly"));
        return;
      }
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (credential.identityToken) {
        await useAuthStore.getState().socialLogin("APPLE", credential.identityToken);
        const user = useAuthStore.getState().user;
        router.replace(getPostAuthRoute(user));
      }
    } catch (e: any) {
      if (e.code !== "ERR_REQUEST_CANCELED") {
        console.error(e);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.alert) {
        window.alert(t("auth.social.googleMobileOnly"));
      } else {
        Alert.alert(t("common.info"), t("auth.social.googleMobileOnly"));
      }
      return;
    }
    try {
      setLoading(true);
      await GoogleSignin.hasPlayServices();
      // Önceki Google oturumunu temizle ki her girişte hesap seçtirsin
      try {
        await GoogleSignin.signOut();
      } catch {
        // oturum yoksa sorun değil
      }
      const userInfo: any = await GoogleSignin.signIn();
      const idToken = userInfo?.data?.idToken || userInfo?.idToken;
      if (idToken) {
        await useAuthStore.getState().socialLogin("GOOGLE", idToken);
        const user = useAuthStore.getState().user;
        router.replace(getPostAuthRoute(user));
      } else {
        // idToken yok: genelde EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID boş/yanlış demektir
        Alert.alert(
          t("common.error"),
          `Google idToken alınamadı. Web Client ID eksik olabilir.\nwebClientId: "${process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "(boş)"}"`,
        );
      }
    } catch (e: any) {
      // SIGN_IN_CANCELLED kodunu yutuyoruz; diğer her hatayı görünür kılıyoruz
      if (e?.code !== "SIGN_IN_CANCELLED" && e?.code !== "-5") {
        console.error(e);
        Alert.alert(
          t("common.error"),
          `Google giriş hatası\ncode: ${e?.code ?? "?"}\nmessage: ${e?.message ?? String(e)}`,
        );
      }
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
        <Pressable style={styles.socialBtn} onPress={handleGoogleLogin}>
          <MaterialCommunityIcons color="#FFFFFF" name="google" size={22} />
        </Pressable>
        <Pressable style={styles.socialBtn} onPress={handleAppleLogin}>
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

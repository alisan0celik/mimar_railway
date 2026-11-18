import { Platform } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

import { showAppAlert } from "../../../shared/ui";
import { useAuthStore } from "../../../store/authStore";
import { getLoginErrorMessage, isApiError } from "./auth-errors";

type Translate = (key: string, params?: Record<string, string | number>) => string;
export type SocialProvider = "GOOGLE" | "APPLE";

function alertMobileOnly(title: string, message: string) {
  if (typeof window !== "undefined" && window.alert) {
    window.alert(message);
    return;
  }
  showAppAlert(title, message);
}

/**
 * Google veya Apple hesabıyla oturum açar. Hesap yoksa sunucu onu oluşturur.
 * Kullanıcı pencereyi kapatırsa false döner ve uyarı göstermez.
 */
export async function signInWithSocial(provider: SocialProvider, t: Translate): Promise<boolean> {
  if (provider === "APPLE") return signInWithApple(t);
  return signInWithGoogle(t);
}

async function signInWithApple(t: Translate): Promise<boolean> {
  if (Platform.OS === "web") {
    alertMobileOnly(t("common.info"), t("auth.social.appleMobileOnly"));
    return false;
  }
  try {
    const isAvailable = await AppleAuthentication.isAvailableAsync();
    if (!isAvailable) {
      showAppAlert(t("common.info"), t("auth.social.appleMobileOnly"));
      return false;
    }
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken) return false;
    await useAuthStore.getState().socialLogin("APPLE", credential.identityToken);
    return true;
  } catch (e: any) {
    if (e?.code === "ERR_REQUEST_CANCELED") return false;
    if (isApiError(e)) {
      showAppAlert(t("common.error"), getLoginErrorMessage(e, t));
      return false;
    }
    console.error(e);
    showAppAlert(t("common.error"), e?.message || t("auth.errors.socialLoginFailed"));
    return false;
  }
}

async function signInWithGoogle(t: Translate): Promise<boolean> {
  if (Platform.OS === "web") {
    alertMobileOnly(t("common.info"), t("auth.social.googleMobileOnly"));
    return false;
  }
  try {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "",
    });
    await GoogleSignin.hasPlayServices();
    const userInfo: any = await GoogleSignin.signIn();
    let idToken = userInfo?.data?.idToken || userInfo?.idToken;
    if (!idToken && userInfo?.type !== "cancelled") {
      // iOS'ta ilk denemede signIn bazen idToken döndürmüyor; getTokens ile telafi et
      try {
        const tokens: any = await GoogleSignin.getTokens();
        idToken = tokens?.idToken || null;
      } catch {
        // getTokens da başarısızsa aşağıdaki uyarı gösterilecek
      }
    }
    if (idToken) {
      await useAuthStore.getState().socialLogin("GOOGLE", idToken);
      return true;
    }
    if (userInfo?.type !== "cancelled") {
      // idToken yok: genelde EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID boş/yanlış demektir
      showAppAlert(
        t("common.error"),
        `Google idToken alınamadı. Web Client ID eksik olabilir.\nwebClientId: "${process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "(boş)"}"`,
      );
    }
    return false;
  } catch (e: any) {
    if (e?.code === "SIGN_IN_CANCELLED" || e?.code === "-5") return false;
    if (isApiError(e)) {
      showAppAlert(t("common.error"), getLoginErrorMessage(e, t));
      return false;
    }
    console.error(e);
    showAppAlert(
      t("common.error"),
      `Google giriş hatası\ncode: ${e?.code ?? "?"}\nmessage: ${e?.message ?? String(e)}`,
    );
    return false;
  }
}

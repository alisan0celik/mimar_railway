import { create } from "zustand";
import { AppState, Platform } from "react-native";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { AuthService } from "../services/auth/auth.service";
import { NotificationService } from "../services/notification/notification.service";
import {
  clearTokens,
  getTokens,
  isTokenStorageUnavailable,
  setTokens,
  type SessionTokens,
} from "../services/auth/token-storage";
import { saveUserProfile, getUserProfile, clearUserProfile } from "../services/auth/user-cache";
import { markOnboardingSeen } from "../services/auth/onboarding-storage";
import { clearOfflineDatabase } from "../offline/db/database";
import { clearSyncMetadata } from "../offline/sync/sync-metadata";
import { hydrateNotificationPrefs } from "./notification-prefs";
import { tKey } from "../shared/i18n";
import type { UserDTO } from "@mimar/shared";

/** Anahtarlık o an okunamazsa kısa aralıklarla yeniden denenir. */
const TOKEN_READ_RETRY_DELAYS_MS = [400, 1200];

async function readTokensWithRetry(): Promise<SessionTokens | null> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await getTokens();
    } catch (error) {
      const delay = TOKEN_READ_RETRY_DELAYS_MS[attempt];
      if (!isTokenStorageUnavailable(error) || delay === undefined) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

async function persistAuthenticatedUser(user: UserDTO) {
  await saveUserProfile(user);
  await markOnboardingSeen();
  hydrateNotificationPrefs((user as UserDTO & { notificationPreferences?: unknown }).notificationPreferences);
}

type AuthState = {
  user: UserDTO | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; fullName: string }) => Promise<UserDTO | undefined>;
  socialLogin: (provider: "GOOGLE" | "APPLE" | "MICROSOFT", idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
  setUser: (user: UserDTO) => void;
  completeAuthSession: (user: UserDTO, accessToken: string, refreshToken: string) => Promise<void>;
  clearError: () => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (email: string, password: string) => {
    try {
      set({ error: null });
      const user = await AuthService.login(email, password);
      await persistAuthenticatedUser(user);
      set({ user, isAuthenticated: true });
    } catch (error: any) {
      const message = error?.response?.data?.message || tKey("auth.errors.loginFailed");
      set({ error: message });
      throw error;
    }
  },

  register: async (data) => {
    try {
      set({ error: null });
      const user = await AuthService.register(data);
      await persistAuthenticatedUser(user);
      set({ user, isAuthenticated: true });
      return user;
    } catch (error: any) {
      const message = error?.response?.data?.message || tKey("auth.errors.registerFailed");
      set({ error: message });
      throw error;
    }
  },

  socialLogin: async (provider, idToken) => {
    try {
      set({ error: null });
      const user = await AuthService.socialLogin(provider, idToken);
      await persistAuthenticatedUser(user);
      set({ user, isAuthenticated: true });
    } catch (error: any) {
      const message = error?.response?.data?.message || tKey("auth.errors.socialLoginFailed");
      set({ error: message });
      throw error;
    }
  },

  logout: async () => {
    try {
      await NotificationService.unregisterPushToken();
      await AuthService.logout();
    } finally {
      // AuthService.logout token'ları siliyor, ama bir hata yüzünden o adım
      // atlanırsa oturum bir sonraki açılışta geri gelirdi. Silme tekrar
      // çağrılabilir; ikinci kez çalışmasının zararı yok.
      await clearTokens().catch(() => undefined);
      // Google oturumunu da kapat ki SADECE çıkıştan sonra tekrar giriş yaparken hesap seçtirsin
      if (Platform.OS !== "web") {
        try {
          GoogleSignin.configure({ webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "" });
          await GoogleSignin.signOut();
        } catch {
          // Google oturumu yoksa / yapılandırılmadıysa sorun değil
        }
      }
      await clearUserProfile();
      await clearSyncMetadata();
      await clearOfflineDatabase();
      set({ user: null, isAuthenticated: false, isLoading: false, error: null });
    }
  },

  hydrate: async () => {
    let tokens: SessionTokens | null;
    try {
      tokens = await readTokensWithRetry();
    } catch (error) {
      if (isTokenStorageUnavailable(error) && AppState.currentState !== "active") {
        // iOS uygulamayı kullanıcı açmadan arka planda başlattı ve anahtarlık
        // henüz okunamıyor. Giriş ekranına düşürmek yerine uygulama öne
        // geldiğinde yeniden dene; token'lar yerinde duruyor.
        const subscription = AppState.addEventListener("change", (state) => {
          if (state !== "active") return;
          subscription.remove();
          void get().hydrate();
        });
        return;
      }
      // Uygulama öndeyken bile okunamıyorsa beklemenin anlamı yok. Giriş
      // ekranı gösterilir ama token'lar silinmez; bir sonraki açılış kurtarır.
      set({ isLoading: false });
      return;
    }

    try {
      if (!tokens?.accessToken) {
        set({ isLoading: false });
        return;
      }

      const cachedUser = await getUserProfile();
      if (cachedUser) {
        hydrateNotificationPrefs(
          (cachedUser as UserDTO & { notificationPreferences?: unknown }).notificationPreferences,
        );
        set({ user: cachedUser, isAuthenticated: true, isLoading: false });
      }

      try {
        const user = await AuthService.getProfile();
        await saveUserProfile(user);
        hydrateNotificationPrefs((user as UserDTO & { notificationPreferences?: unknown }).notificationPreferences);
        set({ user, isAuthenticated: true, isLoading: false });
        if (user.companyId) {
          const { runSync } = await import("../offline/sync/sync-engine");
          void runSync();
        }
      } catch {
        // Sunucu oturumu reddettiyse API katmanı çıkışı zaten yaptı. Buraya bir
        // ağ hatasıyla gelindiyse token'ları silmek oturumu boşuna düşürürdü:
        // önbellekte kullanıcı yoksa giriş ekranı gösterilir ama token'lar
        // yerinde kalır, bağlantı gelince bir sonraki açılış oturumu yükler.
        if (!cachedUser) {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      }
    } catch {
      set({ isLoading: false });
    }
  },

  setUser: (user) => {
    void saveUserProfile(user);
    hydrateNotificationPrefs((user as UserDTO & { notificationPreferences?: unknown }).notificationPreferences);
    set({ user, isAuthenticated: true });
  },

  completeAuthSession: async (user, accessToken, refreshToken) => {
    await setTokens(accessToken, refreshToken);
    await persistAuthenticatedUser(user);
    set({ user, isAuthenticated: true, isLoading: false, error: null });
    if (user.companyId) {
      const { runSync } = await import("../offline/sync/sync-engine");
      void runSync();
    }
  },

  clearError: () => set({ error: null }),
}));

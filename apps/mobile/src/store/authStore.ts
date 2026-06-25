import { create } from "zustand";
import { AuthService } from "../services/auth/auth.service";
import { NotificationService } from "../services/notification/notification.service";
import { getTokens, clearTokens, setTokens } from "../services/auth/token-storage";
import { saveUserProfile, getUserProfile, clearUserProfile } from "../services/auth/user-cache";
import { markOnboardingSeen } from "../services/auth/onboarding-storage";
import { clearOfflineDatabase } from "../offline/db/database";
import { clearSyncMetadata } from "../offline/sync/sync-metadata";
import { hydrateNotificationPrefs } from "./notification-prefs";
import { tKey } from "../shared/i18n";
import type { UserDTO } from "@mimar/shared";

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
      await clearUserProfile();
      await clearSyncMetadata();
      await clearOfflineDatabase();
      set({ user: null, isAuthenticated: false, isLoading: false, error: null });
    }
  },

  hydrate: async () => {
    try {
      const tokens = await getTokens();
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
        if (!cachedUser) {
          await clearTokens();
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

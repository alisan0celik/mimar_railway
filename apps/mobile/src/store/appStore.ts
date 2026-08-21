import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

import { isThemeMode, type ThemeMode } from "../shared/theme/colors";

const THEME_STORAGE_KEY = "app:themeMode";
const LANGUAGE_STORAGE_KEY = "app:language";

type Language = "tr" | "en";

type AppState = {
  themeMode: ThemeMode;
  language: Language;
  notificationPrefs: {
    projects: boolean;
    finance: boolean;
    system: boolean;
  };
  setThemeMode: (mode: ThemeMode) => void;
  setLanguage: (lang: Language) => void;
  setNotificationPref: (
    key: keyof AppState["notificationPrefs"],
    value: boolean,
  ) => void;
};

export const useAppStore = create<AppState>((set) => ({
  themeMode: "dark",
  language: "tr",
  notificationPrefs: {
    projects: true,
    finance: true,
    system: true,
  },
  setThemeMode: (themeMode) => {
    set({ themeMode });
    void AsyncStorage.setItem(THEME_STORAGE_KEY, themeMode);
  },
  setLanguage: (language) => {
    set({ language });
    void AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  },
  setNotificationPref: (key, value) =>
    set((state) => ({
      notificationPrefs: { ...state.notificationPrefs, [key]: value },
    })),
}));

/**
 * Tema ve dil tercihini diskten okur.
 *
 * Bu tercihler daha önce hiç saklanmıyordu; uygulama her açılışta koyu tema
 * ve Türkçe'ye dönüyordu. Açılışta bir kez çağrılır.
 */
export async function hydrateAppPreferences(): Promise<void> {
  try {
    const [storedTheme, storedLanguage] = await AsyncStorage.multiGet([
      THEME_STORAGE_KEY,
      LANGUAGE_STORAGE_KEY,
    ]);

    const themeMode = storedTheme[1];
    if (isThemeMode(themeMode)) {
      useAppStore.setState({ themeMode });
    }

    const language = storedLanguage[1];
    if (language === "tr" || language === "en") {
      useAppStore.setState({ language });
    }
  } catch {
    // Tercih okunamazsa varsayılanlarla devam et
  }
}

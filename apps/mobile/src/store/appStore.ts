import { create } from "zustand";

type AppState = {
  themeMode: "dark" | "light";
  language: "tr" | "en";
  notificationPrefs: {
    projects: boolean;
    finance: boolean;
    system: boolean;
  };
  setThemeMode: (mode: "dark" | "light") => void;
  setLanguage: (lang: "tr" | "en") => void;
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
  setThemeMode: (themeMode) => set({ themeMode }),
  setLanguage: (language) => set({ language }),
  setNotificationPref: (key, value) =>
    set((state) => ({
      notificationPrefs: { ...state.notificationPrefs, [key]: value },
    })),
}));

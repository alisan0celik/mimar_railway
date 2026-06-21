import { useAppStore } from "./appStore";

type NotificationPrefs = {
  projects?: boolean;
  finance?: boolean;
  system?: boolean;
};

export function hydrateNotificationPrefs(prefs: unknown) {
  if (!prefs || typeof prefs !== "object") return;

  const record = prefs as NotificationPrefs;

  useAppStore.setState({
    notificationPrefs: {
      projects: record.projects ?? true,
      finance: record.finance ?? true,
      system: record.system ?? true,
    },
  });
}

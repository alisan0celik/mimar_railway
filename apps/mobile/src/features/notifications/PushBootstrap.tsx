import { useEffect } from "react";
import { AppState } from "react-native";

import { useNotifications } from "../../hooks/useNotifications";
import { NotificationService } from "../../services/notification/notification.service";
import { useAuthStore } from "../../store/authStore";
import { PERMISSIONS } from "../../shared/permissions";

function userHasPermission(permissions: string[] | undefined, code: string): boolean {
  return Boolean(permissions?.includes(code));
}

export function PushBootstrap() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const canLoadNotificationList = userHasPermission(user?.permissions, PERMISSIONS.NOTIFICATION_VIEW);

  useNotifications({ loadList: canLoadNotificationList });

  useEffect(() => {
    if (!isAuthenticated) return;

    void NotificationService.registerForPushNotificationsAsync();

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void NotificationService.registerForPushNotificationsAsync();
      }
    });

    return () => subscription.remove();
  }, [isAuthenticated, user?.id]);

  return null;
}

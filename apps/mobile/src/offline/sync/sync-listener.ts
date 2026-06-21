import * as Notifications from "expo-notifications";
import { triggerSyncFromNotification } from "./sync-engine";

let initialized = false;

export function initSyncNotificationListener(): void {
  if (initialized) return;
  initialized = true;

  Notifications.addNotificationReceivedListener((notification) => {
    const data = notification.request.content.data;
    if (data?.type === "sync_required") {
      triggerSyncFromNotification();
    }
  });

  Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    if (data?.type === "sync_required") {
      triggerSyncFromNotification();
    }
  });
}

import * as Notifications from "expo-notifications";
import { socketService } from "../../services/websocket/socket.service";
import { triggerSyncFromNotification } from "./sync-engine";

let initialized = false;

export function initSyncNotificationListener(): void {
  if (initialized) return;
  initialized = true;

  // Başka bir üye çevrimdışı değişikliklerini gönderdiğinde sunucu bu
  // sinyali WebSocket'ten yolluyor; görünür bir bildirim çıkmıyor. Dinleyici
  // soket servisinde kayıtlı kaldığı için yeniden bağlanmalarda da çalışıyor.
  socketService.on("sync_required", () => {
    triggerSyncFromNotification();
  });

  // Sunucu bu sinyali eskiden push bildirimiyle gönderiyordu; o yoldan
  // gelen bir bildirim de aynı şekilde senkron başlatsın.
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

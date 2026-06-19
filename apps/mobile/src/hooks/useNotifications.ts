import { useEffect } from "react";
import { useNotificationStore } from "../store/notificationStore";
import { socketService } from "../services/websocket/socket.service";
import { NotificationService } from "../services/notification/notification.service";
import {
  handleNotificationData,
  isMembershipNotification,
  type NotificationDataPayload,
} from "../services/notification/notification-router";
import { useAuthStore } from "../store/authStore";

type UseNotificationsOptions = {
  loadList?: boolean;
};

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { loadList = true } = options;
  const { notifications, unreadCount, isLoading, loadNotifications, markAsRead, markAllAsRead, addNotification } =
    useNotificationStore();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (loadList) {
      loadNotifications();
    }
  }, [loadList]);

  useEffect(() => {
    if (!user) return;

    void socketService.connect(user.id);

    const onNotification = (notification: unknown) => {
      const payload = notification as NotificationDataPayload & {
        id?: string;
        title?: string;
        message?: string;
        type?: string;
        targetType?: string;
        targetId?: string | null;
        action?: string;
        route?: string;
        createdAt?: string;
      };

      if (isMembershipNotification(payload)) {
        void handleNotificationData(payload);
      }

      if (payload.id && payload.title) {
        addNotification({
          id: payload.id,
          userId: user.id,
          title: payload.title,
          message: payload.message ?? "",
          type: (payload.type as "info" | "success" | "warning" | "danger") || "info",
          targetType: payload.targetType ?? "",
          targetId: payload.targetId ?? null,
          isRead: false,
          createdAt: payload.createdAt ?? new Date().toISOString(),
        });
      }
    };

    const onUnreadCount = (data: unknown) => {
      const payload = data as { count: number };
      useNotificationStore.getState().setUnreadCount(payload.count);
    };

    socketService.on("notification", onNotification);
    socketService.on("unread_count", onUnreadCount);

    return () => {
      socketService.off("notification", onNotification);
      socketService.off("unread_count", onUnreadCount);
      socketService.disconnect();
    };
  }, [user?.id]);

  useEffect(() => {
    const subscription = NotificationService.addNotificationReceivedListener(
      (notification) => {
        const data = notification.request.content.data as NotificationDataPayload | undefined;
        if (data) {
          if (isMembershipNotification(data)) {
            void handleNotificationData(data);
          }

          addNotification({
            id: (data.id as string) || String(Date.now()),
            userId: user?.id || "",
            title: (data.title as string) || notification.request.content.title || "",
            message: (data.message as string) || notification.request.content.body || "",
            type: (data.type as "info" | "success" | "warning" | "danger") || "info",
            targetType: (data.targetType as string) || "",
            targetId: (data.targetId as string) || null,
            isRead: false,
            createdAt: new Date().toISOString(),
          });
        }
      },
    );

    return () => subscription.remove();
  }, [user?.id]);

  return {
    notifications,
    unreadCount,
    isLoading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
  };
}

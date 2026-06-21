import { create } from "zustand";
import { tKey } from "../shared/i18n";
import { notificationsApi } from "../services/api/notifications.api";

type Notification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "danger";
  targetType: string;
  targetId: string | null;
  isRead: boolean;
  createdAt: string;
};

type NotificationState = {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  loadNotifications: (page?: number) => Promise<void>;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  setUnreadCount: (count: number) => void;
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  loadNotifications: async (page = 1) => {
    try {
      set({ isLoading: true, error: null });
      const response = await notificationsApi.getAll({ page });
      const { data, meta } = response.data;
      set({
        notifications: page === 1 ? data : [...get().notifications, ...data],
        unreadCount: meta.unreadCount,
        isLoading: false,
      });
    } catch (error: any) {
      const message = error?.response?.data?.message || tKey("notifications.errors.loadFailed");
      set({ error: message, isLoading: false });
    }
  },

  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  markAsRead: async (id) => {
    try {
      await notificationsApi.markAsRead(id);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n,
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error: any) {
      set({ error: error?.response?.data?.message || tKey("notifications.errors.markReadFailed") });
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationsApi.markAllAsRead();
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
        error: null,
      }));
    } catch (error: any) {
      set({ error: error?.response?.data?.message || tKey("notifications.errors.actionFailed") });
    }
  },

  setUnreadCount: (count) => set({ unreadCount: count }),
}));

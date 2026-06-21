import { apiClient } from "./client";

export const notificationsApi = {
  getAll: (params?: { page?: number; limit?: number }) =>
    apiClient.get("/notifications", { params }),

  markAsRead: (id: string) =>
    apiClient.patch(`/notifications/${id}/read`),

  markAllAsRead: () =>
    apiClient.patch("/notifications/read-all"),

  registerDeviceToken: (token: string, platform: string) =>
    apiClient.post("/notifications/device-token", { token, platform }),

  removeDeviceToken: (token: string) =>
    apiClient.delete("/notifications/device-token", { data: { token } }),
};

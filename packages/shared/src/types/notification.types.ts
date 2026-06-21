import { NotificationType } from "../enums";

export interface NotificationDTO {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  targetType: string;
  targetId: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface DeviceTokenInput {
  token: string;
  platform: "ios" | "android";
}

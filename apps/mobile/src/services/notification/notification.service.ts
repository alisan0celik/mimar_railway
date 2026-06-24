import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

import { useAppStore } from "../../store/appStore";
import { notificationsApi } from "../api/notifications.api";
import {
  handleNotificationData,
  isMembershipNotification,
  type NotificationDataPayload,
} from "./notification-router";

export const FCM_CHANNEL_MEMBERSHIP = "membership";

let lastRegisteredToken: string | null = null;
let routerInitialized = false;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function ensureAndroidChannels(language: "tr" | "en") {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync(FCM_CHANNEL_MEMBERSHIP, {
    name: language === "en" ? "Membership notifications" : "Üyelik Bildirimleri",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#7C3AED",
  });
}

export class NotificationService {
  static getLastRegisteredToken(): string | null {
    return lastRegisteredToken;
  }

  static async registerForPushNotificationsAsync(): Promise<string | null> {
    if (!Device.isDevice) {
      return null;
    }

    const language = useAppStore.getState().language;
    await ensureAndroidChannels(language);

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      return null;
    }

    try {
      const tokenData = await Notifications.getDevicePushTokenAsync();
      const token = tokenData.data;
      const platform = Platform.OS === "ios" ? "ios" : "android";

      await notificationsApi.registerDeviceToken(token, platform);
      lastRegisteredToken = token;

      return token;
    } catch {
      return null;
    }
  }

  static async unregisterPushToken(): Promise<void> {
    if (!lastRegisteredToken) return;

    try {
      await notificationsApi.removeDeviceToken(lastRegisteredToken);
    } catch {
      // ignore cleanup errors
    } finally {
      lastRegisteredToken = null;
    }
  }

  static addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void,
  ): Notifications.EventSubscription {
    return Notifications.addNotificationReceivedListener(callback);
  }

  static addNotificationResponseReceivedListener(
    callback: (response: Notifications.NotificationResponse) => void,
  ): Notifications.EventSubscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  static async getBadgeCount(): Promise<number> {
    return Notifications.getBadgeCountAsync();
  }

  static async setBadgeCount(count: number) {
    await Notifications.setBadgeCountAsync(count);
  }
}

export function initNotificationRouter(): void {
  if (routerInitialized) return;
  routerInitialized = true;

  NotificationService.addNotificationReceivedListener((notification) => {
    const data = notification.request.content.data as NotificationDataPayload | undefined;
    if (data && isMembershipNotification(data)) {
      void handleNotificationData(data);
    }
  });

  NotificationService.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as NotificationDataPayload | undefined;
    if (data) {
      void handleNotificationData(data);
    }
  });
}

import { Injectable, Logger } from "@nestjs/common";
import { FirebaseConfig } from "../../config/firebase.config";
import { FCM_CHANNEL_MEMBERSHIP } from "./notification-events.constants";

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  channelId?: string;
}

export interface FcmSendResult {
  invalidTokens: string[];
}

@Injectable()
export class FcmService {
  private readonly logger = new Logger(FcmService.name);

  constructor(private readonly firebaseConfig: FirebaseConfig) {}

  private buildMessage(token: string, payload: PushNotificationPayload) {
    const channelId =
      payload.channelId ??
      (payload.data?.targetType === "membership" ? FCM_CHANNEL_MEMBERSHIP : undefined);

    return {
      token,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data ?? {},
      android: channelId
        ? {
            priority: "high" as const,
            notification: { channelId },
          }
        : { priority: "high" as const },
      apns: {
        payload: {
          aps: {
            sound: "default",
            contentAvailable: true,
          },
        },
      },
    };
  }

  private isInvalidTokenError(code?: string): boolean {
    return (
      code === "messaging/registration-token-not-registered" ||
      code === "messaging/invalid-registration-token"
    );
  }

  async sendToDevice(token: string, payload: PushNotificationPayload): Promise<FcmSendResult> {
    const messaging = this.firebaseConfig.messaging;

    if (!messaging) {
      this.logger.warn("Firebase not initialized, skipping push notification");
      return { invalidTokens: [] };
    }

    try {
      await messaging.send(this.buildMessage(token, payload));
      return { invalidTokens: [] };
    } catch (error: any) {
      if (this.isInvalidTokenError(error.code)) {
        this.logger.warn(`Device token not registered: ${token.substring(0, 20)}...`);
        return { invalidTokens: [token] };
      }
      this.logger.error(`FCM send failed: ${error.message}`);
      return { invalidTokens: [] };
    }
  }

  async sendToMultipleDevices(
    tokens: string[],
    payload: PushNotificationPayload,
  ): Promise<FcmSendResult> {
    const messaging = this.firebaseConfig.messaging;

    if (!messaging) {
      this.logger.warn("Firebase not initialized, skipping push notifications");
      return { invalidTokens: [] };
    }

    if (tokens.length === 0) return { invalidTokens: [] };

    const invalidTokens: string[] = [];

    try {
      if (tokens.length === 1) {
        const result = await this.sendToDevice(tokens[0], payload);
        invalidTokens.push(...result.invalidTokens);
        return { invalidTokens };
      }

      const messages = tokens.map((token) => this.buildMessage(token, payload));
      const response = await messaging.sendEach(messages);
      this.logger.log(
        `FCM: ${response.successCount} sent, ${response.failureCount} failed`,
      );

      response.responses.forEach((res, index) => {
        if (res.success) return;
        const code = (res.error as { code?: string } | undefined)?.code;
        if (this.isInvalidTokenError(code)) {
          invalidTokens.push(tokens[index]);
        }
      });
    } catch (error: any) {
      this.logger.error(`FCM bulk send failed: ${error.message}`);
    }

    return { invalidTokens };
  }
}

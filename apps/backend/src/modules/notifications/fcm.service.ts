import { Injectable, Logger } from "@nestjs/common";
import { FirebaseConfig } from "../../config/firebase.config";
import { FCM_CHANNEL_DEFAULT, FCM_CHANNEL_MEMBERSHIP } from "./notification-events.constants";

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  channelId?: string;
}

export interface FcmSendResult {
  invalidTokens: string[];
}

const IID_BATCH_IMPORT_URL = "https://iid.googleapis.com/iid/v1:batchImport";
const IOS_BUNDLE_ID = process.env.IOS_BUNDLE_ID || "com.mimar.app";

@Injectable()
export class FcmService {
  private readonly logger = new Logger(FcmService.name);

  // iOS'ta Expo, FCM token'ı değil ham APNs token'ı verir; FCM'e göndermeden önce
  // Instance ID batchImport ile FCM kayıt token'ına çevrilir ve burada cache'lenir.
  private readonly apnsToFcmCache = new Map<string, string>();

  constructor(private readonly firebaseConfig: FirebaseConfig) {}

  private buildMessage(token: string, payload: PushNotificationPayload) {
    const channelId =
      payload.channelId ??
      (payload.data?.targetType === "membership" ? FCM_CHANNEL_MEMBERSHIP : FCM_CHANNEL_DEFAULT);

    return {
      token,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data ?? {},
      android: {
        priority: "high" as const,
        notification: { channelId },
      },
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

  private isLikelyApnsToken(token: string): boolean {
    return !token.includes(":") && /^[0-9a-fA-F]{64,200}$/.test(token);
  }

  /** Ham APNs token'ını FCM kayıt token'ına çevirir; FCM token'ları olduğu gibi döner. */
  private async resolveSendableToken(token: string): Promise<string | null> {
    if (!this.isLikelyApnsToken(token)) return token;

    const cached = this.apnsToFcmCache.get(token);
    if (cached) return cached;

    const accessToken = await this.firebaseConfig.getAccessToken();
    if (!accessToken) {
      this.logger.warn("No Google access token; cannot convert APNs token");
      return null;
    }

    // TestFlight/App Store production APNs kullanır; development build'ler sandbox.
    for (const sandbox of [false, true]) {
      try {
        const response = await (globalThis as any).fetch(IID_BATCH_IMPORT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            access_token_auth: "true",
          },
          body: JSON.stringify({
            application: IOS_BUNDLE_ID,
            sandbox,
            apns_tokens: [token],
          }),
        });

        if (!response.ok) {
          this.logger.warn(
            `APNs batchImport HTTP ${response.status} (sandbox=${sandbox})`,
          );
          continue;
        }

        const data = await response.json();
        const result = data?.results?.[0];
        if (result?.status === "OK" && result.registration_token) {
          this.apnsToFcmCache.set(token, result.registration_token);
          this.logger.log(
            `APNs token converted to FCM (${token.substring(0, 8)}..., sandbox=${sandbox})`,
          );
          return result.registration_token;
        }
        this.logger.warn(
          `APNs batchImport status=${result?.status ?? "?"} (sandbox=${sandbox})`,
        );
      } catch (error: any) {
        this.logger.warn(`APNs->FCM conversion failed: ${error.message}`);
      }
    }

    this.logger.warn(`APNs token could not be converted: ${token.substring(0, 12)}...`);
    return null;
  }

  async sendToDevice(token: string, payload: PushNotificationPayload): Promise<FcmSendResult> {
    const messaging = this.firebaseConfig.messaging;

    if (!messaging) {
      this.logger.warn("Firebase not initialized, skipping push notification");
      return { invalidTokens: [] };
    }

    const sendable = await this.resolveSendableToken(token);
    if (!sendable) return { invalidTokens: [] };

    try {
      await messaging.send(this.buildMessage(sendable, payload));
      this.logger.log(`FCM sent (${token.substring(0, 8)}...)`);
      return { invalidTokens: [] };
    } catch (error: any) {
      if (this.isInvalidTokenError(error.code)) {
        this.logger.warn(`Device token not registered: ${token.substring(0, 20)}...`);
        this.apnsToFcmCache.delete(token);
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

      // Orijinal token -> gönderilebilir (FCM) token eşlemesi; hata durumunda
      // temizlik için invalidTokens'a DB'deki orijinal token yazılır.
      const resolved: Array<{ original: string; sendable: string }> = [];
      for (const token of tokens) {
        const sendable = await this.resolveSendableToken(token);
        if (sendable) resolved.push({ original: token, sendable });
      }
      if (resolved.length === 0) return { invalidTokens };

      const messages = resolved.map((entry) => this.buildMessage(entry.sendable, payload));
      const response = await messaging.sendEach(messages);
      this.logger.log(
        `FCM: ${response.successCount} sent, ${response.failureCount} failed`,
      );

      response.responses.forEach((res, index) => {
        if (res.success) return;
        const code = (res.error as { code?: string } | undefined)?.code;
        if (this.isInvalidTokenError(code)) {
          const original = resolved[index].original;
          this.apnsToFcmCache.delete(original);
          invalidTokens.push(original);
        }
      });
    } catch (error: any) {
      this.logger.error(`FCM bulk send failed: ${error.message}`);
    }

    return { invalidTokens };
  }
}

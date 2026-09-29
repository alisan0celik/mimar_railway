import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createPrivateKey, sign, type KeyObject } from "node:crypto";
import { connect, constants, type ClientHttp2Session } from "node:http2";

/**
 * iOS bildirimlerini FCM'e uğramadan doğrudan Apple'a (APNs) gönderir.
 *
 * Uygulama iOS'ta FCM token'ı değil ham APNs token'ı kaydediyor. Bu token'lar
 * şimdiye kadar Firebase'in InstanceId `batchImport` API'siyle FCM token'ına
 * çevrilip FCM'e veriliyordu; Firebase o API'yi 29 Eylül 2027'de kapatıyor.
 * Doğrudan gönderim uygulamada değişiklik gerektirmiyor, bu yüzden eski
 * sürümleri kullananlara da bildirim gitmeye devam ediyor.
 *
 * Anahtar yoksa (ortam değişkenleri tanımlı değilse) servis kapalı kalır ve
 * FcmService eski dönüştürme yolunu kullanır; anahtar sunucuya konmadan
 * yapılan bir yayın bildirimleri kesmez.
 */

const HOSTS = {
  production: "https://api.push.apple.com",
  sandbox: "https://api.sandbox.push.apple.com",
} as const;

type ApnsEnvironment = keyof typeof HOSTS;

/**
 * Apple sağlayıcı token'ını en fazla 60 dakika kabul ediyor, 20 dakikadan
 * sık yenilemeyi de reddediyor (TooManyProviderTokenUpdates).
 */
const PROVIDER_TOKEN_TTL_MS = 50 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 10_000;

export type ApnsSendResult = "sent" | "invalid-token" | "failed";

export interface ApnsMessage {
  title: string;
  body: string;
  data?: Record<string, string>;
}

/**
 * Apple'a giden bildirim gövdesi.
 *
 * Veri iki yerde duruyor: expo-notifications iOS'ta uzak bildirimin verisini
 * yalnızca `body` anahtarından okuyor (`content.data`). FCM veriyi en üst
 * seviyeye koyduğu için iOS'ta bildirime dokunmak uygulamayı ilgili ekrana
 * götürmüyordu. En üst seviyedeki kopya, veriyi o yerde bekleyen başka
 * okuyucular için korunuyor.
 */
export function buildApnsPayload({ title, body, data = {} }: ApnsMessage) {
  return {
    ...data,
    aps: {
      alert: { title, body },
      sound: "default",
      // FCM yolunda da açıktı; uygulama bildirim gelince eşitleme başlatıyor.
      "content-available": 1,
    },
    body: data,
  };
}

@Injectable()
export class ApnsService implements OnModuleDestroy {
  private readonly logger = new Logger(ApnsService.name);

  private readonly keyId?: string;
  private readonly teamId?: string;
  private readonly bundleId: string;
  private readonly key?: KeyObject;

  private providerToken: { value: string; issuedAt: number } | null = null;
  private readonly sessions = new Map<ApnsEnvironment, ClientHttp2Session>();

  /**
   * Token'ın kabul edildiği ortam. TestFlight ve App Store production,
   * geliştirme build'leri sandbox kullanıyor; ilk gönderimde ikisi de
   * denenir, sonra doğru olan hatırlanır.
   */
  private readonly tokenEnvironment = new Map<string, ApnsEnvironment>();

  constructor(configService: ConfigService) {
    this.keyId = configService.get<string>("APNS_KEY_ID")?.trim() || undefined;
    this.teamId =
      (configService.get<string>("APNS_TEAM_ID") || configService.get<string>("APPLE_TEAM_ID"))
        ?.trim() || undefined;
    this.bundleId = configService.get<string>("IOS_BUNDLE_ID")?.trim() || "com.mimar.app";

    // .p8 dosyası base64 olarak tek satırda tutuluyor: FIREBASE_PRIVATE_KEY'de
    // olduğu gibi satır sonları .env'e elle kopyalanırken bozulmasın.
    const encodedKey = configService.get<string>("APNS_PRIVATE_KEY_BASE64")?.trim();
    if (encodedKey) {
      try {
        this.key = createPrivateKey(Buffer.from(encodedKey, "base64").toString("utf8"));
      } catch (error: any) {
        this.logger.error(`APNS_PRIVATE_KEY_BASE64 could not be read: ${error.message}`);
      }
    }

    if (this.isConfigured) {
      this.logger.log(`APNs direct sending enabled (key ${this.keyId}, topic ${this.bundleId})`);
    }
  }

  get isConfigured(): boolean {
    return Boolean(this.keyId && this.teamId && this.key);
  }

  onModuleDestroy() {
    for (const session of this.sessions.values()) session.close();
    this.sessions.clear();
  }

  /** ES256 imzalı sağlayıcı token'ı; ömrü dolana kadar aynısı kullanılır. */
  authorization(now = Date.now()): string {
    if (this.providerToken && now - this.providerToken.issuedAt < PROVIDER_TOKEN_TTL_MS) {
      return this.providerToken.value;
    }

    const header = Buffer.from(JSON.stringify({ alg: "ES256", kid: this.keyId })).toString(
      "base64url",
    );
    const claims = Buffer.from(
      JSON.stringify({ iss: this.teamId, iat: Math.floor(now / 1000) }),
    ).toString("base64url");
    const signature = sign("sha256", Buffer.from(`${header}.${claims}`), {
      key: this.key!,
      dsaEncoding: "ieee-p1363",
    }).toString("base64url");

    const value = `${header}.${claims}.${signature}`;
    this.providerToken = { value, issuedAt: now };
    return value;
  }

  async send(token: string, message: ApnsMessage): Promise<ApnsSendResult> {
    if (!this.isConfigured) return "failed";

    const payload = JSON.stringify(buildApnsPayload(message));
    const known = this.tokenEnvironment.get(token);
    const environments: ApnsEnvironment[] = known ? [known] : ["production", "sandbox"];

    for (const environment of environments) {
      let status: number;
      let reason: string | undefined;
      try {
        ({ status, reason } = await this.post(environment, token, payload));
      } catch (error: any) {
        this.logger.warn(`APNs ${environment} request failed: ${error.message}`);
        return "failed";
      }

      if (status === 200) {
        this.tokenEnvironment.set(token, environment);
        return "sent";
      }

      // Uygulama silinmiş ya da token yenilenmiş: kayıt temizlenmeli.
      if (status === 410 || reason === "Unregistered") {
        this.tokenEnvironment.delete(token);
        return "invalid-token";
      }

      // Token bu ortama ait değil; diğer ortam denenir.
      if (reason === "BadDeviceToken") continue;

      // Anahtar reddedildiyse bir sonraki gönderimde yeni token üretilsin.
      if (reason === "ExpiredProviderToken" || reason === "InvalidProviderToken") {
        this.providerToken = null;
      }
      this.logger.warn(
        `APNs ${environment} rejected (${token.substring(0, 8)}...): ${status} ${reason ?? ""}`,
      );
      return "failed";
    }

    // Denenen her ortamda BadDeviceToken: token bu uygulamaya ait değil.
    this.tokenEnvironment.delete(token);
    return "invalid-token";
  }

  private session(environment: ApnsEnvironment): ClientHttp2Session {
    const existing = this.sessions.get(environment);
    if (existing && !existing.closed && !existing.destroyed) return existing;

    const session = connect(HOSTS[environment]);
    const forget = () => {
      if (this.sessions.get(environment) === session) this.sessions.delete(environment);
    };
    session.on("error", (error) => {
      this.logger.warn(`APNs ${environment} connection error: ${error.message}`);
      forget();
    });
    session.on("close", forget);
    session.on("goaway", forget);
    // Boştaki bağlantı süreci ayakta tutmasın.
    session.unref();

    this.sessions.set(environment, session);
    return session;
  }

  private post(
    environment: ApnsEnvironment,
    token: string,
    payload: string,
  ): Promise<{ status: number; reason?: string }> {
    return new Promise((resolve, reject) => {
      let settled = false;
      const finish = (callback: () => void) => {
        if (settled) return;
        settled = true;
        callback();
      };

      const request = this.session(environment).request({
        ":method": "POST",
        ":path": `/3/device/${token}`,
        authorization: `bearer ${this.authorization()}`,
        "apns-topic": this.bundleId,
        "apns-push-type": "alert",
        "apns-priority": "10",
        "content-type": "application/json",
      });

      let status = 0;
      let responseBody = "";

      request.setTimeout(REQUEST_TIMEOUT_MS, () => {
        request.close(constants.NGHTTP2_CANCEL);
        finish(() => reject(new Error("timed out")));
      });
      request.on("response", (headers) => {
        status = Number(headers[":status"]);
      });
      request.setEncoding("utf8");
      request.on("data", (chunk: string) => {
        responseBody += chunk;
      });
      request.on("end", () => {
        let reason: string | undefined;
        try {
          reason = responseBody ? JSON.parse(responseBody).reason : undefined;
        } catch {
          reason = undefined;
        }
        finish(() => resolve({ status, reason }));
      });
      request.on("error", (error) => finish(() => reject(error)));
      request.on("close", () => finish(() => reject(new Error("stream closed"))));

      request.end(payload);
    });
  }
}

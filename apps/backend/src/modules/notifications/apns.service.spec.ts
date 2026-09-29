import { ConfigService } from "@nestjs/config";
import { generateKeyPairSync, verify } from "node:crypto";

import { ApnsService, buildApnsPayload } from "./apns.service";

const { privateKey, publicKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
const encodedKey = Buffer.from(
  privateKey.export({ type: "pkcs8", format: "pem" }) as string,
).toString("base64");

function makeService(env: Record<string, string | undefined>) {
  const config = { get: (key: string) => env[key] } as unknown as ConfigService;
  return new ApnsService(config);
}

const configured = {
  APNS_KEY_ID: "D99GMBU2MS",
  APNS_TEAM_ID: "4FXVMZW9NP",
  APNS_PRIVATE_KEY_BASE64: encodedKey,
  IOS_BUNDLE_ID: "com.mimar.app",
};

function decodePart(part: string) {
  return JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
}

describe("buildApnsPayload", () => {
  it("puts the data under body, where expo-notifications reads it on iOS", () => {
    const payload = buildApnsPayload({
      title: "Yeni görev",
      body: "Kaba inşaat kontrolü",
      data: { targetType: "task", route: "/(main)/projects/p1" },
    });

    expect(payload.body).toEqual({ targetType: "task", route: "/(main)/projects/p1" });
    // FCM'in yaptığı gibi en üst seviyede de duruyor.
    expect((payload as Record<string, unknown>).route).toBe("/(main)/projects/p1");
    expect(payload.aps).toEqual({
      alert: { title: "Yeni görev", body: "Kaba inşaat kontrolü" },
      sound: "default",
      "content-available": 1,
    });
  });

  it("sends an empty data object when there is none", () => {
    expect(buildApnsPayload({ title: "a", body: "b" }).body).toEqual({});
  });
});

describe("ApnsService", () => {
  it("stays off until the key, key id and team id are all set", () => {
    expect(makeService({}).isConfigured).toBe(false);
    expect(makeService({ ...configured, APNS_KEY_ID: undefined }).isConfigured).toBe(false);
    expect(makeService({ ...configured, APNS_PRIVATE_KEY_BASE64: "bm90IGEga2V5" }).isConfigured).toBe(
      false,
    );
    expect(makeService(configured).isConfigured).toBe(true);
  });

  it("falls back to the Sign in with Apple team id", () => {
    const service = makeService({
      ...configured,
      APNS_TEAM_ID: undefined,
      APPLE_TEAM_ID: "4FXVMZW9NP",
    });
    expect(service.isConfigured).toBe(true);
  });

  describe("provider token", () => {
    it("is an ES256 JWT that Apple can verify with the key", () => {
      const service = makeService(configured);
      const now = Date.UTC(2026, 8, 29, 12, 0, 0);

      const [header, claims, signature] = service.authorization(now).split(".");

      expect(decodePart(header)).toEqual({ alg: "ES256", kid: "D99GMBU2MS" });
      expect(decodePart(claims)).toEqual({ iss: "4FXVMZW9NP", iat: now / 1000 });
      expect(
        verify(
          "sha256",
          Buffer.from(`${header}.${claims}`),
          { key: publicKey, dsaEncoding: "ieee-p1363" },
          Buffer.from(signature, "base64url"),
        ),
      ).toBe(true);
    });

    it("is reused for 50 minutes and renewed after that", () => {
      // Apple 20 dakikadan sık yenilemeyi reddediyor, 60 dakikadan eskisini de.
      const service = makeService(configured);
      const start = Date.UTC(2026, 8, 29, 12, 0, 0);

      const first = service.authorization(start);
      expect(service.authorization(start + 49 * 60 * 1000)).toBe(first);
      expect(service.authorization(start + 51 * 60 * 1000)).not.toBe(first);
    });
  });

  describe("send", () => {
    const message = { title: "t", body: "b", data: { route: "/x" } };
    let service: ApnsService;
    let post: jest.SpyInstance;

    beforeEach(() => {
      service = makeService(configured);
      post = jest.spyOn(service as any, "post");
    });

    it("sends to production, where TestFlight and App Store tokens live", async () => {
      post.mockResolvedValue({ status: 200 });

      await expect(service.send("a".repeat(64), message)).resolves.toBe("sent");
      expect(post).toHaveBeenCalledTimes(1);
      expect(post.mock.calls[0][0]).toBe("production");
    });

    it("tries sandbox for a development build's token and remembers it", async () => {
      post
        .mockResolvedValueOnce({ status: 400, reason: "BadDeviceToken" })
        .mockResolvedValueOnce({ status: 200 })
        .mockResolvedValueOnce({ status: 200 });

      await expect(service.send("b".repeat(64), message)).resolves.toBe("sent");
      await expect(service.send("b".repeat(64), message)).resolves.toBe("sent");

      expect(post.mock.calls.map((call) => call[0])).toEqual(["production", "sandbox", "sandbox"]);
    });

    it("reports a token Apple no longer knows so it can be removed", async () => {
      post.mockResolvedValue({ status: 410, reason: "Unregistered" });

      await expect(service.send("c".repeat(64), message)).resolves.toBe("invalid-token");
    });

    it("reports a token that no environment accepts", async () => {
      post.mockResolvedValue({ status: 400, reason: "BadDeviceToken" });

      await expect(service.send("d".repeat(64), message)).resolves.toBe("invalid-token");
      expect(post).toHaveBeenCalledTimes(2);
    });

    it("keeps the token when the key itself is rejected", async () => {
      // Anahtar hatası token'ın suçu değil; kayıt silinirse kullanıcı
      // bildirimlerini kalıcı olarak kaybederdi.
      post.mockResolvedValue({ status: 403, reason: "InvalidProviderToken" });

      await expect(service.send("e".repeat(64), message)).resolves.toBe("failed");
      expect(post).toHaveBeenCalledTimes(1);
    });

    it("keeps the token when the connection fails", async () => {
      post.mockRejectedValue(new Error("ECONNRESET"));

      await expect(service.send("f".repeat(64), message)).resolves.toBe("failed");
    });

    it("sends nothing when it is not configured", async () => {
      const off = makeService({});
      const offPost = jest.spyOn(off as any, "post");

      await expect(off.send("a".repeat(64), message)).resolves.toBe("failed");
      expect(offPost).not.toHaveBeenCalled();
    });
  });
});

import { FcmService } from "./fcm.service";
import { ApnsService } from "./apns.service";
import { FirebaseConfig } from "../../config/firebase.config";

const APNS_TOKEN = "a1".repeat(32);
const FCM_TOKEN = "fcm-token:APA91b";

function makeApns(isConfigured: boolean) {
  return {
    isConfigured,
    send: jest.fn().mockResolvedValue("sent"),
  } as unknown as ApnsService & { send: jest.Mock };
}

describe("FcmService token cleanup signals", () => {
  it("returns invalid token when send fails with not-registered", async () => {
    const messaging = {
      send: jest.fn().mockRejectedValue({
        code: "messaging/registration-token-not-registered",
        message: "not registered",
      }),
    };

    const firebaseConfig = {
      messaging,
    } as unknown as FirebaseConfig;

    const service = new FcmService(firebaseConfig, makeApns(false));
    const result = await service.sendToDevice("bad-token", {
      title: "Test",
      body: "Body",
      data: { targetType: "membership", action: "approved" },
    });

    expect(result.invalidTokens).toEqual(["bad-token"]);
  });

  it("includes membership channel for membership payloads", async () => {
    const messaging = {
      send: jest.fn().mockResolvedValue("ok"),
    };

    const firebaseConfig = {
      messaging,
    } as unknown as FirebaseConfig;

    const service = new FcmService(firebaseConfig, makeApns(false));
    await service.sendToDevice("good-token", {
      title: "Test",
      body: "Body",
      data: { targetType: "membership", action: "approved" },
    });

    expect(messaging.send).toHaveBeenCalledWith(
      expect.objectContaining({
        android: expect.objectContaining({
          notification: expect.objectContaining({ channelId: "membership" }),
        }),
      }),
    );
  });

  it("puts the data under body in the iOS payload, where the app reads it", async () => {
    const messaging = { send: jest.fn().mockResolvedValue("ok") };
    const service = new FcmService({ messaging } as unknown as FirebaseConfig, makeApns(false));

    await service.sendToDevice(FCM_TOKEN, {
      title: "Test",
      body: "Body",
      data: { route: "/(main)/projects/p1" },
    });

    expect(messaging.send).toHaveBeenCalledWith(
      expect.objectContaining({
        apns: {
          payload: expect.objectContaining({ body: { route: "/(main)/projects/p1" } }),
        },
      }),
    );
  });
});

describe("FcmService routing to APNs", () => {
  const payload = { title: "Test", body: "Body", data: { route: "/x" } };

  it("sends raw iOS tokens straight to Apple once the key is set", async () => {
    const messaging = { send: jest.fn().mockResolvedValue("ok"), sendEach: jest.fn() };
    const apns = makeApns(true);
    const service = new FcmService({ messaging } as unknown as FirebaseConfig, apns);

    await service.sendToMultipleDevices([APNS_TOKEN, FCM_TOKEN], payload);

    expect(apns.send).toHaveBeenCalledWith(APNS_TOKEN, payload);
    expect(apns.send).toHaveBeenCalledTimes(1);
    // Android token'ı FCM'e gitmeye devam ediyor.
    expect(messaging.send).toHaveBeenCalledWith(expect.objectContaining({ token: FCM_TOKEN }));
  });

  it("reaches Apple even when Firebase is not set up", async () => {
    const apns = makeApns(true);
    const service = new FcmService({ messaging: null } as unknown as FirebaseConfig, apns);

    await service.sendToDevice(APNS_TOKEN, payload);

    expect(apns.send).toHaveBeenCalledWith(APNS_TOKEN, payload);
  });

  it("passes on the tokens Apple rejects so they are removed", async () => {
    const apns = makeApns(true);
    apns.send.mockResolvedValue("invalid-token");
    const service = new FcmService({ messaging: null } as unknown as FirebaseConfig, apns);

    const result = await service.sendToDevice(APNS_TOKEN, payload);

    expect(result.invalidTokens).toEqual([APNS_TOKEN]);
  });

  it("keeps a token whose send merely failed", async () => {
    const apns = makeApns(true);
    apns.send.mockResolvedValue("failed");
    const service = new FcmService({ messaging: null } as unknown as FirebaseConfig, apns);

    const result = await service.sendToDevice(APNS_TOKEN, payload);

    expect(result.invalidTokens).toEqual([]);
  });

  it("leaves iOS tokens on the old path until the key is set", async () => {
    const apns = makeApns(false);
    const service = new FcmService({ messaging: null } as unknown as FirebaseConfig, apns);

    await service.sendToDevice(APNS_TOKEN, payload);

    expect(apns.send).not.toHaveBeenCalled();
  });
});

import { FcmService } from "./fcm.service";
import { FirebaseConfig } from "../../config/firebase.config";

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

    const service = new FcmService(firebaseConfig);
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

    const service = new FcmService(firebaseConfig);
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
});

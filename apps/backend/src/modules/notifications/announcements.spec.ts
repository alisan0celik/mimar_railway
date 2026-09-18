import "reflect-metadata";
import { ConflictException, ForbiddenException } from "@nestjs/common";

import type { JwtPayload } from "../../common/interfaces/jwt-payload.interface";
import { PrismaService } from "../../common/prisma.service";
import { AnnouncementsController } from "./announcements.controller";
import { AnnouncementsService } from "./announcements.service";
import { NotificationsService } from "./notifications.service";

const PLATFORM_ADMIN_EMAIL = "platform-admin@planova.test";

const asUser = (email: string): JwtPayload =>
  ({ sub: "u1", email, companyId: "c1" }) as JwtPayload;

describe("AnnouncementsController access", () => {
  const originalAdmins = process.env.PLATFORM_ADMIN_EMAILS;
  const service = {
    audience: jest.fn().mockResolvedValue({ recipients: 3, reachableByPush: 2 }),
    broadcast: jest.fn().mockResolvedValue({ recipients: 3 }),
  };
  const controller = new AnnouncementsController(service as unknown as AnnouncementsService);

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.PLATFORM_ADMIN_EMAILS = PLATFORM_ADMIN_EMAIL;
  });

  afterAll(() => {
    process.env.PLATFORM_ADMIN_EMAILS = originalAdmins;
  });

  it("refuses a company owner, who is not a platform admin", () => {
    const owner = asUser("owner@company.test");

    expect(() => controller.audience(owner)).toThrow(ForbiddenException);
    expect(() => controller.send(owner, { title: "Bakım", message: "Yarın gece bakım var" })).toThrow(
      ForbiddenException,
    );
    expect(service.broadcast).not.toHaveBeenCalled();
  });

  it("lets a platform admin broadcast", async () => {
    const admin = asUser(PLATFORM_ADMIN_EMAIL);

    await expect(controller.send(admin, { title: "Bakım", message: "Yarın gece bakım var" })).resolves.toEqual({
      recipients: 3,
    });
    expect(service.broadcast).toHaveBeenCalledWith("u1", { title: "Bakım", message: "Yarın gece bakım var" });
  });
});

describe("AnnouncementsService", () => {
  const prisma = {
    user: { findMany: jest.fn(), count: jest.fn() },
  };
  const notificationsService = { createForUser: jest.fn() };

  const build = () =>
    new AnnouncementsService(
      prisma as unknown as PrismaService,
      notificationsService as unknown as NotificationsService,
    );

  const content = { title: "Planlı bakım", message: "Sunucularımız yarın gece 02:00-04:00 arası bakımda." };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.user.findMany.mockResolvedValue([{ id: "a" }, { id: "b" }, { id: "c" }]);
    notificationsService.createForUser.mockResolvedValue({});
  });

  it("delivers to every user, including those outside any company", async () => {
    const service = build();
    const deliver = jest.spyOn(service, "deliver").mockResolvedValue({ delivered: 3, failed: 0 });

    await expect(service.broadcast("admin", content)).resolves.toEqual({ recipients: 3 });

    // Şirket ya da onay durumuna göre süzme yok: herkes.
    expect(prisma.user.findMany).toHaveBeenCalledWith({ select: { id: true } });
    expect(deliver).toHaveBeenCalledWith(["a", "b", "c"], content);
  });

  it("sends each user an announcement that opens the notification list", async () => {
    await build().deliver(["a", "b"], content);

    expect(notificationsService.createForUser).toHaveBeenCalledTimes(2);
    expect(notificationsService.createForUser).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "a",
        title: content.title,
        message: content.message,
        targetType: "announcement",
        route: "/(main)/dashboard/notifications",
      }),
    );
  });

  it("keeps going when one user's delivery fails", async () => {
    notificationsService.createForUser
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error("geçersiz token"))
      .mockResolvedValueOnce({});

    await expect(build().deliver(["a", "b", "c"], content)).resolves.toEqual({ delivered: 2, failed: 1 });
    expect(notificationsService.createForUser).toHaveBeenCalledTimes(3);
  });

  it("delivers in bounded batches rather than all at once", async () => {
    const ids = Array.from({ length: 25 }, (_, index) => `u${index}`);
    let inFlight = 0;
    let peak = 0;
    notificationsService.createForUser.mockImplementation(async () => {
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      await new Promise((resolve) => setImmediate(resolve));
      inFlight -= 1;
      return {};
    });

    await build().deliver(ids, content);

    expect(notificationsService.createForUser).toHaveBeenCalledTimes(25);
    expect(peak).toBeLessThanOrEqual(10);
  });

  it("refuses the same announcement twice in a row", async () => {
    const service = build();
    jest.spyOn(service, "deliver").mockResolvedValue({ delivered: 3, failed: 0 });

    await service.broadcast("admin", content);
    await expect(service.broadcast("other-admin", { ...content, title: "  Planlı bakım " })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it("allows a different announcement right away", async () => {
    const service = build();
    const deliver = jest.spyOn(service, "deliver").mockResolvedValue({ delivered: 3, failed: 0 });

    await service.broadcast("admin", content);
    await service.broadcast("admin", { ...content, message: "Bakım 1 saat uzadı." });

    expect(deliver).toHaveBeenCalledTimes(2);
  });

  it("can be retried when the recipient list could not be read", async () => {
    const service = build();
    const deliver = jest.spyOn(service, "deliver").mockResolvedValue({ delivered: 3, failed: 0 });
    prisma.user.findMany.mockRejectedValueOnce(new Error("veritabanı meşgul"));

    await expect(service.broadcast("admin", content)).rejects.toThrow("veritabanı meşgul");
    await expect(service.broadcast("admin", content)).resolves.toEqual({ recipients: 3 });
    expect(deliver).toHaveBeenCalledTimes(1);
  });

  it("reports how many users it will reach and how many by push", async () => {
    prisma.user.count.mockResolvedValueOnce(41).mockResolvedValueOnce(33);

    await expect(build().audience()).resolves.toEqual({ recipients: 41, reachableByPush: 33 });
    expect(prisma.user.count).toHaveBeenCalledWith({ where: { deviceTokens: { some: {} } } });
  });
});

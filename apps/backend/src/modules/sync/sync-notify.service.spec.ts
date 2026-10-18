import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";

import { PrismaService } from "../../common/prisma.service";
import { NotificationsGateway } from "../notifications/notifications.gateway";
import { SyncNotifyService } from "./sync-notify.service";

describe("SyncNotifyService", () => {
  const prisma = { user: { findMany: jest.fn() } };
  const gateway = { sendSyncRequired: jest.fn() };
  const service = new SyncNotifyService(
    prisma as unknown as PrismaService,
    gateway as unknown as NotificationsGateway,
  );

  beforeEach(() => jest.clearAllMocks());

  it("tells every other member's open app to refresh, without a notification", async () => {
    prisma.user.findMany.mockResolvedValue([{ id: "u2" }, { id: "u3" }]);

    await service.notifyCompanySync("c1", "projects", "u1");

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: { companyId: "c1", approvalStatus: "approved", id: { not: "u1" } },
      select: { id: true },
    });
    expect(gateway.sendSyncRequired).toHaveBeenCalledTimes(2);
    expect(gateway.sendSyncRequired).toHaveBeenCalledWith("u2", {
      entity: "projects",
      companyId: "c1",
    });
    expect(gateway.sendSyncRequired).toHaveBeenCalledWith("u3", {
      entity: "projects",
      companyId: "c1",
    });
  });

  it("does nothing when nobody else is in the company", async () => {
    prisma.user.findMany.mockResolvedValue([]);

    await service.notifyCompanySync("c1", "projects", "u1");

    expect(gateway.sendSyncRequired).not.toHaveBeenCalled();
  });
});

describe("NotificationsGateway.sendSyncRequired", () => {
  function makeGateway() {
    const gateway = new NotificationsGateway(
      {} as JwtService,
      {} as ConfigService,
      {} as PrismaService,
    );
    const emit = jest.fn();
    const to = jest.fn().mockReturnValue({ emit });
    gateway.server = { to } as any;
    return { gateway, to, emit };
  }

  it("signals the member's connected app", () => {
    const { gateway, to, emit } = makeGateway();
    (gateway as any).connectedUsers.set("u2", "socket-2");

    gateway.sendSyncRequired("u2", { entity: "projects", companyId: "c1" });

    expect(to).toHaveBeenCalledWith("socket-2");
    expect(emit).toHaveBeenCalledWith("sync_required", { entity: "projects", companyId: "c1" });
  });

  it("skips a member whose app is not open", () => {
    const { gateway, to } = makeGateway();

    gateway.sendSyncRequired("u9", { entity: "projects", companyId: "c1" });

    expect(to).not.toHaveBeenCalled();
  });
});

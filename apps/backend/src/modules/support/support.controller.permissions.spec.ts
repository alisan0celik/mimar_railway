import "reflect-metadata";
import { ForbiddenException } from "@nestjs/common";
import { SupportController } from "./support.controller";
import type { JwtPayload } from "../../common/interfaces/jwt-payload.interface";

const PLATFORM_ADMIN_EMAIL = "platform-admin@planova.test";

function buildController() {
  const supportService = {
    getInbox: jest.fn().mockResolvedValue({ data: [] }),
    getInboxTicket: jest.fn().mockResolvedValue({ id: "t1" }),
    updateStatus: jest.fn().mockResolvedValue({ id: "t1" }),
    addStaffReply: jest.fn().mockResolvedValue({ id: "m1" }),
  };
  const companyScope = {} as never;
  return {
    controller: new SupportController(supportService as never, companyScope),
    supportService,
  };
}

const asUser = (email: string): JwtPayload =>
  ({ sub: "u1", email, companyId: null }) as JwtPayload;

describe("SupportController inbox access", () => {
  const originalAdmins = process.env.PLATFORM_ADMIN_EMAILS;

  beforeEach(() => {
    process.env.PLATFORM_ADMIN_EMAILS = PLATFORM_ADMIN_EMAIL;
  });

  afterAll(() => {
    process.env.PLATFORM_ADMIN_EMAILS = originalAdmins;
  });

  it("blocks non platform admins on every inbox endpoint", () => {
    const { controller, supportService } = buildController();
    const user = asUser("office-manager@company.test");

    expect(() => controller.getInbox(user, {} as never)).toThrow(ForbiddenException);
    expect(() => controller.getInboxTicket(user, "t1")).toThrow(ForbiddenException);
    expect(() => controller.updateInboxStatus(user, "t1", { status: "closed" } as never)).toThrow(
      ForbiddenException,
    );
    expect(() => controller.replyInbox(user, "t1", { body: "hi" } as never)).toThrow(
      ForbiddenException,
    );

    expect(supportService.getInbox).not.toHaveBeenCalled();
    expect(supportService.getInboxTicket).not.toHaveBeenCalled();
    expect(supportService.updateStatus).not.toHaveBeenCalled();
    expect(supportService.addStaffReply).not.toHaveBeenCalled();
  });

  it("allows platform admins", () => {
    const { controller, supportService } = buildController();
    const admin = asUser(PLATFORM_ADMIN_EMAIL);

    controller.getInbox(admin, {} as never);
    controller.getInboxTicket(admin, "t1");

    expect(supportService.getInbox).toHaveBeenCalled();
    expect(supportService.getInboxTicket).toHaveBeenCalledWith("t1");
  });
});

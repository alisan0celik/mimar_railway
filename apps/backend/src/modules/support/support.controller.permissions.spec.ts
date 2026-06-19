import "reflect-metadata";
import { PERMISSIONS_KEY } from "../../common/decorators/permissions.decorator";
import { SupportController } from "./support.controller";

function getMethodPermissions(
  controller: object,
  methodName: string,
): string[] | undefined {
  const method = (controller as Record<string, unknown>)[methodName];
  return Reflect.getMetadata(PERMISSIONS_KEY, method as object);
}

describe("SupportController permissions", () => {
  const controller = SupportController.prototype;

  it("requires support.manage for inbox endpoints", () => {
    expect(getMethodPermissions(controller, "getInbox")).toEqual(["support.manage"]);
    expect(getMethodPermissions(controller, "getInboxTicket")).toEqual(["support.manage"]);
    expect(getMethodPermissions(controller, "updateInboxStatus")).toEqual(["support.manage"]);
    expect(getMethodPermissions(controller, "replyInbox")).toEqual(["support.manage"]);
  });

  it("does not require support.manage for user ticket endpoints", () => {
    expect(getMethodPermissions(controller, "getTickets")).toBeUndefined();
    expect(getMethodPermissions(controller, "createTicket")).toBeUndefined();
    expect(getMethodPermissions(controller, "getTicket")).toBeUndefined();
    expect(getMethodPermissions(controller, "addMessage")).toBeUndefined();
  });
});

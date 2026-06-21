import { BadRequestException, NotFoundException } from "@nestjs/common";
import { SupportService } from "./support.service";
import { PrismaService } from "../../common/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import {
  NOTIFICATION_TARGET,
  SUPPORT_TICKET_ACTION,
} from "../notifications/notification-events.constants";

describe("SupportService", () => {
  const prisma = {
    supportTicket: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  const notificationsService = {
    createForUser: jest.fn().mockResolvedValue({}),
  };

  const service = new SupportService(
    prisma as unknown as PrismaService,
    notificationsService as unknown as NotificationsService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a ticket with an initial message", async () => {
    const now = new Date("2026-06-13T10:00:00.000Z");
    prisma.supportTicket.create.mockResolvedValue({
      id: "ticket-1",
      userId: "user-1",
      companyId: "company-1",
      subject: "Login issue",
      category: "technical",
      priority: "normal",
      status: "open",
      lastMessageAt: now,
      createdAt: now,
      updatedAt: now,
      user: { id: "user-1", fullName: "Ali", email: "ali@test.com" },
      company: { id: "company-1", name: "Office" },
      messages: [
        {
          id: "msg-1",
          body: "Cannot login",
          isStaffReply: false,
          createdAt: now,
          author: { id: "user-1", fullName: "Ali" },
        },
      ],
    });

    const result = await service.createTicket("user-1", "company-1", {
      subject: "Login issue",
      category: "technical",
      message: "Cannot login",
    });

    expect(prisma.supportTicket.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "user-1",
          companyId: "company-1",
          subject: "Login issue",
          category: "technical",
        }),
      }),
    );
    expect(result.messages).toHaveLength(1);
  });

  it("rejects messages on closed tickets", async () => {
    prisma.supportTicket.findFirst.mockResolvedValue({
      id: "ticket-1",
      userId: "user-1",
      status: "closed",
    });

    await expect(service.addUserMessage("user-1", "ticket-1", "Follow up")).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("notifies user when staff replies", async () => {
    const now = new Date("2026-06-13T10:00:00.000Z");
    prisma.supportTicket.findUnique.mockResolvedValue({
      id: "ticket-1",
      userId: "user-1",
      subject: "Login issue",
      status: "open",
    });
    prisma.supportTicket.update.mockResolvedValue({
      id: "ticket-1",
      userId: "user-1",
      companyId: "company-1",
      subject: "Login issue",
      category: "technical",
      priority: "normal",
      status: "waiting_user",
      lastMessageAt: now,
      createdAt: now,
      updatedAt: now,
      user: { id: "user-1", fullName: "Ali", email: "ali@test.com" },
      company: { id: "company-1", name: "Office" },
      messages: [
        {
          id: "msg-2",
          body: "Please retry",
          isStaffReply: true,
          createdAt: now,
          author: { id: "agent-1", fullName: "Support" },
        },
      ],
    });

    await service.addStaffReply("agent-1", "ticket-1", "Please retry");

    expect(notificationsService.createForUser).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        targetType: NOTIFICATION_TARGET.SUPPORT_TICKET,
        targetId: "ticket-1",
        action: SUPPORT_TICKET_ACTION.REPLIED,
        metadata: { ticketId: "ticket-1" },
      }),
    );
  });

  it("throws when ticket is missing for user", async () => {
    prisma.supportTicket.findFirst.mockResolvedValue(null);

    await expect(service.getTicketForUser("user-1", "missing")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

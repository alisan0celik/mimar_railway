import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import {
  NOTIFICATION_TARGET,
  SUPPORT_TICKET_ACTION,
  supportTicketRoute,
} from "../notifications/notification-events.constants";
import {
  resolveNotificationLocale,
  supportTicketRepliedNotification,
  supportTicketStatusNotification,
} from "../notifications/notification-templates";
import { CLOSED_SUPPORT_STATUSES } from "./support.constants";

const ticketInclude = {
  user: { select: { id: true, fullName: true, email: true } },
  company: { select: { id: true, name: true } },
  messages: {
    orderBy: { createdAt: "asc" as const },
    include: {
      author: { select: { id: true, fullName: true } },
    },
  },
};

@Injectable()
export class SupportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getTickets(userId: string) {
    const tickets = await this.prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { lastMessageAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    return tickets.map((ticket) => this.mapTicketSummary(ticket));
  }

  async getTicketForUser(userId: string, ticketId: string) {
    const ticket = await this.prisma.supportTicket.findFirst({
      where: { id: ticketId, userId },
      include: ticketInclude,
    });
    if (!ticket) throw new NotFoundException("Destek talebi bulunamadı");
    return this.mapTicketDetail(ticket);
  }

  async createTicket(
    userId: string,
    companyId: string,
    data: { subject: string; category: string; message: string },
  ) {
    const now = new Date();
    const ticket = await this.prisma.supportTicket.create({
      data: {
        userId,
        companyId,
        subject: data.subject,
        category: data.category,
        status: "open",
        lastMessageAt: now,
        messages: {
          create: {
            authorId: userId,
            body: data.message,
            isStaffReply: false,
          },
        },
      },
      include: ticketInclude,
    });

    return this.mapTicketDetail(ticket);
  }

  async addUserMessage(userId: string, ticketId: string, body: string) {
    const ticket = await this.prisma.supportTicket.findFirst({
      where: { id: ticketId, userId },
    });
    if (!ticket) throw new NotFoundException("Destek talebi bulunamadı");
    if (CLOSED_SUPPORT_STATUSES.includes(ticket.status as "resolved" | "closed")) {
      throw new BadRequestException("Kapalı taleplere mesaj eklenemez");
    }

    const now = new Date();
    const nextStatus =
      ticket.status === "waiting_user" || ticket.status === "in_progress"
        ? "open"
        : ticket.status;

    const updated = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: nextStatus,
        lastMessageAt: now,
        messages: {
          create: {
            authorId: userId,
            body,
            isStaffReply: false,
          },
        },
      },
      include: ticketInclude,
    });

    return this.mapTicketDetail(updated);
  }

  async getInbox(query: { page?: number; limit?: number; status?: string; category?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.category) where.category = query.category;

    const [tickets, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        orderBy: { lastMessageAt: "desc" },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, fullName: true, email: true } },
          company: { select: { id: true, name: true } },
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return {
      data: tickets.map((ticket) => this.mapTicketSummary(ticket)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getInboxTicket(ticketId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: ticketInclude,
    });
    if (!ticket) throw new NotFoundException("Destek talebi bulunamadı");
    return this.mapTicketDetail(ticket);
  }

  async updateStatus(ticketId: string, status: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: { user: { select: { id: true, fullName: true } } },
    });
    if (!ticket) throw new NotFoundException("Destek talebi bulunamadı");

    const updated = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status },
      include: ticketInclude,
    });

    const locale = resolveNotificationLocale(null);
    const copy = supportTicketStatusNotification(locale, {
      subject: ticket.subject,
      status,
    });

    await this.notificationsService.createForUser({
      userId: ticket.userId,
      title: copy.title,
      message: copy.message,
      type: "info",
      targetType: NOTIFICATION_TARGET.SUPPORT_TICKET,
      targetId: ticketId,
      action: SUPPORT_TICKET_ACTION.STATUS_CHANGED,
      route: supportTicketRoute(ticketId),
      metadata: { ticketId, status },
    });

    return this.mapTicketDetail(updated);
  }

  async addStaffReply(agentId: string, ticketId: string, body: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });
    if (!ticket) throw new NotFoundException("Destek talebi bulunamadı");

    const now = new Date();
    const updated = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: "waiting_user",
        lastMessageAt: now,
        messages: {
          create: {
            authorId: agentId,
            body,
            isStaffReply: true,
          },
        },
      },
      include: ticketInclude,
    });

    const locale = resolveNotificationLocale(null);
    const copy = supportTicketRepliedNotification(locale, { subject: ticket.subject });

    await this.notificationsService.createForUser({
      userId: ticket.userId,
      title: copy.title,
      message: copy.message,
      type: "info",
      targetType: NOTIFICATION_TARGET.SUPPORT_TICKET,
      targetId: ticketId,
      action: SUPPORT_TICKET_ACTION.REPLIED,
      route: supportTicketRoute(ticketId),
      metadata: { ticketId },
    });

    return this.mapTicketDetail(updated);
  }

  private mapTicketSummary(ticket: {
    id: string;
    subject: string;
    category: string;
    priority: string;
    status: string;
    lastMessageAt: Date;
    createdAt: Date;
    updatedAt: Date;
    messages?: Array<{ body: string; createdAt: Date }>;
  }) {
    const lastMessage = ticket.messages?.[0];
    return {
      id: ticket.id,
      subject: ticket.subject,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      lastMessagePreview: lastMessage?.body ?? null,
      lastMessageAt: ticket.lastMessageAt.toISOString(),
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
    };
  }

  private mapTicketDetail(ticket: {
    id: string;
    subject: string;
    category: string;
    priority: string;
    status: string;
    lastMessageAt: Date;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    companyId: string;
    user?: { id: string; fullName: string; email: string };
    company?: { id: string; name: string };
    messages: Array<{
      id: string;
      body: string;
      isStaffReply: boolean;
      createdAt: Date;
      author: { id: string; fullName: string };
    }>;
  }) {
    return {
      id: ticket.id,
      subject: ticket.subject,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      userId: ticket.userId,
      companyId: ticket.companyId,
      user: ticket.user,
      company: ticket.company,
      lastMessageAt: ticket.lastMessageAt.toISOString(),
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      messages: ticket.messages.map((message) => ({
        id: message.id,
        body: message.body,
        isStaffReply: message.isStaffReply,
        createdAt: message.createdAt.toISOString(),
        author: message.author,
      })),
    };
  }
}

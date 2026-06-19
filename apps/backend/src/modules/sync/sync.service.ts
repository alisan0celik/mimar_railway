import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { ProjectsService } from "../projects/projects.service";
import { SyncMutationDto } from "./dto/push-sync.dto";
import { SyncNotifyService } from "./sync-notify.service";

@Injectable()
export class SyncService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectsService: ProjectsService,
    private readonly syncNotifyService: SyncNotifyService,
  ) {}

  async pull(companyId: string, since?: string) {
    const sinceDate = since ? new Date(since) : new Date(0);
    if (since && Number.isNaN(sinceDate.getTime())) {
      throw new BadRequestException("Geçersiz since parametresi");
    }

    const projects = await this.prisma.project.findMany({
      where: {
        companyId,
        updatedAt: { gt: sinceDate },
      },
      include: {
        sections: true,
        createdBy: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    const projectIds = await this.prisma.project.findMany({
      where: { companyId },
      select: { id: true },
    });
    const ids = projectIds.map((project) => project.id);

    const [tasks, notes, messages] = await Promise.all([
      this.prisma.task.findMany({
        where: {
          projectId: { in: ids },
          updatedAt: { gt: sinceDate },
        },
        include: {
          assignee: { select: { id: true, fullName: true, avatarUrl: true } },
          createdBy: { select: { id: true, fullName: true } },
        },
        orderBy: { updatedAt: "desc" },
      }),
      this.prisma.projectNote.findMany({
        where: {
          projectId: { in: ids },
          updatedAt: { gt: sinceDate },
        },
        include: {
          author: { select: { id: true, fullName: true, avatarUrl: true } },
        },
        orderBy: { updatedAt: "desc" },
      }),
      this.prisma.projectMessage.findMany({
        where: {
          projectId: { in: ids },
          updatedAt: { gt: sinceDate },
        },
        include: {
          author: { select: { id: true, fullName: true, avatarUrl: true } },
        },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    const activeTasks = tasks.filter((t) => t.deletedAt === null);
    const deletedTasks = tasks.filter((t) => t.deletedAt !== null);

    const activeNotes = notes.filter((n) => n.deletedAt === null);
    const deletedNotes = notes.filter((n) => n.deletedAt !== null);

    const activeMessages = messages.filter((m) => m.deletedAt === null);
    const deletedMessages = messages.filter((m) => m.deletedAt !== null);

    return {
      serverTime: new Date().toISOString(),
      projects: projects.map((project) => this.serializeProject(project)),
      tasks: activeTasks.map((task) => this.serializeTask(task)),
      notes: activeNotes.map((note) => this.serializeNote(note)),
      messages: activeMessages.map((message) => this.serializeMessage(message)),
      deletedIds: {
        notes: deletedNotes.map((n) => n.id),
        tasks: deletedTasks.map((t) => t.id),
        messages: deletedMessages.map((m) => m.id),
      },
    };
  }

  async push(companyId: string, userId: string, mutations: SyncMutationDto[]) {
    const results = [];

    for (const mutation of mutations) {
      const existing = await this.prisma.syncMutation.findUnique({
        where: { mutationId: mutation.mutationId },
      });

      if (existing) {
        results.push({
          mutationId: mutation.mutationId,
          status: "duplicate",
          serverId: existing.serverRefId ?? undefined,
        });
        continue;
      }

      try {
        const applied = await this.applyMutation(companyId, userId, mutation);
        await this.prisma.syncMutation.create({
          data: {
            mutationId: mutation.mutationId,
            userId,
            companyId,
            entity: mutation.entity,
            action: mutation.action,
            serverRefId: applied.serverId,
          },
        });

        results.push({
          mutationId: mutation.mutationId,
          status: "applied",
          serverId: applied.serverId,
          serverRecord: applied.serverRecord,
        });
      } catch (error) {
        if (error instanceof ConflictException) {
          results.push({
            mutationId: mutation.mutationId,
            status: "conflict",
            message: error.message,
          });
          continue;
        }
        throw error;
      }
    }

    await this.syncNotifyService.notifyCompanySync(companyId, "projects", userId);

    return { results };
  }

  private async applyMutation(companyId: string, userId: string, mutation: SyncMutationDto) {
    if (!mutation.projectId) {
      throw new BadRequestException("projectId zorunludur");
    }

    switch (mutation.entity) {
      case "note":
        return this.applyNoteMutation(companyId, userId, mutation);
      case "message":
        return this.applyMessageMutation(companyId, userId, mutation);
      case "task":
        return this.applyTaskMutation(companyId, userId, mutation);
      default:
        throw new BadRequestException("Desteklenmeyen entity");
    }
  }

  private async applyNoteMutation(companyId: string, userId: string, mutation: SyncMutationDto) {
    const projectId = mutation.projectId!;

    if (mutation.action === "create") {
      const content = String(mutation.payload.content ?? "");
      const record = await this.projectsService.addNote(companyId, projectId, userId, content);
      return { serverId: record.id, serverRecord: this.serializeNote(record) };
    }

    if (mutation.action === "delete") {
      const noteId = mutation.entityId;
      if (!noteId || noteId.startsWith("temp_")) {
        return { serverId: noteId };
      }
      await this.projectsService.removeNote(companyId, projectId, noteId);
      return { serverId: noteId };
    }

    throw new BadRequestException("Not için desteklenmeyen işlem");
  }

  private async applyMessageMutation(companyId: string, userId: string, mutation: SyncMutationDto) {
    const projectId = mutation.projectId!;

    if (mutation.action === "create") {
      const content = String(mutation.payload.content ?? "");
      const record = await this.projectsService.addMessage(companyId, projectId, userId, content);
      return { serverId: record.id, serverRecord: this.serializeMessage(record) };
    }

    if (mutation.action === "delete") {
      const messageId = mutation.entityId;
      if (!messageId || messageId.startsWith("temp_")) {
        return { serverId: messageId };
      }
      await this.projectsService.removeMessage(companyId, projectId, messageId);
      return { serverId: messageId };
    }

    throw new BadRequestException("Mesaj için desteklenmeyen işlem");
  }

  private async applyTaskMutation(companyId: string, userId: string, mutation: SyncMutationDto) {
    const projectId = mutation.projectId!;

    if (mutation.action === "create") {
      const record = await this.projectsService.addTask(companyId, projectId, userId, mutation.payload);
      return { serverId: record.id, serverRecord: this.serializeTask(record) };
    }

    if (mutation.action === "update") {
      const taskId = mutation.entityId;
      if (!taskId) throw new BadRequestException("entityId zorunludur");

      if (taskId.startsWith("temp_")) {
        const record = await this.projectsService.addTask(companyId, projectId, userId, mutation.payload);
        return { serverId: record.id, serverRecord: this.serializeTask(record) };
      }

      const existing = await this.prisma.task.findFirst({ where: { id: taskId, projectId } });
      if (!existing) throw new NotFoundException("Görev bulunamadı");

      const clientUpdatedAt = new Date(mutation.clientCreatedAt);
      if (existing.updatedAt > clientUpdatedAt) {
        throw new ConflictException("Sunucudaki görev daha güncel");
      }

      const record = await this.projectsService.updateTask(
        companyId,
        projectId,
        taskId,
        mutation.payload,
      );
      return { serverId: record.id, serverRecord: this.serializeTask(record) };
    }

    if (mutation.action === "delete") {
      const taskId = mutation.entityId;
      if (!taskId || taskId.startsWith("temp_")) {
        return { serverId: taskId };
      }
      await this.projectsService.removeTask(companyId, projectId, taskId);
      return { serverId: taskId };
    }

    throw new BadRequestException("Görev için desteklenmeyen işlem");
  }

  private serializeProject(project: any) {
    return {
      ...project,
      startDate: project.startDate?.toISOString?.() ?? project.startDate,
      endDate: project.endDate?.toISOString?.() ?? project.endDate,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      sections: project.sections?.map((section: any) => ({
        ...section,
        createdAt: section.createdAt?.toISOString?.() ?? section.createdAt,
        updatedAt: section.updatedAt?.toISOString?.() ?? section.updatedAt,
      })),
    };
  }

  private serializeTask(task: any) {
    return {
      ...task,
      dueDate: task.dueDate?.toISOString?.() ?? task.dueDate,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };
  }

  private serializeNote(note: any) {
    return {
      ...note,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
    };
  }

  private serializeMessage(message: any) {
    return {
      ...message,
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt.toISOString(),
    };
  }
}

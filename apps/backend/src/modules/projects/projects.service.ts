import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  NOTIFICATION_TARGET,
  PROJECT_NOTE_ACTION,
  PROJECT_TASK_ACTION,
  projectNoteRoute,
  projectTaskRoute,
} from '../notifications/notification-events.constants';
import {
  projectNoteCreatedNotification,
  projectTaskCreatedNotification,
  resolveNotificationLocale,
} from '../notifications/notification-templates';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

const DEFAULT_SECTIONS = [
  { type: "architecture", label: "Mimari", order: 1 },
  { type: "static", label: "Statik", order: 2 },
  { type: "mechanical", label: "Mekanik", order: 3 },
  { type: "electrical", label: "Elektrik", order: 4 },
  { type: "map", label: "Harita", order: 5 },
  { type: "geology", label: "Jeoloji", order: 6 },
];

type NotificationRecipient = {
  id: string;
  notificationPreferences: unknown;
};

type CompanyProjectMember = {
  id: string;
  fullName: string;
  email: string;
  title: string | null;
  avatarUrl: string | null;
  createdAt: Date;
};

function previewText(value: string, maxLength = 80) {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1)}…`;
}

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(companyId: string, userId: string, dto: CreateProjectDto) {
    const project = await this.prisma.project.create({
      data: {
        name: dto.name,
        customerName: dto.customerName,
        projectType: dto.projectType,
        location: dto.location,
        description: dto.description,
        hasInspection: dto.hasInspection ?? false,
        inspectionCompany: dto.inspectionCompany,
        status: dto.status || 'active',
        priority: dto.priority || 'medium',
        imageUrl: dto.imageUrl,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        budget: dto.budget,
        companyId,
        createdById: userId,
        sections: {
          create: DEFAULT_SECTIONS.map((sec) => ({
            name: sec.type, // Map 'type' to 'name' in Section model
            order: sec.order,
            status: "not-started",
            content: "Bekliyor",
            updatedBy: "Sistem",
          })),
        },
      },
      include: {
        sections: true,
      },
    });

    return project;
  }

  async findAll(companyId: string) {
    return this.prisma.project.findMany({
      where: { companyId },
      include: {
        sections: true,
        createdBy: {
          select: { id: true, fullName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, companyId },
      include: {
        sections: true,
        createdBy: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    if (!project) throw new NotFoundException('Proje bulunamadı');
    return project;
  }

  async update(companyId: string, id: string, dto: UpdateProjectDto) {
    // Check if exists
    await this.findOne(companyId, id);

    return this.prisma.project.update({
      where: { id },
      data: {
        name: dto.name,
        customerName: dto.customerName,
        projectType: dto.projectType,
        location: dto.location,
        description: dto.description,
        hasInspection: dto.hasInspection,
        inspectionCompany: dto.inspectionCompany,
        status: dto.status,
        priority: dto.priority,
        imageUrl: dto.imageUrl,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        budget: dto.budget,
      },
      include: {
        sections: true,
      },
    });
  }

  async updateSection(companyId: string, projectId: string, sectionId: string, data: { status?: string, content?: string }, userId: string) {
    await this.findOne(companyId, projectId);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    return this.prisma.section.updateMany({
      where: { id: sectionId, projectId },
      data: {
        ...data,
        updatedBy: user?.fullName || 'Sistem',
      },
    }).then(async (result: { count: number }) => {
      if (result.count === 0) throw new NotFoundException('Bölüm bulunamadı');
      return this.prisma.section.findFirst({ where: { id: sectionId, projectId } });
    });
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);
    return this.prisma.project.delete({
      where: { id },
    });
  }

  // --- NOTES ---
  async getNotes(companyId: string, projectId: string) {
    await this.findOne(companyId, projectId);
    return this.prisma.projectNote.findMany({
      where: { projectId, deletedAt: null },
      include: { author: { select: { id: true, fullName: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addNote(companyId: string, projectId: string, userId: string, content: string) {
    await this.findOne(companyId, projectId);
    const note = await this.prisma.projectNote.create({
      data: { content, projectId, authorId: userId },
      include: { author: { select: { id: true, fullName: true, avatarUrl: true } } },
    });

    await this.tryNotifyTeamOnNoteCreated(projectId, note.id, content, userId);

    return note;
  }

  async removeNote(companyId: string, projectId: string, noteId: string) {
    await this.findOne(companyId, projectId);
    const result = await this.prisma.projectNote.updateMany({ 
      where: { id: noteId, projectId, deletedAt: null },
      data: { deletedAt: new Date() }
    });
    if (result.count === 0) throw new NotFoundException('Not bulunamadı');
    return { message: 'Not silindi' };
  }

  // --- MESSAGES ---
  async getMessages(companyId: string, projectId: string) {
    await this.findOne(companyId, projectId);
    return this.prisma.projectMessage.findMany({
      where: { projectId, deletedAt: null },
      include: { author: { select: { id: true, fullName: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addMessage(companyId: string, projectId: string, userId: string, content: string) {
    await this.findOne(companyId, projectId);
    return this.prisma.projectMessage.create({
      data: { content, projectId, authorId: userId },
      include: { author: { select: { id: true, fullName: true, avatarUrl: true } } },
    });
  }

  async removeMessage(companyId: string, projectId: string, messageId: string) {
    await this.findOne(companyId, projectId);
    const result = await this.prisma.projectMessage.updateMany({ 
      where: { id: messageId, projectId, deletedAt: null },
      data: { deletedAt: new Date() }
    });
    if (result.count === 0) throw new NotFoundException('Mesaj bulunamadı');
    return { message: 'Mesaj silindi' };
  }

  // --- TASKS ---
  async getTasks(companyId: string, projectId: string) {
    await this.findOne(companyId, projectId);
    return this.prisma.task.findMany({
      where: { projectId, deletedAt: null },
      include: { 
        assignee: { select: { id: true, fullName: true, avatarUrl: true } },
        createdBy: { select: { id: true, fullName: true } }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addTask(companyId: string, projectId: string, userId: string, data: any) {
    await this.findOne(companyId, projectId);
    const task = await this.prisma.task.create({
      data: { 
        ...data,
        projectId, 
        createdById: userId 
      },
      include: { 
        assignee: { select: { id: true, fullName: true, avatarUrl: true } },
        createdBy: { select: { id: true, fullName: true } }
      },
    });

    await this.tryNotifyTeamOnTaskCreated(projectId, task.id, task.title, userId);

    return task;
  }

  private async tryNotifyTeamOnNoteCreated(
    projectId: string,
    noteId: string,
    content: string,
    creatorId: string,
  ) {
    try {
      await this.notifyTeamOnNoteCreated(projectId, noteId, content, creatorId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Project note notification skipped: ${message}`);
    }
  }

  private async tryNotifyTeamOnTaskCreated(
    projectId: string,
    taskId: string,
    taskTitle: string,
    creatorId: string,
  ) {
    try {
      await this.notifyTeamOnTaskCreated(projectId, taskId, taskTitle, creatorId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Project task notification skipped: ${message}`);
    }
  }

  private async notifyTeamOnNoteCreated(
    projectId: string,
    noteId: string,
    content: string,
    creatorId: string,
  ) {
    const [project, creator] = await Promise.all([
      this.prisma.project.findUnique({
        where: { id: projectId },
        select: { name: true, companyId: true },
      }),
      this.prisma.user.findUnique({
        where: { id: creatorId },
        select: { fullName: true },
      }),
    ]);

    if (!project || !creator) return;

    const route = projectNoteRoute(projectId);
    const locale = resolveNotificationLocale(null);
    const copy = projectNoteCreatedNotification(locale, {
      creatorName: creator.fullName,
      projectName: project.name,
      notePreview: previewText(content),
    });

    const users = await this.prisma.user.findMany({
      where: {
        companyId: project.companyId,
        approvalStatus: 'approved',
        id: { not: creatorId },
      },
      select: { id: true, notificationPreferences: true },
    });
    if (users.length === 0) return;

    await Promise.all(
      users.map((user: NotificationRecipient) => {
        const prefs = user.notificationPreferences as Record<string, boolean> | null;
        if (prefs?.projects === false) return Promise.resolve();

        return this.notificationsService.createForUser({
          userId: user.id,
          title: copy.title,
          message: copy.message,
          type: 'info',
          targetType: NOTIFICATION_TARGET.PROJECT_NOTE,
          targetId: noteId,
          action: PROJECT_NOTE_ACTION.CREATED,
          route,
          metadata: {
            projectId,
            noteId,
          },
        });
      }),
    );
  }

  private async notifyTeamOnTaskCreated(
    projectId: string,
    taskId: string,
    taskTitle: string,
    creatorId: string,
  ) {
    const [project, creator] = await Promise.all([
      this.prisma.project.findUnique({
        where: { id: projectId },
        select: { name: true, companyId: true },
      }),
      this.prisma.user.findUnique({
        where: { id: creatorId },
        select: { fullName: true },
      }),
    ]);

    if (!project || !creator) return;

    const route = projectTaskRoute(projectId);
    const locale = resolveNotificationLocale(null);
    const copy = projectTaskCreatedNotification(locale, {
      creatorName: creator.fullName,
      projectName: project.name,
      taskTitle,
    });

    const users = await this.prisma.user.findMany({
      where: {
        companyId: project.companyId,
        approvalStatus: 'approved',
        id: { not: creatorId },
      },
      select: { id: true, notificationPreferences: true },
    });
    if (users.length === 0) return;

    await Promise.all(
      users.map((user: NotificationRecipient) => {
        const prefs = user.notificationPreferences as Record<string, boolean> | null;
        if (prefs?.projects === false) return Promise.resolve();

        return this.notificationsService.createForUser({
          userId: user.id,
          title: copy.title,
          message: copy.message,
          type: 'info',
          targetType: NOTIFICATION_TARGET.PROJECT_TASK,
          targetId: taskId,
          action: PROJECT_TASK_ACTION.CREATED,
          route,
          metadata: {
            projectId,
            taskId,
          },
        });
      }),
    );
  }

  async updateTaskStatus(
    companyId: string,
    projectId: string,
    taskId: string,
    status: string,
  ) {
    await this.findOne(companyId, projectId);
    const existing = await this.prisma.task.findFirst({ where: { id: taskId, projectId } });
    if (!existing) throw new NotFoundException('Görev bulunamadı');
    return this.prisma.task.update({
      where: { id: taskId },
      data: { status },
      include: {
        assignee: { select: { id: true, fullName: true, avatarUrl: true } },
        createdBy: { select: { id: true, fullName: true } },
      },
    });
  }

  async updateTask(companyId: string, projectId: string, taskId: string, data: any) {
    await this.findOne(companyId, projectId);
    const existing = await this.prisma.task.findFirst({ where: { id: taskId, projectId } });
    if (!existing) throw new NotFoundException('Görev bulunamadı');
    return this.prisma.task.update({
      where: { id: taskId },
      data,
      include: { 
        assignee: { select: { id: true, fullName: true, avatarUrl: true } },
        createdBy: { select: { id: true, fullName: true } }
      },
    });
  }

  async removeTask(companyId: string, projectId: string, taskId: string) {
    await this.findOne(companyId, projectId);
    const result = await this.prisma.task.updateMany({ 
      where: { id: taskId, projectId, deletedAt: null },
      data: { deletedAt: new Date() }
    });
    if (result.count === 0) throw new NotFoundException('Görev bulunamadı');
    return { message: 'Görev silindi' };
  }

  // --- FILES ---
  async getFiles(companyId: string, projectId: string) {
    await this.findOne(companyId, projectId);
    return this.prisma.projectFile.findMany({
      where: { projectId, deletedAt: null },
      include: { author: { select: { id: true, fullName: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addFile(companyId: string, projectId: string, userId: string, data: { name: string, url: string, size: number, type: string }) {
    await this.findOne(companyId, projectId);
    return this.prisma.projectFile.create({
      data: { ...data, projectId, authorId: userId },
      include: { author: { select: { id: true, fullName: true, avatarUrl: true } } },
    });
  }

  async removeFile(companyId: string, projectId: string, fileId: string) {
    await this.findOne(companyId, projectId);
    const result = await this.prisma.projectFile.updateMany({ 
      where: { id: fileId, projectId, deletedAt: null },
      data: { deletedAt: new Date() }
    });
    if (result.count === 0) throw new NotFoundException('Dosya bulunamadı');
    return { message: 'Dosya silindi' };
  }

  // --- TEAM ---
  async getTeam(companyId: string, projectId: string) {
    await this.findOne(companyId, projectId);
    const users = await this.prisma.user.findMany({
      where: {
        companyId,
        approvalStatus: 'approved',
      },
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        email: true,
        title: true,
        createdAt: true,
      },
      orderBy: { fullName: 'asc' },
    });

    return users.map((user: CompanyProjectMember) => ({
      id: `company-member-${user.id}`,
      projectId,
      userId: user.id,
      role: user.title || 'Şirket üyesi',
      joinedAt: user.createdAt,
      user: {
        id: user.id,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        email: user.email,
      },
    }));
  }

  async getAvailableTeamMembers(companyId: string, projectId: string) {
    await this.findOne(companyId, projectId);
    return [];
  }

  async addTeamMember(companyId: string, projectId: string, userId: string, role?: string) {
    const [member] = await this.addTeamMembers(companyId, projectId, [userId], role);
    return member;
  }

  async addTeamMembers(
    companyId: string,
    projectId: string,
    userIds: string[],
    role = '',
  ) {
    await this.findOne(companyId, projectId);

    const uniqueUserIds = [...new Set(userIds)];
    if (uniqueUserIds.length === 0) {
      throw new BadRequestException('En az bir kullanıcı seçilmelidir');
    }

    const approvedMembers = await this.prisma.user.findMany({
      where: {
        id: { in: uniqueUserIds },
        companyId,
        approvalStatus: 'approved',
      },
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        email: true,
        title: true,
        createdAt: true,
      },
      orderBy: { fullName: 'asc' },
    });

    if (approvedMembers.length === 0) {
      throw new BadRequestException('Eklenecek geçerli kullanıcı bulunamadı');
    }

    return approvedMembers.map((user: CompanyProjectMember) => ({
      id: `company-member-${user.id}`,
      projectId,
      userId: user.id,
      role: user.title || role || 'Şirket üyesi',
      joinedAt: user.createdAt,
      user: {
        id: user.id,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        email: user.email,
      },
    }));
  }

  async removeTeamMember(companyId: string, projectId: string, teamId: string) {
    await this.findOne(companyId, projectId);
    return { message: 'Şirket üyeleri projelere otomatik ekip olarak dahil edilir.' };
    const result = await this.prisma.projectTeam.deleteMany({ where: { id: teamId, projectId } });
    if (result.count === 0) throw new NotFoundException('Ekip üyesi bulunamadı');
    return { message: 'Ekip üyesi kaldırıldı' };
  }
}

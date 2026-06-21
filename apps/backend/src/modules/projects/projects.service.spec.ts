import { BadRequestException, NotFoundException } from "@nestjs/common";
import { ProjectsService } from "./projects.service";
import { PrismaService } from "../../common/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import {
  NOTIFICATION_TARGET,
  PROJECT_NOTE_ACTION,
  PROJECT_TASK_ACTION,
} from "../notifications/notification-events.constants";

describe("ProjectsService tasks", () => {
  const prisma = {
    project: { findUnique: jest.fn(), findFirst: jest.fn() },
    user: { findUnique: jest.fn(), findMany: jest.fn() },
    projectTeam: { findMany: jest.fn(), createMany: jest.fn(), deleteMany: jest.fn() },
    projectNote: { create: jest.fn() },
    task: { findFirst: jest.fn(), update: jest.fn(), create: jest.fn() },
  };

  const notificationsService = {
    createForUser: jest.fn().mockResolvedValue({}),
  };

  const service = new ProjectsService(
    prisma as unknown as PrismaService,
    notificationsService as unknown as NotificationsService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("updateTaskStatus", () => {
    it("updates only the task status", async () => {
      prisma.project.findFirst = jest.fn().mockResolvedValue({ id: "proj-1" });
      prisma.task.findFirst = jest.fn().mockResolvedValue({ id: "task-1", projectId: "proj-1" });
      prisma.task.update = jest.fn().mockResolvedValue({ id: "task-1", status: "completed" });

      const result = await service.updateTaskStatus("company-1", "proj-1", "task-1", "completed");

      expect(prisma.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "task-1" },
          data: { status: "completed" },
        }),
      );
      expect(result.status).toBe("completed");
    });

    it("throws when task is missing", async () => {
      prisma.project.findFirst = jest.fn().mockResolvedValue({ id: "proj-1" });
      prisma.task.findFirst = jest.fn().mockResolvedValue(null);

      await expect(
        service.updateTaskStatus("company-1", "proj-1", "missing", "completed"),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("addTask notifications", () => {
    const setupAddTask = () => {
      prisma.project.findFirst = jest.fn().mockResolvedValue({ id: "proj-1" });
      prisma.task.create = jest.fn().mockResolvedValue({
        id: "task-1",
        title: "Inspect site",
        projectId: "proj-1",
      });
      prisma.project.findUnique = jest.fn().mockResolvedValue({ name: "Villa A", companyId: "company-1" });
      prisma.user.findUnique = jest.fn().mockResolvedValue({ fullName: "Manager" });
      prisma.user.findMany = jest.fn().mockResolvedValue([
        { id: "member-1", notificationPreferences: { projects: true } },
        { id: "member-2", notificationPreferences: null },
      ]);
    };

    it("notifies approved company members except the creator with project_task metadata", async () => {
      setupAddTask();

      await service.addTask("company-1", "proj-1", "creator-1", { title: "Inspect site" });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            companyId: "company-1",
            approvalStatus: "approved",
            id: { not: "creator-1" },
          },
        }),
      );
      expect(notificationsService.createForUser).toHaveBeenCalledTimes(2);
      expect(notificationsService.createForUser).not.toHaveBeenCalledWith(
        expect.objectContaining({ userId: "creator-1" }),
      );

      expect(notificationsService.createForUser).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "member-1",
          targetType: NOTIFICATION_TARGET.PROJECT_TASK,
          targetId: "task-1",
          action: PROJECT_TASK_ACTION.CREATED,
          route: "/(main)/projects/proj-1?tab=todos",
          metadata: {
            projectId: "proj-1",
            taskId: "task-1",
          },
        }),
      );
    });

    it("skips users who disabled project notifications", async () => {
      setupAddTask();
      prisma.user.findMany = jest.fn().mockResolvedValue([
        { id: "member-1", notificationPreferences: { projects: false } },
        { id: "member-2", notificationPreferences: null },
      ]);

      await service.addTask("company-1", "proj-1", "creator-1", { title: "Inspect site" });

      expect(notificationsService.createForUser).toHaveBeenCalledTimes(1);
      expect(notificationsService.createForUser).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "member-2" }),
      );
    });

    it("does not notify when no other approved company member exists", async () => {
      setupAddTask();
      prisma.user.findMany = jest.fn().mockResolvedValue([]);

      await service.addTask("company-1", "proj-1", "creator-1", { title: "Inspect site" });

      expect(notificationsService.createForUser).not.toHaveBeenCalled();
    });
  });

  describe("addNote notifications", () => {
    const setupAddNote = () => {
      prisma.project.findFirst = jest.fn().mockResolvedValue({ id: "proj-1" });
      prisma.projectNote.create = jest.fn().mockResolvedValue({
        id: "note-1",
        content: "Please review the updated plan",
        projectId: "proj-1",
        author: { id: "creator-1", fullName: "Manager", avatarUrl: null },
      });
      prisma.project.findUnique = jest.fn().mockResolvedValue({ name: "Villa A", companyId: "company-1" });
      prisma.user.findUnique = jest.fn().mockResolvedValue({ fullName: "Manager" });
      prisma.user.findMany = jest.fn().mockResolvedValue([
        { id: "member-1", notificationPreferences: { projects: true } },
        { id: "member-2", notificationPreferences: null },
      ]);
    };

    it("notifies approved company members except the creator with project_note metadata", async () => {
      setupAddNote();

      await service.addNote(
        "company-1",
        "proj-1",
        "creator-1",
        "Please review the updated plan",
      );

      expect(notificationsService.createForUser).toHaveBeenCalledTimes(2);
      expect(notificationsService.createForUser).not.toHaveBeenCalledWith(
        expect.objectContaining({ userId: "creator-1" }),
      );

      expect(notificationsService.createForUser).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "member-1",
          targetType: NOTIFICATION_TARGET.PROJECT_NOTE,
          targetId: "note-1",
          action: PROJECT_NOTE_ACTION.CREATED,
          route: "/(main)/projects/proj-1?tab=notes",
          metadata: {
            projectId: "proj-1",
            noteId: "note-1",
          },
        }),
      );
    });

    it("skips users who disabled project notifications", async () => {
      setupAddNote();
      prisma.user.findMany = jest.fn().mockResolvedValue([
        { id: "member-1", notificationPreferences: { projects: false } },
        { id: "member-2", notificationPreferences: null },
      ]);

      await service.addNote("company-1", "proj-1", "creator-1", "Please review this");

      expect(notificationsService.createForUser).toHaveBeenCalledTimes(1);
      expect(notificationsService.createForUser).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "member-2" }),
      );
    });

    it("does not notify when no other approved company member exists", async () => {
      setupAddNote();
      prisma.user.findMany = jest.fn().mockResolvedValue([]);

      await service.addNote("company-1", "proj-1", "creator-1", "Please review this");

      expect(notificationsService.createForUser).not.toHaveBeenCalled();
    });
  });

  describe("company-wide project members", () => {
    beforeEach(() => {
      prisma.project.findFirst = jest.fn().mockResolvedValue({ id: "proj-1" });
    });

    it("lists approved company users as project team members", async () => {
      prisma.user.findMany = jest.fn().mockResolvedValue([
        {
          id: "member-1",
          fullName: "Ali",
          email: "ali@test.com",
          title: "Ofis Çalışanı",
          avatarUrl: null,
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
        },
      ]);

      const result = await service.getTeam("company-1", "proj-1");

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            companyId: "company-1",
            approvalStatus: "approved",
          },
        }),
      );
      expect(result[0]).toMatchObject({
        id: "company-member-member-1",
        projectId: "proj-1",
        userId: "member-1",
        role: "Ofis Çalışanı",
        user: { id: "member-1", fullName: "Ali", email: "ali@test.com" },
      });
    });

    it("has no manually available members because everyone is included", async () => {
      const result = await service.getAvailableTeamMembers("company-1", "proj-1");
      expect(result).toEqual([]);
    });

    it("returns selected approved company users without creating project-team rows", async () => {
      prisma.user.findMany = jest.fn().mockResolvedValue([
        {
          id: "member-1",
          fullName: "Ali",
          email: "ali@test.com",
          title: null,
          avatarUrl: null,
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
        },
      ]);

      const result = await service.addTeamMembers("company-1", "proj-1", ["member-1"]);

      expect(prisma.projectTeam.createMany).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: "company-member-member-1",
        userId: "member-1",
        role: "Şirket üyesi",
      });
    });

    it("rejects empty user id list", async () => {
      await expect(service.addTeamMembers("company-1", "proj-1", [])).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });
});

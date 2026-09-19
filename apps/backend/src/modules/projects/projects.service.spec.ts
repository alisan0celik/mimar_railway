import { BadRequestException, NotFoundException } from "@nestjs/common";
import { ProjectsService } from "./projects.service";
import { CreateProjectDto } from "./dto/create-project.dto";
import { PrismaService } from "../../common/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import {
  NOTIFICATION_TARGET,
  PROJECT_NOTE_ACTION,
  PROJECT_TASK_ACTION,
} from "../notifications/notification-events.constants";

describe("ProjectsService tasks", () => {
  const prisma = {
    $transaction: jest.fn(),
    project: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    financeRecord: { deleteMany: jest.fn() },
    user: { findUnique: jest.fn(), findMany: jest.fn() },
    projectTeam: { findMany: jest.fn(), createMany: jest.fn(), deleteMany: jest.fn() },
    projectNote: { create: jest.fn() },
    task: { findFirst: jest.fn(), update: jest.fn(), create: jest.fn() },
    companyWorkItem: { findMany: jest.fn() },
    companyFavouriteTask: { findMany: jest.fn() },
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

  describe("remove", () => {
    beforeEach(() => {
      prisma.project.findFirst.mockResolvedValue({ id: "p1", companyId: "c1" });
      prisma.financeRecord.deleteMany.mockReturnValue("finance-delete");
      prisma.project.delete.mockReturnValue("project-delete");
      prisma.$transaction.mockResolvedValue([{ count: 4 }, { id: "p1" }]);
    });

    it("deletes the project's finance records with it, in one transaction", async () => {
      // Eskiden finans kayıtları projesiz kalıp görünmez biçimde birikiyordu.
      await expect(service.remove("c1", "p1")).resolves.toEqual({ id: "p1" });

      expect(prisma.financeRecord.deleteMany).toHaveBeenCalledWith({
        where: { projectId: "p1", companyId: "c1" },
      });
      expect(prisma.project.delete).toHaveBeenCalledWith({ where: { id: "p1" } });
      expect(prisma.$transaction).toHaveBeenCalledWith(["finance-delete", "project-delete"]);
    });

    it("refuses a project from another company", async () => {
      prisma.project.findFirst.mockResolvedValue(null);

      await expect(service.remove("c1", "baska-sirket")).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    beforeEach(() => {
      prisma.project.findFirst.mockResolvedValue({ id: "p1", companyId: "c1" });
      prisma.project.update.mockResolvedValue({ id: "p1" });
    });

    it("trims the name and customer before saving", async () => {
      await service.update("c1", "p1", { name: "  Zeytin Dalı  ", customerName: " Ege Turizm " });

      expect(prisma.project.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: "Zeytin Dalı", customerName: "Ege Turizm" }),
        }),
      );
    });

    it("rejects a blank name instead of leaving the project nameless", async () => {
      await expect(service.update("c1", "p1", { name: "   " })).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.project.update).not.toHaveBeenCalled();
    });

    it("leaves the name alone when it is not sent", async () => {
      await service.update("c1", "p1", { customerName: "Yeni Müşteri" });

      const { data } = prisma.project.update.mock.calls[0][0];
      expect(data.name).toBeUndefined();
    });
  });

  describe("create with favourite tasks", () => {
    const dto = { name: "Yeni Proje", customerName: "Ege Turizm" } as CreateProjectDto;

    beforeEach(() => {
      prisma.companyWorkItem.findMany.mockResolvedValue([]);
      prisma.companyFavouriteTask.findMany.mockResolvedValue([
        { title: "Ruhsat dosyası" },
        { title: "Zemin etüdü" },
        { title: "Müşteriye sunum" },
      ]);
      prisma.project.create.mockImplementation(async ({ data }) => ({ id: "p1", name: data.name, sections: [] }));
      prisma.user.findUnique.mockResolvedValue({ fullName: "Ali Çelik" });
      prisma.user.findMany.mockResolvedValue([]);
    });

    const createdTasks = () => prisma.project.create.mock.calls[0][0].data.tasks.create;

    it("adds the company's favourite tasks to the new project in favourite order", async () => {
      await service.create("c1", "u1", dto);

      const tasks = createdTasks();
      expect(tasks.map((task: { title: string }) => task.title)).toEqual([
        "Ruhsat dosyası",
        "Zemin etüdü",
        "Müşteriye sunum",
      ]);
      expect(tasks.every((task: { status: string; createdById: string }) =>
        task.status === "todo" && task.createdById === "u1",
      )).toBe(true);
    });

    it("stamps the first favourite newest so it lists first", async () => {
      // Liste en yeni üstte sıralanıyor; aynı işlemdeki görevler aynı zamanı
      // alsaydı sıra rastgele olurdu.
      await service.create("c1", "u1", dto);

      const times = createdTasks().map((task: { createdAt: Date }) => task.createdAt.getTime());
      expect(times[0]).toBeGreaterThan(times[1]);
      expect(times[1]).toBeGreaterThan(times[2]);
      const [first] = createdTasks();
      expect(first.updatedAt).toEqual(first.createdAt);
    });

    it("sends one project notification, not one per favourite task", async () => {
      prisma.user.findMany.mockResolvedValue([{ id: "u2", notificationPreferences: null }]);

      await service.create("c1", "u1", dto);

      expect(prisma.task.create).not.toHaveBeenCalled();
      expect(notificationsService.createForUser).toHaveBeenCalledTimes(1);
    });

    it("creates no tasks when the company has no favourites", async () => {
      prisma.companyFavouriteTask.findMany.mockResolvedValue([]);

      await service.create("c1", "u1", dto);

      expect(createdTasks()).toEqual([]);
    });
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

    it("still returns the created task when notification delivery fails", async () => {
      setupAddTask();
      notificationsService.createForUser.mockRejectedValueOnce(new Error("push failed"));

      const result = await service.addTask("company-1", "proj-1", "creator-1", {
        title: "Inspect site",
      });

      expect(result).toMatchObject({ id: "task-1", title: "Inspect site" });
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

    it("still returns the created note when notification delivery fails", async () => {
      setupAddNote();
      notificationsService.createForUser.mockRejectedValueOnce(new Error("push failed"));

      const result = await service.addNote(
        "company-1",
        "proj-1",
        "creator-1",
        "Please review this",
      );

      expect(result).toMatchObject({ id: "note-1", content: "Please review the updated plan" });
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

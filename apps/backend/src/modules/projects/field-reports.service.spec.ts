import { BadRequestException, ConflictException, ForbiddenException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { existsSync } from "fs";
import { mkdtemp, readdir, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

import { PermissionService } from "../../common/permissions/permission.service";
import { PrismaService } from "../../common/prisma.service";
import { projectDir, reportDir, savePhoto } from "./field-report.storage";
import { FieldReportsService, MAX_PHOTOS_PER_REPORT } from "./field-reports.service";

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);

describe("field report storage", () => {
  let dir: string;
  const previous = process.env.UPLOAD_DIR;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "field-reports-"));
    process.env.UPLOAD_DIR = dir;
  });

  afterEach(async () => {
    process.env.UPLOAD_DIR = previous;
    await rm(dir, { recursive: true, force: true });
  });

  it("keeps photos outside the public companies folder", () => {
    // Statik sunum yalnızca uploads/companies'i açıyor.
    expect(reportDir("c1", "p1", "r1")).toBe(join(dir, "field-reports", "c1", "p1", "r1"));
  });

  it("decides the type from the bytes, not from what the client claims", async () => {
    const saved = await savePhoto(reportDir("c1", "p1", "r1"), { buffer: PNG, size: PNG.length });

    expect(saved.mimeType).toBe("image/png");
    expect(saved.fileName).toMatch(/^[0-9a-f]{24}\.png$/);
    expect(await readdir(reportDir("c1", "p1", "r1"))).toEqual([saved.fileName]);
  });

  it("refuses a file that is not an image", async () => {
    const html = Buffer.from("<html><script>alert(1)</script></html>");
    await expect(
      savePhoto(reportDir("c1", "p1", "r1"), { buffer: html, size: html.length }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("refuses a missing file", async () => {
    await expect(savePhoto(reportDir("c1", "p1", "r1"), undefined)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("refuses ids that could escape the folder", () => {
    expect(() => reportDir("c1", "../other", "r1")).toThrow(BadRequestException);
    expect(() => projectDir("c1/..", "p1")).toThrow(BadRequestException);
  });
});

describe("FieldReportsService", () => {
  const prisma = {
    project: { findFirst: jest.fn() },
    fieldReport: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    fieldReportPhoto: { create: jest.fn(), findUnique: jest.fn() },
  };
  const permissions = { getEffectivePermissions: jest.fn() };
  const service = new FieldReportsService(
    prisma as unknown as PrismaService,
    permissions as unknown as PermissionService,
  );

  const dto = {
    clientId: "client-report-1",
    note: "  Kazı derinliği kontrol edildi  ",
    observedAt: "2026-11-25T08:30:00.000Z",
    latitude: 38.42,
    longitude: 27.14,
  };

  let uploadDir: string;
  const previous = process.env.UPLOAD_DIR;

  beforeEach(async () => {
    jest.clearAllMocks();
    uploadDir = await mkdtemp(join(tmpdir(), "field-reports-"));
    process.env.UPLOAD_DIR = uploadDir;
    prisma.project.findFirst.mockResolvedValue({ id: "p1" });
    permissions.getEffectivePermissions.mockResolvedValue(["project.view"]);
  });

  afterEach(async () => {
    process.env.UPLOAD_DIR = previous;
    await rm(uploadDir, { recursive: true, force: true });
  });

  describe("create", () => {
    it("creates the report with a trimmed note", async () => {
      prisma.fieldReport.findUnique.mockResolvedValue(null);
      prisma.fieldReport.create.mockImplementation(async ({ data }: any) => ({ id: "r1", ...data }));

      const report: any = await service.create("c1", "p1", "u1", dto);

      expect(report.note).toBe("Kazı derinliği kontrol edildi");
      expect(report.observedAt).toEqual(new Date("2026-11-25T08:30:00.000Z"));
      expect(report.authorId).toBe("u1");
    });

    it("returns the existing report when the same one is sent again", async () => {
      // Sahadan gönderim yarıda kalıp tekrarlanınca ikinci kayıt açılmamalı.
      prisma.fieldReport.findUnique.mockResolvedValue({ id: "r1", projectId: "p1", authorId: "u1" });

      const report: any = await service.create("c1", "p1", "u1", dto);

      expect(report.id).toBe("r1");
      expect(prisma.fieldReport.create).not.toHaveBeenCalled();
    });

    it("returns the winner when two sends race", async () => {
      prisma.fieldReport.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: "r1", projectId: "p1", authorId: "u1" });
      prisma.fieldReport.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError("unique", { code: "P2002", clientVersion: "6" }),
      );

      await expect(service.create("c1", "p1", "u1", dto)).resolves.toMatchObject({ id: "r1" });
    });

    it("refuses a client id that belongs to someone else's report", async () => {
      prisma.fieldReport.findUnique.mockResolvedValue({ id: "r9", projectId: "p1", authorId: "u2" });

      await expect(service.create("c1", "p1", "u1", dto)).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe("addPhoto", () => {
    const report = (overrides: Record<string, unknown> = {}) => ({
      id: "r1",
      projectId: "p1",
      companyId: "c1",
      authorId: "u1",
      photos: [],
      ...overrides,
    });

    it("saves the photo and records it", async () => {
      prisma.fieldReport.findFirst.mockResolvedValue(report());
      prisma.fieldReportPhoto.create.mockImplementation(async ({ data }: any) => ({ id: "ph1", ...data }));

      const photo: any = await service.addPhoto("c1", "p1", "r1", "u1", "client-photo-1", {
        buffer: JPEG,
        size: JPEG.length,
      });

      expect(photo.mimeType).toBe("image/jpeg");
      expect(existsSync(join(reportDir("c1", "p1", "r1"), photo.fileName))).toBe(true);
    });

    it("returns the photo already added under the same client id", async () => {
      const existing = { id: "ph1", clientPhotoId: "client-photo-1" };
      prisma.fieldReport.findFirst.mockResolvedValue(report({ photos: [existing] }));

      const photo = await service.addPhoto("c1", "p1", "r1", "u1", "client-photo-1", {
        buffer: JPEG,
        size: JPEG.length,
      });

      expect(photo).toBe(existing);
      expect(prisma.fieldReportPhoto.create).not.toHaveBeenCalled();
    });

    it("stops at the photo limit", async () => {
      const photos = Array.from({ length: MAX_PHOTOS_PER_REPORT }, (_, index) => ({
        id: `ph${index}`,
        clientPhotoId: `client-photo-${index}`,
      }));
      prisma.fieldReport.findFirst.mockResolvedValue(report({ photos }));

      await expect(
        service.addPhoto("c1", "p1", "r1", "u1", "client-photo-new", { buffer: JPEG, size: JPEG.length }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("does not let another member add photos without project update rights", async () => {
      prisma.fieldReport.findFirst.mockResolvedValue(report({ authorId: "u2" }));

      await expect(
        service.addPhoto("c1", "p1", "r1", "u1", "client-photo-1", { buffer: JPEG, size: JPEG.length }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("removes the written file when the record cannot be saved", async () => {
      prisma.fieldReport.findFirst.mockResolvedValue(report());
      prisma.fieldReportPhoto.create.mockRejectedValue(new Error("db down"));

      await expect(
        service.addPhoto("c1", "p1", "r1", "u1", "client-photo-1", { buffer: JPEG, size: JPEG.length }),
      ).rejects.toThrow("db down");
      expect(await readdir(reportDir("c1", "p1", "r1"))).toEqual([]);
    });
  });

  describe("remove", () => {
    it("lets a member with project update rights remove someone else's report", async () => {
      prisma.fieldReport.findFirst.mockResolvedValue({ id: "r1", authorId: "u2", photos: [] });
      permissions.getEffectivePermissions.mockResolvedValue(["project.view", "project.update"]);

      await expect(service.remove("c1", "p1", "r1", "u1")).resolves.toEqual({ success: true });
      expect(prisma.fieldReport.delete).toHaveBeenCalledWith({ where: { id: "r1" } });
    });

    it("deletes the report's photo folder", async () => {
      const dir = reportDir("c1", "p1", "r1");
      await savePhoto(dir, { buffer: JPEG, size: JPEG.length });
      prisma.fieldReport.findFirst.mockResolvedValue({ id: "r1", authorId: "u1", photos: [] });

      await service.remove("c1", "p1", "r1", "u1");

      expect(existsSync(dir)).toBe(false);
    });

    it("refuses a member who neither wrote it nor can update the project", async () => {
      prisma.fieldReport.findFirst.mockResolvedValue({ id: "r1", authorId: "u2", photos: [] });

      await expect(service.remove("c1", "p1", "r1", "u1")).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.fieldReport.delete).not.toHaveBeenCalled();
    });
  });
});

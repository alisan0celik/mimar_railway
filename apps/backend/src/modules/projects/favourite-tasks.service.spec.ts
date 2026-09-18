import { BadRequestException } from "@nestjs/common";

import { PrismaService } from "../../common/prisma.service";
import { FavouriteTasksService } from "./favourite-tasks.service";

describe("FavouriteTasksService", () => {
  const prisma = {
    companyFavouriteTask: {
      findMany: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const service = new FavouriteTasksService(prisma as unknown as PrismaService);

  const favourite = (id: string, title: string, order: number) => ({
    id,
    title,
    order,
    companyId: "c1",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.companyFavouriteTask.findMany.mockResolvedValue([]);
    prisma.companyFavouriteTask.create.mockImplementation(async ({ data }) => ({ id: "new", ...data }));
    prisma.companyFavouriteTask.deleteMany.mockResolvedValue({ count: 1 });
  });

  describe("add", () => {
    it("appends after the last favourite", async () => {
      prisma.companyFavouriteTask.findMany.mockResolvedValue([
        favourite("f1", "Ruhsat dosyası", 1),
        favourite("f2", "Zemin etüdü", 4),
      ]);

      await service.add("c1", "  Müşteriye sunum  ");

      expect(prisma.companyFavouriteTask.create).toHaveBeenCalledWith({
        data: { companyId: "c1", title: "Müşteriye sunum", order: 5 },
      });
    });

    it("treats Turkish case variants as the same favourite", async () => {
      // Düz toLowerCase() "İ"yi "i̇" yapar ve bu ikisini farklı sayardı.
      const existing = favourite("f1", "İmar durumu", 1);
      prisma.companyFavouriteTask.findMany.mockResolvedValue([existing]);

      await expect(service.add("c1", "imar durumu")).resolves.toBe(existing);
      expect(prisma.companyFavouriteTask.create).not.toHaveBeenCalled();
    });

    it("rejects titles shorter than two characters", async () => {
      await expect(service.add("c1", " a ")).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.companyFavouriteTask.create).not.toHaveBeenCalled();
    });

    it("returns the other device's record when two stars race", async () => {
      const winner = favourite("f9", "Zemin etüdü", 1);
      prisma.companyFavouriteTask.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([winner]);
      prisma.companyFavouriteTask.create.mockRejectedValue({ code: "P2002" });

      await expect(service.add("c1", "Zemin etüdü")).resolves.toBe(winner);
    });

    it("still surfaces unrelated database errors", async () => {
      prisma.companyFavouriteTask.create.mockRejectedValue(new Error("bağlantı koptu"));

      await expect(service.add("c1", "Zemin etüdü")).rejects.toThrow("bağlantı koptu");
    });
  });

  describe("removeByTitle", () => {
    it("removes the favourite whatever its casing", async () => {
      prisma.companyFavouriteTask.findMany.mockResolvedValue([
        favourite("f1", "İMAR DURUMU", 1),
        favourite("f2", "Zemin etüdü", 2),
      ]);

      await service.removeByTitle("c1", "imar durumu");

      expect(prisma.companyFavouriteTask.deleteMany).toHaveBeenCalledWith({
        where: { companyId: "c1", id: { in: ["f1"] } },
      });
    });

    it("does nothing when the title is not a favourite", async () => {
      prisma.companyFavouriteTask.findMany.mockResolvedValue([favourite("f1", "Zemin etüdü", 1)]);

      await expect(service.removeByTitle("c1", "Ruhsat")).resolves.toEqual({ success: true });
      expect(prisma.companyFavouriteTask.deleteMany).not.toHaveBeenCalled();
    });
  });
});

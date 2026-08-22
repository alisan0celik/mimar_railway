import { BadRequestException, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../../common/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { ProgressService } from "./progress.service";

describe("ProgressService", () => {
  const prisma = {
    project: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    section: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    progressPayment: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    financeRecord: {
      aggregate: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    company: {
      findUnique: jest.fn(),
    },
    companyWorkItem: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const notificationsService = { createForUser: jest.fn().mockResolvedValue({}) };

  const service = new ProgressService(
    prisma as unknown as PrismaService,
    notificationsService as unknown as NotificationsService,
  );

  const sections = [
    { id: "s1", name: "Mimari", amount: 1_500_000, costAmount: 1_000_000, progress: 60 },
    { id: "s2", name: "Statik", amount: 500_000, costAmount: 300_000, progress: 100 },
    { id: "s3", name: "Mekanik", amount: 1_000_000, costAmount: 700_000, progress: 0 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.project.findFirst.mockResolvedValue({ id: "p1", name: "Blok A", budget: 3_000_000 });
    prisma.project.update.mockResolvedValue({});
    prisma.user.findUnique.mockResolvedValue({ fullName: "Ali" });
    prisma.section.findMany.mockResolvedValue(sections);
    prisma.financeRecord.aggregate.mockResolvedValue({ _sum: { amount: 0 } });
    prisma.progressPayment.create.mockImplementation(({ data }: any) => Promise.resolve(data));
    prisma.progressPayment.update.mockResolvedValue({});
    prisma.financeRecord.create.mockResolvedValue({ id: "fr1" });
    prisma.financeRecord.deleteMany.mockResolvedValue({ count: 1 });
    prisma.companyWorkItem.findMany.mockResolvedValue([]);
    prisma.companyWorkItem.findFirst.mockResolvedValue(null);
    prisma.companyWorkItem.create.mockImplementation(({ data }: any) => Promise.resolve(data));
    prisma.companyWorkItem.deleteMany.mockResolvedValue({ count: 1 });
    prisma.section.createMany.mockResolvedValue({ count: 0 });
    prisma.user.findMany.mockResolvedValue([]);
    prisma.company.findUnique.mockResolvedValue({ ownerId: "owner-1" });
    prisma.project.findUnique.mockResolvedValue({ name: "Blok A" });
  });

  it("rejects a project from another company", async () => {
    prisma.project.findFirst.mockResolvedValue(null);
    await expect(service.listSections("other", "p1")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("bills the item's full earned amount on its first progress payment", async () => {
    prisma.section.findFirst.mockResolvedValue(sections[0]);
    prisma.progressPayment.findMany.mockResolvedValue([]);

    const payment: any = await service.createPayment("c1", "p1", { sectionId: "s1" }, "u1");

    expect(payment.number).toBe(1);
    expect(payment.sectionId).toBe("s1");
    // Mimari: 1.500.000 x %60
    expect(payment.cumulativeAmount).toBe(900_000);
    expect(payment.previousAmount).toBe(0);
    expect(payment.amount).toBe(900_000);
    expect(payment.status).toBe("draft");
  });

  it("numbers progress payments within the item, not the project", async () => {
    prisma.section.findFirst.mockResolvedValue(sections[0]);
    prisma.progressPayment.findMany.mockResolvedValue([
      { amount: 400_000, status: "paid", number: 1 },
      { amount: 200_000, status: "draft", number: 2 },
    ]);

    const payment: any = await service.createPayment("c1", "p1", { sectionId: "s1" }, "u1");

    expect(payment.number).toBe(3);
    expect(payment.previousAmount).toBe(600_000);
    expect(payment.amount).toBe(300_000);
  });

  it("only counts the item's own earlier payments in the same direction", async () => {
    prisma.section.findFirst.mockResolvedValue(sections[0]);
    prisma.progressPayment.findMany.mockResolvedValue([]);

    await service.createPayment("c1", "p1", { sectionId: "s1" }, "u1");

    expect(prisma.progressPayment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { projectId: "p1", sectionId: "s1", direction: "incoming" },
      }),
    );
  });

  it("ignores cancelled payments when working out what is already billed", async () => {
    prisma.section.findFirst.mockResolvedValue(sections[0]);
    prisma.progressPayment.findMany.mockResolvedValue([
      { amount: 900_000, status: "cancelled", number: 1 },
    ]);

    const payment: any = await service.createPayment("c1", "p1", { sectionId: "s1" }, "u1");

    expect(payment.previousAmount).toBe(0);
    expect(payment.amount).toBe(900_000);
  });

  it("refuses to bill when no further work has been earned on the item", async () => {
    prisma.section.findFirst.mockResolvedValue(sections[0]);
    prisma.progressPayment.findMany.mockResolvedValue([
      { amount: 900_000, status: "draft", number: 1 },
    ]);

    await expect(
      service.createPayment("c1", "p1", { sectionId: "s1" }, "u1"),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("refuses to bill an item that is not in the project", async () => {
    prisma.section.findFirst.mockResolvedValue(null);

    await expect(
      service.createPayment("c1", "p1", { sectionId: "nope" }, "u1"),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("notifies the owner and office managers when a payment is issued", async () => {
    prisma.section.findFirst.mockResolvedValue(sections[0]);
    prisma.progressPayment.findMany.mockResolvedValue([]);
    prisma.user.findMany.mockResolvedValue([{ id: "manager-1" }]);
    prisma.progressPayment.create.mockResolvedValue({
      id: "pp1",
      number: 1,
      amount: 900_000,
      section: { name: "Mimari" },
    });

    await service.createPayment("c1", "p1", { sectionId: "s1" }, "u1");

    const notified = notificationsService.createForUser.mock.calls.map((call: any) => call[0].userId);
    expect(notified.sort()).toEqual(["manager-1", "owner-1"]);
    expect(notificationsService.createForUser).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining("Mimari 1 No'lu Hakediş") }),
    );
  });

  it("only deletes the last progress payment", async () => {
    prisma.progressPayment.findFirst
      .mockResolvedValueOnce({ id: "pp1", number: 1 })
      .mockResolvedValueOnce({ number: 3 });

    await expect(service.removePayment("c1", "p1", "pp1")).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.progressPayment.delete).not.toHaveBeenCalled();
  });

  it("deletes the last progress payment", async () => {
    prisma.progressPayment.findFirst
      .mockResolvedValueOnce({ id: "pp3", number: 3 })
      .mockResolvedValueOnce({ number: 3 });

    await expect(service.removePayment("c1", "p1", "pp3")).resolves.toEqual({ success: true });
    expect(prisma.progressPayment.delete).toHaveBeenCalledWith({ where: { id: "pp3" } });
  });

  it("recalculates the project progress after a work item changes", async () => {
    prisma.section.updateMany.mockResolvedValue({ count: 1 });
    prisma.section.findFirst.mockResolvedValue(sections[0]);

    await service.updateSection("c1", "p1", "s1", { progress: 80 }, "u1");

    expect(prisma.project.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { sectionProgress: expect.closeTo(46.67, 2) },
    });
  });

  it("clamps an out-of-range progress value", async () => {
    prisma.section.updateMany.mockResolvedValue({ count: 1 });
    prisma.section.findFirst.mockResolvedValue(sections[0]);

    await service.updateSection("c1", "p1", "s1", { progress: 250 }, "u1");

    expect(prisma.section.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ progress: 100 }) }),
    );
  });

  it("subtracts collections from the billed total in the summary", async () => {
    prisma.progressPayment.findMany.mockResolvedValue([
      { amount: 1_100_000, status: "draft" },
    ]);
    prisma.financeRecord.aggregate.mockResolvedValue({ _sum: { amount: 400_000 } });

    const summary = await service.getSummary("c1", "p1");

    expect(summary.earnedAmount).toBe(1_400_000);
    expect(summary.billedAmount).toBe(1_100_000);
    expect(summary.billableAmount).toBe(300_000);
    expect(summary.collectedAmount).toBe(400_000);
    expect(summary.outstandingAmount).toBe(700_000);
  });

  it("records a collection when a payment is marked paid", async () => {
    prisma.progressPayment.findFirst.mockResolvedValue({
      id: "pp1",
      number: 1,
      amount: 1_400_000,
      status: "draft",
      financeRecordId: null,
      projectId: "p1",
      companyId: "c1",
      createdById: "u1",
      issueDate: new Date("2026-08-21T00:00:00.000Z"),
    });

    await service.updatePayment("c1", "p1", "pp1", { status: "paid" });

    expect(prisma.financeRecord.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "collection",
          amount: 1_400_000,
          projectId: "p1",
          description: "1 No'lu Hakediş",
        }),
      }),
    );
    expect(prisma.progressPayment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "paid", financeRecordId: "fr1" }),
      }),
    );
  });

  it("removes the collection when a paid payment goes back to draft", async () => {
    prisma.progressPayment.findFirst.mockResolvedValue({
      id: "pp1",
      number: 1,
      amount: 1_400_000,
      status: "paid",
      financeRecordId: "fr1",
      projectId: "p1",
      companyId: "c1",
      createdById: "u1",
      issueDate: new Date(),
    });

    await service.updatePayment("c1", "p1", "pp1", { status: "draft" });

    expect(prisma.financeRecord.deleteMany).toHaveBeenCalledWith({ where: { id: "fr1" } });
    expect(prisma.progressPayment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "draft", financeRecordId: null }),
      }),
    );
  });

  it("leaves the collection alone when only the note changes", async () => {
    prisma.progressPayment.findFirst.mockResolvedValue({
      id: "pp1",
      number: 1,
      amount: 1_000,
      status: "paid",
      financeRecordId: "fr1",
      projectId: "p1",
      companyId: "c1",
      createdById: "u1",
      issueDate: new Date(),
    });

    await service.updatePayment("c1", "p1", "pp1", { note: "kontrol edildi" });

    expect(prisma.financeRecord.create).not.toHaveBeenCalled();
    expect(prisma.financeRecord.deleteMany).not.toHaveBeenCalled();
  });

  it("deletes the linked collection along with the payment", async () => {
    prisma.progressPayment.findFirst
      .mockResolvedValueOnce({ id: "pp3", number: 3, financeRecordId: "fr9" })
      .mockResolvedValueOnce({ number: 3 });

    await service.removePayment("c1", "p1", "pp3");

    expect(prisma.financeRecord.deleteMany).toHaveBeenCalledWith({ where: { id: "fr9" } });
  });

  it("does not duplicate a favourite that already exists", async () => {
    prisma.companyWorkItem.findFirst.mockResolvedValue({ id: "w1", name: "Kaba İnşaat" });

    const result: any = await service.addFavourite("c1", "kaba inşaat");

    expect(result.id).toBe("w1");
    expect(prisma.companyWorkItem.create).not.toHaveBeenCalled();
  });

  it("rejects a favourite name that is too short", async () => {
    await expect(service.addFavourite("c1", "a")).rejects.toBeInstanceOf(BadRequestException);
  });

  it("only applies favourites the project does not already have", async () => {
    prisma.companyWorkItem.findMany.mockResolvedValue([
      { name: "Kaba İnşaat" },
      { name: "Sıva" },
    ]);
    prisma.section.findMany.mockResolvedValue([
      { id: "s1", name: "kaba inşaat", order: 1, amount: 0, progress: 0 },
    ]);

    await service.applyFavourites("c1", "p1", "u1");

    expect(prisma.section.createMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({ name: "Sıva", order: 2 })],
    });
  });

  it("writes nothing when every favourite is already in the project", async () => {
    prisma.companyWorkItem.findMany.mockResolvedValue([{ name: "Sıva" }]);
    prisma.section.findMany.mockResolvedValue([
      { id: "s1", name: "Sıva", order: 1, amount: 0, progress: 0 },
    ]);

    await service.applyFavourites("c1", "p1", "u1");

    expect(prisma.section.createMany).not.toHaveBeenCalled();
  });

  it("bills the subcontractor from the item's cost, not its sale price", async () => {
    prisma.section.findFirst.mockResolvedValue(sections[0]);
    prisma.progressPayment.findMany.mockResolvedValue([]);

    const payment: any = await service.createPayment(
      "c1",
      "p1",
      { sectionId: "s1", direction: "outgoing" },
      "u1",
    );

    // Mimari maliyeti 1.000.000 x %60
    expect(payment.amount).toBe(600_000);
    expect(payment.direction).toBe("outgoing");
    expect(payment.number).toBe(1);
  });

  it("numbers each direction separately on the same item", async () => {
    prisma.section.findFirst.mockResolvedValue(sections[0]);
    // Taşeron tarafında yalnızca outgoing kayıtlar sorgulanır
    prisma.progressPayment.findMany.mockResolvedValue([
      { amount: 200_000, status: "paid", number: 1 },
    ]);

    const payment: any = await service.createPayment(
      "c1",
      "p1",
      { sectionId: "s1", direction: "outgoing" },
      "u1",
    );

    expect(payment.number).toBe(2);
    expect(payment.previousAmount).toBe(200_000);
    expect(payment.amount).toBe(400_000);
  });

  it("records an expense when a subcontractor payment is marked paid", async () => {
    prisma.progressPayment.findFirst.mockResolvedValue({
      id: "pp1",
      number: 1,
      amount: 600_000,
      status: "draft",
      direction: "outgoing",
      financeRecordId: null,
      projectId: "p1",
      companyId: "c1",
      createdById: "u1",
      issueDate: new Date("2026-08-23T00:00:00.000Z"),
      section: { name: "Mimari" },
    });

    await service.updatePayment("c1", "p1", "pp1", { status: "paid" });

    expect(prisma.financeRecord.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "expense",
          amount: 600_000,
          description: "Mimari 1 No'lu Taşeron Hakedişi",
        }),
      }),
    );
  });

  it("reports the margin between what is earned and what it costs", async () => {
    prisma.progressPayment.findMany.mockResolvedValue([]);

    const summary = await service.getSummary("c1", "p1");

    // Hak edilen 1.400.000, doğmuş maliyet 900.000
    expect(summary.earnedAmount).toBe(1_400_000);
    expect(summary.earnedCost).toBe(900_000);
    expect(summary.marginAmount).toBe(500_000);
    expect(summary.costTotal).toBe(2_000_000);
  });
});

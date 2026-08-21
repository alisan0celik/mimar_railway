import { BadRequestException, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../../common/prisma.service";
import { ProgressService } from "./progress.service";

describe("ProgressService", () => {
  const prisma = {
    project: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    section: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    progressPayment: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    financeRecord: {
      aggregate: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  const service = new ProgressService(prisma as unknown as PrismaService);

  const sections = [
    { id: "s1", amount: 1_500_000, progress: 60 },
    { id: "s2", amount: 500_000, progress: 100 },
    { id: "s3", amount: 1_000_000, progress: 0 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.project.findFirst.mockResolvedValue({ id: "p1", name: "Blok A", budget: 3_000_000 });
    prisma.project.update.mockResolvedValue({});
    prisma.user.findUnique.mockResolvedValue({ fullName: "Ali" });
    prisma.section.findMany.mockResolvedValue(sections);
    prisma.financeRecord.aggregate.mockResolvedValue({ _sum: { amount: 0 } });
    prisma.progressPayment.create.mockImplementation(({ data }: any) => Promise.resolve(data));
  });

  it("rejects a project from another company", async () => {
    prisma.project.findFirst.mockResolvedValue(null);
    await expect(service.listSections("other", "p1")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("bills the full earned amount on the first progress payment", async () => {
    prisma.progressPayment.findMany.mockResolvedValue([]);

    const payment: any = await service.createPayment("c1", "p1", {}, "u1");

    expect(payment.number).toBe(1);
    expect(payment.cumulativeAmount).toBe(1_400_000);
    expect(payment.previousAmount).toBe(0);
    expect(payment.amount).toBe(1_400_000);
    expect(payment.status).toBe("draft");
  });

  it("bills only the difference since the previous payments", async () => {
    prisma.progressPayment.findMany.mockResolvedValue([
      { amount: 900_000, status: "paid", number: 1 },
      { amount: 200_000, status: "approved", number: 2 },
    ]);

    const payment: any = await service.createPayment("c1", "p1", {}, "u1");

    expect(payment.number).toBe(3);
    expect(payment.previousAmount).toBe(1_100_000);
    expect(payment.amount).toBe(300_000);
  });

  it("ignores cancelled payments when working out what is already billed", async () => {
    prisma.progressPayment.findMany.mockResolvedValue([
      { amount: 900_000, status: "cancelled", number: 1 },
    ]);

    const payment: any = await service.createPayment("c1", "p1", {}, "u1");

    expect(payment.previousAmount).toBe(0);
    expect(payment.amount).toBe(1_400_000);
  });

  it("refuses to bill when no further work has been earned", async () => {
    prisma.progressPayment.findMany.mockResolvedValue([
      { amount: 1_400_000, status: "approved", number: 1 },
    ]);

    await expect(service.createPayment("c1", "p1", {}, "u1")).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("refuses to bill a project with no work items", async () => {
    prisma.section.findMany.mockResolvedValue([]);
    prisma.progressPayment.findMany.mockResolvedValue([]);

    await expect(service.createPayment("c1", "p1", {}, "u1")).rejects.toBeInstanceOf(
      BadRequestException,
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
      { amount: 1_100_000, status: "approved" },
    ]);
    prisma.financeRecord.aggregate.mockResolvedValue({ _sum: { amount: 400_000 } });

    const summary = await service.getSummary("c1", "p1");

    expect(summary.earnedAmount).toBe(1_400_000);
    expect(summary.billedAmount).toBe(1_100_000);
    expect(summary.billableAmount).toBe(300_000);
    expect(summary.collectedAmount).toBe(400_000);
    expect(summary.outstandingAmount).toBe(700_000);
  });
});

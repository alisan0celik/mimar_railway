import {
  calculateGlobalFinanceSummary,
  calculateProjectFinanceSummary,
  hasFinanceActivity,
} from "./finance-summary.utils";

function makeRecord(
  overrides: Partial<{
    id: string;
    type: string;
    amount: number;
    date: Date;
    description: string | null;
  }> = {},
) {
  return {
    id: overrides.id ?? "rec-1",
    type: overrides.type ?? "collection",
    amount: overrides.amount ?? 0,
    date: overrides.date ?? new Date("2026-06-11"),
    description: overrides.description ?? null,
    paidBy: null,
    category: null,
  };
}

describe("calculateProjectFinanceSummary", () => {
  it("calculates collection-only project", () => {
    const summary = calculateProjectFinanceSummary({
      projectId: "p1",
      projectName: "Proje A",
      customerName: "Müşteri",
      budget: 1_000_000,
      financeRecords: [
        makeRecord({ id: "1", type: "collection", amount: 250_000 }),
      ],
    });

    expect(summary.receivedAmount).toBe(250_000);
    expect(summary.remainingAmount).toBe(750_000);
    expect(summary.profitAmount).toBe(250_000);
    expect(summary.expenseAmount).toBe(0);
    expect(summary.hasFinanceSetup).toBe(true);
  });

  it("includes consultant payments in total expense", () => {
    const summary = calculateProjectFinanceSummary({
      projectId: "p2",
      projectName: "Proje B",
      customerName: "Müşteri",
      budget: 2_000_000,
      financeRecords: [
        makeRecord({ id: "1", type: "collection", amount: 1_000_000 }),
        makeRecord({ id: "2", type: "consultant-payment", amount: 200_000 }),
        makeRecord({ id: "3", type: "expense", amount: 100_000 }),
      ],
    });

    expect(summary.receivedAmount).toBe(1_000_000);
    expect(summary.expenseAmount).toBe(300_000);
    expect(summary.profitAmount).toBe(700_000);
    expect(summary.remainingAmount).toBe(1_000_000);
    expect(summary.transactions[1].type).toBe("expense");
  });

  it("handles overpayment", () => {
    const summary = calculateProjectFinanceSummary({
      projectId: "p3",
      projectName: "Proje C",
      customerName: "Müşteri",
      budget: 500_000,
      financeRecords: [
        makeRecord({ id: "1", type: "collection", amount: 600_000 }),
      ],
    });

    expect(summary.remainingAmount).toBe(0);
    expect(summary.overpaymentAmount).toBe(100_000);
  });

  it("handles budget=0 as no finance setup", () => {
    const summary = calculateProjectFinanceSummary({
      projectId: "p4",
      projectName: "Proje D",
      customerName: "Müşteri",
      budget: null,
      financeRecords: [],
    });

    expect(summary.agreedAmount).toBe(0);
    expect(summary.hasFinanceSetup).toBe(false);
    expect(hasFinanceActivity(summary)).toBe(false);
  });
});

describe("calculateGlobalFinanceSummary", () => {
  it("aggregates project summaries", () => {
    const projects = [
      calculateProjectFinanceSummary({
        projectId: "p1",
        projectName: "A",
        customerName: "X",
        budget: 1_000_000,
        financeRecords: [makeRecord({ type: "collection", amount: 400_000 })],
      }),
      calculateProjectFinanceSummary({
        projectId: "p2",
        projectName: "B",
        customerName: "Y",
        budget: 2_000_000,
        financeRecords: [
          makeRecord({ id: "2", type: "collection", amount: 500_000 }),
          makeRecord({ id: "3", type: "expense", amount: 50_000 }),
        ],
      }),
    ];

    const global = calculateGlobalFinanceSummary(projects);

    expect(global.totalAgreedAmount).toBe(3_000_000);
    expect(global.totalReceivedAmount).toBe(900_000);
    expect(global.totalRemainingAmount).toBe(2_100_000);
    expect(global.totalProfitAmount).toBe(850_000);
    expect(global.projectCount).toBe(2);
  });
});

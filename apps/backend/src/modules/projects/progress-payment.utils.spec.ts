import {
  calculateBilledAmount,
  calculateContractTotal,
  calculateEarnedAmount,
  calculateOverallProgress,
  calculateProgressSummary,
  clampProgress,
} from "./progress-payment.utils";

describe("progress payment utils", () => {
  const items = [
    { amount: 1_500_000, progress: 60 },
    { amount: 500_000, progress: 100 },
    { amount: 1_000_000, progress: 0 },
  ];

  it("sums the contract from the work items", () => {
    expect(calculateContractTotal(items)).toBe(3_000_000);
  });

  it("earns each item in proportion to its progress", () => {
    expect(calculateEarnedAmount(items)).toBe(1_400_000);
  });

  it("weights overall progress by item value, not item count", () => {
    // Düz ortalama %53,3 verirdi; bedele göre ağırlıklı doğru sonuç %46,67.
    expect(calculateOverallProgress(items)).toBeCloseTo(46.67, 2);
  });

  it("falls back to a flat average when no amounts are entered yet", () => {
    expect(calculateOverallProgress([
      { amount: 0, progress: 40 },
      { amount: 0, progress: 60 },
    ])).toBe(50);
  });

  it("reports zero progress for a project with no items", () => {
    expect(calculateOverallProgress([])).toBe(0);
  });

  it("clamps progress into 0-100", () => {
    expect(clampProgress(-20)).toBe(0);
    expect(clampProgress(180)).toBe(100);
    expect(clampProgress(undefined)).toBe(0);
  });

  it("ignores cancelled progress payments when totalling", () => {
    expect(
      calculateBilledAmount([
        { amount: 400_000, status: "paid" },
        { amount: 300_000, status: "approved" },
        { amount: 100_000, status: "draft" },
        { amount: 900_000, status: "cancelled" },
      ]),
    ).toBe(800_000);
  });

  it("derives the billable and outstanding balances", () => {
    const summary = calculateProgressSummary({
      items,
      payments: [
        { amount: 900_000, status: "paid" },
        { amount: 200_000, status: "approved" },
      ],
      collectedAmount: 900_000,
    });

    expect(summary.earnedAmount).toBe(1_400_000);
    expect(summary.billedAmount).toBe(1_100_000);
    expect(summary.billableAmount).toBe(300_000);
    expect(summary.outstandingAmount).toBe(200_000);
  });

  it("never reports a negative balance when over-billed", () => {
    const summary = calculateProgressSummary({
      items: [{ amount: 100_000, progress: 50 }],
      payments: [{ amount: 80_000, status: "approved" }],
      collectedAmount: 95_000,
    });

    expect(summary.billableAmount).toBe(0);
    expect(summary.outstandingAmount).toBe(0);
  });

  it("keeps currency free of float artefacts", () => {
    expect(calculateEarnedAmount([{ amount: 0.1, progress: 100 }, { amount: 0.2, progress: 100 }])).toBe(0.3);
  });
});

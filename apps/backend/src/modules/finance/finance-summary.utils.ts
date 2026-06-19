import { normalizeFinanceRecordType } from "./finance-type.utils";

export type FinanceRecordInput = {
  id: string;
  type: string;
  amount: number;
  date: Date;
  description: string | null;
  paidBy?: string | null;
  category?: string | null;
};

export type ProjectFinanceSummary = {
  projectId: string;
  projectName: string;
  customerName: string;
  agreedAmount: number;
  receivedAmount: number;
  expenseAmount: number;
  remainingAmount: number;
  profitAmount: number;
  overpaymentAmount: number;
  hasFinanceSetup: boolean;
  currency: string;
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    date: string;
    description: string;
    paidBy: string;
  }>;
};

export type FinanceGlobalSummary = {
  totalAgreedAmount: number;
  totalReceivedAmount: number;
  totalRemainingAmount: number;
  totalExpenses: number;
  totalProfitAmount: number;
  projectCount: number;
};

function isExpenseType(type: string): boolean {
  return type === "expense" || type === "consultant-payment";
}

export function calculateProjectFinanceSummary(input: {
  projectId: string;
  projectName: string;
  customerName: string;
  budget: number | null;
  financeRecords: FinanceRecordInput[];
}): ProjectFinanceSummary {
  let receivedAmount = 0;
  let expenseAmount = 0;

  for (const record of input.financeRecords) {
    if (record.type === "collection") {
      receivedAmount += record.amount;
    } else if (isExpenseType(record.type)) {
      expenseAmount += record.amount;
    }
  }

  const agreedAmount = input.budget || 0;
  const profitAmount = receivedAmount - expenseAmount;
  const remainingAmount = Math.max(0, agreedAmount - receivedAmount);
  const overpaymentAmount = Math.max(0, receivedAmount - agreedAmount);

  return {
    projectId: input.projectId,
    projectName: input.projectName,
    customerName: input.customerName,
    agreedAmount,
    receivedAmount,
    expenseAmount,
    remainingAmount,
    profitAmount,
    overpaymentAmount,
    hasFinanceSetup: agreedAmount > 0,
    currency: "TRY",
    transactions: input.financeRecords.map((record) => ({
      id: record.id,
      type: normalizeFinanceRecordType(record.type),
      amount: record.amount,
      date: record.date.toISOString().split("T")[0],
      description: record.description || "",
      paidBy: record.paidBy || record.category || "",
    })),
  };
}

export function calculateGlobalFinanceSummary(
  projects: ProjectFinanceSummary[],
): FinanceGlobalSummary {
  return projects.reduce(
    (acc, project) => {
      acc.totalAgreedAmount += project.agreedAmount;
      acc.totalReceivedAmount += project.receivedAmount;
      acc.totalRemainingAmount += project.remainingAmount;
      acc.totalExpenses += project.expenseAmount;
      acc.totalProfitAmount += project.profitAmount;
      acc.projectCount += 1;
      return acc;
    },
    {
      totalAgreedAmount: 0,
      totalReceivedAmount: 0,
      totalRemainingAmount: 0,
      totalExpenses: 0,
      totalProfitAmount: 0,
      projectCount: 0,
    },
  );
}

export function hasFinanceActivity(project: ProjectFinanceSummary): boolean {
  return (
    project.hasFinanceSetup ||
    project.receivedAmount > 0 ||
    project.transactions.length > 0
  );
}

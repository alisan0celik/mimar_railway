import { apiClient } from "./client";

export const FINANCE_MAX_AMOUNT = 999_999_999_999;

export interface FinanceTransactionDTO {
  id: string;
  type: "collection" | "expense";
  amount: number;
  date: string;
  description: string;
  paidBy?: string;
  projectId?: string;
}

export interface FinanceSummaryDTO {
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
  transactions: FinanceTransactionDTO[];
}

export interface FinanceGlobalSummaryDTO {
  totalAgreedAmount: number;
  totalReceivedAmount: number;
  totalRemainingAmount: number;
  totalExpenses: number;
  totalProfitAmount: number;
  projectCount: number;
}

export interface FinanceSummariesResponseDTO {
  global: FinanceGlobalSummaryDTO;
  projects: FinanceSummaryDTO[];
}

export interface FinanceMutationResponseDTO {
  summary: FinanceSummariesResponseDTO;
  record?: FinanceTransactionDTO;
  message?: string;
}

export interface FinanceBudgetUpdateResponseDTO {
  message: string;
  summary: FinanceSummariesResponseDTO;
}

export function hasFinanceActivity(project: FinanceSummaryDTO): boolean {
  return (
    project.hasFinanceSetup ||
    project.receivedAmount > 0 ||
    project.transactions.length > 0
  );
}

export const financeApi = {
  getSummaries: () => apiClient.get<FinanceSummariesResponseDTO>("/finance/summary"),

  getProjectTransactions: (projectId: string) =>
    apiClient.get<FinanceTransactionDTO[]>(`/finance/project/${projectId}`),

  createTransaction: (data: Partial<FinanceTransactionDTO>) =>
    apiClient.post<FinanceMutationResponseDTO>("/finance", data),

  updateTransaction: (id: string, data: Partial<FinanceTransactionDTO>) =>
    apiClient.patch<FinanceMutationResponseDTO>(`/finance/${id}`, data),

  deleteTransaction: (id: string) =>
    apiClient.delete<FinanceMutationResponseDTO>(`/finance/${id}`),

  updateProjectBudget: (projectId: string, budget: number) =>
    apiClient.patch<FinanceBudgetUpdateResponseDTO>(`/finance/project/${projectId}/budget`, {
      budget,
    }),

  auditAnomalies: () => apiClient.get("/finance/audit/anomalies"),
};

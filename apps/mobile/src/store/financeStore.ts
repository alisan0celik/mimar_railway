import { create } from "zustand";
import { tKey } from "../shared/i18n";

import {
  financeApi,
  type FinanceGlobalSummaryDTO,
  type FinanceSummaryDTO,
  type FinanceSummariesResponseDTO,
} from "../services/api/finance.api";

type FetchSummariesOptions = {
  silent?: boolean;
};

type FinanceState = {
  summaries: FinanceSummaryDTO[];
  globalSummary: FinanceGlobalSummaryDTO | null;
  updatedAt: number;
  isLoading: boolean;
  error: string | null;

  fetchSummaries: (options?: FetchSummariesOptions) => Promise<void>;
  applySummaries: (data: FinanceSummariesResponseDTO) => void;
  getSummary: (projectId: string) => FinanceSummaryDTO | undefined;
};

const emptyGlobalSummary: FinanceGlobalSummaryDTO = {
  totalAgreedAmount: 0,
  totalReceivedAmount: 0,
  totalRemainingAmount: 0,
  totalExpenses: 0,
  totalProfitAmount: 0,
  projectCount: 0,
};

export const useFinanceStore = create<FinanceState>((set, get) => ({
  summaries: [],
  globalSummary: null,
  updatedAt: 0,
  isLoading: false,
  error: null,

  fetchSummaries: async (options) => {
    const hasCachedData = get().summaries.length > 0;
    const silent = options?.silent === true && hasCachedData;

    if (!silent) {
      set({ isLoading: true, error: null });
    }

    try {
      const res = await financeApi.getSummaries();
      set({
        summaries: res.data.projects,
        globalSummary: res.data.global,
        updatedAt: Date.now(),
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || tKey("finance.errors.loadFailed"),
        isLoading: false,
      });
    }
  },

  applySummaries: (data) => {
    set({
      summaries: data.projects,
      globalSummary: data.global,
      updatedAt: Date.now(),
      isLoading: false,
      error: null,
    });
  },

  getSummary: (projectId) => get().summaries.find((s) => s.projectId === projectId),
}));

export { emptyGlobalSummary };

export function refreshFinance(options?: FetchSummariesOptions) {
  return useFinanceStore.getState().fetchSummaries(options);
}

export function applyFinanceSummaries(data: FinanceSummariesResponseDTO) {
  useFinanceStore.getState().applySummaries(data);
}

export function useProjectFinanceSummary(projectId: string) {
  return useFinanceStore((state) =>
    state.summaries.find((summary) => summary.projectId === projectId),
  );
}

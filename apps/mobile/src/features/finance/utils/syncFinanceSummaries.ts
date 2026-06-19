import type { FinanceSummariesResponseDTO } from "../../../services/api/finance.api";
import { applyFinanceSummaries } from "../../../store/financeStore";

export function syncFinanceSummaries(summary?: FinanceSummariesResponseDTO) {
  if (summary) {
    applyFinanceSummaries(summary);
    return Promise.resolve();
  }

  return import("../../../store/financeStore").then(({ refreshFinance }) =>
    refreshFinance({ silent: true }),
  );
}

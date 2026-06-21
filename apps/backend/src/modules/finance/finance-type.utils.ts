export const FINANCE_RECORD_TYPES = ["collection", "expense"] as const;

export type FinanceRecordType = (typeof FINANCE_RECORD_TYPES)[number];

export function normalizeFinanceRecordType(type: string): FinanceRecordType {
  if (type === "collection") return "collection";
  return "expense";
}

export function mapFinanceRecordForResponse<T extends { type: string }>(record: T): T {
  return {
    ...record,
    type: normalizeFinanceRecordType(record.type),
  };
}

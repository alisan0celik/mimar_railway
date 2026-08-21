/**
 * Hakediş hesabı.
 *
 * Sözleşme, imalat kalemlerine (Section) bölünür; her kalemin bir bedeli ve
 * tamamlanma yüzdesi vardır. Hak edilen tutar bu ikisinin çarpımlarının
 * toplamıdır. Hakediş belgeleri kümülatif düzenlenir: yeni hakedişin net
 * tutarı, o ana kadar hak edilen toplamdan daha önce düzenlenmiş
 * hakedişlerin düşülmesiyle bulunur.
 */

export type ProgressItem = {
  amount: number;
  progress: number;
};

export type ProgressPaymentLike = {
  amount: number;
  status: string;
};

/** İptal edilmemiş, tutarı sayılan hakediş durumları. */
export const BILLABLE_PAYMENT_STATUSES = ["draft", "approved", "paid"] as const;

function toFiniteNumber(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

/** Yüzdeyi 0-100 aralığına sıkıştırır. */
export function clampProgress(value: number | null | undefined): number {
  const numeric = toFiniteNumber(value);
  if (numeric < 0) return 0;
  if (numeric > 100) return 100;
  return numeric;
}

/** Kuruş artıklarını temizler — float toplamları 0.30000000000000004 üretebiliyor. */
export function roundCurrency(value: number): number {
  return Math.round(toFiniteNumber(value) * 100) / 100;
}

export function calculateEarnedAmount(items: ProgressItem[]): number {
  const total = items.reduce(
    (sum, item) => sum + toFiniteNumber(item.amount) * (clampProgress(item.progress) / 100),
    0,
  );
  return roundCurrency(total);
}

export function calculateContractTotal(items: ProgressItem[]): number {
  return roundCurrency(items.reduce((sum, item) => sum + toFiniteNumber(item.amount), 0));
}

/**
 * Ağırlıklı toplam ilerleme yüzdesi.
 *
 * Bedeli girilmemiş kalemler ağırlık taşımadığı için, hiç bedel yoksa
 * kalemlerin düz ortalaması alınır; aksi halde yeni açılmış bir projede
 * ilerleme hep 0 görünürdü.
 */
export function calculateOverallProgress(items: ProgressItem[]): number {
  if (items.length === 0) return 0;

  const contractTotal = calculateContractTotal(items);
  if (contractTotal <= 0) {
    const average =
      items.reduce((sum, item) => sum + clampProgress(item.progress), 0) / items.length;
    return Math.round(average * 100) / 100;
  }

  const earned = calculateEarnedAmount(items);
  return Math.round((earned / contractTotal) * 10000) / 100;
}

export function calculateBilledAmount(payments: ProgressPaymentLike[]): number {
  const total = payments
    .filter((payment) =>
      BILLABLE_PAYMENT_STATUSES.includes(payment.status as (typeof BILLABLE_PAYMENT_STATUSES)[number]),
    )
    .reduce((sum, payment) => sum + toFiniteNumber(payment.amount), 0);
  return roundCurrency(total);
}

export type ProgressSummary = {
  contractTotal: number;
  earnedAmount: number;
  progressPercent: number;
  billedAmount: number;
  /** Hak edilmiş ama henüz hakedişe bağlanmamış tutar. */
  billableAmount: number;
  collectedAmount: number;
  /** Düzenlenmiş hakedişlerden henüz tahsil edilmemiş tutar. */
  outstandingAmount: number;
  itemCount: number;
};

export function calculateProgressSummary(input: {
  items: ProgressItem[];
  payments: ProgressPaymentLike[];
  collectedAmount: number;
}): ProgressSummary {
  const contractTotal = calculateContractTotal(input.items);
  const earnedAmount = calculateEarnedAmount(input.items);
  const billedAmount = calculateBilledAmount(input.payments);
  const collectedAmount = roundCurrency(input.collectedAmount);

  return {
    contractTotal,
    earnedAmount,
    progressPercent: calculateOverallProgress(input.items),
    billedAmount,
    // Negatife düşmesin: fazla hakediş düzenlenmişse borç yok, sıfır gösterilir.
    billableAmount: Math.max(roundCurrency(earnedAmount - billedAmount), 0),
    collectedAmount,
    outstandingAmount: Math.max(roundCurrency(billedAmount - collectedAmount), 0),
    itemCount: input.items.length,
  };
}

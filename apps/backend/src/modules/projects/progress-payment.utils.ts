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
  /** İşverene satış bedeli. Ekstralarda alacak tutarı. */
  amount: number;
  /** Taşerona maliyeti. Ekstralarda borç tutarı. */
  costAmount?: number;
  progress: number;
  /** "work" imalat kalemi, "extra" imalata bağlı olmayan alacak/borç. */
  kind?: string;
};

/** Ekstralar imalat sayılmaz: baştan tamamen hak edilmiş kabul edilir. */
export function isWorkItem(item: ProgressItem): boolean {
  return (item.kind ?? "work") === "work";
}

/** Ekstranın ilerlemesi her zaman %100'dür; girilen değer dikkate alınmaz. */
export function effectiveProgress(item: ProgressItem): number {
  return isWorkItem(item) ? clampProgress(item.progress) : 100;
}

/** Hakediş yönü: işverenden alınan / taşerona ödenen. */
export const PAYMENT_DIRECTIONS = ["incoming", "outgoing"] as const;
export type PaymentDirection = (typeof PAYMENT_DIRECTIONS)[number];

export type ProgressPaymentLike = {
  amount: number;
  status: string;
  direction?: string;
};

/** İptal edilmemiş, tutarı sayılan hakediş durumları. */
export const BILLABLE_PAYMENT_STATUSES = ["draft", "paid"] as const;

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
    (sum, item) => sum + toFiniteNumber(item.amount) * (effectiveProgress(item) / 100),
    0,
  );
  return roundCurrency(total);
}

/** İlerlemeye göre taşerona doğmuş maliyet. */
export function calculateEarnedCost(items: ProgressItem[]): number {
  const total = items.reduce(
    (sum, item) => sum + toFiniteNumber(item.costAmount) * (effectiveProgress(item) / 100),
    0,
  );
  return roundCurrency(total);
}

export function calculateCostTotal(items: ProgressItem[]): number {
  return roundCurrency(items.reduce((sum, item) => sum + toFiniteNumber(item.costAmount), 0));
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
  // Ekstralar hesaba katılmaz: fiyat farkı ya da avans yüzünden imalat
  // tamamlandığında yüzdenin %100'e ulaşamaması yanlış olurdu.
  const workItems = items.filter(isWorkItem);
  if (workItems.length === 0) return 0;

  const contractTotal = calculateContractTotal(workItems);
  if (contractTotal <= 0) {
    const average =
      workItems.reduce((sum, item) => sum + clampProgress(item.progress), 0) / workItems.length;
    return Math.round(average * 100) / 100;
  }

  const earned = calculateEarnedAmount(workItems);
  return Math.round((earned / contractTotal) * 10000) / 100;
}

/**
 * Belirli yöndeki, iptal edilmemiş hakedişlerin toplamı.
 *
 * Yön verilmezse "incoming" varsayılır: yön alanı eklenmeden önce düzenlenmiş
 * kayıtlarda bu alan yok ve hepsi işverenden alınan hakedişti.
 */
export function calculateBilledAmount(
  payments: ProgressPaymentLike[],
  direction: PaymentDirection = "incoming",
): number {
  const total = payments
    .filter(
      (payment) =>
        (payment.direction ?? "incoming") === direction &&
        BILLABLE_PAYMENT_STATUSES.includes(
          payment.status as (typeof BILLABLE_PAYMENT_STATUSES)[number],
        ),
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
  /** Kalemlerin taşerona toplam maliyeti. */
  costTotal: number;
  /** İlerlemeye göre taşerona doğmuş maliyet. */
  earnedCost: number;
  /** Taşerona düzenlenmiş hakediş toplamı. */
  costBilledAmount: number;
  /** Doğmuş ama taşeron hakedişine bağlanmamış maliyet. */
  costBillableAmount: number;
  /** Bu ana kadarki kâr: hak edilen − doğmuş maliyet. */
  marginAmount: number;
  itemCount: number;
};

export function calculateProgressSummary(input: {
  items: ProgressItem[];
  payments: ProgressPaymentLike[];
  collectedAmount: number;
}): ProgressSummary {
  const contractTotal = calculateContractTotal(input.items);
  const earnedAmount = calculateEarnedAmount(input.items);
  const billedAmount = calculateBilledAmount(input.payments, "incoming");
  const collectedAmount = roundCurrency(input.collectedAmount);

  const costTotal = calculateCostTotal(input.items);
  const earnedCost = calculateEarnedCost(input.items);
  const costBilledAmount = calculateBilledAmount(input.payments, "outgoing");

  return {
    contractTotal,
    earnedAmount,
    progressPercent: calculateOverallProgress(input.items),
    billedAmount,
    // Negatife düşmesin: fazla hakediş düzenlenmişse borç yok, sıfır gösterilir.
    billableAmount: Math.max(roundCurrency(earnedAmount - billedAmount), 0),
    collectedAmount,
    outstandingAmount: Math.max(roundCurrency(billedAmount - collectedAmount), 0),
    costTotal,
    earnedCost,
    costBilledAmount,
    costBillableAmount: Math.max(roundCurrency(earnedCost - costBilledAmount), 0),
    // Kâr negatif olabilir; zararı gizlemek yanlış olur.
    marginAmount: roundCurrency(earnedAmount - earnedCost),
    itemCount: input.items.length,
  };
}

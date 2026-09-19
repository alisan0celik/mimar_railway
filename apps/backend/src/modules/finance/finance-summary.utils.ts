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

/** Projenin imalat kalemi ya da ekstrası, finans ekranında gösterildiği haliyle. */
export type FinanceItemInput = {
  id: string;
  name: string;
  /** "work" imalat kalemi, "extra" imalata bağlı olmayan alacak/borç. */
  kind: string;
  /** İşverene satış bedeli. */
  amount: number;
  /** Taşerona maliyeti. */
  costAmount: number;
};

export type ProjectFinanceSummary = {
  projectId: string;
  projectName: string;
  customerName: string;
  agreedAmount: number;
  /**
   * Anlaşma tutarı imalat kalemlerinden mi türetildi?
   *
   * Türetildiyse projenin `budget` alanını yazmak ekranda hiçbir şeyi
   * değiştirmez; uygulama bu işarete bakıp düzenlemeyi kapatır ve kullanıcıyı
   * kalemlerin bulunduğu hakediş ekranına yönlendirir.
   */
  agreedAmountFromSections: boolean;
  receivedAmount: number;
  expenseAmount: number;
  remainingAmount: number;
  profitAmount: number;
  overpaymentAmount: number;
  hasFinanceSetup: boolean;
  currency: string;
  /**
   * Projenin imalat kalemleri ve ekstraları, hakediş ekranındaki sırayla.
   *
   * Kalem girilmiş proje, bedeli henüz yazılmamış olsa bile finansta
   * listelenir: kalem hakediş ekranında girildiği anda proje finansa düşer,
   * ayrıca "Finans Oluştur" gerekmez.
   */
  items: FinanceItemInput[];
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    date: string;
    description: string;
    paidBy: string;
    /** Hakedişten doğan kayıt: finans ekranından değiştirilemez. */
    locked: boolean;
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
  /** İmalat kalemleri ve ekstralar, gösterilecek sırayla. */
  items?: FinanceItemInput[];
}): ProjectFinanceSummary {
  const items = input.items ?? [];

  let receivedAmount = 0;
  let expenseAmount = 0;

  for (const record of input.financeRecords) {
    if (record.type === "collection") {
      receivedAmount += record.amount;
    } else if (isExpenseType(record.type)) {
      expenseAmount += record.amount;
    }
  }

  /*
   * Sözleşme bedeli, bedeli girilmiş kalemlerin toplamıdır.
   *
   * Proje açılırken elle yazılan bütçe ile kalem toplamı iki ayrı sayıydı ve
   * biri diğerinden habersiz olduğu için kaçınılmaz olarak ayrışıyordu.
   * Kalem kullanılmayan projelerde (ör. yalnız ofis işi) elle girilen bütçe
   * yedek olarak kullanılmaya devam eder.
   */
  const sectionTotal = items.reduce(
    (sum, item) => sum + (Number.isFinite(item.amount) ? item.amount : 0),
    0,
  );
  const agreedAmount = sectionTotal > 0 ? sectionTotal : input.budget || 0;
  const profitAmount = receivedAmount - expenseAmount;
  const remainingAmount = Math.max(0, agreedAmount - receivedAmount);
  const overpaymentAmount = Math.max(0, receivedAmount - agreedAmount);

  return {
    projectId: input.projectId,
    projectName: input.projectName,
    customerName: input.customerName,
    agreedAmount,
    agreedAmountFromSections: sectionTotal > 0,
    receivedAmount,
    expenseAmount,
    remainingAmount,
    profitAmount,
    overpaymentAmount,
    hasFinanceSetup: agreedAmount > 0,
    currency: "TRY",
    items,
    transactions: input.financeRecords.map((record) => ({
      id: record.id,
      type: normalizeFinanceRecordType(record.type),
      amount: record.amount,
      date: record.date.toISOString().split("T")[0],
      description: record.description || "",
      paidBy: record.paidBy || record.category || "",
      // Hakedişten doğan kayıtlar burada düzenlenemez; uygulama da
      // düzenleme ve silme düğmelerini bu işarete göre gizler.
      locked: record.category === "progress-payment",
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
    project.transactions.length > 0 ||
    project.items.length > 0
  );
}

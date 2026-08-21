/**
 * Proje açılırken oluşturulan varsayılan imalat kalemleri.
 *
 * Mimarlık ofisi ile müteahhit aynı ekranı kullanır ama işleri farklıdır:
 * ofis proje müellifliği disiplinlerine göre (mimari, statik, mekanik...),
 * müteahhit şantiyedeki imalat sırasına göre çalışır. Şirketin iş koluna
 * göre doğru liste önerilir; kullanıcı proje açarken değiştirebilir.
 */

export const BUSINESS_TYPES = ["architecture", "contractor", "both"] as const;
export type BusinessType = (typeof BUSINESS_TYPES)[number];

export const WORK_ITEM_TEMPLATES = ["architecture", "construction", "empty"] as const;
export type WorkItemTemplate = (typeof WORK_ITEM_TEMPLATES)[number];

const ARCHITECTURE_ITEMS = [
  "Mimari",
  "Statik",
  "Mekanik",
  "Elektrik",
  "Harita",
  "Jeoloji",
];

const CONSTRUCTION_ITEMS = [
  "Kaba İnşaat",
  "Duvar ve Sıva",
  "Şap ve Zemin Kaplama",
  "Mekanik Tesisat",
  "Elektrik Tesisatı",
  "İnce İşler",
  "Çevre Düzenleme",
];

export function getTemplateItems(template: WorkItemTemplate): string[] {
  if (template === "construction") return [...CONSTRUCTION_ITEMS];
  if (template === "empty") return [];
  return [...ARCHITECTURE_ITEMS];
}

/** Şirketin iş koluna göre öntanımlı şablon. "both" mimarlıkla başlar. */
export function defaultTemplateFor(businessType: string | null | undefined): WorkItemTemplate {
  return businessType === "contractor" ? "construction" : "architecture";
}

export function isWorkItemTemplate(value: unknown): value is WorkItemTemplate {
  return typeof value === "string" && WORK_ITEM_TEMPLATES.includes(value as WorkItemTemplate);
}

/**
 * Proje açılışında önerilen imalat kalemleri.
 *
 * Backend'deki work-item-templates.ts ile aynı listeleri taşır; kullanıcı
 * proje açarken hangi kalemlerin oluşacağını görüp değiştirebilsin diye
 * burada da tutulur. Seçim `workItems` olarak gönderildiği için sunucu
 * varsayılanı devreye girmez.
 */
export type WorkItemTemplate = "architecture" | "construction" | "empty";

export const WORK_ITEM_TEMPLATES: WorkItemTemplate[] = [
  "architecture",
  "construction",
  "empty",
];

const ARCHITECTURE_ITEMS = ["Mimari", "Statik", "Mekanik", "Elektrik", "Harita", "Jeoloji"];

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

/** Şirketin iş koluna göre öntanımlı şablon. */
export function defaultTemplateFor(businessType: string | null | undefined): WorkItemTemplate {
  return businessType === "contractor" ? "construction" : "architecture";
}

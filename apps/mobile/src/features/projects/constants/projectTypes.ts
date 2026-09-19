import { translate } from "../../../shared/i18n";
import type { Language } from "../../../shared/i18n/types";

export const PROJECT_TYPE_KEYS = ["residential", "office", "villa", "commercial", "mixed"] as const;

export type ProjectTypeKey = (typeof PROJECT_TYPE_KEYS)[number];

const LANGUAGES: readonly Language[] = ["tr", "en"];

/**
 * Kayıtlı proje türünün anahtarı; tanınmazsa `null`.
 *
 * Proje türü veritabanına anahtar olarak değil, proje açılırken seçili dildeki
 * etiketiyle ("Konut", "Residential") yazılıyor. Düzenleme ekranında doğru
 * çipi seçili gösterebilmek için etiket her iki dildeki karşılıklarla
 * eşleştiriliyor.
 */
export function projectTypeKeyOf(label: string | null | undefined): ProjectTypeKey | null {
  if (!label) return null;
  const trimmed = label.trim();
  return (
    PROJECT_TYPE_KEYS.find((key) =>
      LANGUAGES.some((language) => translate(language, `projects.types.${key}`) === trimmed),
    ) ?? null
  );
}

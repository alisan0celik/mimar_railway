import { useCallback } from "react";

import { useAppStore } from "../../store/appStore";
import { type Sector, useSectorStore } from "../../store/sectorStore";
import { en } from "./translations/en";
import { municipality } from "./translations/sectors/municipality";
import { tr } from "./translations/tr";
import type { Language, TranslationTree } from "./types";

const catalogs: Record<Language, TranslationTree> = { tr, en };

/** Sektöre göre ana çevirinin üstüne yazılan metinler (yalnızca değişen anahtarlar). */
const sectorCatalogs: Partial<Record<Sector, Record<Language, TranslationTree>>> = {
  municipality,
};

export type { Language };

export function languageLabel(lang: Language): string {
  return lang === "tr" ? tr.language.turkish : tr.language.english;
}

function resolve(tree: TranslationTree, path: string): string | undefined {
  const parts = path.split(".");
  let node: string | TranslationTree | undefined = tree;
  for (const part of parts) {
    if (typeof node !== "object" || node === null) return undefined;
    node = node[part];
  }
  return typeof node === "string" ? node : undefined;
}

export function translate(
  lang: Language,
  key: string,
  params?: Record<string, string | number>,
  sector: Sector = "default",
): string {
  const sectorCatalog = sectorCatalogs[sector];
  const raw =
    (sectorCatalog ? resolve(sectorCatalog[lang], key) : undefined) ??
    resolve(catalogs[lang], key) ??
    resolve(catalogs.tr, key) ??
    key;
  if (!params) return raw;
  return Object.entries(params).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    raw,
  );
}

export function useTranslation() {
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);
  // Sektör değişince (ör. belediyeye katılınca) metinler yeniden çizilsin.
  const sector = useSectorStore((s) => s.sector);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) =>
      translate(language, key, params, sector),
    [language, sector],
  );

  return {
    t,
    language,
    languageLabel: languageLabel(language),
    setLanguage,
  };
}

export function useLocaleCode(): string {
  const language = useAppStore((s) => s.language);
  return language === "en" ? "en-US" : "tr-TR";
}

/** Non-React helper for stores and services. */
export function tKey(key: string, params?: Record<string, string | number>): string {
  return translate(
    useAppStore.getState().language,
    key,
    params,
    useSectorStore.getState().sector,
  );
}

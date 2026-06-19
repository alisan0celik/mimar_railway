export type Language = "tr" | "en";

export type TranslationTree = {
  [key: string]: string | TranslationTree;
};

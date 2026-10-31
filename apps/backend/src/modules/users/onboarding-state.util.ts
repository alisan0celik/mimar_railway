// Mobil tanıtım turlarının kullanıcı bazlı durumu. İstemci serbest JSON
// gönderebildiği için yalnızca bilinen alanlar, sınırlı boyutta saklanır.

export type OnboardingState = {
  seenTours: Record<string, number>;
  knownPermissions: string[];
  checklistDismissed: boolean;
  checklistDone: Record<string, boolean>;
  welcomeSeen: boolean;
  updatedAt: string | null;
};

const MAX_TOURS = 100;
const MAX_PERMISSIONS = 200;
const MAX_CHECKLIST_ITEMS = 50;
const MAX_KEY_LENGTH = 64;

export function emptyOnboardingState(): OnboardingState {
  return {
    seenTours: {},
    knownPermissions: [],
    checklistDismissed: false,
    checklistDone: {},
    welcomeSeen: false,
    updatedAt: null,
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidKey(key: string): boolean {
  return key.length > 0 && key.length <= MAX_KEY_LENGTH;
}

function sanitizeSeenTours(value: unknown): Record<string, number> | undefined {
  if (!isPlainObject(value)) return undefined;
  const result: Record<string, number> = {};
  for (const [key, version] of Object.entries(value).slice(0, MAX_TOURS)) {
    if (!isValidKey(key)) continue;
    if (typeof version !== "number" || !Number.isFinite(version)) continue;
    result[key] = Math.max(0, Math.floor(version));
  }
  return result;
}

function sanitizeChecklistDone(value: unknown): Record<string, boolean> | undefined {
  if (!isPlainObject(value)) return undefined;
  const result: Record<string, boolean> = {};
  for (const [key, done] of Object.entries(value).slice(0, MAX_CHECKLIST_ITEMS)) {
    if (!isValidKey(key) || typeof done !== "boolean") continue;
    result[key] = done;
  }
  return result;
}

function sanitizePermissions(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const unique = new Set<string>();
  for (const item of value) {
    if (typeof item === "string" && isValidKey(item)) unique.add(item);
    if (unique.size >= MAX_PERMISSIONS) break;
  }
  return [...unique];
}

/** Gelen parçadaki geçerli alanları ayıklar; geçersiz alanlar yok sayılır. */
export function sanitizeOnboardingPatch(input: unknown): Partial<OnboardingState> {
  if (!isPlainObject(input)) return {};
  const patch: Partial<OnboardingState> = {};

  const seenTours = sanitizeSeenTours(input.seenTours);
  if (seenTours) patch.seenTours = seenTours;

  const knownPermissions = sanitizePermissions(input.knownPermissions);
  if (knownPermissions) patch.knownPermissions = knownPermissions;

  const checklistDone = sanitizeChecklistDone(input.checklistDone);
  if (checklistDone) patch.checklistDone = checklistDone;

  if (typeof input.checklistDismissed === "boolean") {
    patch.checklistDismissed = input.checklistDismissed;
  }
  if (typeof input.welcomeSeen === "boolean") {
    patch.welcomeSeen = input.welcomeSeen;
  }

  return patch;
}

/** Veritabanındaki ham değeri her zaman eksiksiz bir duruma çevirir. */
export function normalizeOnboardingState(stored: unknown): OnboardingState {
  const base = emptyOnboardingState();
  if (!isPlainObject(stored)) return base;
  const updatedAt = typeof stored.updatedAt === "string" ? stored.updatedAt : null;
  return { ...base, ...sanitizeOnboardingPatch(stored), updatedAt };
}

/** Üst düzey alanlar bütün olarak değiştirilir; gönderilmeyen alanlar korunur. */
export function mergeOnboardingState(
  stored: unknown,
  patch: unknown,
  now: Date = new Date(),
): OnboardingState {
  return {
    ...normalizeOnboardingState(stored),
    ...sanitizeOnboardingPatch(patch),
    updatedAt: now.toISOString(),
  };
}

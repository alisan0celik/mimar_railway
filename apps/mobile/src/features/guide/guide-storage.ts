import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

import { usersApi } from "../../services/api/users.api";
import type { OnboardingState } from "./types";

const STORAGE_PREFIX = "guide.onboarding.v1.";

type StoredEntry = {
  state: OnboardingState;
  /** Sunucuya henüz yazılamamış yerel değişiklik var. */
  dirty: boolean;
};

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

/** Yerelden veya sunucudan gelen değeri eksiksiz bir duruma çevirir. */
export function normalizeOnboardingState(raw: unknown): OnboardingState {
  const state = emptyOnboardingState();
  if (!isPlainObject(raw)) return state;

  if (isPlainObject(raw.seenTours)) {
    for (const [key, version] of Object.entries(raw.seenTours)) {
      if (typeof version === "number" && Number.isFinite(version)) state.seenTours[key] = version;
    }
  }
  if (Array.isArray(raw.knownPermissions)) {
    state.knownPermissions = raw.knownPermissions.filter(
      (code): code is string => typeof code === "string",
    );
  }
  if (isPlainObject(raw.checklistDone)) {
    for (const [key, done] of Object.entries(raw.checklistDone)) {
      if (typeof done === "boolean") state.checklistDone[key] = done;
    }
  }
  if (typeof raw.checklistDismissed === "boolean") state.checklistDismissed = raw.checklistDismissed;
  if (typeof raw.welcomeSeen === "boolean") state.welcomeSeen = raw.welcomeSeen;
  if (typeof raw.updatedAt === "string") state.updatedAt = raw.updatedAt;
  return state;
}

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

export async function loadLocalState(userId: string): Promise<StoredEntry | null> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: unknown; dirty?: unknown };
    return { state: normalizeOnboardingState(parsed.state), dirty: parsed.dirty === true };
  } catch {
    return null;
  }
}

export async function saveLocalState(userId: string, entry: StoredEntry): Promise<void> {
  try {
    await AsyncStorage.setItem(storageKey(userId), JSON.stringify(entry));
  } catch {
    // Tanıtım durumu kaybolursa en kötü ihtimalle bir tur tekrar gösterilir.
  }
}

/**
 * Sunucu bu uç noktayı tanımıyorsa (henüz güncellenmemiş backend) oturum
 * boyunca bir daha denenmez; durum yalnızca cihazda tutulur.
 */
let remoteUnsupported = false;

function markUnsupportedIfMissing(error: unknown) {
  if (!axios.isAxiosError(error)) return;
  const status = error.response?.status;
  if (status === 404 || status === 405 || status === 501) remoteUnsupported = true;
}

export async function fetchRemoteState(): Promise<OnboardingState | null> {
  if (remoteUnsupported) return null;
  try {
    const { data } = await usersApi.getOnboardingState();
    return normalizeOnboardingState(data);
  } catch (error) {
    markUnsupportedIfMissing(error);
    return null;
  }
}

export async function pushRemoteState(state: OnboardingState): Promise<boolean> {
  if (remoteUnsupported) return false;
  try {
    await usersApi.updateOnboardingState({
      seenTours: state.seenTours,
      knownPermissions: state.knownPermissions,
      checklistDismissed: state.checklistDismissed,
      checklistDone: state.checklistDone,
      welcomeSeen: state.welcomeSeen,
    });
    return true;
  } catch (error) {
    markUnsupportedIfMissing(error);
    return false;
  }
}

function timestamp(state: OnboardingState | null | undefined): number {
  if (!state?.updatedAt) return 0;
  const value = Date.parse(state.updatedAt);
  return Number.isNaN(value) ? 0 : value;
}

/** Son yazan kazanır: cihazlar arasında sıfırlama gibi işlemler de doğru taşınır. */
export function pickNewerState(
  local: StoredEntry | null,
  remote: OnboardingState | null,
): { state: OnboardingState; needsPush: boolean } {
  if (!remote) {
    return { state: local?.state ?? emptyOnboardingState(), needsPush: local?.dirty ?? false };
  }
  if (!local) return { state: remote, needsPush: false };
  if (timestamp(remote) > timestamp(local.state)) return { state: remote, needsPush: false };
  return { state: local.state, needsPush: local.dirty };
}

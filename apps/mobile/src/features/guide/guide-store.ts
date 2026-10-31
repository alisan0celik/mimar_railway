import type { UserDTO } from "@mimar/shared";
import { create } from "zustand";

import { useAuthStore } from "../../store/authStore";
import {
  emptyOnboardingState,
  fetchRemoteState,
  loadLocalState,
  pickNewerState,
  pushRemoteState,
  saveLocalState,
} from "./guide-storage";
import { addedPermissions, resolveNewlyUnlockedSteps, resolveTourSteps } from "./tour-filter";
import { TOURS } from "./tours";
import type { ChecklistItemId, OnboardingState, ResolvedStep, TourId } from "./types";

export type GuideQueueItem =
  | {
      kind: "tour";
      id: TourId | "newPermissions";
      /** Öğenin ait olduğu ekran; ekran odaktan çıkınca öğe düşürülür. */
      screen: TourId;
      steps: ResolvedStep[];
      persistSeen: boolean;
    }
  | { kind: "welcome"; id: "welcome"; screen: TourId };

type GuideState = {
  userId: string | null;
  hydrated: boolean;
  data: OnboardingState;
  active: GuideQueueItem | null;
  activeIndex: number;
  /** Etkin turda en az bir adım gerçekten gösterildi mi. */
  activeDisplayed: boolean;
  queue: GuideQueueItem[];
  focusedScreens: TourId[];
  armedTourId: TourId | null;
};

const PUSH_DEBOUNCE_MS = 1500;

const initialState: GuideState = {
  userId: null,
  hydrated: false,
  data: emptyOnboardingState(),
  active: null,
  activeIndex: 0,
  activeDisplayed: false,
  queue: [],
  focusedScreens: [],
  armedTourId: null,
};

export const useGuideStore = create<GuideState>(() => ({ ...initialState }));

const NEW_PERMISSIONS_INTRO: ResolvedStep = {
  id: "intro",
  titleKey: "guide.newPermissions.title",
  bodyKey: "guide.newPermissions.body",
};

function eligibleUser(): UserDTO | null {
  const user = useAuthStore.getState().user;
  if (!user?.companyId || user.approvalStatus !== "approved") return null;
  return user;
}

function guideUser(user: UserDTO) {
  return { permissions: user.permissions ?? [], roles: user.roles ?? [] };
}

let pushTimer: ReturnType<typeof setTimeout> | null = null;

function cancelPendingPush() {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = null;
}

function schedulePush() {
  cancelPendingPush();
  pushTimer = setTimeout(() => {
    pushTimer = null;
    const { userId, data } = useGuideStore.getState();
    if (!userId) return;
    void pushRemoteState(data).then((ok) => {
      const current = useGuideStore.getState();
      // Bu arada yeni bir değişiklik yapıldıysa onun push'u ayrıca gelecek.
      if (!ok || current.userId !== userId || current.data !== data) return;
      void saveLocalState(userId, { state: data, dirty: false });
    });
  }, PUSH_DEBOUNCE_MS);
}

function updateData(mutate: (data: OnboardingState) => OnboardingState) {
  const { userId, data } = useGuideStore.getState();
  if (!userId) return;
  const next = { ...mutate(data), updatedAt: new Date().toISOString() };
  useGuideStore.setState({ data: next });
  void saveLocalState(userId, { state: next, dirty: true });
  schedulePush();
}

export async function startGuideSession(userId: string): Promise<void> {
  const current = useGuideStore.getState();
  if (current.userId === userId) return;

  cancelPendingPush();
  useGuideStore.setState({ ...initialState, focusedScreens: current.focusedScreens, userId });

  const local = await loadLocalState(userId);
  if (useGuideStore.getState().userId !== userId) return;
  useGuideStore.setState({ data: local?.state ?? emptyOnboardingState(), hydrated: true });

  const remote = await fetchRemoteState();
  if (useGuideStore.getState().userId !== userId) return;
  const latest = useGuideStore.getState().data;
  const hasLocal = Boolean(local) || latest.updatedAt !== null;
  const { state, needsPush } = pickNewerState(
    hasLocal ? { state: latest, dirty: local?.dirty ?? false } : null,
    remote,
  );
  if (state !== useGuideStore.getState().data) {
    useGuideStore.setState({ data: state });
    void saveLocalState(userId, { state, dirty: false });
  }
  if (needsPush) schedulePush();
}

export function endGuideSession(): void {
  cancelPendingPush();
  useGuideStore.setState((s) => ({ ...initialState, focusedScreens: s.focusedScreens }));
}

function isPending(id: GuideQueueItem["id"]): boolean {
  const { active, queue } = useGuideStore.getState();
  return active?.id === id || queue.some((item) => item.id === id);
}

function activateNext(queue: GuideQueueItem[]) {
  const { focusedScreens } = useGuideStore.getState();
  const remaining = queue.filter((item) => focusedScreens.includes(item.screen));
  const [next, ...rest] = remaining;
  useGuideStore.setState({
    active: next ?? null,
    activeIndex: 0,
    activeDisplayed: false,
    queue: rest,
  });
}

function enqueue(item: GuideQueueItem) {
  const { active, queue, focusedScreens } = useGuideStore.getState();
  if (!focusedScreens.includes(item.screen)) return;
  if (active) {
    useGuideStore.setState({ queue: [...queue, item] });
    return;
  }
  useGuideStore.setState({ active: item, activeIndex: 0, activeDisplayed: false });
}

export function setScreenFocused(screen: TourId, focused: boolean): void {
  const state = useGuideStore.getState();
  if (focused) {
    if (!state.focusedScreens.includes(screen)) {
      useGuideStore.setState({ focusedScreens: [...state.focusedScreens, screen] });
    }
    return;
  }

  const focusedScreens = state.focusedScreens.filter((s) => s !== screen);
  const queue = state.queue.filter((item) => item.screen !== screen);
  useGuideStore.setState({ focusedScreens, queue });
  // Ekrandan çıkıldıysa (ör. bildirime dokunuldu) yarım tur görüldü sayılmaz.
  if (state.active?.screen === screen) activateNext(queue);
}

type RequestOptions = { force?: boolean };

export function requestTour(tourId: TourId, options: RequestOptions = {}): void {
  const state = useGuideStore.getState();
  if (!state.hydrated) return;
  const user = eligibleUser();
  if (!user) return;

  const armed = state.armedTourId === tourId;
  if (armed) useGuideStore.setState({ armedTourId: null });
  const force = options.force || armed;

  const seenVersion = state.data.seenTours[tourId] ?? 0;
  if (!force && seenVersion >= TOURS[tourId].version) return;
  if (isPending(tourId)) return;

  const steps = resolveTourSteps(tourId, guideUser(user));
  if (steps.length === 0) return;

  enqueue({ kind: "tour", id: tourId, screen: tourId, steps, persistSeen: true });
}

/**
 * Rol değişince yeni açılan özellikleri tanıtır. İlk çalıştırmada yalnızca
 * mevcut izinleri kaydeder; izin kaldırıldığında hiçbir şey göstermez.
 */
function checkNewPermissions(user: UserDTO) {
  const { data } = useGuideStore.getState();
  const known = data.knownPermissions;
  const current = user.permissions ?? [];

  if (known.length === 0) {
    if (current.length > 0) updateData((d) => ({ ...d, knownPermissions: [...current] }));
    return;
  }

  const added = addedPermissions(known, current);
  const removed = addedPermissions(current, known);
  if (added.length === 0 && removed.length === 0) return;

  updateData((d) => ({ ...d, knownPermissions: [...current] }));
  if (added.length === 0) return;

  const steps = resolveNewlyUnlockedSteps(known, guideUser(user));
  if (steps.length === 0 || isPending("newPermissions")) return;
  enqueue({
    kind: "tour",
    id: "newPermissions",
    screen: "dashboard",
    steps: [NEW_PERMISSIONS_INTRO, ...steps],
    persistSeen: false,
  });
}

/** Ana sayfa odaklandığında: karşılama, yeni yetkiler ve ana sayfa turu. */
export function requestDashboardOnboarding(): void {
  const state = useGuideStore.getState();
  if (!state.hydrated) return;
  const user = eligibleUser();
  if (!user) return;

  if (!state.data.welcomeSeen) {
    const current = user.permissions ?? [];
    if (current.join(",") !== state.data.knownPermissions.join(",")) {
      updateData((d) => ({ ...d, knownPermissions: [...current] }));
    }
    if (!isPending("welcome")) enqueue({ kind: "welcome", id: "welcome", screen: "dashboard" });
    return;
  }

  checkNewPermissions(user);
  requestTour("dashboard");
}

/** Kurulum listesinden açılan ekranda tur, daha önce görülmüş olsa da başlar. */
export function armTour(tourId: TourId): void {
  useGuideStore.setState({ armedTourId: tourId });
}

export function markStepDisplayed(): void {
  if (!useGuideStore.getState().activeDisplayed) {
    useGuideStore.setState({ activeDisplayed: true });
  }
}

export function goToStep(index: number): void {
  const { active } = useGuideStore.getState();
  if (!active || active.kind !== "tour") return;
  if (index < 0) return;
  if (index >= active.steps.length) {
    finishActiveTour();
    return;
  }
  useGuideStore.setState({ activeIndex: index });
}

/** "Atla" ve son adımdaki "Bitir" aynı yoldan geçer; tur görüldü sayılır. */
export function finishActiveTour(): void {
  const { active, activeDisplayed, queue } = useGuideStore.getState();
  if (!active) return;
  if (active.kind === "tour" && active.persistSeen && activeDisplayed) {
    const tourId = active.id as TourId;
    updateData((d) => ({
      ...d,
      seenTours: { ...d.seenTours, [tourId]: TOURS[tourId].version },
    }));
  }
  activateNext(queue);
}

export function acceptWelcome(): void {
  updateData((d) => ({ ...d, welcomeSeen: true }));
  activateNext(useGuideStore.getState().queue);
  requestTour("dashboard", { force: true });
}

export function postponeWelcome(): void {
  updateData((d) => ({
    ...d,
    welcomeSeen: true,
    seenTours: { ...d.seenTours, dashboard: TOURS.dashboard.version },
  }));
  activateNext(useGuideStore.getState().queue);
}

export function resetTours(): void {
  updateData((d) => ({
    ...d,
    seenTours: {},
    welcomeSeen: false,
    checklistDismissed: false,
  }));
  useGuideStore.setState({ active: null, queue: [], activeIndex: 0, activeDisplayed: false });
}

export function dismissChecklist(): void {
  updateData((d) => ({ ...d, checklistDismissed: true }));
}

export function markChecklistDone(id: ChecklistItemId): void {
  const { userId, data } = useGuideStore.getState();
  if (!userId || data.checklistDone[id]) return;
  updateData((d) => ({ ...d, checklistDone: { ...d.checklistDone, [id]: true } }));
}

import { TOURS, TOUR_ORDER } from "./tours";
import type { GuideUser, ResolvedStep, Tour, TourAudience, TourId, TourStep } from "./types";

type Requirement = TourStep["requires"];

export function isCompanyOwner(user: Pick<GuideUser, "roles"> | null | undefined): boolean {
  return user?.roles?.some((role) => role.code.startsWith("owner-")) ?? false;
}

function hasAll(permissions: readonly string[], requires: Requirement): boolean {
  if (!requires) return true;
  const list = Array.isArray(requires) ? requires : [requires];
  return list.every((code) => permissions.includes(code));
}

function matchesAudience(audience: TourAudience | undefined, isOwner: boolean): boolean {
  if (!audience || audience === "all") return true;
  return audience === "owner" ? isOwner : !isOwner;
}

function stepVisible(
  tour: Tour,
  step: TourStep,
  permissions: readonly string[],
  isOwner: boolean,
): boolean {
  return (
    hasAll(permissions, tour.requires) &&
    matchesAudience(tour.audience, isOwner) &&
    hasAll(permissions, step.requires) &&
    matchesAudience(step.audience, isOwner)
  );
}

/** Kullanıcının izinlerine ve sahipliğine göre gösterilecek adımlar. */
export function resolveTourSteps(tourId: TourId, user: GuideUser): ResolvedStep[] {
  const tour = TOURS[tourId];
  const isOwner = isCompanyOwner(user);
  return tour.steps.filter((step) => stepVisible(tour, step, user.permissions, isOwner));
}

export function addedPermissions(known: readonly string[], current: readonly string[]): string[] {
  return current.filter((code) => !known.includes(code));
}

/**
 * Bilinen izinlerle görünmeyen ama güncel izinlerle görünen adımlar.
 * Ana sayfa dışındaki ekranların hedefleri o an ekranda olmadığı için
 * kartları ortada açılır.
 */
export function resolveNewlyUnlockedSteps(
  knownPermissions: readonly string[],
  user: GuideUser,
): ResolvedStep[] {
  const isOwner = isCompanyOwner(user);
  const result: ResolvedStep[] = [];
  for (const tourId of TOUR_ORDER) {
    const tour = TOURS[tourId];
    for (const step of tour.steps) {
      const visibleNow = stepVisible(tour, step, user.permissions, isOwner);
      const visibleBefore = stepVisible(tour, step, knownPermissions, isOwner);
      if (visibleNow && !visibleBefore) {
        result.push({
          ...step,
          id: `${tourId}.${step.id}`,
          ignoreTarget: tourId !== "dashboard",
        });
      }
    }
  }
  return result;
}

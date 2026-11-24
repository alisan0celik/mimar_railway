import type { Sector } from "../../store/sectorStore";
import { TOURS } from "./tours";
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

function matchesSector(required: Sector | undefined, sector: Sector): boolean {
  return !required || required === sector;
}

function stepVisible(tour: Tour, step: TourStep, user: GuideUser, isOwner: boolean): boolean {
  return (
    hasAll(user.permissions, tour.requires) &&
    matchesAudience(tour.audience, isOwner) &&
    matchesSector(tour.sector, user.sector) &&
    hasAll(user.permissions, step.requires) &&
    matchesAudience(step.audience, isOwner) &&
    matchesSector(step.sector, user.sector)
  );
}

/**
 * Kullanıcının izinlerine, sahipliğine ve şirketin sektörüne göre gösterilecek
 * adımlar. Sektöre özgü adım burada süzülüyor: yalnızca hedefi çizilmediği için
 * atlansaydı sayaç onu da sayar, tur "2/3"te biterdi.
 */
export function resolveTourSteps(tourId: TourId, user: GuideUser): ResolvedStep[] {
  const tour = TOURS[tourId];
  const isOwner = isCompanyOwner(user);
  return tour.steps.filter((step) => stepVisible(tour, step, user, isOwner));
}


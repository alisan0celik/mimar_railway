import type { Href } from "expo-router";

import type { PermissionCode } from "../../shared/permissions";

export type TourAudience = "owner" | "member" | "all";

export type TourStep = {
  id: string;
  /** Vurgulanacak öğenin `useTourTarget` kimliği; yoksa kart ortada açılır. */
  target?: string;
  titleKey: string;
  bodyKey: string;
  /** Birden fazla izin verilirse hepsi gerekir. */
  requires?: PermissionCode | PermissionCode[];
  audience?: TourAudience;
};

export type TourId =
  | "dashboard"
  | "projects"
  | "projectDetail"
  | "createProject"
  | "finance"
  | "pendingUsers"
  | "roles";

export type Tour = {
  id: TourId;
  /** İçerik değişince artırılır; tur, eski sürümü görenlere bir kez daha açılır. */
  version: number;
  requires?: PermissionCode | PermissionCode[];
  audience?: TourAudience;
  steps: TourStep[];
};

export type ResolvedStep = TourStep & {
  /** Hedef bu ekranda değilse kart ortada gösterilir, adım atlanmaz. */
  ignoreTarget?: boolean;
};

export type OnboardingState = {
  seenTours: Record<string, number>;
  knownPermissions: string[];
  checklistDismissed: boolean;
  checklistDone: Record<string, boolean>;
  welcomeSeen: boolean;
  updatedAt: string | null;
};

export type ChecklistItemId = "logo" | "project" | "approve" | "roles" | "finance";

export type ChecklistItem = {
  id: ChecklistItemId;
  titleKey: string;
  requires: PermissionCode;
  route: Href;
  tourId?: TourId;
};

export type GuideUser = {
  permissions: readonly string[];
  roles: ReadonlyArray<{ code: string }>;
};

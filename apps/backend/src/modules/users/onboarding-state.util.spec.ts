import {
  emptyOnboardingState,
  mergeOnboardingState,
  normalizeOnboardingState,
  sanitizeOnboardingPatch,
} from "./onboarding-state.util";

describe("onboarding-state.util", () => {
  it("returns an empty state for missing or malformed data", () => {
    expect(normalizeOnboardingState(null)).toEqual(emptyOnboardingState());
    expect(normalizeOnboardingState("x")).toEqual(emptyOnboardingState());
    expect(normalizeOnboardingState([1, 2])).toEqual(emptyOnboardingState());
  });

  it("keeps only known, well-typed fields", () => {
    const patch = sanitizeOnboardingPatch({
      seenTours: { dashboard: 2, projects: "1", finance: 1.7, "": 1 },
      knownPermissions: ["finance.view", 3, "finance.view", "role.view"],
      checklistDismissed: "yes",
      welcomeSeen: true,
      checklistDone: { logo: true, project: "true" },
      isPlatformAdmin: true,
    });

    expect(patch).toEqual({
      seenTours: { dashboard: 2, finance: 1 },
      knownPermissions: ["finance.view", "role.view"],
      welcomeSeen: true,
      checklistDone: { logo: true },
    });
  });

  it("merges a partial patch over the stored state", () => {
    const stored = {
      seenTours: { dashboard: 1 },
      knownPermissions: ["project.view"],
      welcomeSeen: true,
      checklistDismissed: false,
      checklistDone: {},
    };
    const now = new Date("2026-10-31T10:00:00.000Z");

    const merged = mergeOnboardingState(stored, { checklistDismissed: true }, now);

    expect(merged).toEqual({
      seenTours: { dashboard: 1 },
      knownPermissions: ["project.view"],
      welcomeSeen: true,
      checklistDismissed: true,
      checklistDone: {},
      updatedAt: "2026-10-31T10:00:00.000Z",
    });
  });

  it("caps the number of stored permissions", () => {
    const many = Array.from({ length: 500 }, (_, i) => `perm.${i}`);
    expect(sanitizeOnboardingPatch({ knownPermissions: many }).knownPermissions).toHaveLength(200);
  });
});

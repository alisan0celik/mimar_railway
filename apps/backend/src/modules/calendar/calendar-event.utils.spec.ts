import { parseTimeToMinutes, resolveEventWindow } from "./calendar-event.utils";

describe("calendar event utils", () => {
  it("reads a well-formed time", () => {
    expect(parseTimeToMinutes("14:30")).toBe(870);
    expect(parseTimeToMinutes("09:05")).toBe(545);
    expect(parseTimeToMinutes("9:05")).toBe(545);
  });

  it("rejects a time that is not a real clock reading", () => {
    expect(parseTimeToMinutes("25:00")).toBeNull();
    expect(parseTimeToMinutes("12:75")).toBeNull();
    expect(parseTimeToMinutes("öğleden sonra")).toBeNull();
    expect(parseTimeToMinutes(undefined)).toBeNull();
  });

  it("builds the window from the legacy date and time fields", () => {
    const { startsAt, endsAt } = resolveEventWindow({
      date: new Date(2026, 7, 22, 0, 0, 0),
      time: "14:30",
    });

    expect(startsAt.getHours()).toBe(14);
    expect(startsAt.getMinutes()).toBe(30);
    expect(endsAt.getTime() - startsAt.getTime()).toBe(60 * 60_000);
  });

  it("falls back to the start of the day when the time is unreadable", () => {
    const { startsAt } = resolveEventWindow({
      date: new Date(2026, 7, 22, 0, 0, 0),
      time: "belirsiz",
    });

    expect(startsAt.getHours()).toBe(0);
  });

  it("prefers explicit timestamps over the legacy fields", () => {
    const explicit = new Date(2026, 7, 22, 9, 0, 0);
    const { startsAt } = resolveEventWindow({
      date: new Date(2026, 7, 22),
      time: "14:30",
      startsAt: explicit,
    });

    expect(startsAt).toBe(explicit);
  });

  it("ignores an end that is not after the start", () => {
    const startsAt = new Date(2026, 7, 22, 10, 0, 0);
    const { endsAt } = resolveEventWindow({
      date: startsAt,
      startsAt,
      endsAt: new Date(2026, 7, 22, 9, 0, 0),
    });

    expect(endsAt.getTime()).toBe(startsAt.getTime() + 60 * 60_000);
  });
});

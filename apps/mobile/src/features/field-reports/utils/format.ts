import { formatCalendarDate, today } from "../../projects/utils/contractDeadline";

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

/** "2026-11-25T08:30:00Z" → "25 Kasım 2026 · 11:30" (cihazın yerel saatiyle). */
export function formatReportTime(iso: string, translate: (key: string) => string): string {
  const date = new Date(iso);
  return `${formatCalendarDate(today(date), translate)} · ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

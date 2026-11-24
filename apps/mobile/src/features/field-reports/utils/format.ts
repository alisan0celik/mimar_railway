import { formatCalendarDate, today } from "../../projects/utils/contractDeadline";

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

/** "2026-11-25T08:30:00Z" → "25 Kasım 2026 · 11:30" (cihazın yerel saatiyle). */
export function formatReportTime(iso: string, translate: (key: string) => string): string {
  const date = new Date(iso);
  return `${formatCalendarDate(today(date), translate)} · ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatCoordinates(latitude: number, longitude: number): string {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

/** iOS'ta da Android'de de harita uygulamasında ya da tarayıcıda açılan adres. */
export function mapsUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

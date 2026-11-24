/**
 * Kamu yapım işinin sözleşmeye göre bitmesi gereken gün ve kalan süre.
 *
 * Süre yer teslim tarihinden itibaren işler ve yer teslim günü birinci gün
 * sayılır: 14 Mart'ta teslim edilen 30 günlük iş 12 Nisan'da biter. Verilen
 * süre uzatımları bu süreye eklenir. Sayım bu tek işlevde; idarenin uygulaması
 * farklıysa yalnızca burası değişir.
 *
 * Tarihler takvim günü olarak, "YYYY-AA-GG" metni üzerinden hesaplanıyor.
 * Saat dilimine bağlı `Date` aritmetiği gece yarısına yakın kayıtlarda günü
 * kaydırabiliyordu.
 */

const DAY_MS = 86_400_000;

/** Bitimine bu kadar gün ya da daha az kalan iş "süresi doluyor" sayılır. */
export const DUE_SOON_DAYS = 30;

type TenderDates = {
  siteDeliveryDate?: string | null;
  workDurationDays?: number | null;
  extensionDays?: number | null;
  provisionalAcceptanceDate?: string | null;
};

export type DeadlineStatus =
  | { kind: "unknown" }
  | { kind: "accepted"; deadline: string }
  | { kind: "onTrack"; deadline: string; daysLeft: number }
  | { kind: "dueSoon"; deadline: string; daysLeft: number }
  | { kind: "overdue"; deadline: string; daysLate: number };

/** Sunucudan gelen tarih/saat değerinin takvim günü: "2026-03-14T00:00:00.000Z" → "2026-03-14". */
export function calendarDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
}

function dayNumber(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return Date.UTC(year, month - 1, day) / DAY_MS;
}

function fromDayNumber(days: number): string {
  return new Date(days * DAY_MS).toISOString().slice(0, 10);
}

const MONTH_KEYS = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec",
] as const;

/**
 * Takvim gününü okunur biçimde yazar: "2026-03-14" → "14 Mart 2026".
 * Ay adları uygulamanın çevirisinden geliyor; `toLocaleDateString` saat
 * dilimine göre günü kaydırabildiği için kullanılmıyor.
 */
export function formatCalendarDate(date: string, translate: (key: string) => string): string {
  const [year, month, day] = date.split("-").map(Number);
  return `${day} ${translate(`calendar.months.${MONTH_KEYS[month - 1]}`)} ${year}`;
}

/** Cihazın yerel saatine göre bugünün takvim günü. */
export function today(now: Date = new Date()): string {
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** İş bitim tarihi; yer teslim tarihi ya da süre girilmemişse `null`. */
export function contractDeadline(project: TenderDates): string | null {
  const start = calendarDate(project.siteDeliveryDate);
  const duration = project.workDurationDays ?? 0;
  if (!start || duration <= 0) return null;

  const total = duration + Math.max(0, project.extensionDays ?? 0);
  return fromDayNumber(dayNumber(start) + total - 1);
}

export function deadlineStatus(project: TenderDates, todayDate: string = today()): DeadlineStatus {
  const deadline = contractDeadline(project);
  if (!deadline) return { kind: "unknown" };

  // Geçici kabul yapıldıysa iş teslim edilmiştir; süre artık işlemez.
  if (calendarDate(project.provisionalAcceptanceDate)) return { kind: "accepted", deadline };

  const daysLeft = dayNumber(deadline) - dayNumber(todayDate);
  if (daysLeft < 0) return { kind: "overdue", deadline, daysLate: -daysLeft };
  if (daysLeft <= DUE_SOON_DAYS) return { kind: "dueSoon", deadline, daysLeft };
  return { kind: "onTrack", deadline, daysLeft };
}

/**
 * Takvim etkinliğinin başlangıç/bitiş anını çözer.
 *
 * Eski kayıtlarda yalnızca gün (`date`) ve serbest metin saat (`time`) vardı.
 * Cihaz takvimine yazabilmek için gerçek zaman damgaları gerekiyor; istemci
 * göndermediyse eldeki iki alandan türetilir.
 */

/** Varsayılan etkinlik süresi (dk) — bitiş verilmediğinde kullanılır. */
export const DEFAULT_EVENT_MINUTES = 60;

const TIME_PATTERN = /^(\d{1,2}):(\d{2})$/;

/** "14:30" biçimindeki saati dakikaya çevirir; okunamazsa null. */
export function parseTimeToMinutes(time: string | null | undefined): number | null {
  const match = TIME_PATTERN.exec((time ?? "").trim());
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;

  return hours * 60 + minutes;
}

export function resolveEventWindow(input: {
  date: Date;
  time?: string | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
}): { startsAt: Date; endsAt: Date } {
  let startsAt = input.startsAt ?? null;

  if (!startsAt) {
    startsAt = new Date(input.date);
    const minutes = parseTimeToMinutes(input.time);
    if (minutes !== null) {
      startsAt.setHours(0, 0, 0, 0);
      startsAt = new Date(startsAt.getTime() + minutes * 60_000);
    }
  }

  // Bitiş başlangıçtan önce olamaz; hatalı veri gelirse varsayılan süre uygulanır.
  const endsAt =
    input.endsAt && input.endsAt.getTime() > startsAt.getTime()
      ? input.endsAt
      : new Date(startsAt.getTime() + DEFAULT_EVENT_MINUTES * 60_000);

  return { startsAt, endsAt };
}

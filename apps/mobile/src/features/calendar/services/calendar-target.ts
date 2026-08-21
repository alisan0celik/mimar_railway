/**
 * Etkinliklerin yazılacağı takvimi seçer.
 *
 * Kullanıcı hangi hesapla giriş yaptıysa o hesabın takvimi öntanımlı gelir:
 * Google ile girdiyse Google takvimi, Apple ile girdiyse iCloud. E-posta ile
 * girdiyse telefonun kendi birincil takvimi kullanılır — telefonda zaten bir
 * hesap vardır ve kullanıcı etkinliklerini orada görmeyi bekler.
 *
 * Seçim yalnızca ilk kez yapılır; kullanıcı sonradan ekrandan değiştirebilir.
 */

export type WritableCalendar = {
  id: string;
  title: string;
  /** Takvimin bağlı olduğu hesap — "alisan@gmail.com", "iCloud" gibi. */
  accountName: string;
  /** Kaynak türü — Android'de "com.google", iOS'ta "caldav" gibi. */
  sourceType: string;
  isPrimary: boolean;
};

function haystack(calendar: WritableCalendar): string {
  return `${calendar.accountName} ${calendar.sourceType} ${calendar.title}`.toLowerCase();
}

export function isGoogleCalendar(calendar: WritableCalendar): boolean {
  return /google|gmail/.test(haystack(calendar));
}

export function isAppleCalendar(calendar: WritableCalendar): boolean {
  return /icloud|mobileme|apple/.test(haystack(calendar));
}

/**
 * Öntanımlı takvimi belirler; uygun bir aday yoksa null döner.
 *
 * Google ile giriş yapan kullanıcıda önce e-postayla birebir eşleşen takvim
 * aranır: telefonda birden fazla Google hesabı olabilir ve etkinliğin yanlış
 * hesaba yazılması kullanıcının onları hiç görmemesi demektir.
 */
export function pickPreferredCalendar(input: {
  authProvider?: string | null;
  email?: string | null;
  calendars: WritableCalendar[];
}): string | null {
  const { calendars } = input;
  if (calendars.length === 0) return null;

  const provider = (input.authProvider ?? "").toUpperCase();
  const email = (input.email ?? "").trim().toLowerCase();

  if (provider === "GOOGLE") {
    const sameAccount = calendars.find(
      (calendar) => calendar.accountName.trim().toLowerCase() === email && email.length > 0,
    );
    if (sameAccount) return sameAccount.id;

    const google = calendars.filter(isGoogleCalendar);
    if (google.length > 0) {
      return (google.find((calendar) => calendar.isPrimary) ?? google[0]).id;
    }
  }

  if (provider === "APPLE") {
    const apple = calendars.filter(isAppleCalendar);
    if (apple.length > 0) {
      return (apple.find((calendar) => calendar.isPrimary) ?? apple[0]).id;
    }
  }

  // E-posta ile giriş ya da eşleşen hesap yok: telefonun birincil takvimi.
  const primary = calendars.find((calendar) => calendar.isPrimary);
  if (primary) return primary.id;

  // Birincil işaretlenmemişse hesabı olan ilk takvim yerel takvime yeğlenir;
  // yerel takvimler hiçbir buluta senkronlanmaz.
  const withAccount = calendars.find((calendar) => calendar.accountName.length > 0);
  return (withAccount ?? calendars[0]).id;
}

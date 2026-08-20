import { calendarApi } from "../../services/api/calendar.api";
import { companiesApi } from "../../services/api/companies.api";
import { financeApi } from "../../services/api/finance.api";
import { usersApi } from "../../services/api/users.api";
import type { UserDTO } from "../../services/api";
import { saveReadCache } from "./read-cache";
import { isOnline } from "../network/network-monitor";

/**
 * Finans, takvim, ekip ve şirket bilgisini arka planda önbelleğe alır.
 *
 * Bu ekranlar önbelleğe yalnızca ziyaret edildiklerinde yazılıyordu; kullanıcı
 * çevrimdışı kalmadan önce hepsini tek tek açmak zorundaydı. Senkronizasyon
 * sonrası bu fonksiyon çalışınca hiçbir ekranı açmaya gerek kalmıyor.
 *
 * Her istek kendi içinde yutulur: yetkisi olmayan kullanıcıda (ör. finans veya
 * ekip görme izni yok) diğerlerinin önbelleğe alınması engellenmez.
 */
export async function prefetchOfflineData(companyId: string | null | undefined): Promise<void> {
  if (!isOnline() || !companyId) return;

  const now = new Date();
  const year = now.getFullYear();
  // Takvim ekranıyla aynı düzen: ay 0 tabanlı
  const month = now.getMonth();

  await Promise.allSettled([
    (async () => {
      const res = await financeApi.getSummaries();
      await saveReadCache("finance:summaries", res.data);
    })(),

    (async () => {
      const res = await calendarApi.getEvents(year, month);
      await saveReadCache(`calendar:${year}-${month}`, res.data);
    })(),

    (async () => {
      const res = await usersApi.getTeamMembers();
      const payload = res.data as { data?: UserDTO[] } | UserDTO[];
      const list = Array.isArray(payload) ? payload : payload.data;
      await saveReadCache("team:members", Array.isArray(list) ? list : []);
    })(),

    (async () => {
      const res = await companiesApi.getById(companyId);
      await saveReadCache(`company:${companyId}`, res.data);
    })(),
  ]);
}

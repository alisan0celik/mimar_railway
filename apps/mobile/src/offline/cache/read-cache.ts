import { getDatabase } from "../db/database";
import { isOnline } from "../network/network-monitor";

/**
 * Salt okunur listeler için basit "son başarılı yanıt" önbelleği.
 *
 * Finans, takvim ve ekip ekranları çevrimdışında boş kalıyordu; bu yardımcı
 * çevrimiçiyken yanıtı SQLite'a yazar, çevrimdışında (veya istek başarısız
 * olduğunda) son kaydı döndürür.
 */
export async function saveReadCache(key: string, payload: unknown): Promise<void> {
  const db = await getDatabase();
  if (!db) return;

  await db.runAsync(
    `INSERT INTO cached_reads (key, payload, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at`,
    [key, JSON.stringify(payload), new Date().toISOString()],
  );
}

export async function getReadCache<T>(key: string): Promise<T | null> {
  const db = await getDatabase();
  if (!db) return null;

  const row = await db.getFirstAsync<{ payload: string }>(
    "SELECT payload FROM cached_reads WHERE key = ?",
    [key],
  );
  if (!row?.payload) return null;

  try {
    return JSON.parse(row.payload) as T;
  } catch {
    return null;
  }
}

/**
 * Çevrimiçiyse veriyi sunucudan çeker ve önbelleğe yazar; çevrimdışıysa ya da
 * istek başarısız olursa önbellekteki son sürümü döndürür.
 * Hiç önbellek yoksa hatayı yukarı taşır ki ekran kendi hata durumunu gösterebilsin.
 */
export async function fetchWithReadCache<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  if (isOnline()) {
    try {
      const fresh = await fetcher();
      await saveReadCache(key, fresh);
      return fresh;
    } catch (error) {
      const cached = await getReadCache<T>(key);
      if (cached !== null) return cached;
      throw error;
    }
  }

  const cached = await getReadCache<T>(key);
  if (cached !== null) return cached;
  return fetcher();
}

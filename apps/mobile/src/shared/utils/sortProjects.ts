/**
 * Proje listesinin tek sıralama tanımı: en yeni proje üstte.
 *
 * Sunucu listeyi `createdAt` azalan sırada gönderiyor, çevrimdışı önbellek
 * ise satırları `updatedAt`'a göre okuyordu. Ekran açılırken önce önbellek
 * listesi görünüp yanıt gelince sıra değiştiği için liste gözle görülür
 * biçimde yeniden diziliyordu. İki kaynak da bu işlevden geçiyor.
 */
export function sortProjectsByNewest<T extends { id: string; createdAt?: string }>(
  projects: T[],
): T[] {
  return [...projects].sort((a, b) => {
    const byDate = (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
    // Aynı saniyede açılan projelerde sıra rastgele kalmasın.
    return byDate !== 0 ? byDate : b.id.localeCompare(a.id);
  });
}

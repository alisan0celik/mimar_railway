import { create } from "zustand";

/**
 * Uygulamanın hangi sektöre göre konuştuğu.
 *
 * Belediye modunda belediye, yükleniciye hakediş ödeyen işveren tarafıdır:
 * terimler bu bakışa çevrilir ("Müşteri" yerine "Yüklenici", "Tahsil edilen"
 * yerine "Ödenen"), kâr ve taşeron kısımları gizlenir, projelerde ihale
 * bilgileri görünür.
 *
 * Ayrı bir depoda tutuluyor: çeviri sistemi bunu okuyor, oturum deposu ise
 * çeviri sistemini içe aktardığı için çeviri sistemi oturum deposunu okursa
 * döngüsel bağımlılık oluşurdu. Değeri oturum deposu kullanıcıyla eşitliyor.
 */
export type Sector = "default" | "municipality";

export function sectorOf(businessType: string | null | undefined): Sector {
  return businessType === "municipality" ? "municipality" : "default";
}

type SectorState = {
  sector: Sector;
  setSector: (sector: Sector) => void;
};

export const useSectorStore = create<SectorState>((set) => ({
  sector: "default",
  setSector: (sector) => set({ sector }),
}));

export function useIsMunicipality(): boolean {
  return useSectorStore((state) => state.sector === "municipality");
}

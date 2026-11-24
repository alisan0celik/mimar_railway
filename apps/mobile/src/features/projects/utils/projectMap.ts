import type { GeoPoint } from "../../../shared/location";
import type { DeadlineStatus } from "./contractDeadline";

/**
 * Harita ekranlarının ortak hesapları. react-native-maps'e bağlı değil; web
 * paketine de girebiliyor.
 */

export type MapRegion = GeoPoint & { latitudeDelta: number; longitudeDelta: number };

/** Hiç konum yokken açılan görünüm: Türkiye'nin tamamı. */
export const TURKEY_REGION: MapRegion = {
  latitude: 39.0,
  longitude: 35.2,
  latitudeDelta: 12,
  longitudeDelta: 20,
};

/** Tek bir işe yakınlaşırken gösterilen alan: birkaç yüz metre. */
export const POINT_DELTA = 0.004;
/** Birden çok işi gösterirken bırakılan en dar alan. */
const MIN_AREA_DELTA = 0.02;
/** İşaretler kenara yapışmasın diye alan bu oranda genişletiliyor. */
const AREA_PADDING = 1.5;

/** Projenin harita noktası; enlem ya da boylamı eksikse `null`. */
export function projectPoint(project: {
  latitude?: number | null;
  longitude?: number | null;
}): GeoPoint | null {
  const { latitude, longitude } = project;
  return typeof latitude === "number" && typeof longitude === "number"
    ? { latitude, longitude }
    : null;
}

export function pointRegion(point: GeoPoint, delta: number = POINT_DELTA): MapRegion {
  return { ...point, latitudeDelta: delta, longitudeDelta: delta };
}

/** Bütün noktaları içine alan görünüm; nokta yoksa Türkiye. */
export function regionAround(points: GeoPoint[]): MapRegion {
  if (points.length === 0) return TURKEY_REGION;
  const latitudes = points.map((point) => point.latitude);
  const longitudes = points.map((point) => point.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * AREA_PADDING, MIN_AREA_DELTA),
    longitudeDelta: Math.max((maxLng - minLng) * AREA_PADDING, MIN_AREA_DELTA),
  };
}

export type DeadlineKind = DeadlineStatus["kind"];

/**
 * Harita işaretlerinin renkleri. Uygulama temasından bağımsız: işaretler her
 * temada aynı harita zemininde duruyor. Android'deki Google Haritalar işareti
 * yalnızca rengin tonunu (hue) kullanıyor, gri gibi tonsuz bir renk kırmızıya
 * dönerdi; bu yüzden beş durumun tonları birbirinden belirgin biçimde ayrık.
 */
export const DEADLINE_MARKER_COLORS: Record<DeadlineKind, string> = {
  overdue: "#DC2626",
  dueSoon: "#F59E0B",
  onTrack: "#16A34A",
  unknown: "#7C3AED",
  accepted: "#2563EB",
};

/** Listede ve açıklamada önce acil işler. */
export const DEADLINE_ORDER: DeadlineKind[] = ["overdue", "dueSoon", "onTrack", "unknown", "accepted"];

/**
 * Aciliyet sırası: süresi geçenler (en çok geciken önce), dolmak üzere olanlar
 * ve süresinde olanlar (en az günü kalan önce), süresi girilmeyenler, kabulü
 * yapılanlar.
 */
export function compareByUrgency(a: DeadlineStatus, b: DeadlineStatus): number {
  const byKind = DEADLINE_ORDER.indexOf(a.kind) - DEADLINE_ORDER.indexOf(b.kind);
  if (byKind !== 0) return byKind;
  if (a.kind === "overdue" && b.kind === "overdue") return b.daysLate - a.daysLate;
  if ((a.kind === "dueSoon" || a.kind === "onTrack") && (b.kind === "dueSoon" || b.kind === "onTrack")) {
    return a.daysLeft - b.daysLeft;
  }
  return 0;
}

type Translate = (key: string, params?: Record<string, string | number>) => string;

/** "Alsancak · 1234 ada 5 parsel"; hiçbiri girilmemişse `null`. */
export function formatParcel(
  project: {
    neighbourhood?: string | null;
    cadastralBlock?: string | null;
    cadastralParcel?: string | null;
  },
  t: Translate,
): string | null {
  const block = project.cadastralBlock?.trim();
  const parcel = project.cadastralParcel?.trim();
  const plot =
    block && parcel
      ? t("projects.site.blockAndParcel", { block, parcel })
      : block
        ? t("projects.site.blockOnly", { block })
        : parcel
          ? t("projects.site.parcelOnly", { parcel })
          : null;
  const parts = [project.neighbourhood?.trim(), plot].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : null;
}

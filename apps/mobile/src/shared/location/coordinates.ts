/** Koordinatları gösterme, elle girilenleri okuma ve harita uygulamasında açma. */

export type GeoPoint = { latitude: number; longitude: number };

export const LATITUDE_LIMIT = 90;
export const LONGITUDE_LIMIT = 180;

export function formatCoordinates(latitude: number, longitude: number): string {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

/** Forma yazılan değer: altı ondalık basamak (yaklaşık 10 cm), sondaki sıfırlar atılmış. */
export function coordinateText(value: number): string {
  return String(Number(value.toFixed(6)));
}

/**
 * Elle yazılan tek bir koordinat. Boşsa `null`; sayı değilse ya da sınırı
 * aşıyorsa `undefined` döner. Türkçe klavyedeki ondalık virgül de kabul ediliyor.
 */
export function parseCoordinate(text: string, limit: number): number | null | undefined {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const normalised = trimmed.includes(".") ? trimmed : trimmed.replace(",", ".");
  if (!/^[-+]?\d+(\.\d+)?$/.test(normalised)) return undefined;
  const value = Number(normalised);
  return Math.abs(value) <= limit ? value : undefined;
}

const NUMBER = "[-+]?\\d+(?:\\.\\d+)?";
// "38.42, 27.14", "38.42;27.14", "38.42 27.14". Boşluksuz virgül ondalık
// ayırıcı olabileceği için ("38,42") yalnızca iki sayı da noktalıysa çift sayılıyor.
const SEPARATED_PAIR = new RegExp(`^\\s*(${NUMBER})\\s*(?:;\\s*|,\\s+|\\s+)(${NUMBER})\\s*$`);
const DOTTED_PAIR = /^\s*([-+]?\d+\.\d+),([-+]?\d+\.\d+)\s*$/;

/**
 * Google Haritalar'dan kopyalanan "38.423734, 27.142826" gibi bir enlem-boylam
 * çiftini ayırır. Metin bir çift değilse ya da değerler sınır dışındaysa `null`.
 */
export function parseCoordinatePair(text: string): GeoPoint | null {
  const match = SEPARATED_PAIR.exec(text) ?? DOTTED_PAIR.exec(text);
  if (!match) return null;
  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  if (Math.abs(latitude) > LATITUDE_LIMIT || Math.abs(longitude) > LONGITUDE_LIMIT) return null;
  return { latitude, longitude };
}

/** iOS'ta da Android'de de harita uygulamasında ya da tarayıcıda açılan adres. */
export function mapsUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

/** Bulunulan yerden noktaya yol tarifi. */
export function directionsUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}

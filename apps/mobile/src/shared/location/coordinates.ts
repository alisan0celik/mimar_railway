/** Koordinatları gösterme ve harita uygulamasında açma. */

export function formatCoordinates(latitude: number, longitude: number): string {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

/** iOS'ta da Android'de de harita uygulamasında ya da tarayıcıda açılan adres. */
export function mapsUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

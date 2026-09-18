/**
 * Favori kalem ve görev adlarını karşılaştırmak için ortak biçim.
 *
 * Türkçe büyük/küçük harf dönüşümü `toLocaleLowerCase("tr")` ile yapılmalı:
 * `"İ".toLowerCase()` birleşik noktalı `i̇` üretiyor ve görünürde aynı iki ad
 * farklı sayılıyordu; favorilerde çift kayıt böyle oluşuyordu.
 */
export function normaliseName(value: string): string {
  return value.trim().toLocaleLowerCase("tr").normalize("NFC");
}

/**
 * Favori kalem ve yapılacak adlarını karşılaştırmak için ortak biçim;
 * sunucudaki `normaliseName` ile aynı olmalı ki yıldızın durumu sunucunun
 * kararıyla örtüşsün.
 *
 * Türkçe büyük/küçük harf dönüşümü yerel ayarla yapılır: düz `toLowerCase()`
 * "İ"yi birleşik noktalı "i̇"ye çeviriyor. `NFC` ise bazı klavyelerin "ş"yi
 * "s" + birleşen çengel olarak üretmesini tek karaktere indiriyor.
 */
export function normaliseName(value: string): string {
  return value.trim().toLocaleLowerCase("tr").normalize("NFC");
}

/**
 * Projenin kamu ihalesi alanlarını (belediye modu) veritabanı biçimine çevirir.
 *
 * Güncellemede üç durum ayrılır: gönderilmeyen alan (`undefined`) olduğu gibi
 * kalır, `null` ya da boş metin alanı temizler, değer varsa yazılır. Böylece
 * yalnızca süre uzatımını değiştiren bir istek İKN'yi silmez, kullanıcı da
 * bir tarihi geri boşaltabilir.
 */

export type TenderFieldsInput = {
  tenderNumber?: string | null;
  contractDate?: string | null;
  siteDeliveryDate?: string | null;
  workDurationDays?: number | null;
  extensionDays?: number | null;
  provisionalAcceptanceDate?: string | null;
  finalAcceptanceDate?: string | null;
};

function optionalText(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function optionalDate(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  return value ? new Date(value) : null;
}

export function tenderData(input: TenderFieldsInput) {
  return {
    tenderNumber: optionalText(input.tenderNumber),
    contractDate: optionalDate(input.contractDate),
    siteDeliveryDate: optionalDate(input.siteDeliveryDate),
    workDurationDays: input.workDurationDays,
    extensionDays: input.extensionDays,
    provisionalAcceptanceDate: optionalDate(input.provisionalAcceptanceDate),
    finalAcceptanceDate: optionalDate(input.finalAcceptanceDate),
  };
}

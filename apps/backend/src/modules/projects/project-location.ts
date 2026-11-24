import { BadRequestException } from "@nestjs/common";

import { optionalText } from "./tender-fields";

/**
 * Projenin haritadaki noktası ve imar bilgisi (mahalle, ada, parsel).
 *
 * Enlem ve boylam yalnızca birlikte yazılır ya da birlikte temizlenir. Tek
 * başına gelen bir enlem eski boylamla birleşip projeyi haritada bambaşka bir
 * yere koyardı. Diğer alanlarda gönderilmeyen alan değişmez, `null` ya da boş
 * metin temizler.
 */

export type ProjectLocationInput = {
  latitude?: number | null;
  longitude?: number | null;
  neighbourhood?: string | null;
  cadastralBlock?: string | null;
  cadastralParcel?: string | null;
};

export function locationData(input: ProjectLocationInput) {
  const latitudeSent = input.latitude !== undefined;
  const longitudeSent = input.longitude !== undefined;
  const halfCleared =
    latitudeSent && longitudeSent && (input.latitude === null) !== (input.longitude === null);

  if (latitudeSent !== longitudeSent || halfCleared) {
    throw new BadRequestException("Enlem ve boylam birlikte gönderilmeli");
  }

  return {
    latitude: input.latitude,
    longitude: input.longitude,
    neighbourhood: optionalText(input.neighbourhood),
    cadastralBlock: optionalText(input.cadastralBlock),
    cadastralParcel: optionalText(input.cadastralParcel),
  };
}

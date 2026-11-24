import { apiClient } from "./client";

export type FieldReportPhotoDTO = {
  id: string;
  clientPhotoId: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

export type FieldReportDTO = {
  id: string;
  clientId: string;
  title: string | null;
  note: string;
  latitude: number | null;
  longitude: number | null;
  observedAt: string;
  projectId: string;
  authorId: string;
  author: { id: string; fullName: string; avatarUrl: string | null };
  photos: FieldReportPhotoDTO[];
  createdAt: string;
};

export type CreateFieldReportInput = {
  clientId: string;
  title?: string;
  note: string;
  latitude?: number;
  longitude?: number;
  observedAt: string;
};

export type FieldReportPhotoUpload = {
  clientPhotoId: string;
  uri: string;
  mimeType: string;
};

function reportsPath(projectId: string) {
  return `/projects/${projectId}/field-reports`;
}

export const fieldReportsApi = {
  async list(projectId: string) {
    const { data } = await apiClient.get<FieldReportDTO[]>(reportsPath(projectId));
    return data;
  },

  /** Aynı `clientId` ile tekrar çağrılırsa sunucu var olan raporu döndürür. */
  async create(projectId: string, input: CreateFieldReportInput) {
    const { data } = await apiClient.post<FieldReportDTO>(reportsPath(projectId), input);
    return data;
  },

  /** Aynı `clientPhotoId` ile tekrar çağrılırsa sunucu var olan fotoğrafı döndürür. */
  async uploadPhoto(projectId: string, reportId: string, photo: FieldReportPhotoUpload) {
    const form = new FormData();
    form.append("clientPhotoId", photo.clientPhotoId);
    form.append("photo", {
      uri: photo.uri,
      type: photo.mimeType,
      name: `${photo.clientPhotoId}.${photo.mimeType === "image/png" ? "png" : "jpg"}`,
    } as unknown as Blob);

    const { data } = await apiClient.post<FieldReportPhotoDTO>(
      `${reportsPath(projectId)}/${reportId}/photos`,
      form,
      // Fotoğraflar büyük olabiliyor; şantiyedeki yavaş bağlantıda 15 sn yetmez.
      { headers: { "Content-Type": "multipart/form-data" }, timeout: 120_000 },
    );
    return data;
  },

  async remove(projectId: string, reportId: string) {
    await apiClient.delete(`${reportsPath(projectId)}/${reportId}`);
  },

  /**
   * Fotoğrafın adresi. Herkese açık değil; görüntülenirken oturum anahtarı
   * istek başlığında gönderilmeli. API istemcisinin adresinden kuruluyor:
   * sunucu kök adresi canlıda WebSocket adresinden (wss://) türetildiği için
   * görsel adresi olarak kullanılamıyor.
   */
  photoUrl(projectId: string, reportId: string, photoId: string): string {
    const base = (apiClient.defaults.baseURL ?? "").replace(/\/+$/, "");
    return `${base}${reportsPath(projectId)}/${reportId}/photos/${photoId}`;
  },
};

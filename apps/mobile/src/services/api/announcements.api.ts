import { apiClient } from "./client";

export type AnnouncementAudienceDTO = {
  /** Duyurunun ulaşacağı bütün kullanıcılar. */
  recipients: number;
  /** Bunlardan push bildirimi alabilecek cihazı olanlar. */
  reachableByPush: number;
};

/** Platform yöneticisinin bütün kullanıcılara duyurusu. */
export const announcementsApi = {
  async getAudience() {
    const { data } = await apiClient.get<AnnouncementAudienceDTO>("/announcements/audience");
    return data;
  },

  async send(title: string, message: string) {
    const { data } = await apiClient.post<{ recipients: number }>("/announcements", { title, message });
    return data;
  },
};

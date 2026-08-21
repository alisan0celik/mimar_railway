import { apiClient } from "./client";

export interface CalendarEventDTO {
  id: string;
  title: string;
  projectName: string;
  time: string;
  type: string;
  date: string;
  /** Gerçek başlangıç/bitiş anı. Eski sunucu sürümlerinde gelmeyebilir. */
  startsAt?: string;
  endsAt?: string;
}

export type CalendarEventType = "deadline" | "meeting" | "other";

export interface CreateCalendarEventDTO {
  title: string;
  projectName?: string;
  time: string;
  type?: CalendarEventType;
  date: string;
}

export const calendarApi = {
  getEvents: (year: number, month: number) =>
    apiClient.get<CalendarEventDTO[]>("/calendar", {
      params: { year, month },
    }),
  createEvent: (payload: CreateCalendarEventDTO) =>
    apiClient.post<CalendarEventDTO>("/calendar", payload),
  updateEvent: (id: string, payload: Partial<CreateCalendarEventDTO>) =>
    apiClient.patch<CalendarEventDTO>(`/calendar/${id}`, payload),
  deleteEvent: (id: string) => apiClient.delete(`/calendar/${id}`),
};

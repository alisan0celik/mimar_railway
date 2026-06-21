import { apiClient } from "./client";

export interface CalendarEventDTO {
  id: string;
  title: string;
  projectName: string;
  time: string;
  type: string;
  date: string;
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
};

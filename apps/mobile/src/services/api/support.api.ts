import { apiClient } from "./client";
import { unwrapApiData } from "./api-error";

export interface SupportTicketMessageDTO {
  id: string;
  body: string;
  isStaffReply: boolean;
  createdAt: string;
  author: { id: string; fullName: string };
}

export interface SupportTicketSummaryDTO {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  lastMessagePreview: string | null;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupportTicketDetailDTO extends SupportTicketSummaryDTO {
  userId: string;
  companyId: string;
  user?: { id: string; fullName: string; email: string };
  company?: { id: string; name: string };
  messages: SupportTicketMessageDTO[];
}

export const supportApi = {
  getTickets: async () => {
    const res = await apiClient.get<SupportTicketSummaryDTO[]>("/support");
    return unwrapApiData<SupportTicketSummaryDTO[]>(res.data);
  },

  getTicket: async (ticketId: string) => {
    const res = await apiClient.get<SupportTicketDetailDTO>(`/support/${ticketId}`);
    return unwrapApiData<SupportTicketDetailDTO>(res.data);
  },

  createTicket: async (data: { subject: string; category: string; message: string }) => {
    const res = await apiClient.post<SupportTicketDetailDTO>("/support", data);
    return unwrapApiData<SupportTicketDetailDTO>(res.data);
  },

  addMessage: async (ticketId: string, body: string) => {
    const res = await apiClient.post<SupportTicketDetailDTO>(`/support/${ticketId}/messages`, { body });
    return unwrapApiData<SupportTicketDetailDTO>(res.data);
  },
};

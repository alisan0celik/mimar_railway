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

export interface SupportInboxResponse {
  data: SupportTicketDetailDTO[];
  meta: { page: number; limit: number; total: number; totalPages: number };
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

  // --- Platform yöneticisi gelen kutusu (tüm şirketlerin talepleri) ---

  getInbox: async (params?: { status?: string; page?: number; limit?: number }) => {
    const res = await apiClient.get<SupportInboxResponse>("/support/inbox", { params });
    return unwrapApiData<SupportInboxResponse>(res.data);
  },

  getInboxTicket: async (ticketId: string) => {
    const res = await apiClient.get<SupportTicketDetailDTO>(`/support/inbox/${ticketId}`);
    return unwrapApiData<SupportTicketDetailDTO>(res.data);
  },

  replyInbox: async (ticketId: string, body: string) => {
    const res = await apiClient.post<SupportTicketDetailDTO>(`/support/inbox/${ticketId}/reply`, {
      body,
    });
    return unwrapApiData<SupportTicketDetailDTO>(res.data);
  },

  updateInboxStatus: async (ticketId: string, status: string) => {
    const res = await apiClient.patch<SupportTicketDetailDTO>(
      `/support/inbox/${ticketId}/status`,
      { status },
    );
    return unwrapApiData<SupportTicketDetailDTO>(res.data);
  },
};

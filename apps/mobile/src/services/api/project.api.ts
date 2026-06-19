import { apiClient } from "./client";

export type ProjectSectionDTO = {
  id: string;
  name: string;
  order: number;
  status: string;
  content: string | null;
  updatedBy: string | null;
  projectId: string;
  createdAt: string;
  updatedAt: string;
};

export type ProjectNoteDTO = {
  id: string;
  content: string;
  projectId: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  };
};

export type ProjectMessageDTO = {
  id: string;
  content: string;
  projectId: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  };
};

export type ProjectFileDTO = {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  projectId: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  };
};

export type ProjectTeamDTO = {
  id: string;
  role: string | null;
  user: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
  };
  createdAt: string;
};

export type AvailableTeamMemberDTO = {
  id: string;
  fullName: string;
  email: string;
  title: string | null;
  avatarUrl: string | null;
};

export type ProjectTaskDTO = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  sectionId: string | null;
  projectId: string;
  assigneeId: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  assignee: { id: string; fullName: string; avatarUrl: string | null } | null;
  createdBy: { id: string; fullName: string };
};

export type ProjectDTO = {
  id: string;
  name: string;
  customerName: string | null;
  projectType: string | null;
  location: string | null;
  description: string | null;
  hasInspection: boolean;
  inspectionCompany: string | null;
  status: string;
  priority: string;
  imageUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  companyId: string;
  createdById: string;
  sections: ProjectSectionDTO[];
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    fullName: string;
    email: string;
  };
};

export type CreateProjectDTO = {
  name: string;
  customerName?: string;
  projectType?: string;
  location?: string;
  description?: string;
  hasInspection?: boolean;
  inspectionCompany?: string;
  status?: string;
  priority?: string;
  imageUrl?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
};

export type UpdateProjectDTO = Partial<CreateProjectDTO>;

export const projectApi = {
  async getProjects() {
    const { data } = await apiClient.get<ProjectDTO[]>("/projects");
    return data;
  },

  async getProject(id: string) {
    const { data } = await apiClient.get<ProjectDTO>(`/projects/${id}`);
    return data;
  },

  async createProject(payload: CreateProjectDTO) {
    const { data } = await apiClient.post<ProjectDTO>("/projects", payload);
    return data;
  },

  async updateProject(id: string, payload: UpdateProjectDTO) {
    const { data } = await apiClient.patch<ProjectDTO>(`/projects/${id}`, payload);
    return data;
  },

  async deleteProject(id: string) {
    const { data } = await apiClient.delete(`/projects/${id}`);
    return data;
  },

  async updateSection(projectId: string, sectionId: string, payload: { status?: string; content?: string }) {
    const { data } = await apiClient.patch<ProjectSectionDTO>(`/projects/${projectId}/sections/${sectionId}`, payload);
    return data;
  },

  // Notes
  async getNotes(projectId: string) {
    const { data } = await apiClient.get<ProjectNoteDTO[]>(`/projects/${projectId}/notes`);
    return data;
  },
  async addNote(projectId: string, content: string) {
    const { data } = await apiClient.post<ProjectNoteDTO>(`/projects/${projectId}/notes`, { content });
    return data;
  },
  async removeNote(projectId: string, noteId: string) {
    const { data } = await apiClient.delete(`/projects/${projectId}/notes/${noteId}`);
    return data;
  },

  // Messages
  async getMessages(projectId: string) {
    const { data } = await apiClient.get<ProjectMessageDTO[]>(`/projects/${projectId}/messages`);
    return data;
  },
  async addMessage(projectId: string, content: string) {
    const { data } = await apiClient.post<ProjectMessageDTO>(`/projects/${projectId}/messages`, { content });
    return data;
  },
  async removeMessage(projectId: string, messageId: string) {
    const { data } = await apiClient.delete(`/projects/${projectId}/messages/${messageId}`);
    return data;
  },

  // Tasks
  async getTasks(projectId: string) {
    const { data } = await apiClient.get<ProjectTaskDTO[]>(`/projects/${projectId}/tasks`);
    return data;
  },
  async addTask(projectId: string, payload: any) {
    const { data } = await apiClient.post<ProjectTaskDTO>(`/projects/${projectId}/tasks`, payload);
    return data;
  },
  async updateTask(projectId: string, taskId: string, payload: any) {
    const { data } = await apiClient.patch<ProjectTaskDTO>(`/projects/${projectId}/tasks/${taskId}`, payload);
    return data;
  },
  async updateTaskStatus(projectId: string, taskId: string, status: string) {
    const { data } = await apiClient.patch<ProjectTaskDTO>(
      `/projects/${projectId}/tasks/${taskId}/status`,
      { status },
    );
    return data;
  },
  async removeTask(projectId: string, taskId: string) {
    const { data } = await apiClient.delete(`/projects/${projectId}/tasks/${taskId}`);
    return data;
  },

  // Files
  async getFiles(projectId: string) {
    const { data } = await apiClient.get<ProjectFileDTO[]>(`/projects/${projectId}/files`);
    return data;
  },
  async addFile(projectId: string, payload: { name: string; url: string; size: number; type: string }) {
    const { data } = await apiClient.post<ProjectFileDTO>(`/projects/${projectId}/files`, payload);
    return data;
  },
  async removeFile(projectId: string, fileId: string) {
    const { data } = await apiClient.delete(`/projects/${projectId}/files/${fileId}`);
    return data;
  },

  // Team
  async getTeam(projectId: string) {
    const { data } = await apiClient.get<ProjectTeamDTO[]>(`/projects/${projectId}/team`);
    return data;
  },
  async getAvailableTeamMembers(projectId: string) {
    const { data } = await apiClient.get<AvailableTeamMemberDTO[]>(
      `/projects/${projectId}/team/available`,
    );
    return data;
  },
  async addTeamMembers(projectId: string, userIds: string[]) {
    const { data } = await apiClient.post<ProjectTeamDTO[]>(
      `/projects/${projectId}/team/bulk`,
      { userIds },
    );
    return data;
  },
  async addTeamMember(projectId: string, payload: { userId: string; role?: string }) {
    const { data } = await apiClient.post<ProjectTeamDTO>(`/projects/${projectId}/team`, payload);
    return data;
  },
  async removeTeamMember(projectId: string, teamId: string) {
    const { data } = await apiClient.delete(`/projects/${projectId}/team/${teamId}`);
    return data;
  },
};

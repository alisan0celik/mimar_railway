import { ProjectStatus, TaskStatus, TaskPriority } from "../enums";

export interface ProjectDTO {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  companyId: string;
  createdById: string;
  team: ProjectTeamMemberDTO[];
  taskCount: number;
  completedTaskCount: number;
  createdAt: string;
}

export interface ProjectTeamMemberDTO {
  userId: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  role: string | null;
}

export interface TaskDTO {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  sectionId: string | null;
  projectId: string;
  assigneeId: string | null;
  assigneeName: string | null;
  createdById: string;
  createdAt: string;
}

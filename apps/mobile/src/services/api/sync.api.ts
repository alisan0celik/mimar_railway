import type { ProjectDTO, ProjectMessageDTO, ProjectNoteDTO, ProjectTaskDTO } from "./project.api";
import type { PushMutationInput, PushMutationResult } from "../../offline/outbox/outbox.types";
import { apiClient } from "./client";

export type SyncPullResponse = {
  serverTime: string;
  projects: ProjectDTO[];
  tasks: ProjectTaskDTO[];
  notes: ProjectNoteDTO[];
  messages: ProjectMessageDTO[];
  deletedIds: {
    notes: string[];
    tasks: string[];
    messages: string[];
  };
};

export const syncApi = {
  pull: (since?: string) =>
    apiClient.get<SyncPullResponse>("/sync/pull", {
      params: since ? { since } : undefined,
    }),

  push: (mutations: PushMutationInput[]) =>
    apiClient.post<{ results: PushMutationResult[] }>("/sync/push", { mutations }),
};

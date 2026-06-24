import { syncApi } from "../../services/api/sync.api";
import { projectApi, type ProjectMessageDTO, type ProjectNoteDTO, type ProjectTaskDTO } from "../../services/api/project.api";
import { useAuthStore } from "../../store/authStore";
import { useOfflineStore } from "../../store/offlineStore";
import { useProjectStore } from "../../store/projectStore";
import { saveProjects, getCachedProjects } from "../cache/project-cache";
import {
  saveNotes,
  getCachedNotes,
  remapNoteId,
  removeCachedNote,
  upsertPendingNote,
} from "../cache/note-cache";
import {
  saveTasks,
  getCachedTasks,
  remapTaskId,
  removeCachedTask,
  upsertPendingTask,
} from "../cache/task-cache";
import {
  saveMessages,
  getCachedMessages,
  remapMessageId,
  removeCachedMessage,
  upsertPendingMessage,
} from "../cache/message-cache";
import {
  enqueueMutation,
  getPendingMutations,
  markMutationFailed,
  markMutationSynced,
  toPushPayload,
} from "../outbox/outbox.repository";
import { isOnline, subscribeNetwork } from "../network/network-monitor";
import { getLastPullAt, setLastPullAt, setSyncCompanyId } from "./sync-metadata";
import type { PushMutationResult } from "../outbox/outbox.types";
import { v4 as uuidv4 } from "uuid";

let initialized = false;

function shouldQueueOffline(error: unknown): boolean {
  const response = (error as { response?: { status?: number } } | null)?.response;
  return !response?.status;
}

async function applyPullToCache(companyId: string, data: Awaited<ReturnType<typeof syncApi.pull>>["data"]) {
  if (data.projects.length > 0) {
    await saveProjects(data.projects, companyId);
    useProjectStore.getState().setProjects(data.projects);
  }

  const notesByProject = new Map<string, ProjectNoteDTO[]>();
  for (const note of data.notes) {
    const list = notesByProject.get(note.projectId) ?? [];
    list.push(note);
    notesByProject.set(note.projectId, list);
  }
  for (const [projectId, notes] of notesByProject) {
    await saveNotes(projectId, notes);
  }

  const tasksByProject = new Map<string, ProjectTaskDTO[]>();
  for (const task of data.tasks) {
    const list = tasksByProject.get(task.projectId) ?? [];
    list.push(task);
    tasksByProject.set(task.projectId, list);
  }
  for (const [projectId, tasks] of tasksByProject) {
    await saveTasks(projectId, tasks);
  }

  const messagesByProject = new Map<string, ProjectMessageDTO[]>();
  for (const message of data.messages) {
    const list = messagesByProject.get(message.projectId) ?? [];
    list.push(message);
    messagesByProject.set(message.projectId, list);
  }
  for (const [projectId, messages] of messagesByProject) {
    await saveMessages(projectId, messages);
  }

  for (const noteId of data.deletedIds.notes) {
    await removeCachedNote(noteId);
  }
  for (const taskId of data.deletedIds.tasks) {
    await removeCachedTask(taskId);
  }
  for (const messageId of data.deletedIds.messages) {
    await removeCachedMessage(messageId);
  }

  await setLastPullAt(data.serverTime);
}

async function applyPushResults(results: PushMutationResult[]) {
  const pendingBefore = await getPendingMutations();

  for (const result of results) {
    if (result.status === "applied" || result.status === "duplicate") {
      await markMutationSynced(result.mutationId);

      const mutation = pendingBefore.find((item) => item.mutationId === result.mutationId);
      if (!mutation || !result.serverId || !result.serverRecord) continue;

      if (mutation.entity === "note" && mutation.action === "create") {
        await remapNoteId(mutation.entityId!, result.serverId, result.serverRecord as ProjectNoteDTO);
      }
      if (mutation.entity === "task" && mutation.action === "create") {
        await remapTaskId(mutation.entityId!, result.serverId, result.serverRecord as ProjectTaskDTO);
      }
      if (mutation.entity === "message" && mutation.action === "create") {
        await remapMessageId(mutation.entityId!, result.serverId, result.serverRecord as ProjectMessageDTO);
      }
      if (mutation.action === "delete") {
        if (mutation.entity === "note") await removeCachedNote(mutation.entityId!);
        if (mutation.entity === "task") await removeCachedTask(mutation.entityId!);
        if (mutation.entity === "message") await removeCachedMessage(mutation.entityId!);
      }
    } else if (result.status === "conflict") {
      await markMutationFailed(result.mutationId);
    }
  }
}

export async function runSync(): Promise<void> {
  if (!isOnline()) return;

  const user = useAuthStore.getState().user;
  if (!user?.companyId) return;

  const offlineStore = useOfflineStore.getState();
  if (offlineStore.isSyncing) return;

  offlineStore.setSyncing(true);
  try {
    await setSyncCompanyId(user.companyId);

    const pending = await getPendingMutations();
    if (pending.length > 0) {
      const response = await syncApi.push(await toPushPayload(pending));
      await applyPushResults(response.data.results);
    }

    const since = await getLastPullAt();
    const pullResponse = await syncApi.pull(since ?? undefined);
    await applyPullToCache(user.companyId, pullResponse.data);
  } finally {
    offlineStore.setSyncing(false);
    await offlineStore.refreshPendingCount();
  }
}

export async function fetchProjectsWithCache(): Promise<void> {
  const user = useAuthStore.getState().user;
  if (!user?.companyId) return;

  const cached = await getCachedProjects(user.companyId);
  if (cached.length > 0) {
    useProjectStore.getState().setProjects(cached);
  }

  if (isOnline()) {
    try {
      const projects = await projectApi.getProjects();
      await saveProjects(projects, user.companyId);
      useProjectStore.getState().setProjects(projects);
    } catch {
      if (cached.length === 0) {
        throw new Error("Projeler yüklenemedi");
      }
    }
  } else if (cached.length === 0) {
    throw new Error("Çevrimdışı — önbellekte proje bulunamadı");
  }
}

export async function fetchNotesWithCache(projectId: string): Promise<ProjectNoteDTO[]> {
  const cached = await getCachedNotes(projectId);
  if (isOnline()) {
    try {
      const notes = await projectApi.getNotes(projectId);
      await saveNotes(projectId, notes);
      return notes;
    } catch {
      return cached;
    }
  }
  return cached;
}

export async function fetchTasksWithCache(projectId: string): Promise<ProjectTaskDTO[]> {
  const cached = await getCachedTasks(projectId);
  if (isOnline()) {
    try {
      const tasks = await projectApi.getTasks(projectId);
      await saveTasks(projectId, tasks);
      return tasks;
    } catch {
      return cached;
    }
  }
  return cached;
}

export async function fetchMessagesWithCache(projectId: string): Promise<ProjectMessageDTO[]> {
  const cached = await getCachedMessages(projectId);
  if (isOnline()) {
    try {
      const messages = await projectApi.getMessages(projectId);
      await saveMessages(projectId, messages);
      return messages;
    } catch {
      return cached;
    }
  }
  return cached;
}

export async function createNoteOffline(projectId: string, content: string, user: { id: string; fullName: string }) {
  const tempId = `temp_note_${uuidv4()}`;
  const now = new Date().toISOString();
  const note: ProjectNoteDTO = {
    id: tempId,
    content,
    projectId,
    authorId: user.id,
    createdAt: now,
    updatedAt: now,
    author: { id: user.id, fullName: user.fullName, avatarUrl: null },
  };

  try {
    const created = await projectApi.addNote(projectId, content);
    await saveNotes(projectId, [created, ...(await getCachedNotes(projectId))]);
    return created;
  } catch (error) {
    if (!shouldQueueOffline(error)) throw error;
  }

  await upsertPendingNote(note);
  await enqueueMutation({
    entity: "note",
    action: "create",
    projectId,
    entityId: tempId,
    payload: { content },
  });
  await useOfflineStore.getState().refreshPendingCount();
  return note;
}

export async function deleteNoteOffline(projectId: string, noteId: string) {
  if (isOnline() && !noteId.startsWith("temp_")) {
    await projectApi.removeNote(projectId, noteId);
    await removeCachedNote(noteId);
    return;
  }

  await removeCachedNote(noteId);
  await enqueueMutation({
    entity: "note",
    action: "delete",
    projectId,
    entityId: noteId,
    payload: {},
  });
  await useOfflineStore.getState().refreshPendingCount();
}

export async function createMessageOffline(
  projectId: string,
  content: string,
  user: { id: string; fullName: string },
) {
  const tempId = `temp_message_${uuidv4()}`;
  const now = new Date().toISOString();
  const message: ProjectMessageDTO = {
    id: tempId,
    content,
    projectId,
    authorId: user.id,
    createdAt: now,
    updatedAt: now,
    author: { id: user.id, fullName: user.fullName, avatarUrl: null },
  };

  try {
    const created = await projectApi.addMessage(projectId, content);
    await saveMessages(projectId, [created, ...(await getCachedMessages(projectId))]);
    return created;
  } catch (error) {
    if (!shouldQueueOffline(error)) throw error;
  }

  await upsertPendingMessage(message);
  await enqueueMutation({
    entity: "message",
    action: "create",
    projectId,
    entityId: tempId,
    payload: { content },
  });
  await useOfflineStore.getState().refreshPendingCount();
  return message;
}

export async function deleteMessageOffline(projectId: string, messageId: string) {
  if (isOnline() && !messageId.startsWith("temp_")) {
    await projectApi.removeMessage(projectId, messageId);
    await removeCachedMessage(messageId);
    return;
  }

  await removeCachedMessage(messageId);
  await enqueueMutation({
    entity: "message",
    action: "delete",
    projectId,
    entityId: messageId,
    payload: {},
  });
  await useOfflineStore.getState().refreshPendingCount();
}

export async function createTaskOffline(
  projectId: string,
  payload: Record<string, unknown>,
  user: { id: string; fullName: string },
) {
  const tempId = `temp_task_${uuidv4()}`;
  const now = new Date().toISOString();
  const task: ProjectTaskDTO = {
    id: tempId,
    title: String(payload.title ?? ""),
    description: (payload.description as string) ?? null,
    status: String(payload.status ?? "todo"),
    priority: String(payload.priority ?? "medium"),
    dueDate: (payload.dueDate as string) ?? null,
    sectionId: (payload.sectionId as string) ?? null,
    projectId,
    assigneeId: (payload.assigneeId as string) ?? null,
    createdById: user.id,
    createdAt: now,
    updatedAt: now,
    assignee: null,
    createdBy: { id: user.id, fullName: user.fullName },
  };

  try {
    const created = await projectApi.addTask(projectId, payload);
    await saveTasks(projectId, [created, ...(await getCachedTasks(projectId))]);
    return created;
  } catch (error) {
    if (!shouldQueueOffline(error)) throw error;
  }

  await upsertPendingTask(task);
  await enqueueMutation({
    entity: "task",
    action: "create",
    projectId,
    entityId: tempId,
    payload,
  });
  await useOfflineStore.getState().refreshPendingCount();
  return task;
}

export async function updateTaskOffline(projectId: string, taskId: string, payload: Record<string, unknown>) {
  const tasks = await getCachedTasks(projectId);
  const existing = tasks.find((task) => task.id === taskId);
  if (!existing) return;
  const payloadKeys = Object.keys(payload);
  const isStatusOnlyUpdate = payloadKeys.length === 1 && typeof payload.status === "string";

  const updated: ProjectTaskDTO = {
    ...existing,
    ...payload,
    updatedAt: new Date().toISOString(),
  } as ProjectTaskDTO;

  if (isOnline() && !taskId.startsWith("temp_")) {
    try {
      const result = isStatusOnlyUpdate
        ? await projectApi.updateTaskStatus(projectId, taskId, String(payload.status))
        : await projectApi.updateTask(projectId, taskId, payload);
      await saveTasks(
        projectId,
        tasks.map((task) => (task.id === taskId ? result : task)),
      );
      return result;
    } catch {
      // fall through
    }
  }

  await upsertPendingTask(updated);
  await enqueueMutation({
    entity: "task",
    action: "update",
    projectId,
    entityId: taskId,
    payload,
  });
  await useOfflineStore.getState().refreshPendingCount();
  return updated;
}

export async function deleteTaskOffline(projectId: string, taskId: string) {
  if (isOnline() && !taskId.startsWith("temp_")) {
    await projectApi.removeTask(projectId, taskId);
    await removeCachedTask(taskId);
    return;
  }

  await removeCachedTask(taskId);
  await enqueueMutation({
    entity: "task",
    action: "delete",
    projectId,
    entityId: taskId,
    payload: {},
  });
  await useOfflineStore.getState().refreshPendingCount();
}

export function initSyncEngine(): void {
  if (initialized) return;
  initialized = true;

  void initNetworkMonitorSideEffects();
}

async function initNetworkMonitorSideEffects() {
  const { initNetworkMonitor } = await import("../network/network-monitor");
  await initNetworkMonitor();

  subscribeNetwork((online) => {
    if (online) {
      void runSync();
    }
  });

  const user = useAuthStore.getState().user;
  if (user?.companyId && isOnline()) {
    void runSync();
  }
}

export function triggerSyncFromNotification(): void {
  void runSync();
}

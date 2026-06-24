import type { ProjectTaskDTO } from "../../services/api/project.api";
import { getDatabase } from "../db/database";

export async function saveTasks(projectId: string, tasks: ProjectTaskDTO[]): Promise<void> {
  const db = await getDatabase();
  if (!db) return;

  await db.withTransactionAsync(async () => {
    await db.runAsync(`DELETE FROM cached_tasks WHERE project_id = ? AND is_pending = 0`, projectId);
    for (const task of tasks) {
      await db.runAsync(
        `INSERT OR REPLACE INTO cached_tasks (id, project_id, payload, updated_at, is_pending)
         VALUES (?, ?, ?, ?, 0)`,
        task.id,
        projectId,
        JSON.stringify(task),
        task.updatedAt,
      );
    }
  });
}

export async function getCachedTasks(projectId: string): Promise<ProjectTaskDTO[]> {
  const db = await getDatabase();
  if (!db) return [];

  const rows = await db.getAllAsync<{ payload: string }>(
    `SELECT payload FROM cached_tasks WHERE project_id = ? ORDER BY updated_at DESC`,
    projectId,
  );

  return rows.map((row) => JSON.parse(row.payload) as ProjectTaskDTO);
}

export async function upsertPendingTask(task: ProjectTaskDTO): Promise<void> {
  const db = await getDatabase();
  if (!db) return;

  await db.runAsync(
    `INSERT OR REPLACE INTO cached_tasks (id, project_id, payload, updated_at, is_pending)
     VALUES (?, ?, ?, ?, 1)`,
    task.id,
    task.projectId,
    JSON.stringify(task),
    task.updatedAt,
  );
}

export async function removeCachedTask(taskId: string): Promise<void> {
  const db = await getDatabase();
  if (!db) return;
  await db.runAsync(`DELETE FROM cached_tasks WHERE id = ?`, taskId);
}

export async function remapTaskId(tempId: string, serverId: string, serverTask: ProjectTaskDTO): Promise<void> {
  const db = await getDatabase();
  if (!db) return;

  await db.withTransactionAsync(async () => {
    await db.runAsync(`DELETE FROM cached_tasks WHERE id = ?`, tempId);
    await db.runAsync(
      `INSERT OR REPLACE INTO cached_tasks (id, project_id, payload, updated_at, is_pending)
       VALUES (?, ?, ?, ?, 0)`,
      serverId,
      serverTask.projectId,
      JSON.stringify(serverTask),
      serverTask.updatedAt,
    );
  });
}

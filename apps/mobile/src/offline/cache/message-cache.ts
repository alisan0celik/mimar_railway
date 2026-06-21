import type { ProjectMessageDTO } from "../../services/api/project.api";
import { getDatabase } from "../db/database";

export async function saveMessages(projectId: string, messages: ProjectMessageDTO[]): Promise<void> {
  const db = await getDatabase();
  if (!db) return;

  await db.withTransactionAsync(async () => {
    await db.runAsync(`DELETE FROM cached_messages WHERE project_id = ? AND is_pending = 0`, projectId);
    for (const message of messages) {
      await db.runAsync(
        `INSERT OR REPLACE INTO cached_messages (id, project_id, payload, updated_at, is_pending)
         VALUES (?, ?, ?, ?, 0)`,
        message.id,
        projectId,
        JSON.stringify(message),
        message.updatedAt,
      );
    }
  });
}

export async function getCachedMessages(projectId: string): Promise<ProjectMessageDTO[]> {
  const db = await getDatabase();
  if (!db) return [];

  const rows = await db.getAllAsync<{ payload: string }>(
    `SELECT payload FROM cached_messages WHERE project_id = ? ORDER BY updated_at DESC`,
    projectId,
  );

  return rows.map((row) => JSON.parse(row.payload) as ProjectMessageDTO);
}

export async function upsertPendingMessage(message: ProjectMessageDTO): Promise<void> {
  const db = await getDatabase();
  if (!db) return;

  await db.runAsync(
    `INSERT OR REPLACE INTO cached_messages (id, project_id, payload, updated_at, is_pending)
     VALUES (?, ?, ?, ?, 1)`,
    message.id,
    message.projectId,
    JSON.stringify(message),
    message.updatedAt,
    1,
  );
}

export async function removeCachedMessage(messageId: string): Promise<void> {
  const db = await getDatabase();
  if (!db) return;
  await db.runAsync(`DELETE FROM cached_messages WHERE id = ?`, messageId);
}

export async function remapMessageId(
  tempId: string,
  serverId: string,
  serverMessage: ProjectMessageDTO,
): Promise<void> {
  const db = await getDatabase();
  if (!db) return;

  await db.withTransactionAsync(async () => {
    await db.runAsync(`DELETE FROM cached_messages WHERE id = ?`, tempId);
    await db.runAsync(
      `INSERT OR REPLACE INTO cached_messages (id, project_id, payload, updated_at, is_pending)
       VALUES (?, ?, ?, ?, 0)`,
      serverId,
      serverMessage.projectId,
      JSON.stringify(serverMessage),
      serverMessage.updatedAt,
    );
  });
}

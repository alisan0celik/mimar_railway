import type { ProjectNoteDTO } from "../../services/api/project.api";
import { getDatabase } from "../db/database";

export async function saveNotes(projectId: string, notes: ProjectNoteDTO[]): Promise<void> {
  const db = await getDatabase();
  if (!db) return;

  await db.withTransactionAsync(async () => {
    await db.runAsync(`DELETE FROM cached_notes WHERE project_id = ? AND is_pending = 0`, projectId);
    for (const note of notes) {
      await db.runAsync(
        `INSERT OR REPLACE INTO cached_notes (id, project_id, payload, updated_at, is_pending)
         VALUES (?, ?, ?, ?, 0)`,
        note.id,
        projectId,
        JSON.stringify(note),
        note.updatedAt,
      );
    }
  });
}

export async function getCachedNotes(projectId: string): Promise<ProjectNoteDTO[]> {
  const db = await getDatabase();
  if (!db) return [];

  const rows = await db.getAllAsync<{ payload: string }>(
    `SELECT payload FROM cached_notes WHERE project_id = ? ORDER BY updated_at DESC`,
    projectId,
  );

  return rows.map((row) => JSON.parse(row.payload) as ProjectNoteDTO);
}

export async function upsertPendingNote(note: ProjectNoteDTO): Promise<void> {
  const db = await getDatabase();
  if (!db) return;

  await db.runAsync(
    `INSERT OR REPLACE INTO cached_notes (id, project_id, payload, updated_at, is_pending)
     VALUES (?, ?, ?, ?, 1)`,
    note.id,
    note.projectId,
    JSON.stringify(note),
    note.updatedAt,
  );
}

export async function removeCachedNote(noteId: string): Promise<void> {
  const db = await getDatabase();
  if (!db) return;
  await db.runAsync(`DELETE FROM cached_notes WHERE id = ?`, noteId);
}

export async function remapNoteId(tempId: string, serverId: string, serverNote: ProjectNoteDTO): Promise<void> {
  const db = await getDatabase();
  if (!db) return;

  await db.withTransactionAsync(async () => {
    await db.runAsync(`DELETE FROM cached_notes WHERE id = ?`, tempId);
    await db.runAsync(
      `INSERT OR REPLACE INTO cached_notes (id, project_id, payload, updated_at, is_pending)
       VALUES (?, ?, ?, ?, 0)`,
      serverId,
      serverNote.projectId,
      JSON.stringify(serverNote),
      serverNote.updatedAt,
    );
  });
}

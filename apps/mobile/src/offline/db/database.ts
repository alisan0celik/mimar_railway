import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";

const DB_NAME = "mimar_offline.db";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

const SCHEMA_SQL = `
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS cached_projects (
  id TEXT PRIMARY KEY NOT NULL,
  company_id TEXT NOT NULL,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cached_tasks (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  is_pending INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS cached_notes (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  is_pending INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS cached_messages (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  is_pending INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sync_outbox (
  mutation_id TEXT PRIMARY KEY NOT NULL,
  entity TEXT NOT NULL,
  action TEXT NOT NULL,
  project_id TEXT,
  entity_id TEXT,
  payload TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_meta (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cached_tasks_project ON cached_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_cached_notes_project ON cached_notes(project_id);
CREATE INDEX IF NOT EXISTS idx_cached_messages_project ON cached_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_outbox_status ON sync_outbox(status);
`;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase | null> {
  if (Platform.OS === "web") {
    return null;
  }

  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await db.execAsync(SCHEMA_SQL);
      return db;
    })();
  }

  return dbPromise;
}

export async function clearOfflineDatabase(): Promise<void> {
  const db = await getDatabase();
  if (!db) return;

  await db.execAsync(`
    DELETE FROM cached_projects;
    DELETE FROM cached_tasks;
    DELETE FROM cached_notes;
    DELETE FROM cached_messages;
    DELETE FROM sync_outbox;
    DELETE FROM sync_meta;
  `);
}

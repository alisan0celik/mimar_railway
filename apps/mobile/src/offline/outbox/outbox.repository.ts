import { createClientId } from "../../shared/utils/id";
import { getDatabase } from "../db/database";
import type { OutboxAction, OutboxEntity, OutboxMutation, PushMutationInput } from "./outbox.types";

export async function enqueueMutation(input: {
  entity: OutboxEntity;
  action: OutboxAction;
  projectId?: string;
  entityId?: string;
  payload: Record<string, unknown>;
}): Promise<OutboxMutation> {
  const db = await getDatabase();
  const mutation: OutboxMutation = {
    mutationId: createClientId("mutation"),
    entity: input.entity,
    action: input.action,
    projectId: input.projectId,
    entityId: input.entityId,
    payload: input.payload,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  if (!db) {
    return mutation;
  }

  await db.runAsync(
    `INSERT INTO sync_outbox (mutation_id, entity, action, project_id, entity_id, payload, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    mutation.mutationId,
    mutation.entity,
    mutation.action,
    mutation.projectId ?? null,
    mutation.entityId ?? null,
    JSON.stringify(mutation.payload),
    mutation.status,
    mutation.createdAt,
  );

  return mutation;
}

export async function getPendingMutations(): Promise<OutboxMutation[]> {
  const db = await getDatabase();
  if (!db) return [];

  const rows = await db.getAllAsync<{
    mutation_id: string;
    entity: OutboxEntity;
    action: OutboxAction;
    project_id: string | null;
    entity_id: string | null;
    payload: string;
    status: string;
    created_at: string;
  }>(`SELECT * FROM sync_outbox WHERE status = 'pending' ORDER BY created_at ASC`);

  return rows.map((row) => ({
    mutationId: row.mutation_id,
    entity: row.entity,
    action: row.action,
    projectId: row.project_id ?? undefined,
    entityId: row.entity_id ?? undefined,
    payload: JSON.parse(row.payload),
    status: row.status as OutboxMutation["status"],
    createdAt: row.created_at,
  }));
}

export async function markMutationSynced(mutationId: string): Promise<void> {
  const db = await getDatabase();
  if (!db) return;

  await db.runAsync(`UPDATE sync_outbox SET status = 'synced' WHERE mutation_id = ?`, mutationId);
}

export async function markMutationFailed(mutationId: string): Promise<void> {
  const db = await getDatabase();
  if (!db) return;

  await db.runAsync(`UPDATE sync_outbox SET status = 'failed' WHERE mutation_id = ?`, mutationId);
}

export async function toPushPayload(mutations: OutboxMutation[]): Promise<PushMutationInput[]> {
  return mutations.map((mutation) => ({
    mutationId: mutation.mutationId,
    entity: mutation.entity,
    action: mutation.action,
    projectId: mutation.projectId,
    entityId: mutation.entityId,
    payload: mutation.payload,
    clientCreatedAt: mutation.createdAt,
  }));
}

export async function getPendingCount(): Promise<number> {
  const db = await getDatabase();
  if (!db) return 0;

  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM sync_outbox WHERE status = 'pending'`,
  );
  return row?.count ?? 0;
}

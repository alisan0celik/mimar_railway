export type OutboxEntity = "note" | "task" | "message";
export type OutboxAction = "create" | "update" | "delete";
export type OutboxStatus = "pending" | "synced" | "failed";

export type OutboxMutation = {
  mutationId: string;
  entity: OutboxEntity;
  action: OutboxAction;
  projectId?: string;
  entityId?: string;
  payload: Record<string, unknown>;
  status: OutboxStatus;
  createdAt: string;
};

export type PushMutationInput = {
  mutationId: string;
  entity: OutboxEntity;
  action: OutboxAction;
  projectId?: string;
  entityId?: string;
  payload: Record<string, unknown>;
  clientCreatedAt: string;
};

export type PushMutationResult = {
  mutationId: string;
  status: "applied" | "duplicate" | "conflict";
  serverId?: string;
  serverRecord?: unknown;
  message?: string;
};

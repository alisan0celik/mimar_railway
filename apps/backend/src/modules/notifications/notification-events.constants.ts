export const NOTIFICATION_TARGET = {
  MEMBERSHIP: "membership",
  JOIN_REQUEST: "join_request",
  PROJECT: "project",
  PROJECT_TASK: "project_task",
  PROGRESS_PAYMENT: "progress_payment",
  PROJECT_NOTE: "project_note",
  FINANCE_RECORD: "finance_record",
  CALENDAR_EVENT: "calendar_event",
  SUPPORT_TICKET: "support_ticket",
  SUBSCRIPTION: "subscription",
} as const;

export const SUBSCRIPTION_ACTION = {
  EXPIRING: "expiring",
} as const;

export const MEMBERSHIP_ACTION = {
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

export const PROJECT_TASK_ACTION = {
  CREATED: "created",
  COMPLETED: "completed",
} as const;

export const PROGRESS_PAYMENT_ACTION = {
  ISSUED: "issued",
  PAID: "paid",
} as const;

export const PROJECT_NOTE_ACTION = {
  CREATED: "created",
} as const;

export const PROJECT_ACTION = {
  CREATED: "created",
} as const;

export const FINANCE_ACTION = {
  CREATED: "created",
} as const;

export const CALENDAR_EVENT_ACTION = {
  CREATED: "created",
} as const;

export const SUPPORT_TICKET_ACTION = {
  CREATED: "created",
  REPLIED: "replied",
  USER_REPLIED: "user_replied",
  STATUS_CHANGED: "status_changed",
} as const;

export const MEMBERSHIP_ROUTES = {
  APPROVED: "/(main)/(tabs)/dashboard",
  REJECTED: "/(auth)/login",
} as const;

export function projectTaskRoute(projectId: string): string {
  return `/(main)/projects/${projectId}?tab=todos`;
}

export function projectNoteRoute(projectId: string): string {
  return `/(main)/projects/${projectId}?tab=notes`;
}

export function projectRoute(projectId: string): string {
  return `/(main)/projects/${projectId}`;
}

export function progressPaymentRoute(projectId: string): string {
  return `/(main)/projects/${projectId}/progress`;
}

export function financeRoute(): string {
  return "/(main)/(tabs)/finance";
}

export function subscriptionRoute(): string {
  return "/(main)/(tabs)/profile";
}

export function calendarRoute(): string {
  return "/(main)/dashboard/calendar";
}

export function supportTicketRoute(ticketId: string): string {
  return `/(main)/settings/support-tickets/${ticketId}`;
}

/** Platform yöneticisinin gelen kutusundaki talep detayı. */
export function platformSupportTicketRoute(ticketId: string): string {
  return `/(main)/platform/support/${ticketId}`;
}

export const FCM_CHANNEL_DEFAULT = "default";
export const FCM_CHANNEL_MEMBERSHIP = "membership";
export const FCM_CHANNEL_PROJECT = "projects";
export const FCM_CHANNEL_SUPPORT = "support";

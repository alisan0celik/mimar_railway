export enum AuthProvider {
  EMAIL = "EMAIL",
  GOOGLE = "GOOGLE",
  APPLE = "APPLE",
  MICROSOFT = "MICROSOFT",
}

export enum ApprovalStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  SUSPENDED = "suspended",
}

export enum CompanyStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  PENDING = "pending",
}

export enum NotificationType {
  INFO = "info",
  SUCCESS = "success",
  WARNING = "warning",
  DANGER = "danger",
}

export enum ProjectStatus {
  ACTIVE = "active",
  PLANNED = "planned",
  COMPLETED = "completed",
  WAITING = "waiting",
}

export enum TaskStatus {
  TODO = "todo",
  IN_PROGRESS = "in_progress",
  REVIEW = "review",
  DONE = "done",
}

export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

export enum FinanceType {
  INCOME = "income",
  EXPENSE = "expense",
}

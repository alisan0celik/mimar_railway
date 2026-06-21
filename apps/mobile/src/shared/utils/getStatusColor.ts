export type StatusColorVariant = "success" | "warning" | "info" | "primary" | "neutral";

export function getStatusColor(status: string): StatusColorVariant {
  switch (status) {
    case "active":
      return "success";
    case "planned":
    case "planning":
      return "info";
    case "completed":
      return "primary";
    case "waiting":
    case "pending":
      return "warning";
    case "rejected":
      return "warning";
    default:
      return "neutral";
  }
}

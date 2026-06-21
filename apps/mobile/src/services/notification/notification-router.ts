import type { Href } from "expo-router";
import { router } from "expo-router";

import { getPostAuthRoute } from "../../features/auth/utils/post-auth-route";
import { AuthService } from "../auth/auth.service";
import { useAuthStore } from "../../store/authStore";

export type NotificationDataPayload = Record<string, unknown> & {
  targetType?: string;
  action?: string;
  route?: string;
};

export async function handleNotificationData(data: NotificationDataPayload): Promise<boolean> {
  const targetType = data.targetType;
  const action = data.action;

  if (targetType === "membership") {
    try {
      const user = await AuthService.getProfile();
      useAuthStore.getState().setUser(user);

      if (action === "approved" || user.approvalStatus === "approved") {
        router.replace(getPostAuthRoute(user));
        return true;
      }

      if (action === "rejected" || user.approvalStatus === "rejected") {
        await useAuthStore.getState().logout();
        router.replace("/(auth)/login");
        return true;
      }
    } catch {
      if (typeof data.route === "string" && data.route.length > 0) {
        router.replace(data.route as Href);
        return true;
      }
    }
    return true;
  }

  if (targetType === "join_request") {
    router.push("/(main)/users/pending");
    return true;
  }

  if (targetType === "project_task") {
    const projectId = typeof data.projectId === "string" ? data.projectId : undefined;
    if (projectId) {
      if (typeof data.route === "string" && data.route.length > 0) {
        router.push(data.route as Href);
      } else {
        router.push({
          pathname: "/(main)/projects/[projectId]",
          params: { projectId, tab: "todos" },
        });
      }
      return true;
    }
  }

  if (targetType === "project_note") {
    const projectId = typeof data.projectId === "string" ? data.projectId : undefined;
    if (projectId) {
      if (typeof data.route === "string" && data.route.length > 0) {
        router.push(data.route as Href);
      } else {
        router.push({
          pathname: "/(main)/projects/[projectId]",
          params: { projectId, tab: "notes" },
        });
      }
      return true;
    }
  }

  if (targetType === "calendar_event") {
    if (typeof data.route === "string" && data.route.length > 0) {
      router.push(data.route as Href);
    } else {
      router.push("/(main)/dashboard/calendar");
    }
    return true;
  }

  if (targetType === "support_ticket") {
    const ticketId = typeof data.ticketId === "string" ? data.ticketId : undefined;
    if (ticketId) {
      if (typeof data.route === "string" && data.route.length > 0) {
        router.push(data.route as Href);
      } else {
        router.push({
          pathname: "/(main)/settings/support-tickets/[ticketId]",
          params: { ticketId },
        });
      }
      return true;
    }
  }

  return false;
}

export function isMembershipNotification(data: NotificationDataPayload): boolean {
  return data.targetType === "membership";
}

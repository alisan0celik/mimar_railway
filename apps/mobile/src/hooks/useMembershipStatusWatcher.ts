import { useEffect, useRef } from "react";
import { router } from "expo-router";

import { getPostAuthRoute } from "../features/auth/utils/post-auth-route";
import { AuthService } from "../services/auth/auth.service";
import {
  handleNotificationData,
  isMembershipNotification,
  type NotificationDataPayload,
} from "../services/notification/notification-router";
import { socketService } from "../services/websocket/socket.service";
import { useAuthStore } from "../store/authStore";

const POLL_INTERVAL_MS = 45_000;

async function syncMembershipStatusFromProfile(): Promise<boolean> {
  const current = useAuthStore.getState().user;
  if (!current || current.approvalStatus !== "pending") return false;

  try {
    const user = await AuthService.getProfile();
    if (user.approvalStatus === current.approvalStatus) return false;

    useAuthStore.getState().setUser(user);

    if (user.approvalStatus === "approved") {
      router.replace(getPostAuthRoute(user));
      return true;
    }

    if (user.approvalStatus === "rejected") {
      await useAuthStore.getState().logout();
      router.replace("/(auth)/login");
      return true;
    }
  } catch {
    // ignore transient errors
  }

  return false;
}

export function useMembershipStatusWatcher(enabled: boolean) {
  const handledRef = useRef(false);

  useEffect(() => {
    if (!enabled || handledRef.current) return;

    const user = useAuthStore.getState().user;
    if (!user?.id) return;

    void socketService.connect(user.id);

    const onNotification = (notification: unknown) => {
      if (handledRef.current) return;
      const payload = notification as NotificationDataPayload;
      if (!isMembershipNotification(payload)) return;

      handledRef.current = true;
      void handleNotificationData(payload);
    };

    socketService.on("notification", onNotification);

    void syncMembershipStatusFromProfile();

    const pollId = setInterval(() => {
      if (handledRef.current) return;
      void syncMembershipStatusFromProfile().then((handled) => {
        if (handled) handledRef.current = true;
      });
    }, POLL_INTERVAL_MS);

    return () => {
      clearInterval(pollId);
      socketService.off("notification", onNotification);
    };
  }, [enabled]);
}

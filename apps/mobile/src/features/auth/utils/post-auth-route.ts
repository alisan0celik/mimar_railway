import type { UserDTO } from "@mimar/shared";
import type { Href } from "expo-router";

export function getPostAuthRoute(user: UserDTO | null | undefined): Href {
  if (!user?.companyId) {
    return "/(auth)/company-select";
  }

  if (user.approvalStatus === "pending") {
    return {
      pathname: "/(auth)/approval-pending",
      params: { companyName: user.companyName ?? "" },
    };
  }

  if (user.approvalStatus === "approved") {
    return "/(main)/(tabs)/dashboard";
  }

  return "/(auth)/login";
}

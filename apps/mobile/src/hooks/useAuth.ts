import { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";
import { useAuthStore } from "../store/authStore";
import { getPostAuthRoute } from "../features/auth/utils/post-auth-route";

export function useAuth() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isLoading, user, error, login, register, socialLogin, logout, hydrate, clearError } =
    useAuthStore();

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace(getPostAuthRoute(user));
    }
  }, [isAuthenticated, isLoading, segments, user]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    socialLogin,
    logout,
    hydrate,
    clearError,
  };
}

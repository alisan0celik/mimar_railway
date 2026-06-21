import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { getTokens, setTokens, clearTokens } from "../auth/token-storage";
import { emitAuthSessionExpired } from "../auth/auth-session";
import { useAuthStore } from "../../store/authStore";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api";

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const tokens = await getTokens();
    if (tokens?.accessToken) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

const SUBSCRIPTION_BLOCK_CODES = new Set([
  "COMPANY_SUBSCRIPTION_EXPIRED",
  "COMPANY_SUBSCRIPTION_BLOCKED",
  "COMPANY_INACTIVE",
]);

async function forceLogout() {
  await clearTokens();
  useAuthStore.setState({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    const responseData = error.response?.data as { code?: string } | undefined;
    const requestUrl = originalRequest.url ?? "";

    if (
      error.response?.status === 403 &&
      responseData?.code &&
      SUBSCRIPTION_BLOCK_CODES.has(responseData.code)
    ) {
      if (requestUrl.includes("/auth/login") || requestUrl.includes("/auth/social")) {
        return Promise.reject(error);
      }
      await forceLogout();
      emitAuthSessionExpired();
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Do not intercept auth endpoints to allow them to handle their own errors
      if (originalRequest.url?.includes("/auth/login") || originalRequest.url?.includes("/auth/refresh") || originalRequest.url?.includes("/auth/register")) {
        return Promise.reject(error);
      }
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const tokens = await getTokens();
        if (!tokens?.refreshToken) {
          throw new Error("No refresh token");
        }

        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken: tokens.refreshToken,
        });

        const { accessToken, refreshToken, user } = response.data;
        await setTokens(accessToken, refreshToken);
        if (user) {
          useAuthStore.getState().setUser(user);
        }

        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await forceLogout();
        emitAuthSessionExpired();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

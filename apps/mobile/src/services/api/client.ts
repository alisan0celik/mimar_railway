import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import {
  clearTokens,
  getSessionEpoch,
  getTokens,
  isTokenStorageUnavailable,
  setTokens,
} from "../auth/token-storage";
import { emitAuthSessionExpired } from "../auth/auth-session";
import { useAuthStore } from "../../store/authStore";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api";
const REQUEST_TIMEOUT_MS = 15000;

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Oturum açmadan çağrılan uçlar; sunucuda `@Public()`.
 *
 * Bunlar için token okunmuyor: depo okunamadığında giriş de engelleniyordu,
 * oysa giriş token'a ihtiyaç duymuyor ve başarılı giriş depodaki kaydı zaten
 * yenisiyle değiştiriyor.
 */
const PUBLIC_AUTH_PATH =
  /^\/auth\/(register|check-email|login|social|refresh|forgot-password|reset-password)(\?|$)/;

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (PUBLIC_AUTH_PATH.test(config.url ?? "")) {
      return config;
    }

    // Anahtarlık okunamazsa `getTokens` hata fırlatır ve istek hiç gönderilmez.
    // Yetkisiz göndermek 401 alıp yenileme zincirini, oradan da oturum silmeyi
    // tetiklerdi. Hata çağırana ağ hatası gibi ulaşır; eşitleme motoru gibi
    // çağıranlar bir sonraki turda yeniden dener.
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

const NO_STORED_SESSION = "NO_STORED_SESSION";
const SESSION_ENDED_DURING_REFRESH = "SESSION_ENDED_DURING_REFRESH";

function sessionError(code: string): Error & { code: string } {
  return Object.assign(new Error(code), { code });
}

/**
 * Oturum yalnızca sunucu onu reddettiğinde silinir.
 *
 * Eskiden yenileme herhangi bir sebeple başarısız olunca — bağlantı kopması,
 * zaman aşımı, sunucunun yeniden başlaması, anahtarlığın o an okunamaması —
 * token'lar siliniyordu. Erişim token'ı 15 dakikada dolduğu için uygulama
 * neredeyse her açılışta yenileme yapıyor; şantiyedeki zayıf bir bağlantı ya
 * da sunucu güncellemesi sırasındaki birkaç saniye kullanıcıyı çıkışa
 * atıyordu. Artık bu durumlarda istek başarısız olur ama oturum yerinde kalır.
 */
function isSessionRejected(error: unknown): boolean {
  if ((error as { code?: unknown } | null)?.code === NO_STORED_SESSION) {
    return true;
  }
  const status = axios.isAxiosError(error) ? error.response?.status : undefined;
  return status === 401 || status === 403;
}

async function forceLogout() {
  // Sunucu bu token'ları zaten reddetti; silinemeseler bile bir sonraki
  // denemede yine reddedilirler, o yüzden silme hatası durumu değiştirmez.
  await clearTokens().catch(() => undefined);
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
    // Anahtarlık okunamadığı için hiç gönderilmemiş istek: oturuma dokunma.
    if (isTokenStorageUnavailable(error) || !error.config) {
      return Promise.reject(error);
    }

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
      if (requestUrl.includes("/auth/login") || requestUrl.includes("/auth/refresh") || requestUrl.includes("/auth/register")) {
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
      // Yenileme sürerken çıkış yapılırsa bu değer değişir; yanıt geldiğinde
      // kontrol edilip kapatılan oturum geri yazılmaz.
      const epoch = getSessionEpoch();

      try {
        const tokens = await getTokens();
        if (!tokens?.refreshToken) {
          throw sessionError(NO_STORED_SESSION);
        }

        // Varsayılan axios'ta zaman aşımı yok; asılı kalan bir yenileme
        // kuyruktaki bütün istekleri sonsuza kadar bekletirdi.
        const response = await axios.post(
          `${API_URL}/auth/refresh`,
          { refreshToken: tokens.refreshToken },
          { timeout: REQUEST_TIMEOUT_MS },
        );

        if (getSessionEpoch() !== epoch) {
          throw sessionError(SESSION_ENDED_DURING_REFRESH);
        }

        const { accessToken, refreshToken, user } = response.data;
        await setTokens(accessToken, refreshToken);
        if (getSessionEpoch() !== epoch) {
          // Token'lar yazılırken çıkış yapıldı; yazdıklarımızı geri al.
          await clearTokens().catch(() => undefined);
          throw sessionError(SESSION_ENDED_DURING_REFRESH);
        }
        if (user) {
          useAuthStore.getState().setUser(user);
        }

        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        if (isSessionRejected(refreshError)) {
          await forceLogout();
          emitAuthSessionExpired();
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

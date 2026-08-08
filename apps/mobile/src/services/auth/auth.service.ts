import { authApi } from "../api/auth.api";
import { setTokens, clearTokens, getTokens } from "./token-storage";

export class AuthService {
  static async login(email: string, password: string) {
    const response = await authApi.login({ email, password });
    const { accessToken, refreshToken, user } = response.data;
    await setTokens(accessToken, refreshToken);
    return user;
  }

  static async register(data: { email: string; password: string; fullName: string }) {
    const response = await authApi.register(data);
    const { accessToken, refreshToken, user } = response.data;
    await setTokens(accessToken, refreshToken);
    return user;
  }

  static async socialLogin(provider: "GOOGLE" | "APPLE" | "MICROSOFT", idToken: string) {
    const response = await authApi.socialLogin({ provider, idToken });
    const { accessToken, refreshToken, user } = response.data;
    await setTokens(accessToken, refreshToken);
    return user;
  }

  static async logout() {
    try {
      // Refresh token'ı gönderiyoruz: yalnızca bu cihazın oturumu kapansın,
      // aynı hesabın diğer cihazlardaki oturumları etkilenmesin.
      const tokens = await getTokens();
      await authApi.logout(tokens?.refreshToken);
    } catch {
      // ignore logout errors
    }
    await clearTokens();
  }

  static async getProfile() {
    const response = await authApi.getMe();
    return response.data;
  }
}

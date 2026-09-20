import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/**
 * Oturum token'larının cihazdaki deposu.
 *
 * iOS'ta anahtarlık öğeleri varsayılan olarak yalnızca cihazın kilidi
 * açıkken okunabiliyor. Oysa iOS uygulamayı kullanıcı dokunmadan önce arka
 * planda başlatabiliyor (prewarming) ya da arka plan eşitlemesi için
 * uyandırabiliyor; o anda okuma hata veriyordu. Eski kod bu hatayı "token
 * yok" diye yorumluyordu: istek yetkisiz gidiyor, 401 dönüyor, yenileme de
 * token bulamayınca oturum siliniyordu. Kullanıcının çıkış yapmadığı halde
 * tekrar tekrar giriş ekranına düşmesinin sebebi buydu.
 *
 * Buna karşı iki önlem var:
 * - Token'lar "ilk kilit açılışından sonra" erişilebilir olarak yazılıyor;
 *   cihaz bir kez açıldıktan sonra arka planda da okunabiliyorlar.
 * - Okuma hatası `null` ile karıştırılmıyor. Token yoksa `null` döner;
 *   anahtarlık şu an okunamıyorsa `TokenStorageUnavailableError` fırlatılır.
 *   Çağıran bu durumda oturumu silmemeli, yalnızca işlemi ertelemeli.
 */

const ACCESS_TOKEN_KEY = "session.accessToken";
const REFRESH_TOKEN_KEY = "session.refreshToken";

/**
 * Eski anahtarlar. expo-secure-store var olan bir öğeyi güncellerken yalnızca
 * değerini değiştiriyor, erişilebilirlik ayarına dokunmuyor. Ayarı değiştirmek
 * için token'ları yeni anahtarlara taşıyoruz; bu anahtarlar yalnızca o geçiş
 * için okunuyor.
 */
const LEGACY_ACCESS_TOKEN_KEY = "accessToken";
const LEGACY_REFRESH_TOKEN_KEY = "refreshToken";

/**
 * "Bu cihaza özel": token'lar iCloud yedeğiyle yeni bir telefona taşınmaz,
 * yeni cihazda tekrar giriş yapılır. Oturum anahtarı için doğru olan bu.
 */
const KEYCHAIN_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

/**
 * Web'de anahtarlık yok, localStorage kullanılıyor; erişilebilirlik ayarı
 * diye bir şey olmadığı için taşımaya gerek yok, eski adlar korunuyor.
 */
const WEB_ACCESS_TOKEN_KEY = LEGACY_ACCESS_TOKEN_KEY;
const WEB_REFRESH_TOKEN_KEY = LEGACY_REFRESH_TOKEN_KEY;

const TOKEN_STORAGE_UNAVAILABLE = "TOKEN_STORAGE_UNAVAILABLE";

const isWeb = Platform.OS === "web";

export type SessionTokens = { accessToken: string; refreshToken: string };

/** Token'lar yerinde ama anahtarlık şu an okunamıyor. */
export class TokenStorageUnavailableError extends Error {
  /**
   * `instanceof` yerine bu alan kontrol ediliyor: sınıflar derlenirken
   * `Error`'dan türeyen tiplerin prototip zinciri bozulabiliyor.
   */
  readonly code = TOKEN_STORAGE_UNAVAILABLE;
  readonly reason: unknown;

  constructor(reason: unknown) {
    // Altta yatan hata mesaja ekleniyor: kullanıcıya gösterilen hata kutusu
    // cihazda log almadan sebebi görmenin tek yolu.
    const detail = (reason as { message?: unknown } | null)?.message;
    super(
      typeof detail === "string" && detail.length > 0
        ? `Token deposu şu an okunamıyor (${detail})`
        : "Token deposu şu an okunamıyor",
    );
    this.name = "TokenStorageUnavailableError";
    this.reason = reason;
  }
}

export function isTokenStorageUnavailable(error: unknown): error is TokenStorageUnavailableError {
  return (error as { code?: unknown } | null)?.code === TOKEN_STORAGE_UNAVAILABLE;
}

/**
 * Her çıkışta artar. Sürmekte olan bir token yenilemesi başladığı andaki
 * değeri saklar; yanıt geldiğinde değer değişmişse sonucu yazmaz. Böylece
 * çıkış sırasında dönen bir yenileme, kapatılan oturumu geri getiremez.
 */
let sessionEpoch = 0;

export function getSessionEpoch(): number {
  return sessionEpoch;
}

async function readPair(accessKey: string, refreshKey: string): Promise<SessionTokens | null> {
  const accessToken = await SecureStore.getItemAsync(accessKey);
  const refreshToken = await SecureStore.getItemAsync(refreshKey);
  return accessToken && refreshToken ? { accessToken, refreshToken } : null;
}

async function writePair(tokens: SessionTokens): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken, KEYCHAIN_OPTIONS);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken, KEYCHAIN_OPTIONS);
}

async function deleteKeys(keys: readonly string[]): Promise<void> {
  const results = await Promise.allSettled(keys.map((key) => SecureStore.deleteItemAsync(key)));
  const failure = results.find((result) => result.status === "rejected");
  if (failure && failure.status === "rejected") {
    throw failure.reason;
  }
}

export async function setTokens(accessToken: string, refreshToken: string) {
  if (isWeb) {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(WEB_ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(WEB_REFRESH_TOKEN_KEY, refreshToken);
    }
    return;
  }

  await writePair({ accessToken, refreshToken });
  // Yeni kopya yazıldı; eskisi artık gereksiz. Silinemezse zararı yok,
  // okuma önce yeni anahtarlara bakıyor.
  await deleteKeys([LEGACY_ACCESS_TOKEN_KEY, LEGACY_REFRESH_TOKEN_KEY]).catch(() => undefined);
}

/**
 * Kayıtlı oturum; yoksa `null`.
 *
 * @throws {TokenStorageUnavailableError} Anahtarlık şu an okunamıyorsa.
 */
export async function getTokens(): Promise<SessionTokens | null> {
  if (isWeb) {
    if (typeof localStorage === "undefined") return null;
    const accessToken = localStorage.getItem(WEB_ACCESS_TOKEN_KEY);
    const refreshToken = localStorage.getItem(WEB_REFRESH_TOKEN_KEY);
    return accessToken && refreshToken ? { accessToken, refreshToken } : null;
  }

  try {
    const current = await readPair(ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY);
    if (current) return current;

    const legacy = await readPair(LEGACY_ACCESS_TOKEN_KEY, LEGACY_REFRESH_TOKEN_KEY);
    if (!legacy) return null;

    // Eski ayarla yazılmış oturumu yeni anahtarlara taşı. Taşıma yarıda
    // kalırsa eski kopya yerinde durduğu için oturum kaybolmaz; bir sonraki
    // okumada yeniden denenir.
    try {
      await writePair(legacy);
      await deleteKeys([LEGACY_ACCESS_TOKEN_KEY, LEGACY_REFRESH_TOKEN_KEY]);
    } catch {
      // yukarıdaki açıklama
    }
    return legacy;
  } catch (error) {
    /*
     * "Şu an okunamıyor" durumu iOS'a özgü: anahtarlık cihaz kilitliyken
     * kapalı oluyor ve biraz sonra aynı okuma başarılı olabiliyor.
     * Android'de böyle bir geçici durum yok; okuma hatası bozuk ya da
     * çözülemeyen bir kayıt demek ve kalıcı. Orada hata fırlatmak
     * kullanıcıyı kilitliyordu: uygulama açılmıyor, giriş de yapılamıyordu.
     * Kayıt yokmuş gibi davranıyoruz; giriş yapıldığında üzerine yazılıyor.
     */
    if (Platform.OS === "ios") {
      throw new TokenStorageUnavailableError(error);
    }
    console.warn("Token deposu okunamadı, oturum yokmuş gibi devam ediliyor", error);
    return null;
  }
}

/**
 * Oturumu cihazdan siler. Eski ve yeni anahtarların hepsi denenir; biri
 * silinemezse hata fırlatılır, çünkü kalan bir token bir sonraki açılışta
 * kapatılan oturumu geri getirirdi.
 */
export async function clearTokens() {
  // Silme başarısız olsa bile sürmekte olan yenilemeler sonucu yazmasın.
  sessionEpoch += 1;

  if (isWeb) {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(WEB_ACCESS_TOKEN_KEY);
      localStorage.removeItem(WEB_REFRESH_TOKEN_KEY);
    }
    return;
  }

  await deleteKeys([
    ACCESS_TOKEN_KEY,
    REFRESH_TOKEN_KEY,
    LEGACY_ACCESS_TOKEN_KEY,
    LEGACY_REFRESH_TOKEN_KEY,
  ]);
}

/** Soket bağlantısı için; okunamazsa `null` döner ve bağlantı sonra yeniden denenir. */
export async function getAccessToken(): Promise<string | null> {
  try {
    const tokens = await getTokens();
    return tokens?.accessToken ?? null;
  } catch {
    return null;
  }
}

import { Platform } from "react-native";

/**
 * Uygulamanın içinde harita gösterilebilir mi.
 *
 * iOS'ta Apple Haritalar anahtarsız çalışıyor. Android'deki Google Haritalar
 * derleme sırasında verilen anahtarı istiyor; anahtar aynı ortam değişkeninden
 * android/app/build.gradle'a da geçiyor. Anahtarsız derlenen uygulamada harita
 * yerine konum listesi gösteriliyor. Web'de harita bileşeni yok.
 */
export const MAPS_AVAILABLE =
  Platform.OS === "ios" ||
  (Platform.OS === "android" && Boolean(process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY));

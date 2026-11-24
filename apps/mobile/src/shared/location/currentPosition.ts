import * as Location from "expo-location";

/** Kapalı alanda uydu bulunamazsa istek uzun süre asılı kalabiliyor. */
const TIMEOUT_MS = 15_000;

export type CurrentPosition = {
  latitude: number;
  longitude: number;
  /** Metre cinsinden yarıçap; cihaz bildirmezse `null`. */
  accuracy: number | null;
};

export type CurrentPositionResult =
  | { status: "ok"; position: CurrentPosition }
  | { status: "denied" }
  | { status: "failed" };

/**
 * İzin isteyip cihazın bulunduğu yeri alır.
 *
 * "balanced" daha çabuk ama birkaç yüz metre sapabiliyor; bir işin yerini
 * işaretlemek gibi kesinlik gereken yerlerde "high" (GPS) kullanılıyor.
 */
export async function getCurrentPosition(
  accuracy: "balanced" | "high" = "balanced",
): Promise<CurrentPositionResult> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) return { status: "denied" };

    const current = await Promise.race([
      Location.getCurrentPositionAsync({
        accuracy: accuracy === "high" ? Location.Accuracy.High : Location.Accuracy.Balanced,
      }),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS);
      }),
    ]);
    return {
      status: "ok",
      position: {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        accuracy: current.coords.accuracy ?? null,
      },
    };
  } catch {
    return { status: "failed" };
  } finally {
    clearTimeout(timer);
  }
}

import * as Calendar from "expo-calendar";
import AsyncStorage from "@react-native-async-storage/async-storage";

import type { CalendarEventDTO } from "../../../services/api/calendar.api";
import { useAuthStore } from "../../../store/authStore";
import { pickPreferredCalendar, type WritableCalendar } from "./calendar-target";

export type { WritableCalendar } from "./calendar-target";

/**
 * Uygulama etkinliklerini telefonun takvimine yazar.
 *
 * Etkinliğin Google Takvim'e (ya da iCloud'a) ulaşması, yazıldığı takvimin
 * hangi hesaba bağlı olduğuna bakar. Bu yüzden hedef takvim kullanıcının
 * giriş yöntemine göre seçilir ve ekranda hesabıyla birlikte gösterilir;
 * kullanıcı dilediğinde değiştirebilir.
 *
 * Akış tek yönlüdür: bulutta yapılan değişiklik geri gelmez, uygulama her
 * zaman kaynak kabul edilir. Cihaz etkinlik kimlikleri telefona özeldir;
 * sunucuda değil, yerelde eşleştirme tablosunda tutulur.
 */

const ENABLED_KEY = "calendar:deviceSyncEnabled";
const MAP_KEY = "calendar:deviceEventMap";
const CALENDAR_ID_KEY = "calendar:deviceCalendarId";

type EventMap = Record<string, string>;

async function readMap(): Promise<EventMap> {
  try {
    const raw = await AsyncStorage.getItem(MAP_KEY);
    return raw ? (JSON.parse(raw) as EventMap) : {};
  } catch {
    return {};
  }
}

async function writeMap(map: EventMap): Promise<void> {
  await AsyncStorage.setItem(MAP_KEY, JSON.stringify(map));
}

export async function isDeviceSyncEnabled(): Promise<boolean> {
  return (await AsyncStorage.getItem(ENABLED_KEY)) === "1";
}

export async function setDeviceSyncEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(ENABLED_KEY, enabled ? "1" : "0");
}

/** Takvim yazma izni ister. Kullanıcı reddederse false döner. */
export async function requestCalendarPermission(): Promise<boolean> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status === "granted";
}

/**
 * Etkinliklerin yazılacağı takvimi bulur.
 *
 * Uygulama kendi takvimini **oluşturmaz**. Android'de Takvim Sağlayıcısı
 * üzerinden açılan bir takvim Google sunucularına senkronlanmaz; cihazda
 * kalır. Etkinliğin Google Takvim'de görünmesi için hesabın **mevcut**
 * takvimlerinden birine yazmak gerekiyor.
 */
async function resolveCalendarId(): Promise<string | null> {
  const calendars = await listWritableCalendars();
  if (calendars.length === 0) return null;

  const stored = await AsyncStorage.getItem(CALENDAR_ID_KEY);
  if (stored && calendars.some((calendar) => calendar.id === stored)) return stored;

  const user = useAuthStore.getState().user;
  const preferred = pickPreferredCalendar({
    authProvider: user?.authProvider,
    email: user?.email,
    calendars,
  });
  if (!preferred) return null;

  await AsyncStorage.setItem(CALENDAR_ID_KEY, preferred);
  return preferred;
}

/** Yazılabilir takvimleri, bağlı oldukları hesap ve kaynak türüyle listeler. */
export async function listWritableCalendars(): Promise<WritableCalendar[]> {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  return calendars
    .filter((calendar) => calendar.allowsModifications)
    .map((calendar) => ({
      id: calendar.id,
      title: calendar.title,
      accountName: calendar.ownerAccount ?? calendar.source?.name ?? "",
      sourceType: String(calendar.source?.type ?? ""),
      isPrimary: calendar.isPrimary === true,
    }));
}

export async function getSelectedCalendarId(): Promise<string | null> {
  return AsyncStorage.getItem(CALENDAR_ID_KEY);
}

/** Hedef takvimi değiştirir. Önceki takvime yazılanlar orada kalır. */
export async function setSelectedCalendarId(calendarId: string): Promise<void> {
  await AsyncStorage.setItem(CALENDAR_ID_KEY, calendarId);
  // Eşleştirme sıfırlanır ki etkinlikler yeni takvimde yeniden oluşsun.
  await writeMap({});
}

function windowOf(event: CalendarEventDTO): { start: Date; end: Date } {
  const start = new Date(event.startsAt ?? event.date);
  const end = event.endsAt ? new Date(event.endsAt) : new Date(start.getTime() + 60 * 60_000);
  return { start, end: end > start ? end : new Date(start.getTime() + 60 * 60_000) };
}

/**
 * Etkinliği cihaz takvimine yazar; daha önce yazıldıysa günceller.
 * Senkron kapalıysa ya da izin yoksa sessizce hiçbir şey yapmaz.
 */
export async function upsertDeviceEvent(event: CalendarEventDTO): Promise<void> {
  if (!(await isDeviceSyncEnabled())) return;

  const { status } = await Calendar.getCalendarPermissionsAsync();
  if (status !== "granted") return;

  const calendarId = await resolveCalendarId();
  if (!calendarId) return;

  const { start, end } = windowOf(event);
  const details = {
    title: event.title,
    startDate: start,
    endDate: end,
    notes: event.projectName,
    timeZone: undefined,
  };

  const map = await readMap();
  const existingId = map[event.id];

  if (existingId) {
    try {
      await Calendar.updateEventAsync(existingId, details);
      return;
    } catch {
      // Kullanıcı etkinliği telefondan silmiş olabilir; yeniden oluştur.
      delete map[event.id];
    }
  }

  const deviceEventId = await Calendar.createEventAsync(calendarId, details);
  map[event.id] = deviceEventId;
  await writeMap(map);
}

/** Uygulamadan silinen etkinliği cihaz takviminden de kaldırır. */
export async function removeDeviceEvent(eventId: string): Promise<void> {
  const map = await readMap();
  const deviceEventId = map[eventId];
  if (!deviceEventId) return;

  try {
    await Calendar.deleteEventAsync(deviceEventId);
  } catch {
    // Zaten silinmişse sorun değil
  }

  delete map[eventId];
  await writeMap(map);
}

/** Görünen tüm etkinlikleri cihaz takvimiyle eşitler. */
export async function syncDeviceEvents(events: CalendarEventDTO[]): Promise<void> {
  if (!(await isDeviceSyncEnabled())) return;

  for (const event of events) {
    try {
      await upsertDeviceEvent(event);
    } catch {
      // Tek bir etkinlik yazılamazsa diğerleri denenmeye devam etsin
    }
  }
}

/** Senkron kapatılınca uygulamanın yazdığı etkinlikleri temizler. */
export async function clearDeviceEvents(): Promise<void> {
  const map = await readMap();

  for (const deviceEventId of Object.values(map)) {
    try {
      await Calendar.deleteEventAsync(deviceEventId);
    } catch {
      // Yoksa geç
    }
  }

  await writeMap({});
}

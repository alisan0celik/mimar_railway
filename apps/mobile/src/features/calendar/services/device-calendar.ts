import * as Calendar from "expo-calendar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

import type { CalendarEventDTO } from "../../../services/api/calendar.api";

/**
 * Uygulama etkinliklerini telefonun takvimine yazar.
 *
 * Telefonda Google hesabı ekliyse Android bu etkinlikleri kendiliğinden
 * Google Takvim'e senkronlar; ayrıca bir OAuth kapsamı ya da sunucu tarafı
 * senkron gerekmez. Akış tek yönlüdür: Google'da yapılan değişiklik geri
 * gelmez, bu yüzden uygulama her zaman kaynak kabul edilir.
 *
 * Cihaz etkinlik kimlikleri telefona özeldir; sunucuda değil, yerelde
 * eşleştirme tablosunda tutulur.
 */

const ENABLED_KEY = "calendar:deviceSyncEnabled";
const MAP_KEY = "calendar:deviceEventMap";
const CALENDAR_ID_KEY = "calendar:deviceCalendarId";

const CALENDAR_TITLE = "Planova";
const CALENDAR_COLOR = "#F97316";

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
 * Etkinliklerin yazılacağı takvimi bulur ya da oluşturur.
 *
 * iOS'ta yeni takvim bir kaynağa bağlanmak zorunda; varsayılan takvimin
 * kaynağı kullanılır. Android'de yerel bir hesap altında açılır ve telefona
 * eklenmiş Google hesabı varsa kullanıcı onu Google Takvim'de görebilir.
 */
async function resolveCalendarId(): Promise<string | null> {
  const stored = await AsyncStorage.getItem(CALENDAR_ID_KEY);
  if (stored) {
    // Kullanıcı takvimi telefondan silmiş olabilir; doğrula.
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    if (calendars.some((calendar) => calendar.id === stored)) return stored;
  }

  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

  const existing = calendars.find(
    (calendar) => calendar.title === CALENDAR_TITLE && calendar.allowsModifications,
  );
  if (existing) {
    await AsyncStorage.setItem(CALENDAR_ID_KEY, existing.id);
    return existing.id;
  }

  const writable = calendars.filter((calendar) => calendar.allowsModifications);
  if (writable.length === 0) return null;

  const source =
    Platform.OS === "ios"
      ? (await Calendar.getDefaultCalendarAsync()).source
      : (writable[0].source ?? { isLocalAccount: true, name: CALENDAR_TITLE, type: "LOCAL" });

  try {
    const id = await Calendar.createCalendarAsync({
      title: CALENDAR_TITLE,
      name: CALENDAR_TITLE,
      color: CALENDAR_COLOR,
      entityType: Calendar.EntityTypes.EVENT,
      sourceId: Platform.OS === "ios" ? source.id : undefined,
      source: Platform.OS === "android" ? source : undefined,
      ownerAccount: Platform.OS === "android" ? source.name : undefined,
      accessLevel: Calendar.CalendarAccessLevel.OWNER,
    });
    await AsyncStorage.setItem(CALENDAR_ID_KEY, id);
    return id;
  } catch {
    // Kendi takvimimizi açamazsak yazılabilir ilk takvime düşeriz.
    await AsyncStorage.setItem(CALENDAR_ID_KEY, writable[0].id);
    return writable[0].id;
  }
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

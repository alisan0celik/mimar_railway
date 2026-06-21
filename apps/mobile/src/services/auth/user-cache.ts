import AsyncStorage from "@react-native-async-storage/async-storage";
import type { UserDTO } from "@mimar/shared";

const USER_PROFILE_KEY = "cachedUserProfile";

export async function saveUserProfile(user: UserDTO): Promise<void> {
  await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(user));
}

export async function getUserProfile(): Promise<UserDTO | null> {
  try {
    const raw = await AsyncStorage.getItem(USER_PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserDTO;
  } catch {
    return null;
  }
}

export async function clearUserProfile(): Promise<void> {
  await AsyncStorage.removeItem(USER_PROFILE_KEY);
}

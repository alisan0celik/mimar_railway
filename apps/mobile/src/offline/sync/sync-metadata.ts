import AsyncStorage from "@react-native-async-storage/async-storage";

const LAST_PULL_AT_KEY = "sync:lastPullAt";
const COMPANY_ID_KEY = "sync:companyId";

export async function getLastPullAt(): Promise<string | null> {
  return AsyncStorage.getItem(LAST_PULL_AT_KEY);
}

export async function setLastPullAt(isoDate: string): Promise<void> {
  await AsyncStorage.setItem(LAST_PULL_AT_KEY, isoDate);
}

export async function getSyncCompanyId(): Promise<string | null> {
  return AsyncStorage.getItem(COMPANY_ID_KEY);
}

export async function setSyncCompanyId(companyId: string): Promise<void> {
  await AsyncStorage.setItem(COMPANY_ID_KEY, companyId);
}

export async function clearSyncMetadata(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(LAST_PULL_AT_KEY),
    AsyncStorage.removeItem(COMPANY_ID_KEY),
  ]);
}

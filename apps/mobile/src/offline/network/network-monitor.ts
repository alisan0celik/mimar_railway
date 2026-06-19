import { useEffect, useState } from "react";
import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";
import { Platform } from "react-native";

let cachedOnline = true;
const listeners = new Set<(online: boolean) => void>();

function notifyListeners(online: boolean) {
  cachedOnline = online;
  listeners.forEach((listener) => listener(online));
}

export function isOnline(): boolean {
  return cachedOnline;
}

export function subscribeNetwork(listener: (online: boolean) => void): () => void {
  listeners.add(listener);
  listener(cachedOnline);
  return () => listeners.delete(listener);
}

export async function initNetworkMonitor(): Promise<void> {
  if (Platform.OS === "web" && typeof navigator !== "undefined") {
    cachedOnline = navigator.onLine;
    const handleOnline = () => notifyListeners(true);
    const handleOffline = () => notifyListeners(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return;
  }

  const state = await NetInfo.fetch();
  cachedOnline = state.isConnected !== false && state.isInternetReachable !== false;

  NetInfo.addEventListener((nextState: NetInfoState) => {
    const online = nextState.isConnected !== false && nextState.isInternetReachable !== false;
    notifyListeners(online);
  });
}

export function useNetworkStatus() {
  const [online, setOnline] = useState(cachedOnline);

  useEffect(() => {
    return subscribeNetwork(setOnline);
  }, []);

  return { isOnline: online };
}

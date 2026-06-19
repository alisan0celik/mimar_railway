import { create } from "zustand";
import { getPendingCount } from "../offline/outbox/outbox.repository";

type OfflineState = {
  pendingCount: number;
  isSyncing: boolean;
  refreshPendingCount: () => Promise<void>;
  setSyncing: (value: boolean) => void;
};

export const useOfflineStore = create<OfflineState>((set) => ({
  pendingCount: 0,
  isSyncing: false,
  refreshPendingCount: async () => {
    const count = await getPendingCount();
    set({ pendingCount: count });
  },
  setSyncing: (isSyncing) => set({ isSyncing }),
}));

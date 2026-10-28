import { create } from "zustand";

interface SubscriptionUiState {
  renewOpen: boolean;
  /** Bumped every time a request fails with 402 subscription_expired. */
  expiredSignal: number;
  openRenew: () => void;
  closeRenew: () => void;
  notifyExpired: () => void;
}

export const useSubscriptionUiStore = create<SubscriptionUiState>((set) => ({
  renewOpen: false,
  expiredSignal: 0,
  openRenew: () => set({ renewOpen: true }),
  closeRenew: () => set({ renewOpen: false }),
  notifyExpired: () => set((s) => ({ expiredSignal: s.expiredSignal + 1 })),
}));

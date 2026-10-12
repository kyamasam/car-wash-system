import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthRedirectStore {
  redirectUrl: string | null;
  save: (url: string) => void;
  consumeRedirectUrl: () => string | null;
}

export const useAuthRedirectStore = create<AuthRedirectStore>()(
  persist(
    (set, get) => ({
      redirectUrl: null,
      save: (url) => set({ redirectUrl: url }),
      consumeRedirectUrl: () => {
        const url = get().redirectUrl;
        set({ redirectUrl: null });
        return url;
      },
    }),
    { name: "auth-redirect" }
  )
);

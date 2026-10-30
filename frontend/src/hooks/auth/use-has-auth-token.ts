import { useSyncExternalStore } from "react";

const subscribe = (onChange: () => void) => {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
};

/**
 * Whether an auth token is in localStorage.
 * Returns null during SSR / hydration so callers can render a neutral loading state.
 */
export function useHasAuthToken(): boolean | null {
  return useSyncExternalStore<boolean | null>(
    subscribe,
    () => !!localStorage.getItem("authToken"),
    () => null,
  );
}

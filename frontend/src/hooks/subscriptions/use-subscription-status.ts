import { useApiQuery } from "@/hooks/use-api";
import type { SubscriptionStatus } from "@/types/subscriptions/subscription";

export const SUBSCRIPTION_STATUS_KEY = ["subscription-status"] as const;

export function useSubscriptionStatus() {
  return useApiQuery<SubscriptionStatus>("/subscriptions/status/", {
    queryKey: SUBSCRIPTION_STATUS_KEY,
    staleTime: 1000 * 60 * 5,
    // 404 means the user has no business (e.g. a platform superuser).
    retry: false,
    enabled: typeof window !== "undefined" && !!localStorage.getItem("authToken"),
  });
}

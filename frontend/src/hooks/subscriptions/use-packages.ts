import { useApiQuery } from "@/hooks/use-api";
import type { Package } from "@/types/subscriptions/subscription";

export function usePackages(enabled = true) {
  return useApiQuery<Package[]>("/subscriptions/packages/", {
    queryKey: ["subscription-packages"],
    staleTime: 1000 * 60 * 30,
    enabled,
  });
}

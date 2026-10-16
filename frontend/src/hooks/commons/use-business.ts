import { useApiMutation, useApiQuery } from "@/hooks/use-api";
import type { Currency } from "@/contexts/currency-context";

export interface Business {
  id: string;
  name: string;
  logo: string | null;
  currency: Currency | null;
  primary_user: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const CURRENT_BUSINESS_URL = "/commons/businesses/current/";

export function useCurrentBusiness() {
  return useApiQuery<Business>(CURRENT_BUSINESS_URL, {
    queryKey: ["business", "current"],
    staleTime: 1000 * 60 * 10,
    retry: false,
    enabled: typeof window !== "undefined" && !!localStorage.getItem("authToken"),
  });
}

export function useUpdateBusiness() {
  return useApiMutation<Business, FormData>({
    method: "PATCH",
    url: CURRENT_BUSINESS_URL,
    invalidateQueries: [["business", "current"]],
  });
}

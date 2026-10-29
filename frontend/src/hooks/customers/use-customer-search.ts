import { keepPreviousData } from "@tanstack/react-query";

import { useApiQuery } from "@/hooks/use-api";
import { useDebounce } from "@/hooks/use-debounce";
import type { CustomerListResponse } from "@/types/customers/customer";

export const CUSTOMER_SEARCH_MIN_LENGTH = 2;

/** Debounced server-side customer search by name, phone or email. */
export function useCustomerSearch(query: string) {
  const debouncedQuery = useDebounce(query.trim(), 300);
  const result = useApiQuery<CustomerListResponse>(
    `/customers/?search=${encodeURIComponent(debouncedQuery)}`,
    {
      queryKey: ["customers", "search", debouncedQuery],
      enabled: debouncedQuery.length >= CUSTOMER_SEARCH_MIN_LENGTH,
      staleTime: 30_000,
      placeholderData: keepPreviousData,
    },
  );
  return { ...result, debouncedQuery };
}

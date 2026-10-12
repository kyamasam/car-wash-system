import { useApiQuery } from "@/hooks/use-api";

export type CurrencyRate = {
  id: string;
  base_currency: string;
  target_currency: string;
  rate: string;
  source: string;
  valid_from: string;
  valid_to: string | null;
  is_active: boolean;
  created_at: string;
};

export function useCurrencyRates() {
  return useApiQuery<CurrencyRate[]>("/commons/currency-rates/", {
    queryKey: ["currency-rates"],
    staleTime: 1000 * 60 * 10,
  });
}

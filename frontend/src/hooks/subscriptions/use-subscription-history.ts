import { keepPreviousData } from "@tanstack/react-query";
import { useApiQuery } from "@/hooks/use-api";
import type {
  Paginated,
  SubscriptionPayment,
  SubscriptionPeriod,
} from "@/types/subscriptions/subscription";

export function useSubscriptionPayments(page: number, enabled = true) {
  return useApiQuery<Paginated<SubscriptionPayment>>(
    `/subscriptions/payments/?page=${page}`,
    {
      queryKey: ["subscription-payments", page],
      placeholderData: keepPreviousData,
      enabled,
    },
  );
}

export function useSubscriptionHistory(page: number, enabled = true) {
  return useApiQuery<Paginated<SubscriptionPeriod>>(
    `/subscriptions/history/?page=${page}`,
    {
      queryKey: ["subscription-history", page],
      placeholderData: keepPreviousData,
      enabled,
    },
  );
}

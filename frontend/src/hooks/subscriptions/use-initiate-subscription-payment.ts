import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { axiosInstance } from "@/hooks/use-api";
import type {
  InitiatePaymentBody,
  SubscriptionPayment,
} from "@/types/subscriptions/subscription";

/** Starts an M-Pesa STK push. Silent so the modal can show its own messaging;
 *  errors are surfaced inline by the caller. */
export function useInitiateSubscriptionPayment() {
  return useMutation<SubscriptionPayment, AxiosError, InitiatePaymentBody>({
    mutationFn: async (body) => {
      const { data } = await axiosInstance.post<SubscriptionPayment>(
        "/subscriptions/payments/initiate/",
        { payment_method: "mpesa", ...body },
        { silent: true },
      );
      return data;
    },
  });
}

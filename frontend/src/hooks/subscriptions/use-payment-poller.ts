import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { axiosInstance } from "@/hooks/use-api";
import { SUBSCRIPTION_STATUS_KEY } from "./use-subscription-status";
import type {
  ConfirmPaymentResponse,
  SubscriptionPayment,
} from "@/types/subscriptions/subscription";

export type PollState = "idle" | "polling" | "succeeded" | "failed" | "timeout" | "error";

const POLL_INTERVAL_MS = 5_000;
const POLL_TIMEOUT_MS = 2 * 60_000;

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const id = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(id);
      resolve();
    });
  });

/** Polls /payments/{id}/confirm/ until the payment settles, times out or is cancelled. */
export function usePaymentPoller() {
  const queryClient = useQueryClient();
  const controllerRef = useRef<AbortController | null>(null);
  const [state, setState] = useState<PollState>("idle");
  const [result, setResult] = useState<ConfirmPaymentResponse | null>(null);

  const cancel = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
  }, []);

  const reset = useCallback(() => {
    cancel();
    setState("idle");
    setResult(null);
  }, [cancel]);

  const start = useCallback(
    async (payment: SubscriptionPayment) => {
      cancel();
      const controller = new AbortController();
      controllerRef.current = controller;
      const { signal } = controller;

      setState("polling");
      setResult(null);

      const deadline = Date.now() + POLL_TIMEOUT_MS;
      await sleep(POLL_INTERVAL_MS, signal);

      while (Date.now() < deadline && !signal.aborted) {
        try {
          const { data } = await axiosInstance.post<ConfirmPaymentResponse>(
            `/subscriptions/payments/${payment.id}/confirm/`,
            null,
            { signal, silent: true },
          );
          if (signal.aborted) return;
          if (data.payment.status !== "pending") {
            setResult(data);
            queryClient.setQueryData(SUBSCRIPTION_STATUS_KEY, data.subscription);
            queryClient.invalidateQueries({ queryKey: ["subscription-payments"] });
            queryClient.invalidateQueries({ queryKey: ["subscription-history"] });
            setState(data.payment.status === "succeeded" ? "succeeded" : "failed");
            return;
          }
        } catch (e) {
          if (signal.aborted || axios.isCancel(e)) return;
          // 502 = provider briefly unreachable, keep polling.
          if (!(axios.isAxiosError(e) && e.response?.status === 502)) {
            setState("error");
            return;
          }
        }
        await sleep(POLL_INTERVAL_MS, signal);
      }

      if (!signal.aborted) {
        setState("timeout");
        queryClient.invalidateQueries({ queryKey: ["subscription-payments"] });
      }
    },
    [cancel, queryClient],
  );

  useEffect(() => cancel, [cancel]);

  return { state, result, start, cancel, reset };
}

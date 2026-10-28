"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSubscriptionAccess } from "@/hooks/subscriptions/use-subscription-access";
import { SUBSCRIPTION_STATUS_KEY } from "@/hooks/subscriptions/use-subscription-status";
import { useSubscriptionUiStore } from "@/stores/subscription-ui-store";
import { RenewSubscriptionModal } from "./renew-subscription-modal";

/** Reacts to 402 subscription_expired responses and hosts the renew modal. Mount once. */
export function SubscriptionGuard() {
  const queryClient = useQueryClient();
  const { canManage } = useSubscriptionAccess();
  const expiredSignal = useSubscriptionUiStore((s) => s.expiredSignal);
  const openRenew = useSubscriptionUiStore((s) => s.openRenew);

  useEffect(() => {
    if (expiredSignal === 0) return;
    queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_STATUS_KEY });
    // Non-managers just see the expired banner once status refreshes.
    if (canManage) openRenew();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiredSignal]);

  return canManage ? <RenewSubscriptionModal /> : null;
}

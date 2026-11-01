"use client";

import { format } from "date-fns";
import { AlertTriangle, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscriptionAccess } from "@/hooks/subscriptions/use-subscription-access";
import { cn } from "@/lib/utils";
import { useSubscriptionUiStore } from "@/stores/subscription-ui-store";

const plural = (n: number) => `${n} day${n === 1 ? "" : "s"}`;

export function SubscriptionBanner() {
  const { status, isExpired, canManage } = useSubscriptionAccess();
  const openRenew = useSubscriptionUiStore((s) => s.openRenew);

  if (!status) return null;

  let tone: "info" | "warning" | "danger";
  let Icon = Sparkles;
  let message: string;
  let cta: string;

  if (isExpired) {
    tone = "danger";
    Icon = AlertTriangle;
    const date = status.expires_at ? format(new Date(status.expires_at), "d MMM yyyy") : null;
    message = `Your subscription expired${date ? ` on ${date}` : ""}. You can view data but can't make changes.`;
    cta = "Renew";
  } else if (status.is_trial) {
    tone = "info";
    message = `Free trial: ${plural(status.days_remaining)} left.`;
    cta = "Choose a plan";
  } else if (status.days_remaining <= 3) {
    tone = "warning";
    Icon = Clock;
    message = `Your subscription ends in ${plural(status.days_remaining)}.`;
    cta = "Renew now";
  } else {
    return null;
  }

  return (
    <div
      className={cn(
        "mx-2 mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border px-4 py-2 text-sm",
        tone === "info" && "border-primary/30 bg-primary/10",
        tone === "warning" && "border-amber-500/40 bg-amber-500/10",
        tone === "danger" && "border-destructive/40 bg-destructive/10",
      )}
    >
      <Icon
        className={cn(
          "size-4 shrink-0",
          tone === "info" && "text-primary",
          tone === "warning" && "text-amber-600",
          tone === "danger" && "text-destructive",
        )}
      />
      <span className="flex-1 min-w-0">{message}</span>
      {canManage ? (
        <Button size="sm" variant={tone === "danger" ? "destructive" : "default"} onClick={openRenew}>
          {cta}
        </Button>
      ) : (
        <span className="text-muted-foreground">Ask your owner or manager to renew.</span>
      )}
    </div>
  );
}

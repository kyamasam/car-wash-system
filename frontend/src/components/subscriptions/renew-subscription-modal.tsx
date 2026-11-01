"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { CheckCircle2, Loader2, Smartphone, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/auth/use-current-user";
import { useInitiateSubscriptionPayment } from "@/hooks/subscriptions/use-initiate-subscription-payment";
import { usePackages } from "@/hooks/subscriptions/use-packages";
import { usePaymentPoller } from "@/hooks/subscriptions/use-payment-poller";
import { useSubscriptionStatus } from "@/hooks/subscriptions/use-subscription-status";
import { parseDjangoErrors } from "@/hooks/use-api";
import { cn } from "@/lib/utils";
import { useSubscriptionUiStore } from "@/stores/subscription-ui-store";
import {
  BILLING_PERIOD_DAYS,
  PERIOD_LABELS,
  formatPrice,
  getOfferedPeriods,
  getPeriodPrice,
  type BillingPeriod,
} from "@/types/subscriptions/subscription";
import { PackageCard } from "./package-card";

const FAILURE_LABELS: Record<string, string> = {
  cancelled: "The payment was cancelled on the phone.",
  failed: "The payment failed.",
};

export function RenewSubscriptionModal() {
  const open = useSubscriptionUiStore((s) => s.renewOpen);
  const closeRenew = useSubscriptionUiStore((s) => s.closeRenew);

  const { data: packages, isLoading: packagesLoading } = usePackages(open);
  const { data: status } = useSubscriptionStatus();
  const { data: user } = useCurrentUser();
  const initiate = useInitiateSubscriptionPayment();
  const poller = usePaymentPoller();

  // User choices; null means "use the default".
  const [chosenPackageId, setPackageId] = useState<string | null>(null);
  const [chosenPeriod, setPeriod] = useState<BillingPeriod | null>(null);
  const [chosenPhone, setPhone] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const purchasable = useMemo(
    () => (packages ?? []).filter((p) => getOfferedPeriods(p).length > 0),
    [packages],
  );
  const anyOffered = purchasable.length > 0;

  // Default: current package, else the default one, else the first with prices.
  const selectedPackage =
    purchasable.find((p) => p.id === chosenPackageId) ??
    purchasable.find((p) => p.id === status?.package?.id) ??
    purchasable.find((p) => p.is_default) ??
    purchasable[0] ??
    null;
  const packageId = selectedPackage?.id ?? null;
  const offeredPeriods = selectedPackage ? getOfferedPeriods(selectedPackage) : [];
  const period: BillingPeriod | null =
    chosenPeriod && offeredPeriods.includes(chosenPeriod)
      ? chosenPeriod
      : offeredPeriods.includes("monthly")
        ? "monthly"
        : (offeredPeriods[0] ?? null);
  const phone = chosenPhone ?? user?.phone_number ?? "";

  const handleOpenChange = (next: boolean) => {
    if (next) return;
    poller.reset();
    initiate.reset();
    setFieldErrors({});
    setPackageId(null);
    setPeriod(null);
    setPhone(null);
    closeRenew();
  };

  const handlePay = () => {
    if (!selectedPackage || !period) return;
    setFieldErrors({});
    initiate.mutate(
      { package_id: selectedPackage.id, period, phone: phone.trim() || undefined },
      {
        onSuccess: (payment) => poller.start(payment),
        onError: (error) => {
          const errs: Record<string, string> = {};
          for (const e of parseDjangoErrors(error)) {
            errs[e.field] = errs[e.field] ? `${errs[e.field]} ${e.message}` : e.message;
          }
          if (error.response?.status === 502) {
            errs.error = "We couldn't reach M-Pesa. Please try again.";
          }
          setFieldErrors(errs);
        },
      },
    );
  };

  const tryAgain = () => {
    poller.reset();
    initiate.reset();
  };

  const amount = selectedPackage && period ? getPeriodPrice(selectedPackage, period) : null;
  const step = poller.state === "idle" ? "select" : poller.state;
  const generalError = Object.entries(fieldErrors)
    .filter(([k]) => !["phone", "period", "package_id"].includes(k))
    .map(([, v]) => v)
    .join(" ");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        {step === "select" && (
          <>
            <DialogHeader>
              <DialogTitle>Renew subscription</DialogTitle>
              <DialogDescription>
                Pay with M-Pesa. Days are added after your current expiry, so none are lost.
              </DialogDescription>
            </DialogHeader>

            {packagesLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : !anyOffered ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Plans coming soon.</p>
            ) : (
              <div className="space-y-4">
                {purchasable.length > 1 && (
                  <div className="space-y-2">
                    {purchasable.map((p) => (
                        <PackageCard
                          key={p.id}
                          pkg={p}
                          isCurrent={p.id === status?.package?.id}
                          selected={p.id === packageId}
                          onSelect={() => setPackageId(p.id)}
                        />
                      ))}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Billing period</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {offeredPeriods.map((p) => {
                      const price = Number(getPeriodPrice(selectedPackage!, p));
                      const days = BILLING_PERIOD_DAYS[p];
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPeriod(p)}
                          className={cn(
                            "rounded-lg border p-3 text-left transition-colors hover:border-primary/60",
                            period === p && "border-primary ring-1 ring-primary",
                          )}
                        >
                          <div className="text-sm font-medium">{PERIOD_LABELS[p]}</div>
                          <div className="text-sm">
                            {formatPrice(price, selectedPackage!.currency)}
                            <span className="text-muted-foreground"> / {days} day{days > 1 ? "s" : ""}</span>
                          </div>
                          {days > 1 && (
                            <div className="text-xs text-muted-foreground">
                              {formatPrice((price / days).toFixed(2), selectedPackage!.currency)} per day
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {fieldErrors.period && <p className="text-xs text-destructive">{fieldErrors.period}</p>}
                  {fieldErrors.package_id && (
                    <p className="text-xs text-destructive">{fieldErrors.package_id}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mpesa-phone">M-Pesa phone number</Label>
                  <Input
                    id="mpesa-phone"
                    inputMode="tel"
                    placeholder="0712345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  {fieldErrors.phone ? (
                    <p className="text-xs text-destructive">{fieldErrors.phone}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      The payment prompt will be sent to this number.
                    </p>
                  )}
                </div>

                {generalError && <p className="text-sm text-destructive">{generalError}</p>}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handlePay}
                disabled={!anyOffered || !period || !amount || initiate.isPending}
              >
                {initiate.isPending && <Loader2 className="size-4 animate-spin" />}
                {amount ? `Pay ${formatPrice(amount, selectedPackage!.currency)}` : "Pay"}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "polling" && (
          <StateView
            icon={<Smartphone className="size-10 text-primary" />}
            title="Check your phone"
            body={`Enter your M-Pesa PIN on ${initiate.data?.phone ?? "your phone"} to pay ${
              initiate.data ? formatPrice(initiate.data.amount, initiate.data.currency) : ""
            }. Waiting for confirmation…`}
            footer={<Loader2 className="size-5 animate-spin text-muted-foreground" />}
          />
        )}

        {step === "succeeded" && poller.result && (
          <StateView
            icon={<CheckCircle2 className="size-10 text-green-600" />}
            title="Payment received"
            body={
              <>
                {poller.result.payment.receipt_number && (
                  <>
                    M-Pesa receipt <span className="font-mono font-medium">{poller.result.payment.receipt_number}</span>.{" "}
                  </>
                )}
                {poller.result.subscription.expires_at &&
                  `Your subscription is active until ${format(
                    new Date(poller.result.subscription.expires_at),
                    "d MMM yyyy",
                  )}.`}
              </>
            }
            footer={<Button onClick={() => handleOpenChange(false)}>Done</Button>}
          />
        )}

        {step === "failed" && (
          <StateView
            icon={<XCircle className="size-10 text-destructive" />}
            title="Payment not completed"
            body={
              FAILURE_LABELS[poller.result?.payment.failure_reason ?? ""] ??
              poller.result?.payment.failure_reason ??
              "The payment did not go through."
            }
            footer={
              <>
                <Button variant="outline" onClick={() => handleOpenChange(false)}>
                  Close
                </Button>
                <Button onClick={tryAgain}>Try again</Button>
              </>
            }
          />
        )}

        {step === "timeout" && (
          <StateView
            icon={<Clock className="size-10 text-amber-600" />}
            title="Still waiting"
            body="We couldn't confirm your payment yet. If you completed it on your phone, your subscription will update automatically within a few minutes."
            footer={<Button onClick={() => handleOpenChange(false)}>Close</Button>}
          />
        )}

        {step === "error" && (
          <StateView
            icon={<XCircle className="size-10 text-destructive" />}
            title="Something went wrong"
            body="We couldn't check the payment status. If you completed it on your phone, your subscription will update automatically within a few minutes."
            footer={
              <>
                <Button variant="outline" onClick={() => handleOpenChange(false)}>
                  Close
                </Button>
                <Button onClick={tryAgain}>Try again</Button>
              </>
            }
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function StateView({
  icon,
  title,
  body,
  footer,
}: {
  icon: React.ReactNode;
  title: string;
  body: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-4 text-center">
      {icon}
      <DialogTitle>{title}</DialogTitle>
      <DialogDescription className="max-w-sm">{body}</DialogDescription>
      <div className="flex gap-2 pt-2">{footer}</div>
    </div>
  );
}

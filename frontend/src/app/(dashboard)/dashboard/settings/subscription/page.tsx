"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarClockIcon, CreditCardIcon } from "lucide-react";

import { PackageCard } from "@/components/subscriptions/package-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePackages } from "@/hooks/subscriptions/use-packages";
import { useSubscriptionAccess } from "@/hooks/subscriptions/use-subscription-access";
import {
  useSubscriptionHistory,
  useSubscriptionPayments,
} from "@/hooks/subscriptions/use-subscription-history";
import { useSubscriptionUiStore } from "@/stores/subscription-ui-store";
import {
  PERIOD_LABELS,
  formatPrice,
  type Paginated,
  type SubscriptionPaymentStatus,
} from "@/types/subscriptions/subscription";

const PAGE_SIZE = 10;

const PAYMENT_STATUS_VARIANT: Record<
  SubscriptionPaymentStatus,
  React.ComponentProps<typeof Badge>["variant"]
> = {
  pending: "secondary",
  succeeded: "default",
  failed: "destructive",
};

const fmtDate = (iso: string | null) => (iso ? format(new Date(iso), "d MMM yyyy") : "—");
const fmtDateTime = (iso: string) => format(new Date(iso), "d MMM yyyy, HH:mm");

export default function SubscriptionSettingsPage() {
  const { status, isLoading, isExpired, canManage } = useSubscriptionAccess();
  const { data: packages, isLoading: packagesLoading } = usePackages();
  const openRenew = useSubscriptionUiStore((s) => s.openRenew);

  const [paymentsPage, setPaymentsPage] = React.useState(1);
  const [historyPage, setHistoryPage] = React.useState(1);
  const payments = useSubscriptionPayments(paymentsPage, canManage);
  const history = useSubscriptionHistory(historyPage, canManage);

  return (
    <div className="space-y-8">
      {/* Current status */}
      <section className="rounded-xl border border-border bg-card p-4">
        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : !status ? (
          <p className="text-sm text-muted-foreground">No subscription found for this account.</p>
        ) : (
          <div className="flex flex-wrap items-center gap-4">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <CalendarClockIcon className="size-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{status.package?.name ?? "No plan"}</span>
                <Badge variant={isExpired ? "destructive" : "default"} className="capitalize">
                  {status.status}
                </Badge>
                {status.is_trial && <Badge variant="secondary">Trial</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">
                {isExpired
                  ? `Expired on ${fmtDate(status.expires_at)}. You can view data but can't make changes.`
                  : `${status.days_remaining} day${status.days_remaining === 1 ? "" : "s"} left · renews by ${fmtDate(status.expires_at)}`}
              </p>
            </div>
            {canManage ? (
              <Button onClick={openRenew} variant={isExpired ? "destructive" : "default"}>
                <CreditCardIcon className="size-4" />
                {status.is_trial ? "Choose a plan" : "Renew"}
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">Ask your owner or manager to renew.</p>
            )}
          </div>
        )}
      </section>

      {/* Packages */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Plans</h2>
        {packagesLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : !packages?.length ? (
          <p className="text-sm text-muted-foreground">Plans coming soon.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {packages.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} isCurrent={pkg.id === status?.package?.id} />
            ))}
          </div>
        )}
      </section>

      {canManage && (
        <>
          {/* Payment history */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold">Payments</h2>
            <HistoryTable
              data={payments.data}
              loading={payments.isLoading}
              page={paymentsPage}
              setPage={setPaymentsPage}
              empty="No payments yet."
              head={["Date", "Plan", "Amount", "Phone", "Status", "Receipt"]}
              hideOnMobile={[3, 5]}
              row={(p) => [
                <span key="d" className="whitespace-nowrap text-muted-foreground">{fmtDateTime(p.created_at)}</span>,
                <span key="p">
                  {p.package_detail?.name}
                  <span className="text-muted-foreground"> · {PERIOD_LABELS[p.period]}</span>
                </span>,
                <span key="a" className="font-semibold tabular-nums">{formatPrice(p.amount, p.currency)}</span>,
                <span key="ph" className="text-muted-foreground">{p.phone ?? "—"}</span>,
                <Badge key="s" variant={PAYMENT_STATUS_VARIANT[p.status]} className="text-xs capitalize">
                  {p.status}
                </Badge>,
                <span key="r" className="font-mono text-muted-foreground">{p.receipt_number ?? "—"}</span>,
              ]}
            />
          </section>

          {/* Subscription periods */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold">Subscription history</h2>
            <HistoryTable
              data={history.data}
              loading={history.isLoading}
              page={historyPage}
              setPage={setHistoryPage}
              empty="No subscription periods yet."
              head={["Plan", "Type", "Starts", "Ends", "Status"]}
              hideOnMobile={[1]}
              row={(h) => {
                const now = Date.now();
                const upcoming = new Date(h.starts_at).getTime() > now;
                const ended = new Date(h.ends_at).getTime() <= now;
                return [
                  <span key="p">{h.package_detail?.name}</span>,
                  <span key="t" className="text-muted-foreground">
                    {h.is_trial ? "Trial" : h.period ? PERIOD_LABELS[h.period] : "—"}
                  </span>,
                  <span key="s" className="whitespace-nowrap">{fmtDate(h.starts_at)}</span>,
                  <span key="e" className="whitespace-nowrap">{fmtDate(h.ends_at)}</span>,
                  <Badge
                    key="st"
                    variant={upcoming ? "secondary" : ended ? "outline" : "default"}
                    className="text-xs"
                  >
                    {upcoming ? "Upcoming" : ended ? "Ended" : "Current"}
                  </Badge>,
                ];
              }}
            />
          </section>
        </>
      )}
    </div>
  );
}

interface HistoryTableProps<T extends { id: string }> {
  data: Paginated<T> | undefined;
  loading: boolean;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  empty: string;
  head: string[];
  /** Column indexes hidden below the sm breakpoint. */
  hideOnMobile?: number[];
  row: (item: T) => React.ReactNode[];
}

function HistoryTable<T extends { id: string }>({
  data,
  loading,
  page,
  setPage,
  empty,
  head,
  hideOnMobile = [],
  row,
}: HistoryTableProps<T>) {
  if (loading) return <Skeleton className="h-32 w-full" />;
  if (!data?.results.length) {
    return (
      <div className="rounded-xl border border-border p-6 text-center text-sm text-muted-foreground">
        {empty}
      </div>
    );
  }

  const totalPages = Math.ceil(data.count / PAGE_SIZE);
  const cellClass = (i: number) => `px-4 py-3 ${hideOnMobile.includes(i) ? "hidden sm:table-cell" : ""}`;

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              {head.map((h, i) => (
                <th key={h} className={`text-left font-medium text-muted-foreground ${cellClass(i)}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.results.map((item) => (
              <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                {row(item).map((cell, i) => (
                  <td key={i} className={cellClass(i)}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, data.count)} of {data.count}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={!data.previous} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={!data.next} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

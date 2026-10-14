"use client";

import * as React from "react";
import {
  ReceiptIcon,
  SearchIcon,
  CalendarIcon,
  BanknoteIcon,
} from "lucide-react";

import { useBillingStore } from "@/stores/billing-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { PaymentMethod, PaymentType } from "@/types/billing/payment";

const METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: "Cash",
  mpesa: "M-Pesa",
  card: "Card",
  bank_transfer: "Bank Transfer",
};

const TYPE_LABEL: Record<PaymentType, string> = {
  payment: "Payment",
  deposit: "Deposit",
  refund: "Refund",
};

const METHOD_VARIANT: Record<PaymentMethod, React.ComponentProps<typeof Badge>["variant"]> = {
  cash: "secondary",
  mpesa: "default",
  card: "outline",
  bank_transfer: "outline",
};

const TYPE_VARIANT: Record<PaymentType, React.ComponentProps<typeof Badge>["variant"]> = {
  payment: "default",
  deposit: "secondary",
  refund: "destructive",
};

const PAGE_SIZE = 10;

export default function BillingPage() {
  const { paymentsList, paymentsListLoading, fetchPayments } = useBillingStore();

  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [method, setMethod] = React.useState<PaymentMethod | "">("");
  const [type, setType] = React.useState<PaymentType | "">("");
  const [datePreset, setDatePreset] = React.useState<"today" | "yesterday" | "this_month" | "custom" | "">("");
  const [customFrom, setCustomFrom] = React.useState("");
  const [customTo, setCustomTo] = React.useState("");
  const [fromOpen, setFromOpen] = React.useState(false);
  const [toOpen, setToOpen] = React.useState(false);

  function getDateRange(): { paid_at_after?: string; paid_at_before?: string } {
    if (!datePreset) return {};
    const today = new Date();
    const fmt = (d: Date) => d.toISOString().split("T")[0];
    if (datePreset === "today") {
      return { paid_at_after: fmt(today), paid_at_before: fmt(today) };
    }
    if (datePreset === "yesterday") {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      return { paid_at_after: fmt(y), paid_at_before: fmt(y) };
    }
    if (datePreset === "this_month") {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { paid_at_after: fmt(start), paid_at_before: fmt(today) };
    }
    if (datePreset === "custom") {
      return {
        paid_at_after: customFrom || undefined,
        paid_at_before: customTo || undefined,
      };
    }
    return {};
  }

  const anyFilterActive = !!(search || method || type || datePreset);

  function clearFilters() {
    setSearch("");
    setMethod("");
    setType("");
    setDatePreset("");
    setCustomFrom("");
    setCustomTo("");
    setPage(1);
  }

  React.useEffect(() => {
    setPage(1);
  }, [search, method, type, datePreset, customFrom, customTo]);

  React.useEffect(() => {
    fetchPayments({
      page,
      search: search || undefined,
      method: method || undefined,
      type: type || undefined,
      ...getDateRange(),
    });
  }, [page, search, method, type, datePreset, customFrom, customTo]);

  const payments = paymentsList?.results ?? [];
  const totalCount = paymentsList?.count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const totalCollected = payments
    .filter((p) => p.type !== "refund")
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View all payment transactions.
          </p>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <BanknoteIcon className="size-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Collected</p>
            <p className="text-lg font-semibold">
              {totalCollected.toLocaleString("en-KE", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <ReceiptIcon className="size-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Transactions</p>
            <p className="text-lg font-semibold">{totalCount}</p>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            className="pl-9 h-8 w-52 text-sm"
            placeholder="Search transactions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select
          value={method}
          onValueChange={(v) => setMethod(v as PaymentMethod | "")}
        >
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue placeholder="All methods" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All methods</SelectItem>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="mpesa">M-Pesa</SelectItem>
            <SelectItem value="card">Card</SelectItem>
            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={type}
          onValueChange={(v) => setType(v as PaymentType | "")}
        >
          <SelectTrigger className="h-8 w-32 text-xs">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All types</SelectItem>
            <SelectItem value="payment">Payment</SelectItem>
            <SelectItem value="deposit">Deposit</SelectItem>
            <SelectItem value="refund">Refund</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={datePreset}
          onValueChange={(v) => {
            setDatePreset(v as typeof datePreset);
            if (v !== "custom") {
              setCustomFrom("");
              setCustomTo("");
            }
          }}
        >
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue placeholder="All dates" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All dates</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="yesterday">Yesterday</SelectItem>
            <SelectItem value="this_month">This Month</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>

        {datePreset === "custom" && (
          <div className="flex items-center gap-1">
            <Popover open={fromOpen} onOpenChange={setFromOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  {customFrom
                    ? new Date(customFrom + "T00:00:00").toLocaleDateString("en-KE", { day: "numeric", month: "short" })
                    : "From"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customFrom ? new Date(customFrom + "T00:00:00") : undefined}
                  onSelect={(d) => {
                    if (!d) return;
                    setCustomFrom(d.toISOString().split("T")[0]);
                    setFromOpen(false);
                  }}
                  disabled={(d) => customTo ? d > new Date(customTo + "T00:00:00") : false}
                />
              </PopoverContent>
            </Popover>

            <span className="text-muted-foreground text-xs">to</span>

            <Popover open={toOpen} onOpenChange={setToOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  {customTo
                    ? new Date(customTo + "T00:00:00").toLocaleDateString("en-KE", { day: "numeric", month: "short" })
                    : "To"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customTo ? new Date(customTo + "T00:00:00") : undefined}
                  onSelect={(d) => {
                    if (!d) return;
                    setCustomTo(d.toISOString().split("T")[0]);
                    setToOpen(false);
                  }}
                  disabled={(d) => customFrom ? d < new Date(customFrom + "T00:00:00") : false}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        )}

        {anyFilterActive && (
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={clearFilters}>
            Clear
          </Button>
        )}
      </div>

      {/* Table */}
      {paymentsListLoading ? (
        <div className="rounded-xl border border-border p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ReceiptIcon className="size-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No payments found</p>
          <p className="text-xs text-muted-foreground mt-1">
            {anyFilterActive ? "Try adjusting your filters." : "Payments will appear here once jobs are paid."}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Method</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Type</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Transaction Code</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Payer Phone</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {new Date(payment.paid_at).toLocaleDateString("en-KE", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    <p className="text-xs text-muted-foreground/70">
                      {new Date(payment.paid_at).toLocaleTimeString("en-KE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-semibold tabular-nums">
                    {parseFloat(payment.amount).toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <Badge variant={METHOD_VARIANT[payment.method]} className="text-xs capitalize">
                      {METHOD_LABEL[payment.method]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <Badge variant={TYPE_VARIANT[payment.type]} className="text-xs">
                      {TYPE_LABEL[payment.type]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                    {payment.transaction_code ?? <span className="text-muted-foreground/40">—</span>}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                    {payment.payer_phone ?? <span className="text-muted-foreground/40">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <a href={`/dashboard/jobs/${payment.job}`}>
                      <Button variant="ghost" size="sm" className="text-xs">
                        View Job
                      </Button>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)} of {totalCount}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || paymentsListLoading}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || paymentsListLoading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

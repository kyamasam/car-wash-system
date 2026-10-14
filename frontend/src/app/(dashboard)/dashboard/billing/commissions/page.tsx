"use client";

import * as React from "react";
import Link from "next/link";
import {
  CoinsIcon,
  CalendarIcon,
  ReceiptIcon,
  CheckIcon,
  Loader2Icon,
} from "lucide-react";

import { useBillingStore } from "@/stores/billing-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import type {
  CommissionEntryType,
  CommissionEntryStatus,
} from "@/types/billing/commission";

const TYPE_LABEL: Record<CommissionEntryType, string> = {
  earned: "Earned",
  adjustment: "Adjustment",
  reversal: "Reversal",
};

const STATUS_LABEL: Record<CommissionEntryStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  void: "Void",
};

const TYPE_VARIANT: Record<CommissionEntryType, React.ComponentProps<typeof Badge>["variant"]> = {
  earned: "default",
  adjustment: "secondary",
  reversal: "destructive",
};

const STATUS_VARIANT: Record<CommissionEntryStatus, React.ComponentProps<typeof Badge>["variant"]> = {
  pending: "outline",
  paid: "default",
  void: "secondary",
};

const PAGE_SIZE = 10;

export default function CommissionsPage() {
  const {
    commissionEntriesList,
    commissionEntriesListLoading,
    fetchCommissionEntries,
    bulkMarkPaid,
    bulkMarkPaidLoading,
    bulkMarkPaidError,
  } = useBillingStore();

  const [page, setPage] = React.useState(1);
  const [type, setType] = React.useState<CommissionEntryType | "">("");
  const [status, setStatus] = React.useState<CommissionEntryStatus | "">("");
  const [hasPayout, setHasPayout] = React.useState<"true" | "false" | "">("");
  const [datePreset, setDatePreset] = React.useState<
    "today" | "yesterday" | "this_month" | "custom" | ""
  >("");
  const [customFrom, setCustomFrom] = React.useState("");
  const [customTo, setCustomTo] = React.useState("");
  const [fromOpen, setFromOpen] = React.useState(false);
  const [toOpen, setToOpen] = React.useState(false);

  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  function getDateRange(): { date_from?: string; date_to?: string } {
    if (!datePreset) return {};
    const today = new Date();
    const fmt = (d: Date) => d.toISOString().split("T")[0];
    if (datePreset === "today") {
      return { date_from: fmt(today), date_to: fmt(today) };
    }
    if (datePreset === "yesterday") {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      return { date_from: fmt(y), date_to: fmt(y) };
    }
    if (datePreset === "this_month") {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { date_from: fmt(start), date_to: fmt(today) };
    }
    if (datePreset === "custom") {
      return {
        date_from: customFrom || undefined,
        date_to: customTo || undefined,
      };
    }
    return {};
  }

  function getCurrentParams() {
    return {
      page,
      type: type || undefined,
      status: status || undefined,
      has_payout: hasPayout !== "" ? hasPayout === "true" : undefined,
      ...getDateRange(),
    };
  }

  const anyFilterActive = !!(type || status || hasPayout || datePreset);

  function clearFilters() {
    setType("");
    setStatus("");
    setHasPayout("");
    setDatePreset("");
    setCustomFrom("");
    setCustomTo("");
    setPage(1);
  }

  React.useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [type, status, hasPayout, datePreset, customFrom, customTo]);

  React.useEffect(() => {
    setSelectedIds(new Set());
  }, [page]);

  React.useEffect(() => {
    fetchCommissionEntries(getCurrentParams());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, type, status, hasPayout, datePreset, customFrom, customTo]);

  const entries = commissionEntriesList?.results ?? [];
  const totalCount = commissionEntriesList?.count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const totalAmount = entries.reduce((sum, e) => sum + parseFloat(e.amount), 0);

  const pendingEntries = entries.filter((e) => e.status === "pending");
  const selectableIds = pendingEntries.map((e) => e.id);
  const selectedOnPage = selectableIds.filter((id) => selectedIds.has(id));
  const allSelected = selectableIds.length > 0 && selectedOnPage.length === selectableIds.length;
  const someSelected = selectedOnPage.length > 0 && !allSelected;

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        selectableIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        selectableIds.forEach((id) => next.add(id));
        return next;
      });
    }
  }

  function toggleEntry(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleBulkMarkPaid() {
    const ids = Array.from(selectedIds);
    const ok = await bulkMarkPaid(ids);
    if (ok) {
      setSelectedIds(new Set());
      fetchCommissionEntries(getCurrentParams());
    }
  }

  const selectAllRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-3 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Commissions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View all commission entries for workers.
          </p>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <CoinsIcon className="size-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Amount</p>
            <p className="text-lg font-semibold">
              {totalAmount.toLocaleString("en-KE", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <ReceiptIcon className="size-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Entries</p>
            <p className="text-lg font-semibold">{totalCount}</p>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={type}
          onValueChange={(v) => setType(v as CommissionEntryType | "")}
        >
          <SelectTrigger className="h-9 w-full sm:w-36 text-xs">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All types</SelectItem>
            <SelectItem value="earned">Earned</SelectItem>
            <SelectItem value="adjustment">Adjustment</SelectItem>
            <SelectItem value="reversal">Reversal</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={status}
          onValueChange={(v) => setStatus(v as CommissionEntryStatus | "")}
        >
          <SelectTrigger className="h-9 w-full sm:w-32 text-xs">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="void">Void</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={hasPayout}
          onValueChange={(v) => setHasPayout(v as "true" | "false" | "")}
        >
          <SelectTrigger className="h-9 w-full sm:w-32 text-xs">
            <SelectValue placeholder="Payout" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All payouts</SelectItem>
            <SelectItem value="true">Paid out</SelectItem>
            <SelectItem value="false">Not paid out</SelectItem>
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
          <SelectTrigger className="h-9 w-full sm:w-36 text-xs">
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
                    ? new Date(customFrom + "T00:00:00").toLocaleDateString("en-KE", {
                        day: "numeric",
                        month: "short",
                      })
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
                  disabled={(d) =>
                    customTo ? d > new Date(customTo + "T00:00:00") : false
                  }
                />
              </PopoverContent>
            </Popover>

            <span className="text-muted-foreground text-xs">to</span>

            <Popover open={toOpen} onOpenChange={setToOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  {customTo
                    ? new Date(customTo + "T00:00:00").toLocaleDateString("en-KE", {
                        day: "numeric",
                        month: "short",
                      })
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
                  disabled={(d) =>
                    customFrom ? d < new Date(customFrom + "T00:00:00") : false
                  }
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

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-primary/30 bg-primary/5 px-3 sm:px-4 py-2.5">
          <p className="text-sm font-medium">
            {selectedIds.size} {selectedIds.size === 1 ? "entry" : "entries"} selected
          </p>
          <div className="flex items-center gap-2">
            {bulkMarkPaidError && (
              <p className="text-xs text-destructive">{bulkMarkPaidError}</p>
            )}
            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs"
              disabled={bulkMarkPaidLoading}
              onClick={handleBulkMarkPaid}
            >
              {bulkMarkPaidLoading ? (
                <Loader2Icon className="size-3.5 animate-spin" />
              ) : (
                <CheckIcon className="size-3.5" />
              )}
              Mark as Paid
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              disabled={bulkMarkPaidLoading}
              onClick={() => setSelectedIds(new Set())}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      {commissionEntriesListLoading ? (
        <div className="rounded-xl border border-border p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <CoinsIcon className="size-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">
            No commission entries found
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {anyFilterActive
              ? "Try adjusting your filters."
              : "Commission entries will appear here once workers complete jobs."}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    className="h-4 w-4 rounded border-border accent-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                    checked={allSelected}
                    disabled={selectableIds.length === 0}
                    onChange={toggleSelectAll}
                    aria-label="Select all pending entries"
                  />
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Date
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Amount
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">
                  Type
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">
                  Status
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">
                  Job #
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">
                  Description
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">
                  Payout
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entries.map((entry) => {
                const isSelectable = entry.status === "pending";
                const isSelected = selectedIds.has(entry.id);
                return (
                  <tr
                    key={entry.id}
                    className={`transition-colors ${isSelected ? "bg-primary/5" : "hover:bg-muted/30"}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-border accent-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-30"
                        checked={isSelected}
                        disabled={!isSelectable}
                        onChange={() => toggleEntry(entry.id)}
                        aria-label={`Select entry ${entry.id}`}
                      />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(entry.earned_at).toLocaleDateString("en-KE", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                      <p className="text-xs text-muted-foreground/70">
                        {new Date(entry.earned_at).toLocaleTimeString("en-KE", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-semibold tabular-nums">
                      {parseFloat(entry.amount).toLocaleString("en-KE", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <Badge variant={TYPE_VARIANT[entry.type]} className="text-xs">
                        {TYPE_LABEL[entry.type]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <Badge variant={STATUS_VARIANT[entry.status]} className="text-xs">
                        {STATUS_LABEL[entry.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                      {entry.job_detail ? (
                        <Link
                          href={`/dashboard/jobs/${entry.job_detail.id}`}
                          className="text-primary hover:underline"
                        >
                          {entry.job_detail.job_number}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground max-w-xs truncate">
                      {entry.description || (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {entry.payout ? (
                        <Badge variant="default" className="text-xs">
                          Paid Out
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)} of{" "}
            {totalCount}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || commissionEntriesListLoading}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || commissionEntriesListLoading}
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

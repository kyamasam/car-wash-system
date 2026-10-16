"use client";

import * as React from "react";
import Link from "next/link";
import {
  PlusIcon,
  ClipboardListIcon,
  SearchIcon,
  LayoutGridIcon,
  ListIcon,
  CalendarIcon,
} from "lucide-react";

import { useJobsStore } from "@/stores/jobs-store";
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
import { resolvePreset } from "@/types/reports/filters";
import { printQueuedJobCard } from "@/lib/print/job-card";
import { JobCardGrid } from "@/components/jobs/job-card";
import {
  STATUS_LABEL,
  STATUS_CLASS,
  PAYMENT_LABEL,
} from "@/components/jobs/job-card";
import type {
  CollectionMethod,
  JobStatus,
  PaymentStatus,
} from "@/types/jobs/job";
import type { ServiceCategory } from "@/types/services/service";

const PAYMENT_VARIANT: Record<
  PaymentStatus,
  React.ComponentProps<typeof Badge>["variant"]
> = {
  unpaid: "destructive",
  partially_paid: "outline",
  paid: "default",
  refunded: "secondary",
};

export default function JobsPage() {
  const { jobsList, jobsListLoading, fetchJobsList } = useJobsStore();
  const [page, setPage] = React.useState(1);
  const [status, setStatus] = React.useState<JobStatus | "">("");
  const [paymentStatus, setPaymentStatus] = React.useState<PaymentStatus | "">(
    ""
  );
  const [collectionMethod, setCollectionMethod] = React.useState<
    CollectionMethod | ""
  >("");
  const [category, setCategory] = React.useState<
    Extract<ServiceCategory, "vehicle" | "carpet"> | ""
  >("");
  const [search, setSearch] = React.useState("");
  const [viewMode, setViewMode] = React.useState<"cards" | "table">("cards");
  const [datePreset, setDatePreset] = React.useState<"today" | "yesterday" | "custom" | "">("today");
  const [customFrom, setCustomFrom] = React.useState("");
  const [customTo, setCustomTo] = React.useState("");
  const [fromOpen, setFromOpen] = React.useState(false);
  const [toOpen, setToOpen] = React.useState(false);

  // Print a job card queued by the create-job form once this page has painted
  React.useEffect(() => {
    const t = setTimeout(printQueuedJobCard, 300);
    return () => clearTimeout(t);
  }, []);

  function getDateRange(): { date_from?: string; date_to?: string } {
    if (!datePreset) return {};
    if (datePreset === "custom") {
      return { date_from: customFrom || undefined, date_to: customTo || undefined };
    }
    const { startDate, endDate } = resolvePreset(datePreset);
    return { date_from: startDate, date_to: endDate };
  }

  const anyFilterActive = !!(
    status ||
    paymentStatus ||
    collectionMethod ||
    category ||
    search ||
    datePreset
  );

  function clearFilters() {
    setStatus("");
    setPaymentStatus("");
    setCollectionMethod("");
    setCategory("");
    setSearch("");
    setDatePreset("");
    setCustomFrom("");
    setCustomTo("");
    setPage(1);
  }

  React.useEffect(() => {
    setPage(1);
  }, [status, paymentStatus, collectionMethod, category, search, datePreset, customFrom, customTo]);

  React.useEffect(() => {
    fetchJobsList({
      page,
      status: status || undefined,
      payment_status: paymentStatus || undefined,
      collection_method: collectionMethod || undefined,
      category: category || undefined,
      search: search || undefined,
      ...getDateRange(),
    });
  }, [page, status, paymentStatus, collectionMethod, category, search, datePreset, customFrom, customTo]);

  const jobs = jobsList?.results ?? [];
  const totalCount = jobsList?.count ?? 0;
  const pageSize = 10;
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-3 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Jobs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track and manage all car wash jobs.
          </p>
        </div>
        <Link href="/dashboard/jobs/new">
          <Button>
            <PlusIcon />
            New Job
          </Button>
        </Link>
      </div>

      {/* Job type pills */}
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { value: "", label: "All" },
            { value: "vehicle", label: "Vehicle" },
            { value: "carpet", label: "Carpet" },
          ] as const
        ).map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setCategory(opt.value)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              category === opt.value
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            className="pl-9 h-9 w-full sm:w-52 text-sm"
            placeholder="Job #, customer, plate…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select
          value={status}
          onValueChange={(v) => setStatus(v as JobStatus | "")}
        >
          <SelectTrigger className="h-9 w-full sm:w-38 text-xs">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            <SelectItem value="queued">Queued</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="ready_for_collection">Ready for Collection</SelectItem>
            <SelectItem value="collected">Collected</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={paymentStatus}
          onValueChange={(v) => setPaymentStatus(v as PaymentStatus | "")}
        >
          <SelectTrigger className="h-9 w-full sm:w-36 text-xs">
            <SelectValue placeholder="All payments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All payments</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
            <SelectItem value="partially_paid">Partially Paid</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={collectionMethod}
          onValueChange={(v) => setCollectionMethod(v as CollectionMethod | "")}
        >
          <SelectTrigger className="h-9 w-full sm:w-36 text-xs">
            <SelectValue placeholder="All methods" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All methods</SelectItem>
            <SelectItem value="walk_in">Walk In</SelectItem>
            <SelectItem value="pickup">Pickup</SelectItem>
            <SelectItem value="delivery">Delivery</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={datePreset}
          onValueChange={(v) => {
            setDatePreset(v as "today" | "yesterday" | "custom" | "");
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
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={clearFilters}
          >
            Clear
          </Button>
        )}

        {/* View toggle */}
        <div className="ml-auto flex items-center rounded-md border border-border overflow-hidden">
          <button
            className={`px-2.5 py-1.5 transition-colors ${
              viewMode === "cards"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
            onClick={() => setViewMode("cards")}
            title="Card view"
          >
            <LayoutGridIcon className="size-4" />
          </button>
          <button
            className={`px-2.5 py-1.5 transition-colors ${
              viewMode === "table"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
            onClick={() => setViewMode("table")}
            title="Table view"
          >
            <ListIcon className="size-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {jobsListLoading ? (
        viewMode === "cards" ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-52 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-md" />
            ))}
          </div>
        )
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ClipboardListIcon className="size-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No jobs found</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            {anyFilterActive
              ? "Try adjusting your filters."
              : "Create your first job to get started."}
          </p>
          {!anyFilterActive && (
            <Link href="/dashboard/jobs/new">
              <Button size="sm">
                <PlusIcon />
                Create Job
              </Button>
            </Link>
          )}
        </div>
      ) : viewMode === "cards" ? (
        <JobCardGrid jobs={jobs} />
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Job #</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Vehicle</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Services</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Payment</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Total</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{job.job_number}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {job.customer ? (
                      <div>
                        <p className="font-medium leading-tight">
                          {job.customer.name ?? <span className="text-muted-foreground/50">No name</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">{job.customer.phone}</p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {job.vehicle ? (
                      <div>
                        <p className="font-medium leading-tight">{job.vehicle.plate_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {[job.vehicle.color, job.vehicle.make, job.vehicle.model].filter(Boolean).join(" ") || job.vehicle.vehicle_category || "—"}
                        </p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {job.items.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {job.items.map((item) => (
                          <Badge key={item.id} variant="secondary" className="text-xs font-normal">
                            {item.service.name}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[job.status]}`}
                    >
                      {STATUS_LABEL[job.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <Badge variant={PAYMENT_VARIANT[job.payment_status]} className="text-xs">
                      {PAYMENT_LABEL[job.payment_status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                    {job.total_amount}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                    {new Date(job.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/dashboard/jobs/${job.id}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
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
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)} of {totalCount}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || jobsListLoading}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || jobsListLoading}
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

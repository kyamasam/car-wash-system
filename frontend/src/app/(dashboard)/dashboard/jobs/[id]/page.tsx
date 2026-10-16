"use client";

import { ArrowLeftIcon, Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import * as React from "react";

import {
  PAYMENT_LABEL,
  STATUS_CLASS,
  STATUS_LABEL,
} from "@/components/jobs/job-card";
import { PayJobModal } from "@/components/jobs/pay-job-modal";
import { PrintJobCardButton } from "@/components/jobs/print-job-card-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBillingStore } from "@/stores/billing-store";
import { useJobsStore } from "@/stores/jobs-store";
import type { Job, JobStatus, PaymentStatus } from "@/types/jobs/job";

const PAYMENT_VARIANT: Record<
  PaymentStatus,
  React.ComponentProps<typeof Badge>["variant"]
> = {
  unpaid: "destructive",
  partially_paid: "outline",
  paid: "default",
  refunded: "secondary",
};

const COLLECTION_LABEL: Record<string, string> = {
  walk_in: "Walk-in",
  pickup: "Pickup",
  delivery: "Delivery",
};

const VEHICLE_CATEGORY_LABEL: Record<string, string> = {
  saloon: "Saloon",
  suv: "SUV",
  van: "Van",
  truck: "Truck",
  other: "Other",
};

const METHOD_LABEL: Record<string, string> = {
  cash: "Cash",
  mpesa: "M-Pesa",
  card: "Card",
  bank_transfer: "Bank Transfer",
};

const PAYMENT_TYPE_LABEL: Record<string, string> = {
  payment: "Payment",
  deposit: "Deposit",
  refund: "Refund",
};

const COMMISSION_STATUS_CLASS: Record<string, string> = {
  pending: "border border-amber-500 text-amber-600 bg-transparent",
  paid: "bg-green-600 text-white",
  cancelled: "bg-secondary text-secondary-foreground",
};

type StatusTransition = {
  label: string;
  next: JobStatus;
  variant: React.ComponentProps<typeof Button>["variant"];
};

const TRANSITIONS: Partial<Record<JobStatus, StatusTransition[]>> = {
  queued: [
    { label: "Start", next: "in_progress", variant: "default" },
    { label: "Cancel", next: "cancelled", variant: "destructive" },
  ],
  in_progress: [
    { label: "Complete", next: "completed", variant: "default" },
    { label: "Cancel", next: "cancelled", variant: "destructive" },
  ],
  completed: [
    { label: "Mark Ready", next: "ready_for_collection", variant: "outline" },
  ],
  ready_for_collection: [
    { label: "Mark Collected", next: "collected", variant: "default" },
  ],
};

function fmt(ts: string | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString();
}

function fmtDate(ts: string | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString();
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { jobDetail, jobDetailLoading, jobDetailError, fetchJobDetail, updateJobStatus, statusUpdating } =
    useJobsStore();
  const { bulkMarkPaid } = useBillingStore();

  const today = new Date().toISOString().slice(0, 10);
  const [payOpen, setPayOpen] = React.useState(false);
  const [commissionDates, setCommissionDates] = React.useState<Record<string, string>>({});
  const [commissionPaying, setCommissionPaying] = React.useState<Set<string>>(new Set());

  const getCommissionDate = (cId: string) => commissionDates[cId] ?? today;

  const handleMarkCommissionPaid = async (cId: string) => {
    setCommissionPaying((prev) => new Set(prev).add(cId));
    const paidAt = new Date(getCommissionDate(cId)).toISOString();
    const ok = await bulkMarkPaid([cId], paidAt);
    if (ok) await fetchJobDetail(id);
    setCommissionPaying((prev) => { const s = new Set(prev); s.delete(cId); return s; });
  };

  React.useEffect(() => {
    fetchJobDetail(id);
  }, [id]);

  if (jobDetailLoading && !jobDetail) {
    return (
      <div className="flex flex-col gap-4 sm:gap-6 p-3 sm:p-6 max-w-5xl">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (jobDetailError || !jobDetail) {
    return (
      <div className="flex flex-col gap-4 p-3 sm:p-6">
        <Link href="/dashboard/jobs">
          <Button variant="ghost" size="sm">
            <ArrowLeftIcon className="size-4" />
            Back to Jobs
          </Button>
        </Link>
        <p className="text-sm text-destructive">
          {jobDetailError ?? "Job not found."}
        </p>
      </div>
    );
  }

  const job = jobDetail;
  const isUpdating = !!statusUpdating[job.id];
  const transitions = TRANSITIONS[job.status] ?? [];
  const canPay = job.payment_status !== "paid" && job.payment_status !== "refunded";
  const balance = (parseFloat(job.total_amount) - parseFloat(job.amount_paid)).toFixed(2);

  const vehicleDesc = job.vehicle
    ? [job.vehicle.color, job.vehicle.make, job.vehicle.model].filter(Boolean).join(" ") ||
    (job.vehicle.vehicle_category ? VEHICLE_CATEGORY_LABEL[job.vehicle.vehicle_category] : null)
    : null;

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-3 sm:p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/jobs">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeftIcon className="size-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-semibold tracking-tight">{job.job_number}</h1>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[job.status]}`}
              >
                {STATUS_LABEL[job.status]}
              </span>
              <Badge variant={PAYMENT_VARIANT[job.payment_status]} className="text-xs">
                {PAYMENT_LABEL[job.payment_status]}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {COLLECTION_LABEL[job.collection_method] ?? job.collection_method}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {fmtDate(job.created_at)}
            </p>
          </div>
        </div>

        {/* Status actions */}
        <div className="flex items-center gap-2 flex-wrap">
            <PrintJobCardButton job={job} size="sm" />
            {canPay && (
              <Button
                variant="outline"
                size="sm"
                className="border-green-500 text-green-600 hover:bg-green-50"
                onClick={() => setPayOpen(true)}
              >
                Record Payment
              </Button>
            )}
            {transitions.map((t) => (
              <Button
                key={t.next}
                variant={t.variant}
                size="sm"
                disabled={isUpdating}
                onClick={() => updateJobStatus(job.id, t.next)}
              >
                {isUpdating ? <Loader2Icon className="size-4 animate-spin" /> : t.label}
              </Button>
            ))}
        </div>
      </div>

      {/* Info grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Left: customer, vehicle, worker */}
        <div className="rounded-xl border border-border p-5 flex flex-col gap-4">
          {job.customer ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Customer</p>
              <p className="text-sm font-medium">{job.customer.name ?? "—"}</p>
              <p className="text-sm text-muted-foreground">{job.customer.phone}</p>
              {job.customer.email && (
                <p className="text-sm text-muted-foreground">{job.customer.email}</p>
              )}
            </div>
          ) : (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Customer</p>
              <p className="text-sm text-muted-foreground/50">No customer</p>
            </div>
          )}

          {job.vehicle && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Vehicle</p>
              <p className="text-sm font-medium">{job.vehicle.plate_number}</p>
              {vehicleDesc && <p className="text-sm text-muted-foreground">{vehicleDesc}</p>}
              {job.vehicle.vehicle_category && !vehicleDesc && (
                <p className="text-sm text-muted-foreground">
                  {VEHICLE_CATEGORY_LABEL[job.vehicle.vehicle_category]}
                </p>
              )}
            </div>
          )}

          {job.worker && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Attendant</p>
              <p className="text-sm font-medium">{job.worker.name}</p>
              {job.worker.phone && (
                <p className="text-sm text-muted-foreground">{job.worker.phone}</p>
              )}
            </div>
          )}

          {job.notes && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
              <p className="text-sm text-muted-foreground">{job.notes}</p>
            </div>
          )}
        </div>

        {/* Right: services + financial summary */}
        <div className="rounded-xl border border-border p-5 flex flex-col gap-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Services</p>

          {job.items.length > 0 ? (
            <div className="flex flex-col gap-2">
              {job.items.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-2 text-sm">
                  <div>
                    <p className="font-medium">{item.service.name}</p>
                    {item.tag_number && (
                      <p className="text-xs text-muted-foreground">Tag: {item.tag_number}</p>
                    )}
                    {item.notes && (
                      <p className="text-xs text-muted-foreground">{item.notes}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-muted-foreground text-xs">×{item.quantity}</p>
                    <p className="font-medium">KES {item.line_total}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground/50">No services</p>
          )}

          <div className="border-t border-border pt-3 flex flex-col gap-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>KES {job.subtotal}</span>
            </div>
            {parseFloat(job.discount_amount) > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Discount</span>
                <span>− KES {job.discount_amount}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>KES {job.total_amount}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Paid</span>
              <span>KES {job.amount_paid}</span>
            </div>
            {parseFloat(balance) > 0 && (
              <div className="flex justify-between text-destructive font-medium">
                <span>Balance due</span>
                <span>KES {balance}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payments */}
      <div className="rounded-xl border border-border p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Payments</p>
          {canPay && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-green-600 hover:text-green-700"
              onClick={() => setPayOpen(true)}
            >
              + Record
            </Button>
          )}
        </div>

        {job.payments.length > 0 ? (
          <div className="flex flex-col gap-2">
            {job.payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{METHOD_LABEL[p.method] ?? p.method}</span>
                  <span className="text-muted-foreground/50">·</span>
                  <span className="text-muted-foreground">{PAYMENT_TYPE_LABEL[p.type] ?? p.type}</span>
                  {p.transaction_code && (
                    <>
                      <span className="text-muted-foreground/50">·</span>
                      <span className="text-xs font-mono text-muted-foreground">{p.transaction_code}</span>
                    </>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <span className="font-medium">KES {p.amount}</span>
                  <span className="text-xs text-muted-foreground ml-2">{fmtDate(p.paid_at)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground/50">No payments recorded</p>
        )}
      </div>

      {/* Commission entries */}
      {job.commission_entries.length > 0 && (
        <div className="rounded-xl border border-border p-5 flex flex-col gap-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Commission</p>
          <div className="flex flex-col gap-2">
            {job.commission_entries.map((c) => (
              <div key={c.id} className="flex items-center justify-between text-sm gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="truncate">{c.description ?? "Commission"}</span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${COMMISSION_STATUS_CLASS[c.status] ?? ""}`}
                  >
                    {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {c.status === "pending" && (
                    <>
                      <input
                        type="date"
                        value={getCommissionDate(c.id)}
                        onChange={(e) => setCommissionDates((prev) => ({ ...prev, [c.id]: e.target.value }))}
                        className="h-9 rounded-md border border-input bg-background px-2 text-xs w-full sm:w-auto"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={commissionPaying.has(c.id)}
                        onClick={() => handleMarkCommissionPaid(c.id)}
                      >
                        {commissionPaying.has(c.id) ? (
                          <Loader2Icon className="size-3 animate-spin" />
                        ) : (
                          "Mark Paid"
                        )}
                      </Button>
                    </>
                  )}
                  <span className="font-medium">KES {c.amount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="rounded-xl border border-border p-5 flex flex-col gap-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Timeline</p>
        <div className="grid gap-2 sm:grid-cols-2 text-sm">
          {[
            { label: "Checked in", value: job.checked_in_at },
            { label: "Started", value: job.started_at },
            { label: "Completed", value: job.completed_at },
            { label: "Collected", value: job.collected_at },
            ...(job.cancelled_at
              ? [{ label: "Cancelled", value: job.cancelled_at }]
              : []),
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between gap-2">
              <span className="text-muted-foreground">{label}</span>
              <span className={value ? "" : "text-muted-foreground/40"}>{fmt(value ?? null)}</span>
            </div>
          ))}
        </div>
        {job.cancel_reason && (
          <p className="text-sm text-muted-foreground border-t border-border pt-2">
            Cancel reason: {job.cancel_reason}
          </p>
        )}
      </div>

      <PayJobModal
        job={job as unknown as Job}
        open={payOpen}
        onOpenChange={setPayOpen}
        onSuccess={() => fetchJobDetail(id)}
      />
    </div>
  );
}

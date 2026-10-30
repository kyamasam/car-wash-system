"use client";

import * as React from "react";
import Link from "next/link";
import { EyeIcon, Loader2Icon } from "lucide-react";

import { useJobsStore } from "@/stores/jobs-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PayJobModal } from "@/components/jobs/pay-job-modal";
import type { Job, JobStatus, PaymentStatus } from "@/types/jobs/job";

export const STATUS_LABEL: Record<JobStatus, string> = {
  queued: "Queued",
  in_progress: "In Progress",
  completed: "Completed",
  ready_for_collection: "Ready",
  collected: "Collected",
  cancelled: "Cancelled",
};

export const STATUS_CLASS: Record<JobStatus, string> = {
  queued: "bg-secondary text-secondary-foreground",
  in_progress: "border border-blue-500 text-blue-600 bg-transparent",
  completed: "bg-green-600 text-white",
  ready_for_collection: "border border-amber-500 text-amber-600 bg-transparent",
  collected: "bg-secondary text-secondary-foreground",
  cancelled: "bg-destructive text-destructive-foreground",
};

export const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  partially_paid: "Partial",
  paid: "Paid",
  refunded: "Refunded",
};

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

type StatusTransition = { label: string; next: JobStatus; variant: React.ComponentProps<typeof Button>["variant"] };

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

function JobCard({ job }: { job: Job }) {
  const { updateJobStatus, statusUpdating, refreshJobsList } = useJobsStore();
  const isUpdating = !!statusUpdating[job.id];
  const isDeleted = !!job.deleted_at;
  const transitions = isDeleted ? [] : TRANSITIONS[job.status] ?? [];
  const [payOpen, setPayOpen] = React.useState(false);
  const canPay = !isDeleted && job.payment_status !== "paid" && job.payment_status !== "refunded";

  const vehicleDesc = [job.vehicle?.color, job.vehicle?.make, job.vehicle?.model]
    .filter(Boolean)
    .join(" ") || job.vehicle?.vehicle_category || null;

  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-sm font-semibold">{job.job_number}</span>
          <span className="text-xs text-muted-foreground ml-2">
            {new Date(job.created_at).toLocaleDateString()}
          </span>
        </div>
        <Badge variant="secondary" className="text-xs shrink-0">
          {COLLECTION_LABEL[job.collection_method] ?? job.collection_method}
        </Badge>
      </div>

      {/* Customer */}
      {job.customer ? (
        <div className="text-sm">
          <p className="font-medium leading-tight">{job.customer.name ?? "—"}</p>
          <p className="text-xs text-muted-foreground">{job.customer.phone}</p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground/50">No customer</p>
      )}

      {/* Vehicle */}
      {job.vehicle && (
        <div className="text-sm">
          <p className="font-medium leading-tight">{job.vehicle.plate_number}</p>
          {vehicleDesc && (
            <p className="text-xs text-muted-foreground">{vehicleDesc}</p>
          )}
        </div>
      )}

      {/* Services */}
      {job.items.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {job.items.map((item) => (
            <Badge key={item.id} variant="secondary" className="text-xs font-normal">
              {item.service.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Footer: status + payment + total */}
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[job.status]}`}
        >
          {STATUS_LABEL[job.status]}
        </span>
        <Badge variant={PAYMENT_VARIANT[job.payment_status]} className="text-xs">
          {PAYMENT_LABEL[job.payment_status]}
        </Badge>
        {isDeleted && (
          <Badge variant="destructive" className="text-xs">
            Deleted
          </Badge>
        )}
        <span className="text-xs text-muted-foreground ml-auto">
          {job.total_amount}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-border">
        {transitions.map((t) => (
          <Button
            key={t.next}
            variant={t.variant}
            size="sm"
            className="h-7 text-xs"
            disabled={isUpdating}
            onClick={() => updateJobStatus(job.id, t.next)}
          >
            {isUpdating ? <Loader2Icon className="size-3 animate-spin" /> : t.label}
          </Button>
        ))}
        {canPay && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs border-green-500 text-green-600 hover:bg-green-50"
            onClick={() => setPayOpen(true)}
          >
            Pay
          </Button>
        )}
        <Link href={`/dashboard/jobs/${job.id}`} className="ml-auto">
          <Button variant="outline">
            <EyeIcon className="size-4" />
            View details
          </Button>
        </Link>
      </div>

      <PayJobModal
        job={job}
        open={payOpen}
        onOpenChange={setPayOpen}
        onSuccess={() => refreshJobsList()}
      />
    </div>
  );
}

export function JobCardGrid({ jobs }: { jobs: Job[] }) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}

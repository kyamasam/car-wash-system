"use client";

import * as React from "react";
import { PrinterIcon, ReceiptIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useJobCardOptions } from "@/hooks/jobs/use-job-card-options";
import { printJobCard, printReceipt, type JobCardData } from "@/lib/print/job-card";

type PrintJobCardButtonProps = Omit<React.ComponentProps<typeof Button>, "onClick"> & {
  job: JobCardData;
  workerName?: string;
  businessName?: string;
};

export function PrintJobCardButton({
  job,
  workerName,
  businessName,
  children,
  variant = "outline",
  ...props
}: PrintJobCardButtonProps) {
  const getJobCardOptions = useJobCardOptions();

  return (
    <Button
      type="button"
      variant={variant}
      onClick={() => printJobCard(job, {
          ...getJobCardOptions(job),
          workerName,
          ...(businessName ? { businessName } : {}),
        })}
      {...props}
    >
      <PrinterIcon />
      {children ?? "Print Job Card"}
    </Button>
  );
}

export function PrintReceiptButton({
  job,
  workerName,
  businessName,
  children,
  variant = "outline",
  ...props
}: PrintJobCardButtonProps) {
  const getJobCardOptions = useJobCardOptions();

  return (
    <Button
      type="button"
      variant={variant}
      onClick={() => printReceipt(job, {
          ...getJobCardOptions(job),
          workerName,
          ...(businessName ? { businessName } : {}),
        })}
      {...props}
    >
      <ReceiptIcon />
      {children ?? "Print Receipt"}
    </Button>
  );
}

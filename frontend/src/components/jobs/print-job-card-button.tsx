"use client";

import * as React from "react";
import { PrinterIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { printJobCard, type JobCardData } from "@/lib/print/job-card";

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
  return (
    <Button
      type="button"
      variant={variant}
      onClick={() => printJobCard(job, { workerName, businessName })}
      {...props}
    >
      <PrinterIcon />
      {children ?? "Print Job Card"}
    </Button>
  );
}

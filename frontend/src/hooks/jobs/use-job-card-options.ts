import { useCallback } from "react";
import { useBranches } from "@/hooks/commons/use-branches";
import { useCurrentBusiness } from "@/hooks/commons/use-business";
import type { JobCardData, JobCardOptions } from "@/lib/print/job-card";

/** Returns a builder that fills job card header details (business + branch) for a job. */
export function useJobCardOptions() {
  const { data: business } = useCurrentBusiness();
  const { data: branches = [] } = useBranches();

  return useCallback(
    (job: JobCardData, extra: JobCardOptions = {}): JobCardOptions => {
      const branch = branches.find((b) => b.id === job.branch);
      return {
        businessName: business?.name,
        businessLogo: business?.logo,
        currency: business?.currency,
        receiptFooter: business?.receipt_footer,
        jobCardFooter: business?.job_card_footer,
        branchName: branch?.name,
        branchLocation: branch?.location,
        branchPhone: branch?.phone,
        ...extra,
      };
    },
    [business, branches],
  );
}

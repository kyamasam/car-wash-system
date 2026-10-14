import { useApiQuery } from "@/hooks/use-api";
import type { JobsSummaryReport } from "@/types/reports/jobs-summary";
import type { ReportFilters } from "@/types/reports/filters";

export function useJobsSummaryReport(filters: ReportFilters) {
  const params = new URLSearchParams();
  params.set("start_date", filters.startDate);
  params.set("end_date", filters.endDate);
  if (filters.branch) params.set("branch", filters.branch);

  return useApiQuery<JobsSummaryReport>(`/reports/jobs-summary/?${params}`, {
    queryKey: ["reports", "jobs-summary", filters],
    staleTime: 1000 * 60 * 5,
    enabled: !!filters.startDate && !!filters.endDate,
  });
}

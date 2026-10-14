import { useApiQuery } from "@/hooks/use-api";
import type { CommissionSummaryReport } from "@/types/reports/commission-summary";
import type { ReportFilters } from "@/types/reports/filters";

export function useCommissionSummaryReport(filters: ReportFilters) {
  const params = new URLSearchParams();
  params.set("start_date", filters.startDate);
  params.set("end_date", filters.endDate);
  if (filters.branch) params.set("branch", filters.branch);

  return useApiQuery<CommissionSummaryReport>(`/reports/commission-summary/?${params}`, {
    queryKey: ["reports", "commission-summary", filters],
    staleTime: 1000 * 60 * 5,
    enabled: !!filters.startDate && !!filters.endDate,
  });
}

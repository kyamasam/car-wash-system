import { useApiQuery } from "@/hooks/use-api";
import type { ProfitReport } from "@/types/reports/profit";
import type { ReportFilters } from "@/types/reports/filters";

export function useProfitReport(filters: ReportFilters) {
  const params = new URLSearchParams();
  params.set("start_date", filters.startDate);
  params.set("end_date", filters.endDate);
  params.set("granularity", filters.granularity);
  if (filters.branch) params.set("branch", filters.branch);

  return useApiQuery<ProfitReport>(`/reports/profit/?${params}`, {
    queryKey: ["reports", "profit", filters],
    staleTime: 1000 * 60 * 5,
    enabled: !!filters.startDate && !!filters.endDate,
  });
}

import { useApiQuery } from "@/hooks/use-api";
import type { RevenueReport } from "@/types/reports/revenue";
import type { ReportFilters } from "@/types/reports/filters";

export function useRevenueReport(filters: ReportFilters) {
  const params = new URLSearchParams();
  params.set("start_date", filters.startDate);
  params.set("end_date", filters.endDate);
  params.set("granularity", filters.granularity);
  if (filters.branch) params.set("branch", filters.branch);

  return useApiQuery<RevenueReport>(`/reports/revenue/?${params}`, {
    queryKey: ["reports", "revenue", filters],
    staleTime: 1000 * 60 * 5,
    enabled: !!filters.startDate && !!filters.endDate,
  });
}

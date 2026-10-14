import { useApiQuery } from "@/hooks/use-api";
import type { ServicePopularityReport } from "@/types/reports/service-popularity";
import type { ReportFilters } from "@/types/reports/filters";

export function useServicePopularityReport(filters: ReportFilters) {
  const params = new URLSearchParams();
  params.set("start_date", filters.startDate);
  params.set("end_date", filters.endDate);
  if (filters.branch) params.set("branch", filters.branch);

  return useApiQuery<ServicePopularityReport>(`/reports/service-popularity/?${params}`, {
    queryKey: ["reports", "service-popularity", filters],
    staleTime: 1000 * 60 * 5,
    enabled: !!filters.startDate && !!filters.endDate,
  });
}

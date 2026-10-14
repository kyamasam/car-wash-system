import { useApiQuery } from "@/hooks/use-api";
import type { WorkerPerformanceReport } from "@/types/reports/worker-performance";
import type { ReportFilters } from "@/types/reports/filters";

export function useWorkerPerformanceReport(filters: ReportFilters) {
  const params = new URLSearchParams();
  params.set("start_date", filters.startDate);
  params.set("end_date", filters.endDate);
  if (filters.branch) params.set("branch", filters.branch);
  if (filters.workerId) params.set("worker", filters.workerId);

  return useApiQuery<WorkerPerformanceReport>(`/reports/worker-performance/?${params}`, {
    queryKey: ["reports", "worker-performance", filters],
    staleTime: 1000 * 60 * 5,
    enabled: !!filters.startDate && !!filters.endDate,
  });
}

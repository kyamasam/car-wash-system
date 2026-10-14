export interface WorkerPerformanceItem {
  worker_id: string;
  worker_name: string;
  jobs_completed: number;
  commission_earned: string;
  commission_pending: string;
  commission_paid: string;
  avg_turnaround_minutes: number | null;
}

export interface WorkerPerformanceReport {
  start_date: string;
  end_date: string;
  workers: WorkerPerformanceItem[];
}

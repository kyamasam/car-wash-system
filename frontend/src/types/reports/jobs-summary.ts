export interface JobStatusCount {
  status: string;
  count: number;
}

export interface WorkerJobStat {
  worker_id: string;
  worker_name: string;
  job_count: number;
  avg_turnaround_minutes: number | null;
}

export interface JobsSummaryReport {
  start_date: string;
  end_date: string;
  total_jobs: number;
  status_breakdown: JobStatusCount[];
  avg_turnaround_minutes: number | null;
  per_worker: WorkerJobStat[];
}

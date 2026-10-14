export interface CommissionWorkerSummary {
  worker_id: string;
  worker_name: string;
  pending_amount: string;
  paid_amount: string;
  void_amount: string;
}

export interface CommissionSummaryReport {
  start_date: string;
  end_date: string;
  total_pending: string;
  total_paid: string;
  total_void: string;
  per_worker: CommissionWorkerSummary[];
}

export type CommissionEntryType = "earned" | "adjustment" | "reversal";
export type CommissionEntryStatus = "pending" | "paid" | "void";
export type CommissionCalcType = "fixed" | "percentage";

export interface CommissionEntryJobDetail {
  id: string;
  job_number: string;
  payment_status: string;
  status: string;
  total_amount: string;
  amount_paid: string;
}

export interface CommissionEntryWorkerDetail {
  id: string;
  name: string;
  phone: string | null;
}

export interface CommissionEntry {
  id: string;
  job: string | null;
  job_detail: CommissionEntryJobDetail | null;
  worker: string;
  worker_detail: CommissionEntryWorkerDetail | null;
  branch: string;
  payout: string | null;
  type: CommissionEntryType;
  status: CommissionEntryStatus;
  amount: string;
  commission_type: CommissionCalcType | null;
  commission_value: string | null;
  base_amount: string | null;
  description: string;
  earned_at: string;
  paid_at: string | null;
  created_at: string;
}

export interface CommissionEntryListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: CommissionEntry[];
}

export interface CommissionEntryListParams {
  page?: number;
  worker?: string;
  type?: CommissionEntryType;
  status?: CommissionEntryStatus;
  date_from?: string;
  date_to?: string;
  has_payout?: boolean;
}

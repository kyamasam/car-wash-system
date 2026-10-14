export interface Worker {
  id: string;
  branch: string;
  name: string;
  phone: string | null;
  national_id: string | null;
  is_commission_eligible: boolean;
  joined_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkerListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Worker[];
}

export interface WorkerListParams {
  search?: string;
  page?: number;
}

export interface WorkerAllParams {
  search?: string;
}

export interface CreateWorkerPayload {
  branch: string;
  name: string;
  phone?: string;
  national_id?: string;
  is_commission_eligible?: boolean;
  joined_at?: string | null;
}

export interface UpdateWorkerPayload {
  name?: string;
  phone?: string | null;
  national_id?: string | null;
  is_commission_eligible?: boolean;
  joined_at?: string | null;
}

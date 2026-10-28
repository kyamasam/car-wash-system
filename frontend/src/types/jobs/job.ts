import type { ServiceCategory } from "@/types/services/service";

export type CollectionMethod = "walk_in" | "pickup" | "delivery";
export type VehicleCategory = "saloon" | "suv" | "van" | "truck" | "other";
export type JobStatus =
  | "queued"
  | "in_progress"
  | "completed"
  | "ready_for_collection"
  | "collected"
  | "cancelled";
export type PaymentStatus = "unpaid" | "partially_paid" | "paid" | "refunded";

// ---------------------------------------------------------------------------
// Write payloads (used when creating a job)
// ---------------------------------------------------------------------------

export interface JobItemPayload {
  service: string;
  service_price?: string;
  custom_unit_price?: string;
  quantity: string;
  length?: string;
  width?: string;
  description?: string;
  tag_number?: string;
  notes?: string;
}

export interface CustomerDataPayload {
  phone: string;
  name: string;
  email?: string;
}

export interface VehicleDataPayload {
  plate_number: string;
  vehicle_category?: VehicleCategory;
  make?: string;
  model?: string;
  color?: string;
}

export interface CreateJobPayload {
  worker?: string;
  collection_method: CollectionMethod;
  pickup_address?: string;
  contact_phone?: string;
  expected_collection_at?: string;
  discount_amount?: string;
  notes?: string;
  customer_id?: string;
  customer_data?: CustomerDataPayload;
  vehicle_id?: string;
  vehicle_data?: VehicleDataPayload;
  items: JobItemPayload[];
}

// ---------------------------------------------------------------------------
// Read shapes (returned by GET /api/jobs/)
// ---------------------------------------------------------------------------

export interface Customer {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
}

export interface Vehicle {
  id: string;
  plate_number: string;
  make: string | null;
  model: string | null;
  color: string | null;
  vehicle_category: VehicleCategory | null;
}

export interface Service {
  id: string;
  name: string;
}

export interface JobItem {
  id: string;
  job: string;
  service: Service;
  description: string | null;
  quantity: string;
  length: string | null;
  width: string | null;
  unit_price: string;
  standard_unit_price: string | null;
  is_custom_price: boolean;
  line_total: string;
  tag_number: string | null;
  notes: string | null;
  created_at: string;
}

export interface Job {
  id: string;
  job_number: string;
  branch: string;
  customer: Customer | null;
  vehicle: Vehicle | null;
  worker: string | null;
  created_by: string | null;
  collected_recorded_by: string | null;
  status: JobStatus;
  payment_status: PaymentStatus;
  collection_method: CollectionMethod;
  pickup_address: string | null;
  contact_phone: string | null;
  expected_collection_at: string | null;
  subtotal: string;
  discount_amount: string;
  total_amount: string;
  amount_paid: string;
  cancel_reason: string | null;
  notes: string | null;
  is_active: boolean;
  deleted_at: string | null;
  checked_in_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  collected_at: string | null;
  cancelled_at: string | null;
  items: JobItem[];
  created_at: string;
  updated_at: string;
}

export interface JobListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Job[];
}

export interface JobListParams {
  branch?: string;
  worker?: string;
  status?: JobStatus;
  payment_status?: PaymentStatus;
  collection_method?: CollectionMethod;
  category?: ServiceCategory;
  search?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
}

export interface WorkerBrief {
  id: string;
  name: string;
  phone: string | null;
  is_commission_eligible: boolean;
}

export type { CommissionEntry } from "@/types/billing/commission";
import type { CommissionEntry } from "@/types/billing/commission";

export interface JobDetail extends Omit<Job, "worker"> {
  worker: WorkerBrief | null;
  payments: import("@/types/billing/payment").Payment[];
  commission_entries: CommissionEntry[];
}

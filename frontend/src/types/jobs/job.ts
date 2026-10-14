export type CollectionMethod = "walk_in" | "pickup";
export type VehicleCategory = "saloon" | "suv" | "van" | "truck" | "other";
export type JobStatus = "pending" | "in_progress" | "completed" | "cancelled";

export interface JobItemPayload {
  service: string;
  service_price?: string;
  quantity: string;
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
  vehicle_category: VehicleCategory;
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

export interface JobItem {
  id: string;
  service: string;
  quantity: string;
  description: string | null;
  tag_number: string | null;
  notes: string | null;
}

export interface Job {
  id: string;
  branch: string;
  worker: string | null;
  collection_method: CollectionMethod;
  pickup_address: string | null;
  contact_phone: string | null;
  expected_collection_at: string | null;
  discount_amount: string;
  notes: string | null;
  status: JobStatus;
  customer_id: string | null;
  vehicle_data: VehicleDataPayload;
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
  collection_method?: CollectionMethod;
  search?: string;
  page?: number;
}

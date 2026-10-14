export type ServiceCategory = "vehicle" | "carpet" | "other";
export type ServiceUnit = "per_job" | "per_hour";
export type CommissionType = "fixed" | "percentage";

export interface ServicePrice {
  id: string;
  vehicle_category: string | null;
  size_label: string | null;
  price: string;
  commission_value: string;
  commission_type: CommissionType;
  icon: string | null;
  created_at: string;
  service: string;
  branch: string | null;
  created_by: string | null;
}

export interface Service {
  id: string;
  name: string;
  code: string;
  category: ServiceCategory;
  unit: ServiceUnit;
  icon: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  prices: ServicePrice[];
}

export interface ServiceListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Service[];
}

export interface ServiceAllParams {
  category?: ServiceCategory;
  search?: string;
}

export interface ServiceListParams {
  category?: ServiceCategory;
  search?: string;
  page?: number;
}

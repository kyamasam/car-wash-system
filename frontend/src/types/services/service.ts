export type ServiceCategory = "vehicle" | "carpet" | "other";
export type ServiceUnit = "per_job" | "per_item" | "by_size";
export type SizeUnit = "sq_ft" | "sq_m" | "ft" | "m";
export type CommissionType = "fixed" | "percentage";

export const SIZE_UNIT_LABELS: Record<SizeUnit, string> = {
  sq_ft: "sq ft",
  sq_m: "sq m",
  ft: "ft",
  m: "m",
};

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
  size_unit: SizeUnit | null;
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

export interface CreateServicePayload {
  name: string;
  code: string;
  category: ServiceCategory;
  unit: ServiceUnit;
  size_unit?: SizeUnit | null;
  icon?: string;
  is_active?: boolean;
}
export type UpdateServicePayload = Partial<CreateServicePayload>;

export interface CreateServicePricePayload {
  service: string;
  branch?: string;
  vehicle_category?: string;
  size_label?: string;
  price: string;
  commission_value: string;
  commission_type: CommissionType;
  icon?: string;
}
export type UpdateServicePricePayload = Partial<CreateServicePricePayload>;

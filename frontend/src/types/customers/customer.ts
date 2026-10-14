export type VehicleCategory = "saloon" | "suv" | "pickup" | "matatu" | "lorry" | "other";

export interface Vehicle {
  id: string;
  plate_number: string;
  customer: string | null;
  vehicle_category: VehicleCategory | null;
  make: string | null;
  model: string | null;
  color: string | null;
  is_active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface VehicleListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Vehicle[];
}

export interface VehicleListParams {
  search?: string;
  vehicle_category?: VehicleCategory;
  customer?: string;
  page?: number;
}

export interface VehicleAllParams {
  search?: string;
  vehicle_category?: VehicleCategory;
}

export interface Customer {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
  notes: string | null;
  is_active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Customer[];
}

export interface CustomerListParams {
  search?: string;
  page?: number;
}

export interface CustomerAllParams {
  search?: string;
}

export interface CreateCustomerPayload {
  phone: string;
  name?: string;
  email?: string;
  notes?: string;
}

export interface UpdateCustomerPayload {
  phone?: string;
  name?: string | null;
  email?: string | null;
  notes?: string | null;
}

export interface CreateVehiclePayload {
  plate_number: string;
  customer?: string | null;
  vehicle_category?: VehicleCategory | null;
  make?: string | null;
  model?: string | null;
  color?: string | null;
}

export interface UpdateVehiclePayload {
  plate_number?: string;
  customer?: string | null;
  vehicle_category?: VehicleCategory | null;
  make?: string | null;
  model?: string | null;
  color?: string | null;
}

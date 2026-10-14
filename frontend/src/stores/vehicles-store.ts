import { create } from "zustand";

import { axiosInstance } from "@/hooks/use-api";
import type {
  Vehicle,
  VehicleAllParams,
  VehicleListParams,
  VehicleListResponse,
  CreateVehiclePayload,
  UpdateVehiclePayload,
} from "@/types/customers/customer";

const buildQuery = (params: object): string => {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      qs.set(key, String(value));
    }
  }
  const str = qs.toString();
  return str ? `?${str}` : "";
};

interface VehiclesStore {
  vehiclesAll: Vehicle[];
  vehiclesAllLoading: boolean;
  vehiclesAllError: string | null;
  fetchVehiclesAll: (params?: VehicleAllParams) => Promise<void>;

  vehiclesList: VehicleListResponse | null;
  vehiclesListLoading: boolean;
  vehiclesListError: string | null;
  fetchVehiclesList: (params?: VehicleListParams) => Promise<void>;

  currentVehicle: Vehicle | null;
  currentVehicleLoading: boolean;
  currentVehicleError: string | null;
  fetchVehicleById: (id: string) => Promise<void>;

  createVehicle: (payload: CreateVehiclePayload) => Promise<Vehicle>;
  updateVehicle: (id: string, payload: UpdateVehiclePayload) => Promise<Vehicle>;
  deleteVehicle: (id: string) => Promise<void>;
}

export const useVehiclesStore = create<VehiclesStore>((set) => ({
  vehiclesAll: [],
  vehiclesAllLoading: false,
  vehiclesAllError: null,

  fetchVehiclesAll: async (params) => {
    set({ vehiclesAllLoading: true, vehiclesAllError: null });
    try {
      const query = buildQuery(params ?? {});
      const { data } = await axiosInstance.get<Vehicle[]>(`/customers/vehicles/all/${query}`);
      set({ vehiclesAll: data, vehiclesAllLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load vehicles";
      set({ vehiclesAllError: message, vehiclesAllLoading: false });
    }
  },

  vehiclesList: null,
  vehiclesListLoading: false,
  vehiclesListError: null,

  fetchVehiclesList: async (params) => {
    set({ vehiclesListLoading: true, vehiclesListError: null });
    try {
      const query = buildQuery(params ?? {});
      const { data } = await axiosInstance.get<VehicleListResponse>(`/customers/vehicles/${query}`);
      set({ vehiclesList: data, vehiclesListLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load vehicles";
      set({ vehiclesListError: message, vehiclesListLoading: false });
    }
  },

  currentVehicle: null,
  currentVehicleLoading: false,
  currentVehicleError: null,

  fetchVehicleById: async (id) => {
    set({ currentVehicleLoading: true, currentVehicleError: null });
    try {
      const { data } = await axiosInstance.get<Vehicle>(`/customers/vehicles/${id}/`);
      set({ currentVehicle: data, currentVehicleLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load vehicle";
      set({ currentVehicleError: message, currentVehicleLoading: false });
    }
  },

  createVehicle: async (payload) => {
    const { data } = await axiosInstance.post<Vehicle>("/customers/vehicles/", payload);
    return data;
  },

  updateVehicle: async (id, payload) => {
    const { data } = await axiosInstance.patch<Vehicle>(`/customers/vehicles/${id}/`, payload);
    return data;
  },

  deleteVehicle: async (id) => {
    await axiosInstance.delete(`/customers/vehicles/${id}/`);
  },
}));

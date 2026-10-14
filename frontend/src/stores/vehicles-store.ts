import { create } from "zustand";

import { axiosInstance } from "@/hooks/use-api";
import type {
  Vehicle,
  VehicleAllParams,
  VehicleListParams,
  VehicleListResponse,
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
}));

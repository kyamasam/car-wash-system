import { create } from "zustand";

import { axiosInstance } from "@/hooks/use-api";
import type {
  Service,
  ServiceAllParams,
  ServiceListParams,
  ServiceListResponse,
} from "@/types/services/service";

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

interface ServicesStore {
  servicesAll: Service[];
  servicesAllLoading: boolean;
  servicesAllError: string | null;
  fetchServicesAll: (params?: ServiceAllParams) => Promise<void>;

  servicesList: ServiceListResponse | null;
  servicesListLoading: boolean;
  servicesListError: string | null;
  fetchServicesList: (params?: ServiceListParams) => Promise<void>;
}

export const useServicesStore = create<ServicesStore>((set) => ({
  servicesAll: [],
  servicesAllLoading: false,
  servicesAllError: null,

  fetchServicesAll: async (params) => {
    set({ servicesAllLoading: true, servicesAllError: null });
    try {
      const query = buildQuery(params ?? {});
      const { data } = await axiosInstance.get<Service[]>(`/services/all/${query}`);
      set({ servicesAll: data, servicesAllLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load services";
      set({ servicesAllError: message, servicesAllLoading: false });
    }
  },

  servicesList: null,
  servicesListLoading: false,
  servicesListError: null,

  fetchServicesList: async (params) => {
    set({ servicesListLoading: true, servicesListError: null });
    try {
      const query = buildQuery(params ?? {});
      const { data } = await axiosInstance.get<ServiceListResponse>(`/services/${query}`);
      set({ servicesList: data, servicesListLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load services";
      set({ servicesListError: message, servicesListLoading: false });
    }
  },
}));

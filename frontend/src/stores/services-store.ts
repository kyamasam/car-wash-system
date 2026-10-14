import { create } from "zustand";

import { axiosInstance } from "@/hooks/use-api";
import type {
  CreateServicePayload,
  CreateServicePricePayload,
  Service,
  ServiceAllParams,
  ServiceListParams,
  ServiceListResponse,
  ServicePrice,
  UpdateServicePayload,
  UpdateServicePricePayload,
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

  createService: (payload: CreateServicePayload) => Promise<Service>;
  updateService: (id: string, payload: UpdateServicePayload) => Promise<Service>;
  deleteService: (id: string) => Promise<void>;

  createServicePrice: (payload: CreateServicePricePayload) => Promise<ServicePrice>;
  updateServicePrice: (id: string, payload: UpdateServicePricePayload) => Promise<ServicePrice>;
  deleteServicePrice: (id: string) => Promise<void>;
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

  createService: async (payload) => {
    const { data } = await axiosInstance.post<Service>("/services/", payload);
    return data;
  },

  updateService: async (id, payload) => {
    const { data } = await axiosInstance.put<Service>(`/services/${id}/`, payload);
    return data;
  },

  deleteService: async (id) => {
    await axiosInstance.delete(`/services/${id}/`);
  },

  createServicePrice: async (payload) => {
    const { data } = await axiosInstance.post<ServicePrice>("/services/prices/", payload);
    return data;
  },

  updateServicePrice: async (id, payload) => {
    const { data } = await axiosInstance.put<ServicePrice>(`/services/prices/${id}/`, payload);
    return data;
  },

  deleteServicePrice: async (id) => {
    await axiosInstance.delete(`/services/prices/${id}/`);
  },
}));

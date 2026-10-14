import { create } from "zustand";

import { axiosInstance } from "@/hooks/use-api";
import type {
  Customer,
  CustomerAllParams,
  CustomerListParams,
  CustomerListResponse,
  CreateCustomerPayload,
  UpdateCustomerPayload,
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

interface CustomersStore {
  customersAll: Customer[];
  customersAllLoading: boolean;
  customersAllError: string | null;
  fetchCustomersAll: (params?: CustomerAllParams) => Promise<void>;

  customersList: CustomerListResponse | null;
  customersListLoading: boolean;
  customersListError: string | null;
  fetchCustomersList: (params?: CustomerListParams) => Promise<void>;

  currentCustomer: Customer | null;
  currentCustomerLoading: boolean;
  currentCustomerError: string | null;
  fetchCustomerById: (id: string) => Promise<void>;

  createCustomer: (payload: CreateCustomerPayload) => Promise<Customer>;
  updateCustomer: (id: string, payload: UpdateCustomerPayload) => Promise<Customer>;
  deleteCustomer: (id: string) => Promise<void>;
}

export const useCustomersStore = create<CustomersStore>((set) => ({
  customersAll: [],
  customersAllLoading: false,
  customersAllError: null,

  fetchCustomersAll: async (params) => {
    set({ customersAllLoading: true, customersAllError: null });
    try {
      const query = buildQuery(params ?? {});
      const { data } = await axiosInstance.get<Customer[]>(`/customers/all/${query}`);
      set({ customersAll: data, customersAllLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load customers";
      set({ customersAllError: message, customersAllLoading: false });
    }
  },

  customersList: null,
  customersListLoading: false,
  customersListError: null,

  fetchCustomersList: async (params) => {
    set({ customersListLoading: true, customersListError: null });
    try {
      const query = buildQuery(params ?? {});
      const { data } = await axiosInstance.get<CustomerListResponse>(`/customers/${query}`);
      set({ customersList: data, customersListLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load customers";
      set({ customersListError: message, customersListLoading: false });
    }
  },

  currentCustomer: null,
  currentCustomerLoading: false,
  currentCustomerError: null,

  fetchCustomerById: async (id) => {
    set({ currentCustomerLoading: true, currentCustomerError: null });
    try {
      const { data } = await axiosInstance.get<Customer>(`/customers/${id}/`);
      set({ currentCustomer: data, currentCustomerLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load customer";
      set({ currentCustomerError: message, currentCustomerLoading: false });
    }
  },

  createCustomer: async (payload) => {
    const { data } = await axiosInstance.post<Customer>("/customers/", payload);
    return data;
  },

  updateCustomer: async (id, payload) => {
    const { data } = await axiosInstance.patch<Customer>(`/customers/${id}/`, payload);
    return data;
  },

  deleteCustomer: async (id) => {
    await axiosInstance.delete(`/customers/${id}/`);
  },
}));

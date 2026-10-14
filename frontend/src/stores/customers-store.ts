import { create } from "zustand";

import { axiosInstance } from "@/hooks/use-api";
import type {
  Customer,
  CustomerAllParams,
  CustomerListParams,
  CustomerListResponse,
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
}));

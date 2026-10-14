import { create } from "zustand";

import { axiosInstance } from "@/hooks/use-api";
import type {
  Worker,
  WorkerAllParams,
  WorkerListParams,
  WorkerListResponse,
  CreateWorkerPayload,
  UpdateWorkerPayload,
} from "@/types/workers/worker";

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

interface WorkersStore {
  workersAll: Worker[];
  workersAllLoading: boolean;
  workersAllError: string | null;
  fetchWorkersAll: (params?: WorkerAllParams) => Promise<void>;

  workersList: WorkerListResponse | null;
  workersListLoading: boolean;
  workersListError: string | null;
  fetchWorkersList: (params?: WorkerListParams) => Promise<void>;

  currentWorker: Worker | null;
  currentWorkerLoading: boolean;
  currentWorkerError: string | null;
  fetchWorkerById: (id: string) => Promise<void>;

  createWorker: (payload: CreateWorkerPayload) => Promise<Worker>;
  updateWorker: (id: string, payload: UpdateWorkerPayload) => Promise<Worker>;
  deleteWorker: (id: string) => Promise<void>;
}

export const useWorkersStore = create<WorkersStore>((set) => ({
  workersAll: [],
  workersAllLoading: false,
  workersAllError: null,

  fetchWorkersAll: async (params) => {
    set({ workersAllLoading: true, workersAllError: null });
    try {
      const query = buildQuery(params ?? {});
      const { data } = await axiosInstance.get<Worker[]>(`/workers/all/${query}`);
      set({ workersAll: data, workersAllLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load workers";
      set({ workersAllError: message, workersAllLoading: false });
    }
  },

  workersList: null,
  workersListLoading: false,
  workersListError: null,

  fetchWorkersList: async (params) => {
    set({ workersListLoading: true, workersListError: null });
    try {
      const query = buildQuery(params ?? {});
      const { data } = await axiosInstance.get<WorkerListResponse>(`/workers/${query}`);
      set({ workersList: data, workersListLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load workers";
      set({ workersListError: message, workersListLoading: false });
    }
  },

  currentWorker: null,
  currentWorkerLoading: false,
  currentWorkerError: null,

  fetchWorkerById: async (id) => {
    set({ currentWorkerLoading: true, currentWorkerError: null });
    try {
      const { data } = await axiosInstance.get<Worker>(`/workers/${id}/`);
      set({ currentWorker: data, currentWorkerLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load worker";
      set({ currentWorkerError: message, currentWorkerLoading: false });
    }
  },

  createWorker: async (payload) => {
    const { data } = await axiosInstance.post<Worker>("/workers/", payload);
    return data;
  },

  updateWorker: async (id, payload) => {
    const { data } = await axiosInstance.patch<Worker>(`/workers/${id}/`, payload);
    return data;
  },

  deleteWorker: async (id) => {
    await axiosInstance.delete(`/workers/${id}/`);
  },
}));

import { create } from "zustand";

import { axiosInstance } from "@/hooks/use-api";
import type {
  Worker,
  WorkerAllParams,
  WorkerListParams,
  WorkerListResponse,
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
}));

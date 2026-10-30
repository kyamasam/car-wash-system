import { create } from "zustand";

import { axiosInstance } from "@/hooks/use-api";
import type {
  CreateJobPayload,
  Job,
  JobDetail,
  JobListParams,
  JobListResponse,
  JobStatus,
} from "@/types/jobs/job";

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

// UI filter state of the jobs page, kept here so it survives navigating away and back.
export interface JobsPageFilters {
  page: number;
  status: string;
  paymentStatus: string;
  collectionMethod: string;
  category: string;
  search: string;
  showDeleted: boolean;
  datePreset: string;
  customFrom: string;
  customTo: string;
}

interface JobsStore {
  jobsPageFilters: JobsPageFilters | null;
  setJobsPageFilters: (filters: JobsPageFilters) => void;

  jobsList: JobListResponse | null;
  jobsListLoading: boolean;
  jobsListError: string | null;
  jobsListParams: JobListParams | undefined;
  fetchJobsList: (params?: JobListParams) => Promise<void>;
  refreshJobsList: () => Promise<void>;

  jobDetail: JobDetail | null;
  jobDetailLoading: boolean;
  jobDetailError: string | null;
  fetchJobDetail: (id: string) => Promise<void>;

  createJobLoading: boolean;
  createJobError: string | null;
  createJob: (payload: CreateJobPayload) => Promise<Job | null>;

  statusUpdating: Record<string, boolean>;
  updateJobStatus: (id: string, status: JobStatus) => Promise<void>;

  deleteJob: (id: string) => Promise<boolean>;
}

export const useJobsStore = create<JobsStore>((set, get) => ({
  jobsPageFilters: null,
  setJobsPageFilters: (filters) => set({ jobsPageFilters: filters }),

  jobsList: null,
  jobsListLoading: false,
  jobsListError: null,
  jobsListParams: undefined,

  fetchJobsList: async (params) => {
    set({ jobsListLoading: true, jobsListError: null, jobsListParams: params });
    try {
      const query = buildQuery(params ?? {});
      const { data } = await axiosInstance.get<JobListResponse>(`/jobs/${query}`);
      set({ jobsList: data, jobsListLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load jobs";
      set({ jobsListError: message, jobsListLoading: false });
    }
  },

  // Refetch the list with the same filters/page that produced it.
  refreshJobsList: () => get().fetchJobsList(get().jobsListParams),

  jobDetail: null,
  jobDetailLoading: false,
  jobDetailError: null,

  fetchJobDetail: async (id) => {
    set({ jobDetailLoading: true, jobDetailError: null });
    try {
      const { data } = await axiosInstance.get<JobDetail>(`/jobs/${id}/`);
      set({ jobDetail: data, jobDetailLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load job";
      set({ jobDetailError: message, jobDetailLoading: false });
    }
  },

  createJobLoading: false,
  createJobError: null,

  createJob: async (payload: CreateJobPayload) => {
    set({ createJobLoading: true, createJobError: null });
    try {
      const { data } = await axiosInstance.post<Job>("/jobs/", payload);
      set({ createJobLoading: false });
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create job";
      set({ createJobError: message, createJobLoading: false });
      return null;
    }
  },

  statusUpdating: {},

  updateJobStatus: async (id, status) => {
    set((s) => ({ statusUpdating: { ...s.statusUpdating, [id]: true } }));
    try {
      const { data } = await axiosInstance.patch<Job>(`/jobs/${id}/`, { status });
      set((s) => ({
        statusUpdating: { ...s.statusUpdating, [id]: false },
        jobsList: s.jobsList
          ? {
              ...s.jobsList,
              results: s.jobsList.results.map((j) => (j.id === id ? data : j)),
            }
          : s.jobsList,
        jobDetail: s.jobDetail?.id === id
          ? { ...s.jobDetail, status: data.status, payment_status: data.payment_status, updated_at: data.updated_at }
          : s.jobDetail,
      }));
    } catch {
      set((s) => ({ statusUpdating: { ...s.statusUpdating, [id]: false } }));
    }
  },

  deleteJob: async (id) => {
    try {
      await axiosInstance.delete(`/jobs/${id}/`);
      set((s) => ({
        jobsList: s.jobsList
          ? {
              ...s.jobsList,
              count: Math.max(0, s.jobsList.count - 1),
              results: s.jobsList.results.filter((j) => j.id !== id),
            }
          : s.jobsList,
        jobDetail: s.jobDetail?.id === id ? null : s.jobDetail,
      }));
      return true;
    } catch {
      return false;
    }
  },
}));

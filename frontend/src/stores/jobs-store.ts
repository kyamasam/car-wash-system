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

interface JobsStore {
  jobsList: JobListResponse | null;
  jobsListLoading: boolean;
  jobsListError: string | null;
  fetchJobsList: (params?: JobListParams) => Promise<void>;

  jobDetail: JobDetail | null;
  jobDetailLoading: boolean;
  jobDetailError: string | null;
  fetchJobDetail: (id: string) => Promise<void>;

  createJobLoading: boolean;
  createJobError: string | null;
  createJob: (payload: CreateJobPayload) => Promise<Job | null>;

  statusUpdating: Record<string, boolean>;
  updateJobStatus: (id: string, status: JobStatus) => Promise<void>;
}

export const useJobsStore = create<JobsStore>((set) => ({
  jobsList: null,
  jobsListLoading: false,
  jobsListError: null,

  fetchJobsList: async (params) => {
    set({ jobsListLoading: true, jobsListError: null });
    try {
      const query = buildQuery(params ?? {});
      const { data } = await axiosInstance.get<JobListResponse>(`/jobs/${query}`);
      set({ jobsList: data, jobsListLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load jobs";
      set({ jobsListError: message, jobsListLoading: false });
    }
  },

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
}));

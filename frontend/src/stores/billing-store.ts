import { create } from "zustand";

import { axiosInstance } from "@/hooks/use-api";
import type {
  CreatePaymentPayload,
  Payment,
  PaymentListParams,
  PaymentListResponse,
} from "@/types/billing/payment";
import type {
  CommissionEntryListParams,
  CommissionEntryListResponse,
} from "@/types/billing/commission";
import type {
  CreateExpensePayload,
  Expense,
  ExpenseListParams,
  ExpenseListResponse,
} from "@/types/billing/expense";

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

interface BillingStore {
  paymentsList: PaymentListResponse | null;
  paymentsListLoading: boolean;
  paymentsListError: string | null;
  fetchPayments: (params?: PaymentListParams) => Promise<void>;

  createPaymentLoading: boolean;
  createPaymentError: string | null;
  createPayment: (payload: CreatePaymentPayload) => Promise<Payment | null>;

  commissionEntriesList: CommissionEntryListResponse | null;
  commissionEntriesListLoading: boolean;
  commissionEntriesListError: string | null;
  fetchCommissionEntries: (params?: CommissionEntryListParams) => Promise<void>;

  bulkMarkPaidLoading: boolean;
  bulkMarkPaidError: string | null;
  bulkMarkPaid: (ids: string[], paidAt?: string) => Promise<boolean>;

  expensesList: ExpenseListResponse | null;
  expensesListLoading: boolean;
  expensesListError: string | null;
  fetchExpenses: (params?: ExpenseListParams) => Promise<void>;

  createExpenseLoading: boolean;
  createExpenseError: string | null;
  createExpense: (payload: CreateExpensePayload) => Promise<Expense | null>;
}

export const useBillingStore = create<BillingStore>((set) => ({
  paymentsList: null,
  paymentsListLoading: false,
  paymentsListError: null,

  fetchPayments: async (params) => {
    set({ paymentsListLoading: true, paymentsListError: null });
    try {
      const query = buildQuery(params ?? {});
      const { data } = await axiosInstance.get<PaymentListResponse>(`/billing/payments/${query}`);
      set({ paymentsList: data, paymentsListLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load payments";
      set({ paymentsListError: message, paymentsListLoading: false });
    }
  },

  createPaymentLoading: false,
  createPaymentError: null,

  createPayment: async (payload) => {
    set({ createPaymentLoading: true, createPaymentError: null });
    try {
      const { data } = await axiosInstance.post<Payment>("/billing/payments/", payload);
      set({ createPaymentLoading: false });
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to record payment";
      set({ createPaymentError: message, createPaymentLoading: false });
      return null;
    }
  },

  commissionEntriesList: null,
  commissionEntriesListLoading: false,
  commissionEntriesListError: null,

  fetchCommissionEntries: async (params) => {
    set({ commissionEntriesListLoading: true, commissionEntriesListError: null });
    try {
      const query = buildQuery(params ?? {});
      const { data } = await axiosInstance.get<CommissionEntryListResponse>(`/billing/commission-entries/${query}`);
      set({ commissionEntriesList: data, commissionEntriesListLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load commission entries";
      set({ commissionEntriesListError: message, commissionEntriesListLoading: false });
    }
  },

  bulkMarkPaidLoading: false,
  bulkMarkPaidError: null,

  bulkMarkPaid: async (ids, paidAt) => {
    set({ bulkMarkPaidLoading: true, bulkMarkPaidError: null });
    try {
      await axiosInstance.post("/billing/commission-entries/bulk_mark_paid/", {
        ids,
        ...(paidAt ? { paid_at: paidAt } : {}),
      });
      set({ bulkMarkPaidLoading: false });
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to mark commissions as paid";
      set({ bulkMarkPaidError: message, bulkMarkPaidLoading: false });
      return false;
    }
  },

  expensesList: null,
  expensesListLoading: false,
  expensesListError: null,

  fetchExpenses: async (params) => {
    set({ expensesListLoading: true, expensesListError: null });
    try {
      const query = buildQuery(params ?? {});
      const { data } = await axiosInstance.get<ExpenseListResponse>(`/billing/expenses/${query}`);
      set({ expensesList: data, expensesListLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load expenses";
      set({ expensesListError: message, expensesListLoading: false });
    }
  },

  createExpenseLoading: false,
  createExpenseError: null,

  createExpense: async (payload) => {
    set({ createExpenseLoading: true, createExpenseError: null });
    try {
      let body: CreateExpensePayload | FormData = payload;
      if (payload.receipt) {
        const form = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (value !== undefined && value !== null) form.append(key, value);
        });
        body = form;
      }
      const { data } = await axiosInstance.post<Expense>("/billing/expenses/", body);
      set({ createExpenseLoading: false });
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to record expense";
      set({ createExpenseError: message, createExpenseLoading: false });
      return null;
    }
  },
}));

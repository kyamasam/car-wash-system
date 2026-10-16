import type { PaymentMethod } from "@/types/billing/payment";

export interface ExpenseCategory {
  id: string;
  name: string;
  business: string;
  is_active: boolean;
  created_at: string;
}

export interface Expense {
  id: string;
  name: string | null;
  category: string | null;
  category_detail: ExpenseCategory | null;
  description: string | null;
  amount: string;
  method: PaymentMethod;
  transaction_code: string | null;
  receipt: string | null;
  incurred_on: string;
  branch: string;
  recorded_by: string | null;
  created_at: string;
}

export interface ExpenseListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Expense[];
}

export interface ExpenseListParams {
  page?: number;
}

export interface CreateExpensePayload {
  name?: string;
  category?: string;
  description?: string;
  amount: string;
  method: PaymentMethod;
  transaction_code?: string;
  receipt?: File;
  incurred_on: string;
  branch: string;
  recorded_by?: string;
}

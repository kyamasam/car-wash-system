export type PaymentMethod = "cash" | "mpesa" | "card" | "bank_transfer";
export type PaymentType = "payment" | "deposit" | "refund";

export interface Payment {
  id: string;
  type: PaymentType;
  method: PaymentMethod;
  amount: string;
  transaction_code: string | null;
  payer_phone: string | null;
  paid_at: string;
  notes: string | null;
  job: string;
  branch: string;
  received_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Payment[];
}

export interface PaymentListParams {
  page?: number;
  search?: string;
  method?: PaymentMethod | "";
  type?: PaymentType | "";
  paid_at_after?: string;
  paid_at_before?: string;
  job?: string;
}

export interface CreatePaymentPayload {
  type: PaymentType;
  method: PaymentMethod;
  amount: string;
  transaction_code?: string;
  payer_phone?: string;
  paid_at: string;
  notes?: string;
  job: string;
  branch: string;
  received_by?: string;
}

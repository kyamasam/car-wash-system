export type BillingPeriod = "daily" | "weekly" | "monthly" | "yearly";
export type SubscriptionStatusValue = "active" | "expired";
export type SubscriptionPaymentStatus = "pending" | "succeeded" | "failed";
export type SubscriptionPaymentMethod = "mpesa" | "card" | "bank_transfer" | "manual";

export type FeatureCode =
  | "jobs"
  | "customers"
  | "workers"
  | "commissions"
  | "expenses"
  | "reports"
  | "multi_branch";

export const BILLING_PERIODS: BillingPeriod[] = ["daily", "weekly", "monthly", "yearly"];

export const BILLING_PERIOD_DAYS: Record<BillingPeriod, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
  yearly: 365,
};

export const PERIOD_LABELS: Record<BillingPeriod, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

export const FEATURE_LABELS: Record<FeatureCode, string> = {
  jobs: "Job management",
  customers: "Customers & vehicles",
  workers: "Workers",
  commissions: "Commissions",
  expenses: "Expenses",
  reports: "Reports",
  multi_branch: "Multiple branches",
};

export interface PackageSummary {
  id: string;
  name: string;
  code: string;
  features: string[]; // FeatureCode values; ignore unknown ones
}

export interface Package extends PackageSummary {
  description: string;
  daily_price: string | null; // decimal string; null = not offered
  weekly_price: string | null;
  monthly_price: string | null;
  yearly_price: string | null;
  currency: string;
  is_default: boolean;
  sort_order: number;
}

export const PERIOD_PRICE_FIELD: Record<BillingPeriod, keyof Package> = {
  daily: "daily_price",
  weekly: "weekly_price",
  monthly: "monthly_price",
  yearly: "yearly_price",
};

export interface SubscriptionStatus {
  status: SubscriptionStatusValue;
  expires_at: string | null;
  is_trial: boolean;
  days_remaining: number;
  package: PackageSummary | null;
}

export interface SubscriptionPayment {
  id: string;
  business: string;
  package: string;
  package_detail: PackageSummary;
  period: BillingPeriod;
  days: number;
  amount: string; // decimal string
  currency: string;
  payment_method: SubscriptionPaymentMethod;
  phone: string | null;
  status: SubscriptionPaymentStatus;
  receipt_number: string | null;
  failure_reason: string | null;
  initiated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPeriod {
  id: string;
  business: string;
  package: string;
  package_detail: PackageSummary;
  is_trial: boolean;
  period: BillingPeriod | null;
  starts_at: string;
  ends_at: string;
  payment: string | null;
  created_at: string;
}

export interface InitiatePaymentBody {
  package_id: string;
  period: BillingPeriod;
  payment_method?: SubscriptionPaymentMethod;
  phone?: string;
}

export interface ConfirmPaymentResponse {
  payment: SubscriptionPayment;
  subscription: SubscriptionStatus;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export function getPeriodPrice(pkg: Package, period: BillingPeriod): string | null {
  return pkg[PERIOD_PRICE_FIELD[period]] as string | null;
}

export function getOfferedPeriods(pkg: Package): BillingPeriod[] {
  return BILLING_PERIODS.filter((p) => getPeriodPrice(pkg, p) !== null);
}

export function formatPrice(amount: string | number, currency = "KES"): string {
  return `${currency} ${Number(amount).toLocaleString("en-KE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export interface RevenueTimeSeriesItem {
  period: string;
  total: string;
  count: number;
}

export interface RevenueMethodBreakdown {
  method: "cash" | "mpesa" | "card" | "bank_transfer";
  total: string;
  count: number;
  percentage: number;
}

export interface RevenueReport {
  start_date: string;
  end_date: string;
  granularity: string;
  gross_revenue: string;
  refunds_total: string;
  net_revenue: string;
  total_jobs: number;
  time_series: RevenueTimeSeriesItem[];
  method_breakdown: RevenueMethodBreakdown[];
}

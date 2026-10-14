export interface ProfitTimeSeriesItem {
  period: string;
  revenue: string;
  expenses: string;
  profit: string;
}

export interface ProfitReport {
  start_date: string;
  end_date: string;
  granularity: string;
  gross_revenue: string;
  refunds_total: string;
  net_revenue: string;
  total_expenses: string;
  net_profit: string;
  time_series: ProfitTimeSeriesItem[];
}

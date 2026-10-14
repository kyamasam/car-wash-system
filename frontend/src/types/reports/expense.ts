export interface ExpenseCategoryItem {
  category: string;
  total: string;
  count: number;
  percentage: number;
}

export interface ExpenseTimeSeriesItem {
  period: string;
  total: string;
  count: number;
}

export interface ExpenseReport {
  start_date: string;
  end_date: string;
  granularity: string;
  total_expenses: string;
  by_category: ExpenseCategoryItem[];
  time_series: ExpenseTimeSeriesItem[];
}

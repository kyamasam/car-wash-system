export interface ServicePopularityItem {
  service_id: string;
  service_name: string;
  service_category: string;
  total_count: number;
  total_quantity: string;
  total_revenue: string;
  revenue_share_percent: number;
}

export interface ServicePopularityReport {
  start_date: string;
  end_date: string;
  total_revenue: string;
  services: ServicePopularityItem[];
}

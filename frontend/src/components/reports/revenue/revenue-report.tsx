"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRevenueReport } from "@/hooks/reports/use-revenue-report";
import type { ReportFilters } from "@/types/reports/filters";
import { RevenueTimeSeriesChart } from "./revenue-time-series-chart";
import { RevenueMethodChart } from "./revenue-method-chart";

function fmt(v: string | number) {
  return `KES ${Number(v).toLocaleString("en-KE", { maximumFractionDigits: 2 })}`;
}

interface Props {
  filters: ReportFilters;
}

export function RevenueReport({ filters }: Props) {
  const { data, isLoading } = useRevenueReport(filters);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Gross Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black">{fmt(data.gross_revenue)}</p>
            <p className="text-xs text-muted-foreground mt-1">{data.total_jobs} jobs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Net Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black">{fmt(data.net_revenue)}</p>
            <p className="text-xs text-muted-foreground mt-1">After refunds</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Refunds</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black">{fmt(data.refunds_total)}</p>
            <p className="text-xs text-muted-foreground mt-1">Total refunded</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RevenueTimeSeriesChart data={data.time_series} granularity={data.granularity} />
        </div>
        <div>
          <RevenueMethodChart data={data.method_breakdown} />
        </div>
      </div>
    </div>
  );
}

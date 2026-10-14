"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfitReport } from "@/hooks/reports/use-profit-report";
import type { ReportFilters } from "@/types/reports/filters";
import { ProfitTimeSeriesChart } from "./profit-time-series-chart";

function fmt(v: string | number) {
  return `KES ${Number(v).toLocaleString("en-KE", { maximumFractionDigits: 2 })}`;
}

interface Props {
  filters: ReportFilters;
}

export function ProfitReport({ filters }: Props) {
  const { data, isLoading } = useProfitReport(filters);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!data) return null;

  const profitPositive = Number(data.net_profit) >= 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black">{fmt(data.total_expenses)}</p>
            <p className="text-xs text-muted-foreground mt-1">All recorded expenses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-black ${profitPositive ? "text-green-600" : "text-red-500"}`}>
              {fmt(data.net_profit)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{profitPositive ? "Profitable" : "Loss"}</p>
          </CardContent>
        </Card>
      </div>

      <ProfitTimeSeriesChart data={data.time_series} granularity={data.granularity} />
    </div>
  );
}

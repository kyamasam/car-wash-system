"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useServicePopularityReport } from "@/hooks/reports/use-service-popularity-report";
import type { ReportFilters } from "@/types/reports/filters";

function fmt(v: string | number) {
  return `KES ${Number(v).toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;
}

interface Props {
  filters: ReportFilters;
}

export function ServicePopularityReport({ filters }: Props) {
  const { data, isLoading } = useServicePopularityReport(filters);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-52" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!data) return null;

  const top10 = data.services.slice(0, 10);
  const chartData = top10.map((s) => ({
    name: s.service_name.length > 20 ? s.service_name.slice(0, 18) + "…" : s.service_name,
    revenue: Number(s.total_revenue),
  }));

  return (
    <div className="space-y-4">
      {chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Top 10 Services by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 16, left: 110, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={110} />
                <Tooltip
                  formatter={(v) => [`KES ${Number(v).toLocaleString()}`, "Revenue"]}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Bar dataKey="revenue" name="Revenue" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">All Services</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Count</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.services.map((s) => (
                <TableRow key={s.service_id}>
                  <TableCell className="font-medium">{s.service_name}</TableCell>
                  <TableCell className="capitalize text-muted-foreground">{s.service_category}</TableCell>
                  <TableCell className="text-right">{s.total_count}</TableCell>
                  <TableCell className="text-right">{fmt(s.total_revenue)}</TableCell>
                  <TableCell className="text-right">{s.revenue_share_percent.toFixed(1)}%</TableCell>
                </TableRow>
              ))}
              {data.services.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No services data for this period.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

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
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useJobsSummaryReport } from "@/hooks/reports/use-jobs-summary-report";
import type { ReportFilters } from "@/types/reports/filters";

const STATUS_LABELS: Record<string, string> = {
  queued: "Queued",
  in_progress: "In Progress",
  completed: "Completed",
  ready_for_collection: "Ready",
  collected: "Collected",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  queued: "#94a3b8",
  in_progress: "#f59e0b",
  completed: "#6366f1",
  ready_for_collection: "#3b82f6",
  collected: "#22c55e",
  cancelled: "#ef4444",
};

interface Props {
  filters: ReportFilters;
}

export function JobsSummaryReport({ filters }: Props) {
  const { data, isLoading } = useJobsSummaryReport(filters);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!data) return null;

  const chartData = data.status_breakdown
    .filter((s) => s.count > 0)
    .map((s) => ({
      status: STATUS_LABELS[s.status] ?? s.status,
      count: s.count,
      fill: STATUS_COLORS[s.status] ?? "#6366f1",
    }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Total Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black">{data.total_jobs}</p>
            <p className="text-xs text-muted-foreground mt-1">In selected period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Avg Turnaround</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black">
              {data.avg_turnaround_minutes != null
                ? `${Math.round(data.avg_turnaround_minutes)} min`
                : "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Start to completion</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Jobs by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 16, left: 80, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
              <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="status" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={80} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="count" name="Jobs" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {data.per_worker.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Jobs per Worker</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Worker</TableHead>
                  <TableHead className="text-right">Jobs</TableHead>
                  <TableHead className="text-right">Avg Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.per_worker.map((w) => (
                  <TableRow key={w.worker_id}>
                    <TableCell className="font-medium">{w.worker_name}</TableCell>
                    <TableCell className="text-right">{w.job_count}</TableCell>
                    <TableCell className="text-right">
                      {w.avg_turnaround_minutes != null
                        ? `${Math.round(w.avg_turnaround_minutes)} min`
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

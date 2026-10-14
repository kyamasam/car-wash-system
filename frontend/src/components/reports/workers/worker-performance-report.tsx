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
import { useWorkerPerformanceReport } from "@/hooks/reports/use-worker-performance-report";
import type { ReportFilters } from "@/types/reports/filters";

function fmt(v: string | number) {
  return `KES ${Number(v).toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;
}

interface Props {
  filters: ReportFilters;
}

export function WorkerPerformanceReport({ filters }: Props) {
  const { data, isLoading } = useWorkerPerformanceReport(filters);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-52" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!data) return null;

  const topWorkers = data.workers.slice(0, 10);
  const chartData = topWorkers.map((w) => ({
    name: w.worker_name.split(" ")[0],
    jobs: w.jobs_completed,
  }));

  return (
    <div className="space-y-4">
      {chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Top Workers by Jobs Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="jobs" name="Jobs" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Worker Details</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Worker</TableHead>
                <TableHead className="text-right">Jobs</TableHead>
                <TableHead className="text-right">Earned</TableHead>
                <TableHead className="text-right">Pending</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Avg Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.workers.map((w) => (
                <TableRow key={w.worker_id}>
                  <TableCell className="font-medium">{w.worker_name}</TableCell>
                  <TableCell className="text-right">{w.jobs_completed}</TableCell>
                  <TableCell className="text-right">{fmt(w.commission_earned)}</TableCell>
                  <TableCell className="text-right">{fmt(w.commission_pending)}</TableCell>
                  <TableCell className="text-right">{fmt(w.commission_paid)}</TableCell>
                  <TableCell className="text-right">
                    {w.avg_turnaround_minutes != null ? `${Math.round(w.avg_turnaround_minutes)} min` : "—"}
                  </TableCell>
                </TableRow>
              ))}
              {data.workers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No worker data for this period.
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

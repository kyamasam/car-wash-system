"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useExpenseReport } from "@/hooks/reports/use-expense-report";
import type { ReportFilters } from "@/types/reports/filters";

const COLORS = ["#ef4444", "#f97316", "#f59e0b", "#84cc16", "#06b6d4", "#8b5cf6"];

function fmt(v: string | number) {
  return `KES ${Number(v).toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;
}

function formatPeriod(period: string, granularity: string) {
  const d = new Date(period + "T00:00:00");
  if (granularity === "month") return d.toLocaleDateString("en-KE", { month: "short", year: "numeric" });
  if (granularity === "week") return `W/e ${d.toLocaleDateString("en-KE", { day: "numeric", month: "short" })}`;
  return d.toLocaleDateString("en-KE", { day: "numeric", month: "short" });
}

interface Props {
  filters: ReportFilters;
}

export function ExpenseReport({ filters }: Props) {
  const { data, isLoading } = useExpenseReport(filters);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const pieData = data.by_category.map((c) => ({
    name: c.category,
    value: Number(c.total),
  }));

  const timeData = data.time_series.map((row) => ({
    period: formatPeriod(row.period, data.granularity),
    total: Number(row.total),
  }));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Total Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-black">{fmt(data.total_expenses)}</p>
          <p className="text-xs text-muted-foreground mt-1">In selected period</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">By Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => [`KES ${Number(v).toLocaleString()}`, "Expenses"]}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={timeData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(v) => [`KES ${Number(v).toLocaleString()}`, "Expenses"]}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Bar dataKey="total" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

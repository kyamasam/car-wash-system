"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { ProfitTimeSeriesItem } from "@/types/reports/profit";

interface Props {
  data: ProfitTimeSeriesItem[];
  granularity: string;
}

function formatPeriod(period: string, granularity: string) {
  const d = new Date(period + "T00:00:00");
  if (granularity === "month") return d.toLocaleDateString("en-KE", { month: "short", year: "numeric" });
  if (granularity === "week") return `W/e ${d.toLocaleDateString("en-KE", { day: "numeric", month: "short" })}`;
  return d.toLocaleDateString("en-KE", { day: "numeric", month: "short" });
}

export function ProfitTimeSeriesChart({ data, granularity }: Props) {
  const chartData = data.map((row) => ({
    period: formatPeriod(row.period, granularity),
    Revenue: Number(row.revenue),
    Expenses: Number(row.expenses),
    Profit: Number(row.profit),
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Revenue vs Expenses vs Profit</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="period" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(v, name) => [`KES ${Number(v).toLocaleString()}`, name]}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="Revenue" stroke="#6366f1" strokeWidth={2} fill="url(#revGrad)" />
            <Area type="monotone" dataKey="Expenses" stroke="#ef4444" strokeWidth={2} fill="url(#expGrad)" />
            <Area type="monotone" dataKey="Profit" stroke="#22c55e" strokeWidth={2} fill="url(#profGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { RevenueTimeSeriesItem } from "@/types/reports/revenue";

interface Props {
  data: RevenueTimeSeriesItem[];
  granularity: string;
}

function formatPeriod(period: string, granularity: string) {
  const d = new Date(period + "T00:00:00");
  if (granularity === "month") return d.toLocaleDateString("en-KE", { month: "short", year: "numeric" });
  if (granularity === "week") return `W/e ${d.toLocaleDateString("en-KE", { day: "numeric", month: "short" })}`;
  return d.toLocaleDateString("en-KE", { day: "numeric", month: "short" });
}

export function RevenueTimeSeriesChart({ data, granularity }: Props) {
  const chartData = data.map((row) => ({
    period: formatPeriod(row.period, granularity),
    total: Number(row.total),
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Revenue Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
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
              formatter={(v) => [`KES ${Number(v).toLocaleString()}`, "Revenue"]}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#revenueGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

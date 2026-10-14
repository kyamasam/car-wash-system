"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { RevenueMethodBreakdown } from "@/types/reports/revenue";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#3b82f6"];

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  mpesa: "M-Pesa",
  card: "Card",
  bank_transfer: "Bank Transfer",
};

interface Props {
  data: RevenueMethodBreakdown[];
}

export function RevenueMethodChart({ data }: Props) {
  const chartData = data
    .filter((d) => Number(d.total) > 0)
    .map((d) => ({
      name: METHOD_LABELS[d.method] ?? d.method,
      value: Number(d.total),
    }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">By Payment Method</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => [`KES ${Number(v).toLocaleString()}`, "Revenue"]}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

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
import { useCommissionSummaryReport } from "@/hooks/reports/use-commission-summary-report";
import type { ReportFilters } from "@/types/reports/filters";

function fmt(v: string | number) {
  return `KES ${Number(v).toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;
}

interface Props {
  filters: ReportFilters;
}

export function CommissionSummaryReport({ filters }: Props) {
  const { data, isLoading } = useCommissionSummaryReport(filters);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Total Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-amber-500">{fmt(data.total_pending)}</p>
            <p className="text-xs text-muted-foreground mt-1">Awaiting payout</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-green-600">{fmt(data.total_paid)}</p>
            <p className="text-xs text-muted-foreground mt-1">Already disbursed</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Commission by Worker</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Worker</TableHead>
                <TableHead className="text-right">Pending</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Void</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.per_worker.map((w) => (
                <TableRow key={w.worker_id}>
                  <TableCell className="font-medium">{w.worker_name}</TableCell>
                  <TableCell className="text-right text-amber-600">{fmt(w.pending_amount)}</TableCell>
                  <TableCell className="text-right text-green-600">{fmt(w.paid_amount)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{fmt(w.void_amount)}</TableCell>
                </TableRow>
              ))}
              {data.per_worker.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No commission data for this period.
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

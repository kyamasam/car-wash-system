"use client";

import { JobCardGrid } from "@/components/jobs/job-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useJobsSummaryReport } from "@/hooks/reports/use-jobs-summary-report";
import { useRevenueReport } from "@/hooks/reports/use-revenue-report";
import { useJobsStore } from "@/stores/jobs-store";
import { Activity, Car, CheckCircle2, Receipt, Wallet } from "lucide-react";
import type { ElementType } from "react";
import { useEffect } from "react";

function formatKes(value: number) {
  return `KES ${value.toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  loading,
}: {
  label: string;
  value: string;
  sub: string;
  icon: ElementType;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </CardTitle>
        <Icon className="w-4 h-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-9 w-16 rounded bg-muted animate-pulse mb-1" />
        ) : (
          <p className="text-3xl font-black tracking-tight">{value}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}

function ActiveJobsSkeleton() {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="h-4 w-24 rounded bg-muted animate-pulse" />
          <div className="h-4 w-32 rounded bg-muted animate-pulse" />
          <div className="h-4 w-20 rounded bg-muted animate-pulse" />
          <div className="h-8 w-full rounded bg-muted animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const today = new Date().toISOString().slice(0, 10);
  const filters = { preset: "today" as const, startDate: today, endDate: today, granularity: "day" as const };

  const { data: jobsSummary, isLoading: summaryLoading } = useJobsSummaryReport(filters);
  const { data: revenue, isLoading: revenueLoading } = useRevenueReport(filters);

  const { jobsList, jobsListLoading, fetchJobsList } = useJobsStore();

  useEffect(() => {
    fetchJobsList({ status: "in_progress" });
  }, [fetchJobsList]);

  const totalJobs = summaryLoading ? undefined : String(jobsSummary?.total_jobs ?? 0);
  const activeJobs = summaryLoading
    ? undefined
    : String(jobsSummary?.status_breakdown.find((s) => s.status === "in_progress")?.count ?? 0);
  const completedToday = summaryLoading
    ? undefined
    : String(
      jobsSummary?.status_breakdown
        .filter((s) => ["completed", "ready_for_collection", "collected"].includes(s.status))
        .reduce((sum, s) => sum + s.count, 0) ?? 0
    );
  const revenueToday = revenueLoading
    ? undefined
    : revenue
      ? formatKes(parseFloat(revenue.net_revenue))
      : "KES 0";
  const expensesToday = revenueLoading
    ? undefined
    : revenue
      ? formatKes(parseFloat(revenue.total_expenses))
      : "KES 0";
  const profitToday = revenueLoading
    ? undefined
    : revenue
      ? formatKes(parseFloat(revenue.profit))
      : "KES 0";

  const activeJobsList = jobsList?.results ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your car wash operations at a glance.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">

        <StatCard
          label="Active Jobs"
          value={activeJobs ?? "—"}
          sub="Currently in progress"
          icon={Activity}
          loading={summaryLoading}
        />
        <StatCard
          label="Completed Today"
          value={completedToday ?? "—"}
          sub="Ready or collected"
          icon={CheckCircle2}
          loading={summaryLoading}
        />
        <StatCard
          label="Revenue Today"
          value={revenueToday ?? "—"}
          sub="Payments received today"
          icon={Wallet}
          loading={revenueLoading}
        />
        <StatCard
          label="Expenses Today"
          value={expensesToday ?? "—"}
          sub="Expenses recorded today"
          icon={Receipt}
          loading={revenueLoading}
        />
        <StatCard
          label="Profit Today"
          value={profitToday ?? "—"}
          sub="Profit (Revenue - Commissions - expenses)"
          icon={Car}
          loading={revenueLoading}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">Active Jobs</h2>
          {!jobsListLoading && (
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              {activeJobsList.length}
            </span>
          )}
        </div>

        {jobsListLoading ? (
          <ActiveJobsSkeleton />
        ) : activeJobsList.length > 0 ? (
          <JobCardGrid jobs={activeJobsList} />
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-3">
              <Activity className="w-8 h-8 text-muted-foreground/30" />
              <div>
                <p className="text-sm font-medium">No active jobs right now</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Jobs will appear here once they are started.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

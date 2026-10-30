"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportsFilterBar } from "@/components/reports/reports-filter-bar";
import { RevenueReport } from "@/components/reports/revenue/revenue-report";
import { ProfitReport } from "@/components/reports/profit/profit-report";
import { JobsSummaryReport } from "@/components/reports/jobs/jobs-summary-report";
import { WorkerPerformanceReport } from "@/components/reports/workers/worker-performance-report";
import { ServicePopularityReport } from "@/components/reports/services/service-popularity-report";
import { ExpenseReport } from "@/components/reports/expenses/expense-report";
import { CommissionSummaryReport } from "@/components/reports/commissions/commission-summary-report";
import { defaultFilters, type ReportFilters } from "@/types/reports/filters";
import { PageHeader } from "@/components/layout/page-header";

const GRANULARITY_TABS = new Set(["revenue", "profit", "expenses"]);

const REPORT_TABS = [
  { value: "revenue", label: "Revenue" },
  { value: "profit", label: "Profit" },
  { value: "jobs", label: "Jobs" },
  { value: "workers", label: "Workers" },
  { value: "services", label: "Services" },
  { value: "expenses", label: "Expenses" },
  { value: "commissions", label: "Commissions" },
];

export default function ReportsPage() {
  const [filters, setFilters] = useState<ReportFilters>(defaultFilters);
  const [activeTab, setActiveTab] = useState("revenue");

  return (
    <div className="space-y-4">
      <PageHeader title="Reports" />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col gap-3">
          <TabsList className="w-full sm:w-fit bg-transparent p-0 flex-wrap justify-start gap-1 group-data-[orientation=horizontal]/tabs:h-auto">
            {REPORT_TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="flex-auto sm:flex-none h-8 data-[state=inactive]:border-foreground/15 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:bg-primary dark:data-[state=active]:text-primary-foreground dark:data-[state=active]:border-transparent">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <ReportsFilterBar
            value={filters}
            onChange={setFilters}
            showGranularity={GRANULARITY_TABS.has(activeTab)}
          />
        </div>

        <TabsContent value="revenue" className="mt-4">
          <RevenueReport filters={filters} />
        </TabsContent>

        <TabsContent value="profit" className="mt-4">
          <ProfitReport filters={filters} />
        </TabsContent>

        <TabsContent value="jobs" className="mt-4">
          <JobsSummaryReport filters={filters} />
        </TabsContent>

        <TabsContent value="workers" className="mt-4">
          <WorkerPerformanceReport filters={filters} />
        </TabsContent>

        <TabsContent value="services" className="mt-4">
          <ServicePopularityReport filters={filters} />
        </TabsContent>

        <TabsContent value="expenses" className="mt-4">
          <ExpenseReport filters={filters} />
        </TabsContent>

        <TabsContent value="commissions" className="mt-4">
          <CommissionSummaryReport filters={filters} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

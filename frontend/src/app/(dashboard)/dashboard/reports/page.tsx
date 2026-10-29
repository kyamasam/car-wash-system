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

export default function ReportsPage() {
  const [filters, setFilters] = useState<ReportFilters>(defaultFilters);
  const [activeTab, setActiveTab] = useState("revenue");

  return (
    <div className="space-y-4">
      <PageHeader title="Reports" />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col gap-3">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="profit">Profit</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
            <TabsTrigger value="workers">Workers</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="commissions">Commissions</TabsTrigger>
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

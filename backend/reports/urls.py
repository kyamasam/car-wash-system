from django.urls import path
from reports.views import (
    RevenueReportView,
    ProfitReportView,
    JobsSummaryReportView,
    WorkerPerformanceReportView,
    ServicePopularityReportView,
    ExpenseReportView,
    CommissionSummaryReportView,
)

url_patterns = [
    path("revenue/", RevenueReportView.as_view(), name="report-revenue"),
    path("profit/", ProfitReportView.as_view(), name="report-profit"),
    path("jobs-summary/", JobsSummaryReportView.as_view(), name="report-jobs-summary"),
    path("worker-performance/", WorkerPerformanceReportView.as_view(), name="report-worker-performance"),
    path("service-popularity/", ServicePopularityReportView.as_view(), name="report-service-popularity"),
    path("expenses/", ExpenseReportView.as_view(), name="report-expenses"),
    path("commission-summary/", CommissionSummaryReportView.as_view(), name="report-commission-summary"),
]

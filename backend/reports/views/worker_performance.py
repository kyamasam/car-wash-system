from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiParameter

from reports.views._mixins import ReportFilterMixin
from reports.services.worker_performance import get_worker_performance_report
from reports.serializers.worker_performance import WorkerPerformanceReportSerializer


@extend_schema(
    tags=["reports"],
    parameters=[
        OpenApiParameter("start_date", str, description="ISO date (default: start of current month)"),
        OpenApiParameter("end_date", str, description="ISO date (default: today)"),
        OpenApiParameter("branch", str, description="Branch UUID (optional)"),
        OpenApiParameter("worker", str, description="Worker UUID (optional, filter to one worker)"),
    ],
    responses={200: WorkerPerformanceReportSerializer},
)
class WorkerPerformanceReportView(ReportFilterMixin, APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        f = self.get_report_filters()
        data = get_worker_performance_report(
            request.user, f["start_date"], f["end_date"], f["branch_id"], f["worker_id"]
        )
        return Response(WorkerPerformanceReportSerializer(data).data)

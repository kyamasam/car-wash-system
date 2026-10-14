from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiParameter

from reports.views._mixins import ReportFilterMixin
from reports.services.jobs_summary import get_jobs_summary_report
from reports.serializers.jobs_summary import JobsSummaryReportSerializer


@extend_schema(
    tags=["reports"],
    parameters=[
        OpenApiParameter("start_date", str, description="ISO date (default: start of current month)"),
        OpenApiParameter("end_date", str, description="ISO date (default: today)"),
        OpenApiParameter("branch", str, description="Branch UUID (optional)"),
    ],
    responses={200: JobsSummaryReportSerializer},
)
class JobsSummaryReportView(ReportFilterMixin, APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        f = self.get_report_filters()
        data = get_jobs_summary_report(
            request.user, f["start_date"], f["end_date"], f["branch_id"]
        )
        return Response(JobsSummaryReportSerializer(data).data)

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiParameter

from reports.views._mixins import ReportFilterMixin
from reports.services.profit import get_profit_report
from reports.serializers.profit import ProfitReportSerializer


@extend_schema(
    tags=["reports"],
    parameters=[
        OpenApiParameter("start_date", str, description="ISO date (default: start of current month)"),
        OpenApiParameter("end_date", str, description="ISO date (default: today)"),
        OpenApiParameter("granularity", str, description="day | week | month (default: day)"),
        OpenApiParameter("branch", str, description="Branch UUID (optional)"),
    ],
    responses={200: ProfitReportSerializer},
)
class ProfitReportView(ReportFilterMixin, APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        f = self.get_report_filters()
        data = get_profit_report(
            request.user, f["start_date"], f["end_date"], f["granularity"], f["branch_id"]
        )
        return Response(ProfitReportSerializer(data).data)

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiParameter

from reports.views._mixins import ReportFilterMixin
from reports.services.service_popularity import get_service_popularity_report
from reports.serializers.service_popularity import ServicePopularityReportSerializer


@extend_schema(
    tags=["reports"],
    parameters=[
        OpenApiParameter("start_date", str, description="ISO date (default: start of current month)"),
        OpenApiParameter("end_date", str, description="ISO date (default: today)"),
        OpenApiParameter("branch", str, description="Branch UUID (optional)"),
    ],
    responses={200: ServicePopularityReportSerializer},
)
class ServicePopularityReportView(ReportFilterMixin, APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        f = self.get_report_filters()
        data = get_service_popularity_report(
            request.user, f["start_date"], f["end_date"], f["branch_id"]
        )
        return Response(ServicePopularityReportSerializer(data).data)

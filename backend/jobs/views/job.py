from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter
from rest_framework.viewsets import ModelViewSet
from drf_spectacular.utils import extend_schema_view, extend_schema

from commons.mixins import BranchScopedMixin
from jobs.filters import JobFilter
from jobs.models import Job, JobItem
from jobs.serializers import JobSerializer, JobItemSerializer, JobCreateSerializer


@extend_schema_view(
    list=extend_schema(tags=["jobs"]),
    retrieve=extend_schema(tags=["jobs"]),
    create=extend_schema(tags=["jobs"]),
    update=extend_schema(tags=["jobs"]),
    partial_update=extend_schema(tags=["jobs"]),
    destroy=extend_schema(tags=["jobs"]),
)
class JobViewSet(BranchScopedMixin, ModelViewSet):
    queryset = Job.objects.select_related("branch", "customer", "vehicle", "worker").prefetch_related("items__service", "payments", "commission_entries").order_by('-created_at').all()
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_class = JobFilter
    search_fields = ["job_number", "customer__phone", "customer__name", "vehicle__plate_number"]

    def get_serializer_class(self):
        if self.action == "create":
            return JobCreateSerializer
        return JobSerializer


@extend_schema_view(
    list=extend_schema(tags=["jobs"]),
    retrieve=extend_schema(tags=["jobs"]),
    create=extend_schema(tags=["jobs"]),
    update=extend_schema(tags=["jobs"]),
    partial_update=extend_schema(tags=["jobs"]),
    destroy=extend_schema(tags=["jobs"]),
)
class JobItemViewSet(BranchScopedMixin, ModelViewSet):
    branch_lookup_field = "job__branch"
    queryset = JobItem.objects.select_related("job", "service").all()
    serializer_class = JobItemSerializer

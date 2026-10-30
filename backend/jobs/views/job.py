from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter
from rest_framework.viewsets import ModelViewSet
from drf_spectacular.utils import extend_schema_view, extend_schema

from commons.mixins import BranchScopedMixin
from jobs.filters import JobFilter
from jobs.models import Job, JobItem
from jobs.permissions import CanDeleteJob, can_manage_deleted_jobs
from jobs.services.job_deletion import soft_delete_job
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
    queryset = Job.objects.select_related("branch", "customer", "vehicle", "worker", "deleted_by").prefetch_related("items__service", "payments", "commission_entries").order_by('-created_at')
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_class = JobFilter
    search_fields = ["job_number", "customer__phone", "customer__name", "vehicle__plate_number"]

    def get_queryset(self):
        qs = super().get_queryset()
        can_view_deleted = can_manage_deleted_jobs(self.request.user)
        if self.action == "list":
            if can_view_deleted and self.request.query_params.get("deleted") in ("true", "1"):
                return qs.filter(deleted_at__isnull=False)
            return qs.filter(deleted_at__isnull=True)
        # Owners/managers can open a deleted job read-only; every write ignores deleted jobs.
        if self.action == "retrieve" and can_view_deleted:
            return qs
        return qs.filter(deleted_at__isnull=True)

    def get_permissions(self):
        permissions = super().get_permissions()
        if self.action == "destroy":
            permissions.append(CanDeleteJob())
        return permissions

    def get_serializer_class(self):
        if self.action == "create":
            return JobCreateSerializer
        return JobSerializer

    def perform_destroy(self, instance):
        soft_delete_job(instance, user=self.request.user)


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
    queryset = JobItem.objects.filter(job__deleted_at__isnull=True).select_related("job", "service")
    serializer_class = JobItemSerializer

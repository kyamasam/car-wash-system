from rest_framework.viewsets import ModelViewSet
from drf_spectacular.utils import extend_schema_view, extend_schema

from jobs.models import Job, JobItem
from jobs.serializers import JobSerializer, JobItemSerializer


@extend_schema_view(
    list=extend_schema(tags=["jobs"]),
    retrieve=extend_schema(tags=["jobs"]),
    create=extend_schema(tags=["jobs"]),
    update=extend_schema(tags=["jobs"]),
    partial_update=extend_schema(tags=["jobs"]),
    destroy=extend_schema(tags=["jobs"]),
)
class JobViewSet(ModelViewSet):
    queryset = Job.objects.select_related("branch", "customer", "vehicle", "worker").prefetch_related("items").all()
    serializer_class = JobSerializer


@extend_schema_view(
    list=extend_schema(tags=["jobs"]),
    retrieve=extend_schema(tags=["jobs"]),
    create=extend_schema(tags=["jobs"]),
    update=extend_schema(tags=["jobs"]),
    partial_update=extend_schema(tags=["jobs"]),
    destroy=extend_schema(tags=["jobs"]),
)
class JobItemViewSet(ModelViewSet):
    queryset = JobItem.objects.select_related("job", "service").all()
    serializer_class = JobItemSerializer

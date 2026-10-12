from rest_framework.viewsets import ModelViewSet
from drf_spectacular.utils import extend_schema_view, extend_schema

from workers.models import Worker
from workers.serializers import WorkerSerializer


@extend_schema_view(
    list=extend_schema(tags=["workers"]),
    retrieve=extend_schema(tags=["workers"]),
    create=extend_schema(tags=["workers"]),
    update=extend_schema(tags=["workers"]),
    partial_update=extend_schema(tags=["workers"]),
    destroy=extend_schema(tags=["workers"]),
)
class WorkerViewSet(ModelViewSet):
    queryset = Worker.objects.select_related("branch").all()
    serializer_class = WorkerSerializer

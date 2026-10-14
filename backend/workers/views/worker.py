from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from rest_framework.filters import SearchFilter
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from drf_spectacular.utils import extend_schema_view, extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from commons.mixins import BranchScopedMixin
from workers.models import Worker
from workers.serializers import WorkerSerializer


@extend_schema_view(
    list=extend_schema(tags=["workers"]),
    retrieve=extend_schema(tags=["workers"]),
    create=extend_schema(tags=["workers"]),
    update=extend_schema(tags=["workers"]),
    partial_update=extend_schema(tags=["workers"]),
    destroy=extend_schema(tags=["workers"]),
    list_all=extend_schema(tags=["workers"]),
)
class WorkerViewSet(BranchScopedMixin, ModelViewSet):
    queryset = Worker.objects.select_related("branch").all()
    serializer_class = WorkerSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = ["name", "phone"]

    @extend_schema(
        tags=["workers"],
        parameters=[
            OpenApiParameter("search", OpenApiTypes.STR, description="Search by name or phone"),
        ],
    )
    @action(detail=False, methods=["get"], url_path="all", url_name="all")
    def list_all(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

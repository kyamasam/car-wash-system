from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from rest_framework.filters import SearchFilter
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from drf_spectacular.utils import extend_schema_view, extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from commons.mixins import BranchScopedMixin
from services.models import Service, ServicePrice
from services.serializers import ServiceSerializer, ServicePriceSerializer


@extend_schema_view(
    list=extend_schema(tags=["services"]),
    retrieve=extend_schema(tags=["services"]),
    create=extend_schema(tags=["services"]),
    update=extend_schema(tags=["services"]),
    partial_update=extend_schema(tags=["services"]),
    destroy=extend_schema(tags=["services"]),
)
class ServiceViewSet(ModelViewSet):
    queryset = Service.objects.prefetch_related("prices").all()
    serializer_class = ServiceSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ["category"]
    search_fields = ["name", "code"]

    @extend_schema(
        tags=["services"],
        parameters=[
            OpenApiParameter("category", OpenApiTypes.STR, description="Filter by category (vehicle, carpet, other)"),
            OpenApiParameter("search", OpenApiTypes.STR, description="Search by name or code"),
        ],
    )
    @action(detail=False, methods=["get"], url_path="all", url_name="all")
    def list_all(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


@extend_schema_view(
    list=extend_schema(tags=["services"]),
    retrieve=extend_schema(tags=["services"]),
    create=extend_schema(tags=["services"]),
    update=extend_schema(tags=["services"]),
    partial_update=extend_schema(tags=["services"]),
    destroy=extend_schema(tags=["services"]),
)
class ServicePriceViewSet(BranchScopedMixin, ModelViewSet):
    queryset = ServicePrice.objects.select_related("service", "branch").all()
    serializer_class = ServicePriceSerializer

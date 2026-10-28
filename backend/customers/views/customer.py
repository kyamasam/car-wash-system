from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from rest_framework.filters import SearchFilter
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from drf_spectacular.utils import extend_schema_view, extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from commons.mixins import CustomerBranchScopedMixin
from customers.models import Customer, Vehicle
from customers.serializers import CustomerSerializer, VehicleSerializer


@extend_schema_view(
    list=extend_schema(tags=["customers"]),
    retrieve=extend_schema(tags=["customers"]),
    create=extend_schema(tags=["customers"]),
    update=extend_schema(tags=["customers"]),
    partial_update=extend_schema(tags=["customers"]),
    destroy=extend_schema(tags=["customers"]),
    list_all=extend_schema(tags=["customers"]),
)
class CustomerViewSet(CustomerBranchScopedMixin, ModelViewSet):
    queryset = Customer.objects.order_by("name", "phone")
    serializer_class = CustomerSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = ["name", "phone", "email"]

    def perform_create(self, serializer):
        serializer.save(branch=self.request.user.branch)

    @extend_schema(
        tags=["customers"],
        parameters=[
            OpenApiParameter("search", OpenApiTypes.STR, description="Search by name, phone, or email"),
        ],
    )
    @action(detail=False, methods=["get"], url_path="all", url_name="all")
    def list_all(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


@extend_schema_view(
    list=extend_schema(tags=["customers"]),
    retrieve=extend_schema(tags=["customers"]),
    create=extend_schema(tags=["customers"]),
    update=extend_schema(tags=["customers"]),
    partial_update=extend_schema(tags=["customers"]),
    destroy=extend_schema(tags=["customers"]),
    list_all=extend_schema(tags=["customers"]),
)
class VehicleViewSet(CustomerBranchScopedMixin, ModelViewSet):
    queryset = Vehicle.objects.select_related("customer").all()
    serializer_class = VehicleSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ["vehicle_category", "customer"]
    search_fields = ["plate_number", "make", "model", "color"]

    def perform_create(self, serializer):
        serializer.save(branch=self.request.user.branch)

    @extend_schema(
        tags=["customers"],
        parameters=[
            OpenApiParameter("search", OpenApiTypes.STR, description="Search by plate number, make, model, or color"),
            OpenApiParameter("vehicle_category", OpenApiTypes.STR, description="Filter by vehicle category"),
        ],
    )
    @action(detail=False, methods=["get"], url_path="all", url_name="all")
    def list_all(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

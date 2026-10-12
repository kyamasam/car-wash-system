from rest_framework.viewsets import ModelViewSet
from drf_spectacular.utils import extend_schema_view, extend_schema

from customers.models import Customer, Vehicle
from customers.serializers import CustomerSerializer, VehicleSerializer


@extend_schema_view(
    list=extend_schema(tags=["customers"]),
    retrieve=extend_schema(tags=["customers"]),
    create=extend_schema(tags=["customers"]),
    update=extend_schema(tags=["customers"]),
    partial_update=extend_schema(tags=["customers"]),
    destroy=extend_schema(tags=["customers"]),
)
class CustomerViewSet(ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer


@extend_schema_view(
    list=extend_schema(tags=["customers"]),
    retrieve=extend_schema(tags=["customers"]),
    create=extend_schema(tags=["customers"]),
    update=extend_schema(tags=["customers"]),
    partial_update=extend_schema(tags=["customers"]),
    destroy=extend_schema(tags=["customers"]),
)
class VehicleViewSet(ModelViewSet):
    queryset = Vehicle.objects.select_related("customer").all()
    serializer_class = VehicleSerializer

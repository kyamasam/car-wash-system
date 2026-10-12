from rest_framework.viewsets import ModelViewSet
from drf_spectacular.utils import extend_schema_view, extend_schema

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
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer


@extend_schema_view(
    list=extend_schema(tags=["services"]),
    retrieve=extend_schema(tags=["services"]),
    create=extend_schema(tags=["services"]),
    update=extend_schema(tags=["services"]),
    partial_update=extend_schema(tags=["services"]),
    destroy=extend_schema(tags=["services"]),
)
class ServicePriceViewSet(ModelViewSet):
    queryset = ServicePrice.objects.select_related("service", "branch").all()
    serializer_class = ServicePriceSerializer

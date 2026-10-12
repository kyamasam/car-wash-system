from rest_framework.viewsets import ModelViewSet
from drf_spectacular.utils import extend_schema_view, extend_schema

from commons.models import Business, Branch
from commons.serializers import BusinessSerializer, BranchSerializer


@extend_schema_view(
    list=extend_schema(tags=["commons"]),
    retrieve=extend_schema(tags=["commons"]),
    create=extend_schema(tags=["commons"]),
    update=extend_schema(tags=["commons"]),
    partial_update=extend_schema(tags=["commons"]),
    destroy=extend_schema(tags=["commons"]),
)
class BusinessViewSet(ModelViewSet):
    queryset = Business.objects.all()
    serializer_class = BusinessSerializer


@extend_schema_view(
    list=extend_schema(tags=["commons"]),
    retrieve=extend_schema(tags=["commons"]),
    create=extend_schema(tags=["commons"]),
    update=extend_schema(tags=["commons"]),
    partial_update=extend_schema(tags=["commons"]),
    destroy=extend_schema(tags=["commons"]),
)
class BranchViewSet(ModelViewSet):
    queryset = Branch.objects.select_related("business").all()
    serializer_class = BranchSerializer

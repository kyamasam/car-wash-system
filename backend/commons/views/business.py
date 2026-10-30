from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from django.db import transaction
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.filters import SearchFilter
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from drf_spectacular.utils import extend_schema_view, extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from commons.models import Business, Branch
from commons.serializers import BusinessSerializer, BranchSerializer
from users.constants import UserRole


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
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated or user.is_superuser:
            return Business.objects.all()
        return Business.objects.filter(id=user.business_id)

    def perform_create(self, serializer):
        user = self.request.user
        if user.business_id:
            raise ValidationError("You are already linked to a business.")
        with transaction.atomic():
            business = serializer.save(primary_user=user)
            user.business = business
            user.role = UserRole.OWNER
            user.save(update_fields=["business", "role"])

    @extend_schema(tags=["commons"], methods=["GET", "PATCH"])
    @action(detail=False, methods=["get", "patch"], url_path="current", url_name="current")
    def current(self, request, *args, **kwargs):
        business = getattr(request.user, "business", None)
        if business is None:
            raise NotFound("You are not linked to a business.")
        if request.method == "PATCH":
            serializer = self.get_serializer(business, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        return Response(self.get_serializer(business).data)


@extend_schema_view(
    list=extend_schema(tags=["commons"]),
    retrieve=extend_schema(tags=["commons"]),
    create=extend_schema(tags=["commons"]),
    update=extend_schema(tags=["commons"]),
    partial_update=extend_schema(tags=["commons"]),
    destroy=extend_schema(tags=["commons"]),
    list_all=extend_schema(tags=["commons"]),
)
class BranchViewSet(ModelViewSet):
    queryset = Branch.objects.select_related("business").all()
    serializer_class = BranchSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ["business", "is_active"]
    search_fields = ["name", "code", "location"]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated or user.is_superuser:
            return Branch.objects.select_related("business").all()
        if user.branch_id:
            return Branch.objects.select_related("business").filter(id=user.branch_id)
        return Branch.objects.select_related("business").filter(business=user.business_id)

    def perform_create(self, serializer):
        user = self.request.user
        if not user.is_superuser and serializer.validated_data["business"].id != user.business_id:
            raise PermissionDenied("You can only add branches to your own business.")
        serializer.save()

    @extend_schema(
        tags=["commons"],
        parameters=[
            OpenApiParameter("search", OpenApiTypes.STR, description="Search by name, code or location"),
            OpenApiParameter("business", OpenApiTypes.UUID, description="Filter by business ID"),
            OpenApiParameter("is_active", OpenApiTypes.BOOL, description="Filter by active status"),
        ],
    )
    @action(detail=False, methods=["get"], url_path="all", url_name="all")
    def list_all(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

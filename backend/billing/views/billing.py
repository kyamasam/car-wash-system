from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db import transaction
from django.utils import timezone
from drf_spectacular.utils import extend_schema_view, extend_schema
from django_filters.rest_framework import DjangoFilterBackend

from commons.mixins import BranchScopedMixin
from billing.models import Payment, CommissionPayout, CommissionEntry, Expense, ExpenseCategory
from billing.serializers import PaymentSerializer, CommissionPayoutSerializer, CommissionEntrySerializer, ExpenseSerializer, ExpenseCategorySerializer, BulkMarkPaidSerializer
from billing.services.payment import record_payment
from billing.filters import CommissionEntryFilter
from billing.constants import CommissionEntryStatus


@extend_schema_view(list=extend_schema(tags=["billing"]), retrieve=extend_schema(tags=["billing"]),
    create=extend_schema(tags=["billing"]), update=extend_schema(tags=["billing"]),
    partial_update=extend_schema(tags=["billing"]), destroy=extend_schema(tags=["billing"]))
class PaymentViewSet(BranchScopedMixin, ModelViewSet):
    queryset = Payment.objects.filter(job__deleted_at__isnull=True).select_related("job", "branch")
    serializer_class = PaymentSerializer

    def perform_create(self, serializer):
        payment = Payment(**serializer.validated_data)
        record_payment(payment)


@extend_schema_view(list=extend_schema(tags=["billing"]), retrieve=extend_schema(tags=["billing"]),
    create=extend_schema(tags=["billing"]), update=extend_schema(tags=["billing"]),
    partial_update=extend_schema(tags=["billing"]), destroy=extend_schema(tags=["billing"]))
class CommissionPayoutViewSet(BranchScopedMixin, ModelViewSet):
    queryset = CommissionPayout.objects.select_related("worker", "branch").all()
    serializer_class = CommissionPayoutSerializer


@extend_schema_view(list=extend_schema(tags=["billing"]), retrieve=extend_schema(tags=["billing"]),
    create=extend_schema(tags=["billing"]), update=extend_schema(tags=["billing"]),
    partial_update=extend_schema(tags=["billing"]), destroy=extend_schema(tags=["billing"]))
class CommissionEntryViewSet(BranchScopedMixin, ModelViewSet):
    queryset = CommissionEntry.objects.select_related("job", "worker", "branch", "payout").all()
    serializer_class = CommissionEntrySerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = CommissionEntryFilter

    @extend_schema(tags=["billing"], request=BulkMarkPaidSerializer)
    @action(detail=False, methods=["post"], url_path="bulk_mark_paid")
    def bulk_mark_paid(self, request):
        serializer = BulkMarkPaidSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ids = [str(i) for i in serializer.validated_data["ids"]]

        qs = self.get_queryset().filter(id__in=ids)
        found_ids = {str(e.id) for e in qs}
        missing = [i for i in ids if i not in found_ids]
        if missing:
            return Response({"detail": "Some entries not found.", "missing": missing}, status=status.HTTP_400_BAD_REQUEST)

        non_pending = list(qs.exclude(status=CommissionEntryStatus.PENDING).values_list("id", flat=True))
        if non_pending:
            return Response(
                {"detail": "Some entries are not in PENDING status.", "invalid_ids": [str(i) for i in non_pending]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        paid_at = serializer.validated_data["paid_at"] or timezone.now()  # type: ignore[index]

        with transaction.atomic():
            updated = qs.update(status=CommissionEntryStatus.PAID, paid_at=paid_at)

        return Response({"updated": updated, "ids": ids}, status=status.HTTP_200_OK)


@extend_schema_view(list=extend_schema(tags=["billing"]), retrieve=extend_schema(tags=["billing"]),
    create=extend_schema(tags=["billing"]), update=extend_schema(tags=["billing"]),
    partial_update=extend_schema(tags=["billing"]), destroy=extend_schema(tags=["billing"]))
class ExpenseViewSet(BranchScopedMixin, ModelViewSet):
    queryset = Expense.objects.select_related("branch", "category").all()
    serializer_class = ExpenseSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]


@extend_schema_view(list=extend_schema(tags=["billing"]), retrieve=extend_schema(tags=["billing"]),
    create=extend_schema(tags=["billing"]), update=extend_schema(tags=["billing"]),
    partial_update=extend_schema(tags=["billing"]), destroy=extend_schema(tags=["billing"]))
class ExpenseCategoryViewSet(ModelViewSet):
    queryset = ExpenseCategory.objects.all()
    serializer_class = ExpenseCategorySerializer
    pagination_class = None

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.is_superuser:
            return qs
        return qs.filter(business=user.business_id)

    def perform_create(self, serializer):
        serializer.save(business_id=self.request.user.business_id)

from rest_framework.viewsets import ModelViewSet
from drf_spectacular.utils import extend_schema_view, extend_schema

from commons.mixins import BranchScopedMixin
from billing.models import Payment, CommissionPayout, CommissionEntry, Expense
from billing.serializers import PaymentSerializer, CommissionPayoutSerializer, CommissionEntrySerializer, ExpenseSerializer


@extend_schema_view(list=extend_schema(tags=["billing"]), retrieve=extend_schema(tags=["billing"]),
    create=extend_schema(tags=["billing"]), update=extend_schema(tags=["billing"]),
    partial_update=extend_schema(tags=["billing"]), destroy=extend_schema(tags=["billing"]))
class PaymentViewSet(BranchScopedMixin, ModelViewSet):
    queryset = Payment.objects.select_related("job", "branch").all()
    serializer_class = PaymentSerializer


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
    queryset = CommissionEntry.objects.select_related("job", "worker", "branch").all()
    serializer_class = CommissionEntrySerializer


@extend_schema_view(list=extend_schema(tags=["billing"]), retrieve=extend_schema(tags=["billing"]),
    create=extend_schema(tags=["billing"]), update=extend_schema(tags=["billing"]),
    partial_update=extend_schema(tags=["billing"]), destroy=extend_schema(tags=["billing"]))
class ExpenseViewSet(BranchScopedMixin, ModelViewSet):
    queryset = Expense.objects.select_related("branch").all()
    serializer_class = ExpenseSerializer

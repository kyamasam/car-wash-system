import django_filters

from billing.constants import CommissionEntryType, CommissionEntryStatus
from billing.models import CommissionEntry


class CommissionEntryFilter(django_filters.FilterSet):
    worker = django_filters.UUIDFilter(field_name="worker__id")
    status = django_filters.ChoiceFilter(choices=CommissionEntryStatus.choices)
    type = django_filters.ChoiceFilter(choices=CommissionEntryType.choices)
    date_from = django_filters.DateFilter(field_name="earned_at", lookup_expr="date__gte")
    date_to = django_filters.DateFilter(field_name="earned_at", lookup_expr="date__lte")
    has_payout = django_filters.BooleanFilter(field_name="payout", lookup_expr="isnull", exclude=True)

    class Meta:
        model = CommissionEntry
        fields = ["worker", "status", "type", "date_from", "date_to", "has_payout"]

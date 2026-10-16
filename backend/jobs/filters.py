import django_filters

from jobs.constants import CollectionMethod, JobStatus, PaymentStatus
from jobs.models import Job
from services.constants import ServiceCategory


class JobFilter(django_filters.FilterSet):
    status = django_filters.ChoiceFilter(choices=JobStatus.choices)
    payment_status = django_filters.ChoiceFilter(choices=PaymentStatus.choices)
    collection_method = django_filters.ChoiceFilter(choices=CollectionMethod.choices)
    category = django_filters.ChoiceFilter(choices=ServiceCategory.choices, method="filter_category")
    worker = django_filters.UUIDFilter(field_name="worker__id")
    date_from = django_filters.DateFilter(field_name="created_at", lookup_expr="date__gte")
    date_to = django_filters.DateFilter(field_name="created_at", lookup_expr="date__lte")

    class Meta:
        model = Job
        fields = ["status", "payment_status", "collection_method", "category", "worker", "date_from", "date_to"]

    def filter_category(self, queryset, name, value):
        return queryset.filter(items__service__category=value).distinct()

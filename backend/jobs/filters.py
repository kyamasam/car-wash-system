import django_filters

from jobs.constants import CollectionMethod, JobStatus, PaymentStatus
from jobs.models import Job


class JobFilter(django_filters.FilterSet):
    status = django_filters.ChoiceFilter(choices=JobStatus.choices)
    payment_status = django_filters.ChoiceFilter(choices=PaymentStatus.choices)
    collection_method = django_filters.ChoiceFilter(choices=CollectionMethod.choices)
    worker = django_filters.UUIDFilter(field_name="worker__id")
    date_from = django_filters.DateFilter(field_name="created_at", lookup_expr="date__gte")
    date_to = django_filters.DateFilter(field_name="created_at", lookup_expr="date__lte")

    class Meta:
        model = Job
        fields = ["status", "payment_status", "collection_method", "worker", "date_from", "date_to"]

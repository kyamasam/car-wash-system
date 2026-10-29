from django.contrib import admin

from commons.models import Business, Branch

EMPTY_VALUE = "__none__"


def business_filter(lookup="business", include_empty=False):
    """
    Build a sidebar filter for Business, reached via `lookup`
    (e.g. "business", "branch__business", "job__branch__business").
    """

    class BusinessListFilter(admin.SimpleListFilter):
        title = "business"
        parameter_name = "business"

        def lookups(self, request, model_admin):
            options = [(str(b.pk), b.name) for b in Business.objects.order_by("name")]
            if include_empty:
                options.append((EMPTY_VALUE, "None"))
            return options

        def queryset(self, request, queryset):
            value = self.value()
            if not value:
                return queryset
            if value == EMPTY_VALUE:
                return queryset.filter(**{f"{lookup}__isnull": True})
            return queryset.filter(**{lookup: value})

    return BusinessListFilter


def branch_filter(lookup="branch", include_empty=False):
    """
    Build a sidebar filter for Branch, reached via `lookup`
    (e.g. "branch", "job__branch"). When a business is selected through the
    business filter, only that business's branches are offered.
    """

    class BranchListFilter(admin.SimpleListFilter):
        title = "branch"
        parameter_name = "branch"

        def lookups(self, request, model_admin):
            branches = Branch.objects.select_related("business").order_by("business__name", "name")
            business_id = request.GET.get("business")
            if business_id and business_id != EMPTY_VALUE:
                branches = branches.filter(business_id=business_id)
            options = [(str(b.pk), f"{b.name} ({b.business.name})") for b in branches]
            if include_empty:
                options.append((EMPTY_VALUE, "Shared / none"))
            return options

        def queryset(self, request, queryset):
            value = self.value()
            if not value:
                return queryset
            if value == EMPTY_VALUE:
                return queryset.filter(**{f"{lookup}__isnull": True})
            return queryset.filter(**{lookup: value})

    return BranchListFilter

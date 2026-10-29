from rest_framework import serializers
from services.constants import PricingUnit
from services.models import Service, ServicePrice


def _validate_branch_in_business(serializer, branch):
    request = serializer.context.get("request")
    user = getattr(request, "user", None)
    if branch and user and not user.is_superuser and branch.business_id != user.business_id:
        raise serializers.ValidationError({"branch": "Branch does not belong to your business."})


class ServicePriceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServicePrice
        fields = "__all__"

    def validate(self, attrs):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        service = attrs.get("service", getattr(self.instance, "service", None))
        if service and user and not user.is_superuser and service.business_id != user.business_id:
            raise serializers.ValidationError({"service": "Service does not belong to your business."})
        _validate_branch_in_business(self, attrs.get("branch"))
        return attrs


class ServiceSerializer(serializers.ModelSerializer):
    prices = ServicePriceSerializer(many=True, read_only=True)

    class Meta:
        model = Service
        fields = "__all__"
        read_only_fields = ["business"]
        # Uniqueness of code is per business; the business is set in the view,
        # so the auto-generated validator can't run here.
        validators = []

    def validate(self, attrs):
        _validate_branch_in_business(self, attrs.get("branch"))
        code = attrs.get("code")
        request = self.context.get("request")
        business_id = self.instance.business_id if self.instance else getattr(request.user, "business_id", None)
        if code:
            duplicates = Service.objects.filter(business_id=business_id, code=code)
            if self.instance:
                duplicates = duplicates.exclude(pk=self.instance.pk)
            if duplicates.exists():
                raise serializers.ValidationError({"code": "A service with this code already exists."})
        unit = attrs.get("unit", getattr(self.instance, "unit", PricingUnit.PER_JOB))
        size_unit = attrs.get("size_unit", getattr(self.instance, "size_unit", None))
        if unit == PricingUnit.BY_SIZE:
            if not size_unit:
                raise serializers.ValidationError({"size_unit": "size_unit is required for By Size services."})
        else:
            attrs["size_unit"] = None
        return attrs

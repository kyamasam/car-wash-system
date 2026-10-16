from rest_framework import serializers
from services.constants import PricingUnit
from services.models import Service, ServicePrice


class ServicePriceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServicePrice
        fields = "__all__"


class ServiceSerializer(serializers.ModelSerializer):
    prices = ServicePriceSerializer(many=True, read_only=True)

    class Meta:
        model = Service
        fields = "__all__"

    def validate(self, attrs):
        unit = attrs.get("unit", getattr(self.instance, "unit", PricingUnit.PER_JOB))
        size_unit = attrs.get("size_unit", getattr(self.instance, "size_unit", None))
        if unit == PricingUnit.BY_SIZE:
            if not size_unit:
                raise serializers.ValidationError({"size_unit": "size_unit is required for By Size services."})
        else:
            attrs["size_unit"] = None
        return attrs

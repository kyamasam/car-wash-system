from rest_framework import serializers

from subscriptions.constants import BillingPeriod, SubscriptionPaymentMethod, SubscriptionStatus
from subscriptions.models import Package, Subscription, SubscriptionPayment


class PackageSerializer(serializers.ModelSerializer):
    features = serializers.ListField(source="feature_list", child=serializers.CharField(), read_only=True)

    class Meta:
        model = Package
        fields = [
            "id", "name", "code", "description", "features",
            "daily_price", "weekly_price", "monthly_price", "yearly_price",
            "currency", "is_default", "sort_order",
        ]


class PackageSummarySerializer(serializers.ModelSerializer):
    features = serializers.ListField(source="feature_list", child=serializers.CharField(), read_only=True)

    class Meta:
        model = Package
        fields = ["id", "name", "code", "features"]


class SubscriptionStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=[SubscriptionStatus.ACTIVE, SubscriptionStatus.EXPIRED])
    expires_at = serializers.DateTimeField(allow_null=True)
    is_trial = serializers.BooleanField()
    days_remaining = serializers.IntegerField()
    package = PackageSummarySerializer(allow_null=True)


class SubscriptionSerializer(serializers.ModelSerializer):
    package_detail = PackageSummarySerializer(source="package", read_only=True)

    class Meta:
        model = Subscription
        fields = ["id", "business", "package", "package_detail", "is_trial", "period", "starts_at", "ends_at",
                  "payment", "created_at"]


class SubscriptionPaymentSerializer(serializers.ModelSerializer):
    package_detail = PackageSummarySerializer(source="package", read_only=True)

    class Meta:
        model = SubscriptionPayment
        fields = [
            "id", "business", "package", "package_detail", "period", "days", "amount", "currency",
            "payment_method", "phone", "status", "receipt_number", "failure_reason",
            "initiated_by", "created_at", "updated_at",
        ]


class InitiatePaymentSerializer(serializers.Serializer):
    package_id = serializers.PrimaryKeyRelatedField(
        source="package", queryset=Package.objects.filter(is_active=True, deleted_at__isnull=True)
    )
    period = serializers.ChoiceField(choices=BillingPeriod.choices)
    payment_method = serializers.ChoiceField(
        choices=SubscriptionPaymentMethod.choices, default=SubscriptionPaymentMethod.MPESA
    )
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)


class ConfirmPaymentResponseSerializer(serializers.Serializer):
    payment = SubscriptionPaymentSerializer()
    subscription = SubscriptionStatusSerializer()

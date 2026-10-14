from rest_framework import serializers
from billing.models import Payment, CommissionPayout, CommissionEntry, Expense
from jobs.models import Job


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = "__all__"


class CommissionPayoutSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommissionPayout
        fields = "__all__"


class _CommissionEntryJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = ["id", "job_number", "payment_status", "status", "total_amount", "amount_paid"]


class CommissionEntrySerializer(serializers.ModelSerializer):
    job_detail = _CommissionEntryJobSerializer(source="job", read_only=True)

    class Meta:
        model = CommissionEntry
        fields = [
            "id", "job", "job_detail", "worker", "branch", "payout",
            "type", "status", "amount", "description", "earned_at", "paid_at", "created_at",
        ]


class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = "__all__"


class BulkMarkPaidSerializer(serializers.Serializer):
    ids = serializers.ListField(child=serializers.UUIDField(), min_length=1)
    paid_at = serializers.DateTimeField(required=False, default=None)

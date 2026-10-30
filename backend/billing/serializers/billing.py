from rest_framework import serializers
from billing.models import Payment, CommissionPayout, CommissionEntry, Expense, ExpenseCategory
from jobs.models import Job
from workers.models import Worker


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = "__all__"

    def validate_job(self, job):
        if job.deleted_at is not None:
            raise serializers.ValidationError("Cannot record a payment for a deleted job.")
        return job


class CommissionPayoutSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommissionPayout
        fields = "__all__"


class _CommissionEntryJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = ["id", "job_number", "payment_status", "status", "total_amount", "amount_paid"]


class _CommissionEntryWorkerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Worker
        fields = ["id", "name", "phone"]


class CommissionEntrySerializer(serializers.ModelSerializer):
    job_detail = _CommissionEntryJobSerializer(source="job", read_only=True)
    worker_detail = _CommissionEntryWorkerSerializer(source="worker", read_only=True)

    class Meta:
        model = CommissionEntry
        fields = [
            "id", "job", "job_detail", "worker", "worker_detail", "branch", "payout",
            "type", "status", "amount", "commission_type", "commission_value", "base_amount", "description", "earned_at", "paid_at", "created_at",
        ]


class ExpenseCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpenseCategory
        fields = ["id", "name", "business", "is_active", "created_at"]
        read_only_fields = ["business", "created_at"]


class ExpenseSerializer(serializers.ModelSerializer):
    category_detail = ExpenseCategorySerializer(source="category", read_only=True)
    receipt = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model = Expense
        fields = "__all__"

    def validate_category(self, category):
        request = self.context.get("request")
        if category and request and not request.user.is_superuser and category.business_id != request.user.business_id:
            raise serializers.ValidationError("Category does not belong to your business.")
        return category


class BulkMarkPaidSerializer(serializers.Serializer):
    ids = serializers.ListField(child=serializers.UUIDField(), min_length=1)
    paid_at = serializers.DateTimeField(required=False, default=None)

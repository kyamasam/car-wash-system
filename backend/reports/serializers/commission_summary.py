from rest_framework import serializers


class CommissionWorkerSummarySerializer(serializers.Serializer):
    worker_id = serializers.CharField()
    worker_name = serializers.CharField()
    pending_amount = serializers.DecimalField(max_digits=14, decimal_places=2)
    paid_amount = serializers.DecimalField(max_digits=14, decimal_places=2)
    void_amount = serializers.DecimalField(max_digits=14, decimal_places=2)


class CommissionSummaryReportSerializer(serializers.Serializer):
    start_date = serializers.CharField()
    end_date = serializers.CharField()
    total_pending = serializers.DecimalField(max_digits=14, decimal_places=2)
    total_paid = serializers.DecimalField(max_digits=14, decimal_places=2)
    total_void = serializers.DecimalField(max_digits=14, decimal_places=2)
    per_worker = CommissionWorkerSummarySerializer(many=True)

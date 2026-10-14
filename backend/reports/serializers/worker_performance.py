from rest_framework import serializers


class WorkerPerformanceItemSerializer(serializers.Serializer):
    worker_id = serializers.CharField()
    worker_name = serializers.CharField()
    jobs_completed = serializers.IntegerField()
    commission_earned = serializers.DecimalField(max_digits=14, decimal_places=2)
    commission_pending = serializers.DecimalField(max_digits=14, decimal_places=2)
    commission_paid = serializers.DecimalField(max_digits=14, decimal_places=2)
    avg_turnaround_minutes = serializers.FloatField(allow_null=True)


class WorkerPerformanceReportSerializer(serializers.Serializer):
    start_date = serializers.CharField()
    end_date = serializers.CharField()
    workers = WorkerPerformanceItemSerializer(many=True)

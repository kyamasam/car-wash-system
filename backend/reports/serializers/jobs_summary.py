from rest_framework import serializers


class JobStatusCountSerializer(serializers.Serializer):
    status = serializers.CharField()
    count = serializers.IntegerField()


class WorkerJobStatSerializer(serializers.Serializer):
    worker_id = serializers.CharField()
    worker_name = serializers.CharField()
    job_count = serializers.IntegerField()
    avg_turnaround_minutes = serializers.FloatField(allow_null=True)


class JobsSummaryReportSerializer(serializers.Serializer):
    start_date = serializers.CharField()
    end_date = serializers.CharField()
    total_jobs = serializers.IntegerField()
    status_breakdown = JobStatusCountSerializer(many=True)
    avg_turnaround_minutes = serializers.FloatField(allow_null=True)
    per_worker = WorkerJobStatSerializer(many=True)

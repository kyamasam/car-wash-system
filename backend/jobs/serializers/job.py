from rest_framework import serializers
from jobs.models import Job, JobItem


class JobItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobItem
        fields = "__all__"


class JobSerializer(serializers.ModelSerializer):
    items = JobItemSerializer(many=True, read_only=True)

    class Meta:
        model = Job
        fields = "__all__"
        read_only_fields = ("job_number",)

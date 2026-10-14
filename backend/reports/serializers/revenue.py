from rest_framework import serializers


class RevenueTimeSeriesItemSerializer(serializers.Serializer):
    period = serializers.CharField()
    total = serializers.DecimalField(max_digits=14, decimal_places=2)
    count = serializers.IntegerField()


class RevenueMethodBreakdownSerializer(serializers.Serializer):
    method = serializers.CharField()
    total = serializers.DecimalField(max_digits=14, decimal_places=2)
    count = serializers.IntegerField()
    percentage = serializers.FloatField()


class RevenueReportSerializer(serializers.Serializer):
    start_date = serializers.CharField()
    end_date = serializers.CharField()
    granularity = serializers.CharField()
    gross_revenue = serializers.DecimalField(max_digits=14, decimal_places=2)
    refunds_total = serializers.DecimalField(max_digits=14, decimal_places=2)
    net_revenue = serializers.DecimalField(max_digits=14, decimal_places=2)
    total_jobs = serializers.IntegerField()
    time_series = RevenueTimeSeriesItemSerializer(many=True)
    method_breakdown = RevenueMethodBreakdownSerializer(many=True)

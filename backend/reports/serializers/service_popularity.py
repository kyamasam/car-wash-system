from rest_framework import serializers


class ServicePopularityItemSerializer(serializers.Serializer):
    service_id = serializers.CharField()
    service_name = serializers.CharField()
    service_category = serializers.CharField()
    total_count = serializers.IntegerField()
    total_quantity = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_revenue = serializers.DecimalField(max_digits=14, decimal_places=2)
    revenue_share_percent = serializers.FloatField()


class ServicePopularityReportSerializer(serializers.Serializer):
    start_date = serializers.CharField()
    end_date = serializers.CharField()
    total_revenue = serializers.DecimalField(max_digits=14, decimal_places=2)
    services = ServicePopularityItemSerializer(many=True)

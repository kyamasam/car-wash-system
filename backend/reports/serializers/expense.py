from rest_framework import serializers


class ExpenseCategoryItemSerializer(serializers.Serializer):
    category = serializers.CharField()
    total = serializers.DecimalField(max_digits=14, decimal_places=2)
    count = serializers.IntegerField()
    percentage = serializers.FloatField()


class ExpenseTimeSeriesItemSerializer(serializers.Serializer):
    period = serializers.CharField()
    total = serializers.DecimalField(max_digits=14, decimal_places=2)
    count = serializers.IntegerField()


class ExpenseReportSerializer(serializers.Serializer):
    start_date = serializers.CharField()
    end_date = serializers.CharField()
    granularity = serializers.CharField()
    total_expenses = serializers.DecimalField(max_digits=14, decimal_places=2)
    by_category = ExpenseCategoryItemSerializer(many=True)
    time_series = ExpenseTimeSeriesItemSerializer(many=True)

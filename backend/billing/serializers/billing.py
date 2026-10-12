from rest_framework import serializers
from billing.models import Payment, CommissionPayout, CommissionEntry, Expense


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = "__all__"


class CommissionPayoutSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommissionPayout
        fields = "__all__"


class CommissionEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = CommissionEntry
        fields = "__all__"


class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = "__all__"
